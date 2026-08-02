import type {
  ActivateSetupInput,
  AuthorityBoundaryInput,
  EscalationRuleInput,
  InterviewAnswer,
  KnowledgeClaimInput,
  PhaseOneSnapshot,
  ResponsibilityInput,
  RoleInput,
  SourceDocumentInput,
  SourceReferenceInput,
} from './entities';
import { getOperationalTopic, isOperationalTopicKey } from './operationalTopics';
import { domainFailure, domainSuccess, type DomainResult } from './result';
import {
  excerptSourceLines,
  normalizeSourceContent,
  numberSourceLines,
  ownerInterviewLocator,
  sourceDocumentLocator,
} from './sourceDocuments';

export const PERMISSION_LEVELS = [
  'may-decide',
  'may-act-within-limit',
  'must-request-approval',
  'must-escalate',
  'prohibited',
] as const;

export const ESCALATION_URGENCIES = ['routine', 'same-day', 'immediate'] as const;
export const ROLE_STATUSES = ['draft', 'active', 'retired'] as const;
export const RESPONSIBILITY_STATUSES = ['active', 'inactive'] as const;
export const SOURCE_DOCUMENT_TYPES = [
  'job-description',
  'existing-sop',
  'policy',
  'checklist',
  'customer-script',
  'dispatch-note',
  'owner-note',
  'interview-record',
  'other',
] as const;
export const SOURCE_DOCUMENT_STATUSES = ['draft', 'available', 'superseded', 'withdrawn'] as const;
export const KNOWLEDGE_GAP_STATUSES = [
  'open',
  'question-ready',
  'answered',
  'proposal-created',
  'resolved',
  'dismissed',
] as const;
export const INTERVIEW_QUESTION_STATUSES = [
  'queued',
  'active',
  'answered',
  'skipped',
  'withdrawn',
] as const;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function required(value: string, field: string, label: string): DomainResult<void> {
  return isBlank(value)
    ? domainFailure('validation-error', `${label} is required.`, field)
    : domainSuccess(undefined);
}

function firstFailure(results: readonly DomainResult<void>[]): DomainResult<void> {
  return results.find((result) => !result.ok) ?? domainSuccess(undefined);
}

export function validateResponsibilityInput(input: ResponsibilityInput): DomainResult<void> {
  const base = firstFailure([
    required(input.title, 'responsibility.title', 'Responsibility title'),
    required(input.expectedOutcome, 'responsibility.expectedOutcome', 'Expected outcome'),
    required(input.frequency, 'responsibility.frequency', 'Frequency'),
    required(input.completionEvidence, 'responsibility.completionEvidence', 'Completion evidence'),
  ]);
  if (!base.ok) return base;

  return RESPONSIBILITY_STATUSES.includes(input.status)
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'Responsibility status is invalid.',
        'responsibility.status',
      );
}

export function validateAuthorityBoundaryInput(input: AuthorityBoundaryInput): DomainResult<void> {
  const base = firstFailure([
    required(input.subject, 'authorityBoundary.subject', 'Authority subject'),
    required(
      input.limitOrConstraint,
      'authorityBoundary.limitOrConstraint',
      'Authority limit or constraint',
    ),
    required(
      input.escalationDestination,
      'authorityBoundary.escalationDestination',
      'Authority escalation destination',
    ),
  ]);
  if (!base.ok) return base;

  return PERMISSION_LEVELS.includes(input.permissionLevel)
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'Permission level is invalid.',
        'authorityBoundary.permissionLevel',
      );
}

export function validateEscalationRuleInput(input: EscalationRuleInput): DomainResult<void> {
  const base = firstFailure([
    required(input.trigger, 'escalationRule.trigger', 'Escalation trigger'),
    required(input.destination, 'escalationRule.destination', 'Escalation destination'),
    required(
      input.requiredContext,
      'escalationRule.requiredContext',
      'Required escalation context',
    ),
    required(
      input.expectedResponse,
      'escalationRule.expectedResponse',
      'Expected escalation response',
    ),
  ]);
  if (!base.ok) return base;

  return ESCALATION_URGENCIES.includes(input.urgency)
    ? domainSuccess(undefined)
    : domainFailure('validation-error', 'Escalation urgency is invalid.', 'escalationRule.urgency');
}

export function validateRoleInput(input: RoleInput): DomainResult<void> {
  const base = firstFailure([
    required(input.title, 'role.title', 'Role title'),
    required(input.mission, 'role.mission', 'Role mission'),
  ]);
  if (!base.ok) return base;

  if (!ROLE_STATUSES.includes(input.status)) {
    return domainFailure('validation-error', 'Role status is invalid.', 'role.status');
  }
  if (input.responsibilities.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one responsibility is required.',
      'role.responsibilities',
    );
  }
  if (input.authorityBoundaries.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one authority boundary is required.',
      'role.authorityBoundaries',
    );
  }
  if (input.escalationRules.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one escalation rule is required.',
      'role.escalationRules',
    );
  }

  return firstFailure([
    ...input.responsibilities.map(validateResponsibilityInput),
    ...input.authorityBoundaries.map(validateAuthorityBoundaryInput),
    ...input.escalationRules.map(validateEscalationRuleInput),
  ]);
}

export function validateActivateSetupInput(input: ActivateSetupInput): DomainResult<void> {
  const company = input.company;
  const base = firstFailure([
    required(company.name, 'company.name', 'Business name'),
    required(company.industry, 'company.industry', 'Industry'),
    required(company.serviceArea, 'company.serviceArea', 'Service area'),
    required(company.phone, 'company.phone', 'Phone'),
    required(company.email, 'company.email', 'Email'),
    required(company.operatingTimezone, 'company.operatingTimezone', 'Operating timezone'),
  ]);
  if (!base.ok) return base;
  if (!/^\S+@\S+\.\S+$/.test(company.email.trim())) {
    return domainFailure('validation-error', 'Enter a valid email address.', 'company.email');
  }

  const role = validateRoleInput(input.role);
  if (!role.ok) return role;
  return input.role.status === 'active'
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'The role must be active to complete setup.',
        'role.status',
      );
}

export function validateSourceReferenceInput(input: SourceReferenceInput): DomainResult<void> {
  return firstFailure([
    required(input.sourceTitle, 'sourceReference.sourceTitle', 'Source title'),
    required(input.sourceType, 'sourceReference.sourceType', 'Source type'),
    required(input.sourceLocator, 'sourceReference.sourceLocator', 'Source locator'),
  ]);
}

export function validateSourceDocumentInput(input: SourceDocumentInput): DomainResult<void> {
  const base = firstFailure([
    required(input.title, 'sourceDocument.title', 'Source title'),
    required(input.supplierLabel, 'sourceDocument.supplierLabel', 'Source supplier'),
  ]);
  if (!base.ok) return base;
  return SOURCE_DOCUMENT_TYPES.includes(input.sourceType)
    ? domainSuccess(undefined)
    : domainFailure('validation-error', 'Source document type is invalid.', 'sourceDocument.type');
}

export function validateKnowledgeClaimInput(input: KnowledgeClaimInput): DomainResult<void> {
  const base = firstFailure([
    required(input.statement, 'knowledgeClaim.statement', 'Claim statement'),
    required(input.category, 'knowledgeClaim.category', 'Claim category'),
    required(input.provenance, 'knowledgeClaim.provenance', 'Claim provenance'),
  ]);
  if (!base.ok) return base;
  return input.topicKey === undefined || isOperationalTopicKey(input.topicKey)
    ? domainSuccess(undefined)
    : domainFailure('invalid-topic', 'Operational topic is invalid.', 'knowledgeClaim.topicKey');
}

function duplicateId(values: readonly { readonly id: string }[]): string | undefined {
  const seen = new Set<string>();
  return values.find(({ id }) => (seen.has(id) ? true : !seen.add(id)))?.id;
}

export function validatePhaseOneSnapshot(
  snapshot: PhaseOneSnapshot,
): DomainResult<PhaseOneSnapshot> {
  if (snapshot.company === null) {
    const hasOrphans =
      snapshot.role !== null ||
      snapshot.sourceDocuments.length > 0 ||
      snapshot.sourceReferences.length > 0 ||
      snapshot.knowledgeClaims.length > 0 ||
      snapshot.approvalDecisions.length > 0 ||
      snapshot.knowledgeGaps.length > 0 ||
      snapshot.interviewQuestions.length > 0 ||
      snapshot.interviewAnswers.length > 0;
    return hasOrphans
      ? domainFailure(
          'relationship-mismatch',
          'A company is required before role or knowledge records.',
        )
      : domainSuccess(snapshot);
  }

  if (snapshot.company.status !== 'active') {
    return domainFailure('relationship-mismatch', 'The Phase 1 company must be active.');
  }
  if (snapshot.role === null) {
    const hasRoleRecords =
      snapshot.sourceDocuments.length > 0 ||
      snapshot.knowledgeClaims.length > 0 ||
      snapshot.approvalDecisions.length > 0 ||
      snapshot.knowledgeGaps.length > 0 ||
      snapshot.interviewQuestions.length > 0 ||
      snapshot.interviewAnswers.length > 0;
    return !hasRoleRecords
      ? domainSuccess(snapshot)
      : domainFailure('role-not-found', 'Knowledge records require an active role.');
  }
  if (snapshot.role.companyId !== snapshot.company.id) {
    return domainFailure(
      'relationship-mismatch',
      'The role must belong to the active company.',
      'role.companyId',
    );
  }

  const roleValidation = validateRoleInput(snapshot.role);
  if (!roleValidation.ok) return roleValidation;
  for (const responsibility of snapshot.role.responsibilities) {
    if (responsibility.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every responsibility must belong to the active role.',
        'responsibility.roleId',
      );
    }
  }
  for (const boundary of snapshot.role.authorityBoundaries) {
    if (boundary.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every authority boundary must belong to the active role.',
        'authorityBoundary.roleId',
      );
    }
  }
  for (const rule of snapshot.role.escalationRules) {
    if (rule.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every escalation rule must belong to the active role.',
        'escalationRule.roleId',
      );
    }
  }

  const allIdentified = [
    snapshot.company,
    snapshot.role,
    ...snapshot.role.responsibilities,
    ...snapshot.role.authorityBoundaries,
    ...snapshot.role.escalationRules,
    ...snapshot.sourceDocuments,
    ...snapshot.sourceReferences,
    ...snapshot.knowledgeClaims,
    ...snapshot.approvalDecisions,
    ...snapshot.knowledgeGaps,
    ...snapshot.interviewQuestions,
    ...snapshot.interviewAnswers,
  ];
  const duplicate = duplicateId(allIdentified);
  if (duplicate !== undefined) {
    return domainFailure('duplicate-record', `Duplicate record id: ${duplicate}.`);
  }

  const sourceIds = new Set(snapshot.sourceReferences.map(({ id }) => id));
  const claimIds = new Set(snapshot.knowledgeClaims.map(({ id }) => id));
  const gapIds = new Set(snapshot.knowledgeGaps.map(({ id }) => id));
  const questionIds = new Set(snapshot.interviewQuestions.map(({ id }) => id));
  const answerIds = new Set(snapshot.interviewAnswers.map(({ id }) => id));

  for (const document of snapshot.sourceDocuments) {
    if (document.companyId !== snapshot.company.id || document.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every source document must belong to the active company and role.',
      );
    }
    if (!SOURCE_DOCUMENT_TYPES.includes(document.sourceType)) {
      return domainFailure('validation-error', 'Source document type is invalid.');
    }
    if (!SOURCE_DOCUMENT_STATUSES.includes(document.status)) {
      return domainFailure('validation-error', 'Source document status is invalid.');
    }
    if (document.captureMethod !== 'manual-paste') {
      return domainFailure('validation-error', 'Phase 2 source capture must be manual paste.');
    }
    if (isBlank(document.title) || isBlank(document.supplierLabel)) {
      return domainFailure('validation-error', 'Source title and supplier are required.');
    }
    if (document.content !== normalizeSourceContent(document.content)) {
      return domainFailure('validation-error', 'Source content must use normalized line endings.');
    }
    if (JSON.stringify(document.lines) !== JSON.stringify(numberSourceLines(document.content))) {
      return domainFailure(
        'relationship-mismatch',
        'Stored source lines must exactly represent the normalized content.',
      );
    }
    if (!Number.isInteger(document.version) || document.version < 1) {
      return domainFailure(
        'validation-error',
        'Source document versions must be positive integers.',
      );
    }
    if (document.status === 'available' && isBlank(document.content)) {
      return domainFailure('validation-error', 'Blank source documents cannot become available.');
    }
    if (document.supersedesDocumentId !== undefined) {
      const previous = snapshot.sourceDocuments.find(
        ({ id }) => id === document.supersedesDocumentId,
      );
      if (
        previous === undefined ||
        previous.companyId !== document.companyId ||
        previous.roleId !== document.roleId ||
        previous.version + 1 !== document.version
      ) {
        return domainFailure(
          'relationship-mismatch',
          'A source revision must reference its exact prior scoped version.',
        );
      }
      if (document.status === 'draft' && previous.status !== 'available') {
        return domainFailure(
          'invalid-transition',
          'A draft revision requires a current available predecessor.',
        );
      }
      if (document.status === 'available' && previous.status !== 'superseded') {
        return domainFailure(
          'invalid-transition',
          'An available revision must supersede its predecessor.',
        );
      }
    }
    if (document.status === 'superseded') {
      const successor = snapshot.sourceDocuments.find(
        (candidate) =>
          candidate.supersedesDocumentId === document.id &&
          (candidate.status === 'available' || candidate.status === 'superseded'),
      );
      if (successor === undefined) {
        return domainFailure(
          'invalid-transition',
          'A source document may be superseded only by an activated revision.',
        );
      }
    }
  }

  for (const source of snapshot.sourceReferences) {
    const scoped = source.companyId !== undefined || source.roleId !== undefined;
    if (
      scoped &&
      (source.companyId !== snapshot.company.id || source.roleId !== snapshot.role.id)
    ) {
      return domainFailure(
        'relationship-mismatch',
        'A scoped source reference must belong to the active company and role.',
      );
    }
    const anchorValues = [
      source.sourceDocumentId,
      source.sourceDocumentVersion,
      source.startLine,
      source.endLine,
    ];
    const hasAnyAnchor = anchorValues.some((value) => value !== undefined);
    const hasCompleteAnchor = anchorValues.every((value) => value !== undefined);
    if (hasAnyAnchor && !hasCompleteAnchor) {
      return domainFailure(
        'relationship-mismatch',
        'A document source anchor must include document, version, start line, and end line.',
      );
    }
    if (hasCompleteAnchor) {
      const document = snapshot.sourceDocuments.find(
        ({ id, version }) =>
          id === source.sourceDocumentId && version === source.sourceDocumentVersion,
      );
      if (document === undefined) {
        return domainFailure(
          'document-version-not-found',
          'An anchored source must reference an existing exact document version.',
        );
      }
      if (document.status === 'draft') {
        return domainFailure('invalid-transition', 'Draft source documents cannot be cited.');
      }
      const startLine = source.startLine as number;
      const endLine = source.endLine as number;
      if (
        !Number.isInteger(startLine) ||
        !Number.isInteger(endLine) ||
        startLine < 1 ||
        endLine < startLine ||
        endLine > document.lines.length
      ) {
        return domainFailure('invalid-line-range', 'The anchored source line range is invalid.');
      }
      if (
        source.sourceTitle !== document.title ||
        source.sourceType !== document.sourceType ||
        source.sourceLocator !==
          sourceDocumentLocator(document.id, document.version, startLine, endLine) ||
        source.excerpt !== excerptSourceLines(document.lines, startLine, endLine)
      ) {
        return domainFailure(
          'relationship-mismatch',
          'Anchored source metadata and excerpt must derive from the exact document version.',
        );
      }
    }
  }

  for (const decision of snapshot.approvalDecisions) {
    const claim = snapshot.knowledgeClaims.find(({ id }) => id === decision.claimId);
    if (!claim || decision.claimVersion !== claim.version) {
      return domainFailure(
        'relationship-mismatch',
        'Every approval decision must reference an existing exact claim version.',
      );
    }
  }

  for (const claim of snapshot.knowledgeClaims) {
    if (claim.companyId !== snapshot.company.id || claim.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every knowledge claim must belong to the active company and role.',
      );
    }
    if (claim.version < 1 || !Number.isInteger(claim.version)) {
      return domainFailure('validation-error', 'Claim versions must be positive integers.');
    }
    if (claim.topicKey !== undefined && !isOperationalTopicKey(claim.topicKey)) {
      return domainFailure('invalid-topic', 'A knowledge claim has an invalid topic.');
    }
    if (claim.sourceReferenceIds.some((sourceId) => !sourceIds.has(sourceId))) {
      return domainFailure(
        'source-not-found',
        'A claim references source metadata that does not exist.',
      );
    }
    if (claim.supersedesClaimId !== undefined) {
      const previous = snapshot.knowledgeClaims.find(({ id }) => id === claim.supersedesClaimId);
      if (!previous || previous.version >= claim.version) {
        return domainFailure(
          'relationship-mismatch',
          'A revision must reference an older claim version.',
        );
      }
    }

    const decisions = snapshot.approvalDecisions.filter(
      ({ claimId, claimVersion }) => claimId === claim.id && claimVersion === claim.version,
    );
    if (
      (claim.lifecycleStatus === 'approved' || claim.lifecycleStatus === 'superseded') &&
      (claim.sourceReferenceIds.length === 0 ||
        !decisions.some(({ decision }) => decision === 'approve'))
    ) {
      return domainFailure(
        'approval-decision-required',
        'Approved knowledge requires source provenance and an approval decision.',
      );
    }
    if (
      claim.lifecycleStatus === 'rejected' &&
      !decisions.some(({ decision }) => decision === 'reject')
    ) {
      return domainFailure(
        'approval-decision-required',
        'Rejected knowledge requires an explicit rejection decision.',
      );
    }
    if (claim.lifecycleStatus === 'superseded') {
      const approvedRevision = snapshot.knowledgeClaims.some(
        (candidate) =>
          candidate.supersedesClaimId === claim.id && candidate.lifecycleStatus === 'approved',
      );
      if (!approvedRevision) {
        return domainFailure(
          'invalid-transition',
          'Knowledge may be superseded only by an approved revision.',
        );
      }
    }
  }

  if ([...claimIds].length !== snapshot.knowledgeClaims.length) {
    return domainFailure('duplicate-record', 'Knowledge claim IDs must be unique.');
  }

  const activeGapTopics = new Set<string>();
  for (const gap of snapshot.knowledgeGaps) {
    if (gap.companyId !== snapshot.company.id || gap.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every knowledge gap must belong to the active company and role.',
      );
    }
    if (!isOperationalTopicKey(gap.topicKey)) {
      return domainFailure('invalid-topic', 'A knowledge gap has an invalid topic.');
    }
    if (!KNOWLEDGE_GAP_STATUSES.includes(gap.status)) {
      return domainFailure('validation-error', 'Knowledge gap status is invalid.');
    }
    if (gap.riskTier !== getOperationalTopic(gap.topicKey).riskTier) {
      return domainFailure('relationship-mismatch', 'Knowledge gap risk must match its topic.');
    }
    if (
      gap.supportingSourceReferenceIds.some((sourceId) => !sourceIds.has(sourceId)) ||
      gap.relatedClaimIds.some((claimId) => !claimIds.has(claimId))
    ) {
      return domainFailure(
        'relationship-mismatch',
        'Knowledge gap support must reference existing sources and claims.',
      );
    }
    const active = ['open', 'question-ready', 'answered', 'proposal-created'].includes(gap.status);
    if (active) {
      const key = `${gap.companyId}:${gap.roleId}:${gap.topicKey}`;
      if (activeGapTopics.has(key)) {
        return domainFailure(
          'duplicate-record',
          'Only one active unresolved gap may exist for a scoped topic.',
        );
      }
      activeGapTopics.add(key);
    }
    if (gap.status === 'dismissed' && isBlank(gap.dismissedReason ?? '')) {
      return domainFailure('validation-error', 'A dismissed gap requires an owner reason.');
    }
    if (gap.status === 'resolved') {
      const resolvingClaim = snapshot.knowledgeClaims.find(
        ({ id }) => id === gap.resolvedByClaimId,
      );
      if (
        resolvingClaim === undefined ||
        resolvingClaim.topicKey !== gap.topicKey ||
        (resolvingClaim.lifecycleStatus !== 'approved' &&
          resolvingClaim.lifecycleStatus !== 'superseded')
      ) {
        return domainFailure(
          'relationship-mismatch',
          'A resolved gap must identify an approved or later-superseded claim for the same topic.',
        );
      }
    }
  }

  const activeQuestions = snapshot.interviewQuestions.filter(({ status }) => status === 'active');
  if (activeQuestions.length > 1) {
    return domainFailure('duplicate-record', 'Only one interview question may be active.');
  }
  for (const question of snapshot.interviewQuestions) {
    const gap = snapshot.knowledgeGaps.find(({ id }) => id === question.gapId);
    if (
      question.companyId !== snapshot.company.id ||
      question.roleId !== snapshot.role.id ||
      gap === undefined ||
      gap.topicKey !== question.topicKey
    ) {
      return domainFailure(
        'relationship-mismatch',
        'Every interview question must match an existing scoped gap and topic.',
      );
    }
    if (!INTERVIEW_QUESTION_STATUSES.includes(question.status)) {
      return domainFailure('validation-error', 'Interview question status is invalid.');
    }
    if (!Number.isInteger(question.priority) || question.priority < 0) {
      return domainFailure('validation-error', 'Interview question priority is invalid.');
    }
    if (isBlank(question.templateKey) || isBlank(question.prompt)) {
      return domainFailure(
        'validation-error',
        'Interview question template and prompt are required.',
      );
    }
    if (question.status === 'answered' && question.answeredAt === undefined) {
      return domainFailure('relationship-mismatch', 'Answered questions require an answer time.');
    }
    if (
      question.status === 'answered' &&
      !snapshot.interviewAnswers.some(({ questionId }) => questionId === question.id)
    ) {
      return domainFailure(
        'relationship-mismatch',
        'Answered questions require an immutable interview answer record.',
      );
    }
    if (question.status === 'skipped' && isBlank(question.skippedReason ?? '')) {
      return domainFailure('validation-error', 'Skipped questions require a reason.');
    }
    if (
      (question.status === 'active' || question.status === 'queued') &&
      (gap.status === 'resolved' || gap.status === 'dismissed')
    ) {
      return domainFailure(
        'invalid-transition',
        'Resolved or dismissed gaps cannot retain queued interview questions.',
      );
    }
  }

  for (const answer of snapshot.interviewAnswers) {
    const relation = validateInterviewAnswer(snapshot, answer);
    if (!relation.ok) return relation;
  }

  if ([...gapIds].length !== snapshot.knowledgeGaps.length) {
    return domainFailure('duplicate-record', 'Knowledge gap IDs must be unique.');
  }
  if ([...questionIds].length !== snapshot.interviewQuestions.length) {
    return domainFailure('duplicate-record', 'Interview question IDs must be unique.');
  }
  if ([...answerIds].length !== snapshot.interviewAnswers.length) {
    return domainFailure('duplicate-record', 'Interview answer IDs must be unique.');
  }
  return domainSuccess(snapshot);
}

function validateInterviewAnswer(
  snapshot: PhaseOneSnapshot,
  answer: InterviewAnswer,
): DomainResult<void> {
  if (snapshot.company === null) {
    return domainFailure('company-not-found', 'Interview answers require an active company.');
  }
  const question = snapshot.interviewQuestions.find(({ id }) => id === answer.questionId);
  const gap = snapshot.knowledgeGaps.find(({ id }) => id === answer.gapId);
  const source = snapshot.sourceReferences.find(({ id }) => id === answer.sourceReferenceId);
  const claim = snapshot.knowledgeClaims.find(({ id }) => id === answer.generatedClaimId);
  if (
    question === undefined ||
    gap === undefined ||
    source === undefined ||
    claim === undefined ||
    isBlank(answer.actorLabel) ||
    isBlank(answer.answer) ||
    answer.companyId !== snapshot.company.id ||
    answer.roleId !== question.roleId ||
    question.gapId !== gap.id ||
    claim.topicKey !== question.topicKey ||
    !claim.sourceReferenceIds.includes(source.id)
  ) {
    return domainFailure(
      'relationship-mismatch',
      'Every interview answer must retain its exact question, gap, source, claim, and scope.',
    );
  }
  if (
    source.sourceType !== 'owner-interview' ||
    source.excerpt !== answer.answer ||
    source.sourceLocator !== ownerInterviewLocator(question.id, answer.id) ||
    claim.provenance !== 'owner-interview-derived'
  ) {
    return domainFailure(
      'relationship-mismatch',
      'Interview answer provenance must retain the exact answer and generated claim origin.',
    );
  }
  if (answer.correctsAnswerId !== undefined) {
    const corrected = snapshot.interviewAnswers.find(({ id }) => id === answer.correctsAnswerId);
    if (
      corrected === undefined ||
      corrected.id === answer.id ||
      corrected.questionId !== answer.questionId
    ) {
      return domainFailure(
        'relationship-mismatch',
        'A corrected answer must reference an earlier answer to the same question.',
      );
    }
  }
  return domainSuccess(undefined);
}
