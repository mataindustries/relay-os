import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  type ActivateSetupInput,
  type ActivityEvent,
  type ActivityEventType,
  type Answer,
  type AnswerEligibilityGateKey,
  type AnswerEligibilityEvaluation,
  type AnchoredSourceReferenceInput,
  type ApprovalDecision,
  type ApprovedClaimRevisionInput,
  type AuthorityBoundary,
  type ClaimDecisionInput,
  type Company,
  type EmployeeVisibleKnowledge,
  type EmployeeQuestion,
  type EmployeeQuestionInput,
  type Escalation,
  type EscalationContextItem,
  type EscalationRule,
  type InterviewAnswer,
  type InterviewAnswerInput,
  type InterviewQuestion,
  type KnowledgeClaim,
  type KnowledgeClaimInput,
  type KnowledgeClaimUpdates,
  type KnowledgeGap,
  type KnowledgeGapReason,
  type KnowledgeGapStatus,
  type KnowledgeLifecycleStatus,
  type ManualExtractedClaimInput,
  type OperationalQuestionTemplate,
  type PhaseOneSnapshot,
  type QuestionEvaluationOutcome,
  type Responsibility,
  type Role,
  type SourceDocument,
  type SourceDocumentInput,
  type SourceDocumentRevisionInput,
  type SourceDocumentUpdates,
  type SourceReference,
  type SourceReferenceInput,
  type StructuredQuestionContext,
} from './entities';
import { evaluateTopicCoverage } from './coverage';
import { selectEmployeeVisibleKnowledge } from './employeeVisibility';
import {
  OPERATIONAL_TOPICS,
  getOperationalTopic,
  isOperationalTopicKey,
  operationalRiskPriority,
  structuredValuesMatch,
} from './operationalTopics';
import type { PhaseOneRepository } from './repositories';
import {
  evaluateQuestionPolicy,
  validateEmployeeQuestionInput,
  type PolicyFirewallDecision,
} from './questionPolicyFirewall';
import { domainFailure, domainSuccess, type DomainResult } from './result';
import {
  excerptSourceLines,
  normalizeSourceContent,
  numberSourceLines,
  ownerInterviewLocator,
  sourceDocumentLocator,
} from './sourceDocuments';
import {
  validateActivateSetupInput,
  validateKnowledgeClaimInput,
  validatePhaseOneSnapshot,
  validateSourceDocumentInput,
  validateSourceReferenceInput,
} from './validation';

export { selectEmployeeVisibleKnowledge } from './employeeVisibility';

export interface PhaseOneServiceOptions {
  readonly clock?: () => string;
  readonly idFactory?: (prefix: string) => string;
  readonly ownerFallbackDestination?: string;
}

const NON_DECISION_TRANSITIONS: Readonly<
  Record<KnowledgeLifecycleStatus, readonly KnowledgeLifecycleStatus[]>
> = {
  extracted: ['proposed'],
  proposed: ['missing-information', 'conflicting-information'],
  approved: [],
  rejected: [],
  'missing-information': ['proposed'],
  'conflicting-information': ['proposed'],
  superseded: [],
};

const REJECTABLE_STATUSES: readonly KnowledgeLifecycleStatus[] = [
  'extracted',
  'proposed',
  'missing-information',
  'conflicting-information',
];

const ACTIVE_GAP_STATUSES: readonly KnowledgeGapStatus[] = [
  'open',
  'question-ready',
  'answered',
  'proposal-created',
];

const QUESTION_GAP_REMEDIATION_GATES: Readonly<
  Record<KnowledgeGapReason, readonly AnswerEligibilityGateKey[]>
> = {
  'missing-evidence': [
    'current-approved-knowledge-present',
    'provenance-valid',
    'no-explicit-conflict',
  ],
  'conflicting-evidence': [
    'current-approved-knowledge-present',
    'provenance-valid',
    'no-explicit-conflict',
  ],
  'invalid-provenance': [
    'current-approved-knowledge-present',
    'provenance-valid',
    'no-explicit-conflict',
  ],
  'authority-unclear': [
    'current-approved-knowledge-present',
    'provenance-valid',
    'no-explicit-conflict',
    'authority-clear',
  ],
  'unsupported-request': [
    'current-approved-knowledge-present',
    'provenance-valid',
    'no-explicit-conflict',
    'answer-mode-supported',
  ],
  'incomplete-evidence': [],
};

const GAP_TRANSITIONS: Readonly<Record<KnowledgeGapStatus, readonly KnowledgeGapStatus[]>> = {
  open: ['question-ready', 'dismissed', 'resolved'],
  'question-ready': ['answered', 'proposal-created', 'dismissed', 'resolved'],
  answered: ['proposal-created', 'dismissed', 'resolved'],
  'proposal-created': ['question-ready', 'dismissed', 'resolved'],
  resolved: [],
  dismissed: [],
};

function clean(value: string): string {
  return value.trim();
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function snapshotsMatch(left: PhaseOneSnapshot, right: PhaseOneSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isEmptySnapshot(snapshot: PhaseOneSnapshot): boolean {
  return snapshotsMatch(snapshot, EMPTY_PHASE_ONE_SNAPSHOT);
}

export class PhaseOneService {
  private readonly clock: () => string;
  private readonly idFactory: (prefix: string) => string;
  private readonly ownerFallbackDestination?: string;

  constructor(
    private readonly repository: PhaseOneRepository,
    options: PhaseOneServiceOptions = {},
  ) {
    let sequence = 0;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}-${++sequence}`);
    if (options.ownerFallbackDestination !== undefined) {
      this.ownerFallbackDestination = clean(options.ownerFallbackDestination);
    }
  }

  getSnapshot(): PhaseOneSnapshot {
    return this.repository.readSnapshot();
  }

  initializeSnapshot(seed: PhaseOneSnapshot): DomainResult<PhaseOneSnapshot> {
    const validation = validatePhaseOneSnapshot(seed);
    if (!validation.ok) return validation;

    const current = this.getSnapshot();
    if (!isEmptySnapshot(current)) {
      return snapshotsMatch(current, seed)
        ? domainSuccess(current)
        : domainFailure(
            'already-initialized',
            'This session already contains a company and cannot load a different dataset.',
          );
    }

    this.repository.replaceSnapshot(seed);
    return domainSuccess(this.getSnapshot());
  }

  resetFictionalDemoSnapshot(
    seed: PhaseOneSnapshot,
    expectedScope: { readonly companyId: string; readonly roleId: string },
  ): DomainResult<PhaseOneSnapshot> {
    const validation = validatePhaseOneSnapshot(seed);
    if (!validation.ok) return validation;

    const current = this.getSnapshot();
    if (
      current.company?.id !== expectedScope.companyId ||
      current.role?.id !== expectedScope.roleId ||
      seed.company?.id !== expectedScope.companyId ||
      seed.role?.id !== expectedScope.roleId
    ) {
      return domainFailure(
        'invalid-transition',
        'Only the active fixed fictional demonstration may be reset.',
      );
    }

    if (snapshotsMatch(current, seed)) return domainSuccess(current);
    this.repository.replaceSnapshot(seed);
    return domainSuccess(this.getSnapshot());
  }

  activateSetup(input: ActivateSetupInput): DomainResult<PhaseOneSnapshot> {
    const current = this.getSnapshot();
    if (!isEmptySnapshot(current)) {
      return domainFailure(
        'already-initialized',
        'Phase 1 supports one company and one role per session.',
      );
    }

    const validation = validateActivateSetupInput(input);
    if (!validation.ok) return validation;

    const timestamp = this.clock();
    const companyId = this.idFactory('company');
    const roleId = this.idFactory('role');
    const company: Company = {
      id: companyId,
      name: clean(input.company.name),
      industry: clean(input.company.industry),
      serviceArea: clean(input.company.serviceArea),
      contactInformation: {
        phone: clean(input.company.phone),
        email: clean(input.company.email),
      },
      operatingTimezone: clean(input.company.operatingTimezone),
      status: 'active',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const responsibilities: readonly Responsibility[] = input.role.responsibilities.map(
      (responsibility) => ({
        id: this.idFactory('responsibility'),
        roleId,
        title: clean(responsibility.title),
        expectedOutcome: clean(responsibility.expectedOutcome),
        frequency: clean(responsibility.frequency),
        completionEvidence: clean(responsibility.completionEvidence),
        status: responsibility.status,
      }),
    );
    const authorityBoundaries: readonly AuthorityBoundary[] = input.role.authorityBoundaries.map(
      (boundary) => ({
        id: this.idFactory('authority'),
        roleId,
        subject: clean(boundary.subject),
        permissionLevel: boundary.permissionLevel,
        limitOrConstraint: clean(boundary.limitOrConstraint),
        escalationDestination: clean(boundary.escalationDestination),
        notes: clean(boundary.notes),
        ...(boundary.topicKeys === undefined ? {} : { topicKeys: [...boundary.topicKeys] }),
        ...(boundary.applicableRequestTypes === undefined
          ? {}
          : { applicableRequestTypes: [...boundary.applicableRequestTypes] }),
        ...(boundary.numericLimit === undefined ? {} : { numericLimit: boundary.numericLimit }),
        ...(boundary.currency === undefined ? {} : { currency: boundary.currency }),
        ...(boundary.structuredConstraintType === undefined
          ? {}
          : { structuredConstraintType: boundary.structuredConstraintType }),
      }),
    );
    const escalationRules: readonly EscalationRule[] = input.role.escalationRules.map((rule) => ({
      id: this.idFactory('escalation'),
      roleId,
      trigger: clean(rule.trigger),
      destination: clean(rule.destination),
      urgency: rule.urgency,
      requiredContext: clean(rule.requiredContext),
      expectedResponse: clean(rule.expectedResponse),
      ...(rule.topicKeys === undefined ? {} : { topicKeys: [...rule.topicKeys] }),
      ...(rule.applicableRequestTypes === undefined
        ? {}
        : { applicableRequestTypes: [...rule.applicableRequestTypes] }),
      ...(rule.urgencyMatch === undefined ? {} : { urgencyMatch: rule.urgencyMatch }),
      ...(rule.sensitivityCategories === undefined
        ? {}
        : { sensitivityCategories: [...rule.sensitivityCategories] }),
    }));
    const role: Role = {
      id: roleId,
      companyId,
      title: clean(input.role.title),
      mission: clean(input.role.mission),
      status: input.role.status,
      responsibilities,
      authorityBoundaries,
      escalationRules,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return this.commit({ ...EMPTY_PHASE_ONE_SNAPSHOT, company, role });
  }

  createSourceDocument(input: SourceDocumentInput): DomainResult<SourceDocument> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const validation = validateSourceDocumentInput(input);
    if (!validation.ok) return validation;

    const timestamp = this.clock();
    const content = normalizeSourceContent(input.content);
    const document: SourceDocument = {
      id: this.idFactory('document'),
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      title: clean(input.title),
      sourceType: input.sourceType,
      supplierLabel: clean(input.supplierLabel),
      captureMethod: 'manual-paste',
      content,
      lines: numberSourceLines(content),
      version: 1,
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return this.commit(
      { ...scope.value, sourceDocuments: [...scope.value.sourceDocuments, document] },
      document,
    );
  }

  updateSourceDocumentDraft(
    documentId: string,
    updates: SourceDocumentUpdates,
  ): DomainResult<SourceDocument> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const document = scope.value.sourceDocuments.find(({ id }) => id === documentId);
    if (document === undefined) {
      return domainFailure('document-not-found', 'Source document was not found.');
    }
    if (document.status !== 'draft') {
      return domainFailure(
        'immutable-source-document',
        'Available and historical source versions cannot be edited in place.',
      );
    }
    const candidateInput: SourceDocumentInput = {
      title: updates.title ?? document.title,
      sourceType: updates.sourceType ?? document.sourceType,
      supplierLabel: updates.supplierLabel ?? document.supplierLabel,
      content: updates.content ?? document.content,
    };
    const validation = validateSourceDocumentInput(candidateInput);
    if (!validation.ok) return validation;
    const content = normalizeSourceContent(candidateInput.content);
    const updated: SourceDocument = {
      ...document,
      title: clean(candidateInput.title),
      sourceType: candidateInput.sourceType,
      supplierLabel: clean(candidateInput.supplierLabel),
      content,
      lines: numberSourceLines(content),
      updatedAt: this.clock(),
    };
    return this.replaceSourceDocument(scope.value, updated);
  }

  activateSourceDocument(documentId: string): DomainResult<SourceDocument> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const document = scope.value.sourceDocuments.find(({ id }) => id === documentId);
    if (document === undefined) {
      return domainFailure('document-not-found', 'Source document was not found.');
    }
    if (document.status !== 'draft') {
      return domainFailure('invalid-transition', 'Only a draft source document can be activated.');
    }
    if (clean(document.content).length === 0) {
      return domainFailure(
        'validation-error',
        'Paste nonblank source content before making the document available.',
        'sourceDocument.content',
      );
    }

    const timestamp = this.clock();
    const activated: SourceDocument = {
      ...document,
      status: 'available',
      updatedAt: timestamp,
    };
    let predecessorId: string | undefined;
    if (document.supersedesDocumentId !== undefined) {
      const predecessor = scope.value.sourceDocuments.find(
        ({ id }) => id === document.supersedesDocumentId,
      );
      if (predecessor === undefined || predecessor.status !== 'available') {
        return domainFailure(
          'revision-conflict',
          'A source revision can supersede only its current available predecessor.',
        );
      }
      predecessorId = predecessor.id;
    }
    const sourceDocuments = scope.value.sourceDocuments.map((candidate) => {
      if (candidate.id === activated.id) return activated;
      if (candidate.id === predecessorId) {
        return { ...candidate, status: 'superseded' as const, updatedAt: timestamp };
      }
      return candidate;
    });
    return this.commit({ ...scope.value, sourceDocuments }, activated);
  }

  createSourceDocumentRevision(input: SourceDocumentRevisionInput): DomainResult<SourceDocument> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const current = scope.value.sourceDocuments.find(({ id }) => id === input.documentId);
    if (current === undefined) {
      return domainFailure('document-not-found', 'Source document was not found.');
    }
    if (current.status !== 'available') {
      return domainFailure(
        'invalid-transition',
        'Only a current available source document can be revised.',
      );
    }
    const openRevision = scope.value.sourceDocuments.some(
      (candidate) => candidate.supersedesDocumentId === current.id && candidate.status === 'draft',
    );
    if (openRevision) {
      return domainFailure(
        'revision-conflict',
        'This source document already has an unresolved draft revision.',
      );
    }
    const candidateInput: SourceDocumentInput = {
      title: input.title ?? current.title,
      sourceType: input.sourceType ?? current.sourceType,
      supplierLabel: input.supplierLabel ?? current.supplierLabel,
      content: input.content ?? current.content,
    };
    const validation = validateSourceDocumentInput(candidateInput);
    if (!validation.ok) return validation;
    const timestamp = this.clock();
    const content = normalizeSourceContent(candidateInput.content);
    const revision: SourceDocument = {
      id: this.idFactory('document'),
      companyId: current.companyId,
      roleId: current.roleId,
      title: clean(candidateInput.title),
      sourceType: candidateInput.sourceType,
      supplierLabel: clean(candidateInput.supplierLabel),
      captureMethod: 'manual-paste',
      content,
      lines: numberSourceLines(content),
      version: current.version + 1,
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
      supersedesDocumentId: current.id,
    };
    return this.commit(
      { ...scope.value, sourceDocuments: [...scope.value.sourceDocuments, revision] },
      revision,
    );
  }

  withdrawSourceDocument(documentId: string): DomainResult<SourceDocument> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const document = scope.value.sourceDocuments.find(({ id }) => id === documentId);
    if (document === undefined) {
      return domainFailure('document-not-found', 'Source document was not found.');
    }
    if (document.status !== 'draft' && document.status !== 'available') {
      return domainFailure(
        'invalid-transition',
        `Cannot withdraw a ${document.status} source document.`,
      );
    }
    const withdrawn: SourceDocument = {
      ...document,
      status: 'withdrawn',
      updatedAt: this.clock(),
    };
    return this.replaceSourceDocument(scope.value, withdrawn);
  }

  createAnchoredSourceReference(
    input: AnchoredSourceReferenceInput,
  ): DomainResult<SourceReference> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const documentWithId = scope.value.sourceDocuments.find(
      ({ id }) => id === input.sourceDocumentId,
    );
    if (documentWithId === undefined) {
      return domainFailure('document-not-found', 'Source document was not found.');
    }
    const document = scope.value.sourceDocuments.find(
      ({ id, version }) => id === input.sourceDocumentId && version === input.sourceDocumentVersion,
    );
    if (document === undefined) {
      return domainFailure(
        'document-version-not-found',
        'The requested source document version does not exist.',
      );
    }
    if (document.status === 'draft' || document.status === 'withdrawn') {
      return domainFailure(
        'invalid-transition',
        'Only available or superseded source versions can receive new anchors.',
      );
    }
    if (
      !Number.isInteger(input.startLine) ||
      !Number.isInteger(input.endLine) ||
      input.startLine < 1 ||
      input.endLine < input.startLine ||
      input.endLine > document.lines.length
    ) {
      return domainFailure(
        'invalid-line-range',
        `Choose a one-based inclusive range within lines 1-${document.lines.length}.`,
      );
    }
    const source: SourceReference = {
      id: this.idFactory('source'),
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      sourceTitle: document.title,
      sourceType: document.sourceType,
      sourceLocator: sourceDocumentLocator(
        document.id,
        document.version,
        input.startLine,
        input.endLine,
      ),
      excerpt: excerptSourceLines(document.lines, input.startLine, input.endLine),
      recordedAt: this.clock(),
      sourceDocumentId: document.id,
      sourceDocumentVersion: document.version,
      startLine: input.startLine,
      endLine: input.endLine,
    };
    return this.commit(
      { ...scope.value, sourceReferences: [...scope.value.sourceReferences, source] },
      source,
    );
  }

  createSourceReference(input: SourceReferenceInput): DomainResult<SourceReference> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const validation = validateSourceReferenceInput(input);
    if (!validation.ok) return validation;
    if (
      input.sourceDocumentId !== undefined ||
      input.sourceDocumentVersion !== undefined ||
      input.startLine !== undefined ||
      input.endLine !== undefined
    ) {
      return domainFailure(
        'validation-error',
        'Use the anchored-source operation for document line references.',
      );
    }

    const base = {
      id: this.idFactory('source'),
      sourceTitle: clean(input.sourceTitle),
      sourceType: input.sourceType,
      sourceLocator: clean(input.sourceLocator),
      recordedAt: this.clock(),
    };
    const source: SourceReference =
      input.excerpt === undefined || clean(input.excerpt).length === 0
        ? base
        : { ...base, excerpt: clean(input.excerpt) };
    const next = {
      ...scope.value,
      sourceReferences: [...scope.value.sourceReferences, source],
    };
    const committed = this.commit(next, source);
    return committed;
  }

  createKnowledgeClaim(input: KnowledgeClaimInput): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const validation = validateKnowledgeClaimInput(input);
    if (!validation.ok) return validation;
    const sources = this.validateSourceIds(scope.value, input.sourceReferenceIds);
    if (!sources.ok) return sources;

    const timestamp = this.clock();
    const claim: KnowledgeClaim = {
      id: this.idFactory('claim'),
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      statement: clean(input.statement),
      category: input.category,
      provenance: input.provenance,
      lifecycleStatus: input.lifecycleStatus,
      sourceReferenceIds: unique(input.sourceReferenceIds),
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
      ...(input.topicKey === undefined ? {} : { topicKey: input.topicKey }),
    };
    return this.commitWithOptionalReconciliation(
      { ...scope.value, knowledgeClaims: [...scope.value.knowledgeClaims, claim] },
      claim,
    );
  }

  createManualExtractedClaim(input: ManualExtractedClaimInput): DomainResult<KnowledgeClaim> {
    if (!isOperationalTopicKey(input.topicKey)) {
      return domainFailure('invalid-topic', 'Choose a valid operational topic.', 'topicKey');
    }
    return this.createKnowledgeClaim({
      statement: input.statement,
      category: input.category,
      provenance: 'source-extracted',
      lifecycleStatus: 'extracted',
      sourceReferenceIds: [input.sourceReferenceId],
      topicKey: input.topicKey,
    });
  }

  updateKnowledgeClaim(
    claimId: string,
    updates: KnowledgeClaimUpdates,
  ): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const claim = scope.value.knowledgeClaims.find(({ id }) => id === claimId);
    if (claim === undefined) return domainFailure('not-found', 'Knowledge claim was not found.');
    if (claim.lifecycleStatus === 'approved' || claim.lifecycleStatus === 'superseded') {
      return domainFailure(
        'immutable-approved-claim',
        'Approved knowledge cannot be edited in place; create a revision.',
      );
    }
    if (claim.lifecycleStatus === 'rejected') {
      return domainFailure('invalid-transition', 'Rejected knowledge is immutable.');
    }

    const sourceReferenceIds = updates.sourceReferenceIds ?? claim.sourceReferenceIds;
    const sources = this.validateSourceIds(scope.value, sourceReferenceIds);
    if (!sources.ok) return sources;
    const statement = clean(updates.statement ?? claim.statement);
    if (statement.length === 0) {
      return domainFailure(
        'validation-error',
        'Claim statement is required.',
        'knowledgeClaim.statement',
      );
    }

    const updated: KnowledgeClaim = {
      ...claim,
      statement,
      category: updates.category ?? claim.category,
      provenance: updates.provenance ?? claim.provenance,
      sourceReferenceIds: unique(sourceReferenceIds),
      updatedAt: this.clock(),
      ...(updates.topicKey === undefined ? {} : { topicKey: updates.topicKey }),
    };
    return this.replaceClaim(scope.value, updated, true);
  }

  transitionKnowledgeClaim(
    claimId: string,
    target: KnowledgeLifecycleStatus,
  ): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const claim = scope.value.knowledgeClaims.find(({ id }) => id === claimId);
    if (claim === undefined) return domainFailure('not-found', 'Knowledge claim was not found.');
    if (target === 'approved' || target === 'rejected') {
      return domainFailure(
        'approval-decision-required',
        'Approval and rejection require an explicit decision operation.',
      );
    }
    if (target === 'superseded') {
      return domainFailure(
        'invalid-transition',
        'Supersession occurs only when an approved revision succeeds.',
      );
    }
    if (!NON_DECISION_TRANSITIONS[claim.lifecycleStatus].includes(target)) {
      return domainFailure(
        'invalid-transition',
        `Cannot transition knowledge from ${claim.lifecycleStatus} to ${target}.`,
      );
    }

    const updated: KnowledgeClaim = {
      ...claim,
      lifecycleStatus: target,
      updatedAt: this.clock(),
    };
    return this.replaceClaim(scope.value, updated, true);
  }

  approveKnowledgeClaim(input: ClaimDecisionInput): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const decisionValidation = this.validateDecisionInput(input);
    if (!decisionValidation.ok) return decisionValidation;
    const claim = scope.value.knowledgeClaims.find(({ id }) => id === input.claimId);
    if (claim === undefined) return domainFailure('not-found', 'Knowledge claim was not found.');
    if (claim.lifecycleStatus !== 'proposed') {
      return domainFailure('invalid-transition', 'Only proposed knowledge can be approved.');
    }
    if (claim.sourceReferenceIds.length === 0) {
      return domainFailure(
        'missing-source',
        'A claim requires at least one source reference before approval.',
      );
    }
    const sources = this.validateSourceIds(scope.value, claim.sourceReferenceIds);
    if (!sources.ok) return sources;

    const timestamp = this.clock();
    const decision = this.createDecision(claim, input, 'approve', timestamp);
    const approved: KnowledgeClaim = {
      ...claim,
      lifecycleStatus: 'approved',
      updatedAt: timestamp,
    };
    let previousId: string | undefined;
    if (claim.supersedesClaimId !== undefined) {
      const previous = scope.value.knowledgeClaims.find(({ id }) => id === claim.supersedesClaimId);
      if (previous === undefined || previous.lifecycleStatus !== 'approved') {
        return domainFailure(
          'revision-conflict',
          'A revision can supersede only its current approved predecessor.',
        );
      }
      previousId = previous.id;
    }

    const knowledgeClaims = scope.value.knowledgeClaims.map((candidate) => {
      if (candidate.id === approved.id) return approved;
      if (candidate.id === previousId) {
        return {
          ...candidate,
          lifecycleStatus: 'superseded' as const,
          updatedAt: timestamp,
        };
      }
      return candidate;
    });
    return this.commitWithOptionalReconciliation(
      {
        ...scope.value,
        knowledgeClaims,
        approvalDecisions: [...scope.value.approvalDecisions, decision],
      },
      approved,
    );
  }

  rejectKnowledgeClaim(input: ClaimDecisionInput): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const decisionValidation = this.validateDecisionInput(input);
    if (!decisionValidation.ok) return decisionValidation;
    const claim = scope.value.knowledgeClaims.find(({ id }) => id === input.claimId);
    if (claim === undefined) return domainFailure('not-found', 'Knowledge claim was not found.');
    if (!REJECTABLE_STATUSES.includes(claim.lifecycleStatus)) {
      return domainFailure(
        'invalid-transition',
        `Cannot reject knowledge in ${claim.lifecycleStatus} status.`,
      );
    }

    const timestamp = this.clock();
    const rejected: KnowledgeClaim = {
      ...claim,
      lifecycleStatus: 'rejected',
      updatedAt: timestamp,
    };
    const decision = this.createDecision(claim, input, 'reject', timestamp);
    const next = {
      ...scope.value,
      knowledgeClaims: scope.value.knowledgeClaims.map((candidate) =>
        candidate.id === rejected.id ? rejected : candidate,
      ),
      approvalDecisions: [...scope.value.approvalDecisions, decision],
    };
    return this.commitWithOptionalReconciliation(next, rejected);
  }

  createApprovedClaimRevision(input: ApprovedClaimRevisionInput): DomainResult<KnowledgeClaim> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const claim = scope.value.knowledgeClaims.find(({ id }) => id === input.claimId);
    if (claim === undefined) return domainFailure('not-found', 'Knowledge claim was not found.');
    if (claim.lifecycleStatus !== 'approved') {
      return domainFailure('invalid-transition', 'Only current approved knowledge can be revised.');
    }
    const statement = clean(input.statement);
    if (statement.length === 0) {
      return domainFailure('validation-error', 'Revision statement is required.', 'statement');
    }
    const openRevision = scope.value.knowledgeClaims.some(
      (candidate) =>
        candidate.supersedesClaimId === claim.id &&
        ['extracted', 'proposed', 'missing-information', 'conflicting-information'].includes(
          candidate.lifecycleStatus,
        ),
    );
    if (openRevision) {
      return domainFailure(
        'revision-conflict',
        'This approved claim already has an unresolved revision.',
      );
    }

    const sourceReferenceIds = input.sourceReferenceIds ?? claim.sourceReferenceIds;
    const sources = this.validateSourceIds(scope.value, sourceReferenceIds);
    if (!sources.ok) return sources;
    const relatedVersions = scope.value.knowledgeClaims
      .filter((candidate) => candidate.id === claim.id || candidate.supersedesClaimId === claim.id)
      .map(({ version }) => version);
    const timestamp = this.clock();
    const revision: KnowledgeClaim = {
      id: this.idFactory('claim'),
      companyId: claim.companyId,
      roleId: claim.roleId,
      statement,
      category: input.category ?? claim.category,
      provenance: input.provenance ?? claim.provenance,
      lifecycleStatus: 'proposed',
      sourceReferenceIds: unique(sourceReferenceIds),
      createdAt: timestamp,
      updatedAt: timestamp,
      version: Math.max(...relatedVersions) + 1,
      supersedesClaimId: claim.id,
      ...((input.topicKey ?? claim.topicKey) === undefined
        ? {}
        : { topicKey: input.topicKey ?? claim.topicKey }),
    };
    return this.commitWithOptionalReconciliation(
      {
        ...scope.value,
        knowledgeClaims: [...scope.value.knowledgeClaims, revision],
      },
      revision,
    );
  }

  reconcileKnowledgeGaps(): DomainResult<readonly KnowledgeGap[]> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const reconciled = this.reconcileSnapshot(scope.value);
    if (!reconciled.ok) return reconciled;
    if (!snapshotsMatch(reconciled.value, scope.value)) {
      const committed = this.commit(reconciled.value);
      if (!committed.ok) return committed;
      return domainSuccess(committed.value.knowledgeGaps);
    }
    return domainSuccess(scope.value.knowledgeGaps);
  }

  transitionKnowledgeGap(gapId: string, target: KnowledgeGapStatus): DomainResult<KnowledgeGap> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const gap = scope.value.knowledgeGaps.find(({ id }) => id === gapId);
    if (gap === undefined) return domainFailure('gap-not-found', 'Knowledge gap was not found.');
    if (target === 'dismissed') {
      return domainFailure(
        'validation-error',
        'Dismissing a knowledge gap requires an explicit owner reason.',
      );
    }
    if (target === 'resolved') {
      return domainFailure(
        'invalid-transition',
        'Knowledge gaps resolve only through approved same-topic knowledge.',
      );
    }
    if (!GAP_TRANSITIONS[gap.status].includes(target)) {
      return domainFailure(
        'invalid-transition',
        `Cannot transition a knowledge gap from ${gap.status} to ${target}.`,
      );
    }
    const updated: KnowledgeGap = { ...gap, status: target, updatedAt: this.clock() };
    return this.replaceGap(scope.value, updated);
  }

  dismissKnowledgeGap(gapId: string, reason: string): DomainResult<KnowledgeGap> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const gap = scope.value.knowledgeGaps.find(({ id }) => id === gapId);
    if (gap === undefined) return domainFailure('gap-not-found', 'Knowledge gap was not found.');
    if (!ACTIVE_GAP_STATUSES.includes(gap.status)) {
      return domainFailure('invalid-transition', `Cannot dismiss a ${gap.status} knowledge gap.`);
    }
    if (clean(reason).length === 0) {
      return domainFailure(
        'validation-error',
        'Record why this knowledge gap is being dismissed.',
        'dismissedReason',
      );
    }
    const timestamp = this.clock();
    const dismissed: KnowledgeGap = {
      ...gap,
      status: 'dismissed',
      dismissedReason: clean(reason),
      updatedAt: timestamp,
    };
    const next = {
      ...scope.value,
      knowledgeGaps: scope.value.knowledgeGaps.map((candidate) =>
        candidate.id === dismissed.id ? dismissed : candidate,
      ),
      interviewQuestions: scope.value.interviewQuestions.map((question) =>
        question.gapId === dismissed.id &&
        (question.status === 'queued' || question.status === 'active')
          ? { ...question, status: 'withdrawn' as const }
          : question,
      ),
    };
    return this.commit(next, dismissed);
  }

  generateInterviewQuestions(): DomainResult<readonly InterviewQuestion[]> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const reconciled = this.reconcileSnapshot(scope.value);
    if (!reconciled.ok) return reconciled;
    let next = reconciled.value;
    const questions = [...next.interviewQuestions];
    const gaps = [...next.knowledgeGaps];

    for (const gap of gaps) {
      if (!ACTIVE_GAP_STATUSES.includes(gap.status)) continue;
      const topic = getOperationalTopic(gap.topicKey);
      const alreadyGenerated = questions.some(
        (question) =>
          question.gapId === gap.id && question.templateKey === topic.primaryQuestion.key,
      );
      if (alreadyGenerated) continue;
      questions.push(this.createInterviewQuestion(gap, topic.primaryQuestion, 0));
      const gapIndex = gaps.findIndex(({ id }) => id === gap.id);
      gaps[gapIndex] = {
        ...gap,
        status: 'question-ready',
        updatedAt: this.clock(),
      };
    }

    next = this.activateNextQuestion({
      ...next,
      knowledgeGaps: gaps,
      interviewQuestions: questions,
    });
    const committed = this.commit(next);
    if (!committed.ok) return committed;
    return domainSuccess(this.prioritizedQuestions(committed.value.interviewQuestions));
  }

  skipInterviewQuestion(questionId: string, reason: string): DomainResult<InterviewQuestion> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const question = scope.value.interviewQuestions.find(({ id }) => id === questionId);
    if (question === undefined) {
      return domainFailure('question-not-found', 'Interview question was not found.');
    }
    if (question.status !== 'active') {
      return domainFailure(
        'invalid-transition',
        'Only the active interview question can be skipped.',
      );
    }
    if (clean(reason).length === 0) {
      return domainFailure(
        'validation-error',
        'Record a reason before skipping this question.',
        'skipReason',
      );
    }
    const skipped: InterviewQuestion = {
      ...question,
      status: 'skipped',
      skippedReason: clean(reason),
    };
    const next = this.activateNextQuestion({
      ...scope.value,
      interviewQuestions: scope.value.interviewQuestions.map((candidate) =>
        candidate.id === skipped.id ? skipped : candidate,
      ),
    });
    return this.commit(next, skipped);
  }

  submitInterviewAnswer(input: InterviewAnswerInput): DomainResult<InterviewAnswer> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const question = scope.value.interviewQuestions.find(({ id }) => id === input.questionId);
    if (question === undefined) {
      return domainFailure('question-not-found', 'Interview question was not found.');
    }
    const correction = input.correctsAnswerId !== undefined;
    if (!correction && question.status !== 'active') {
      return domainFailure('invalid-transition', 'Only the active question can be answered.');
    }
    if (correction) {
      const corrected = scope.value.interviewAnswers.find(
        ({ id }) => id === input.correctsAnswerId,
      );
      if (corrected === undefined) {
        return domainFailure('answer-not-found', 'The answer being corrected was not found.');
      }
      if (corrected.questionId !== question.id || question.status !== 'answered') {
        return domainFailure(
          'relationship-mismatch',
          'A correction must target an answered record for the same question.',
        );
      }
    }
    const answerValidation = this.validateInterviewAnswerInput(question, input);
    if (!answerValidation.ok) return answerValidation;
    const gap = scope.value.knowledgeGaps.find(({ id }) => id === question.gapId);
    if (gap === undefined || !ACTIVE_GAP_STATUSES.includes(gap.status)) {
      return domainFailure('gap-not-found', 'The question no longer has an unresolved gap.');
    }

    const timestamp = this.clock();
    const answerId = this.idFactory('answer');
    const sourceId = this.idFactory('source');
    const claimId = this.idFactory('claim');
    const topic = getOperationalTopic(question.topicKey);
    const source: SourceReference = {
      id: sourceId,
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      sourceTitle: `Owner interview — ${topic.label}`,
      sourceType: 'owner-interview',
      sourceLocator: ownerInterviewLocator(question.id, answerId),
      excerpt: input.answer,
      recordedAt: timestamp,
    };
    const claim: KnowledgeClaim = {
      id: claimId,
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      statement: clean(input.answer),
      category: question.topicKey === 'authority-and-escalation' ? 'authority-boundary' : 'general',
      provenance: 'owner-interview-derived',
      lifecycleStatus: 'proposed',
      sourceReferenceIds: [source.id],
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
      topicKey: question.topicKey,
    };
    const answer: InterviewAnswer = {
      id: answerId,
      questionId: question.id,
      gapId: gap.id,
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      actorLabel: clean(input.actorLabel),
      answer: input.answer,
      ...(input.structuredValue === undefined ? {} : { structuredValue: input.structuredValue }),
      answeredAt: timestamp,
      sourceReferenceId: source.id,
      generatedClaimId: claim.id,
      ...(input.correctsAnswerId === undefined ? {} : { correctsAnswerId: input.correctsAnswerId }),
    };
    const answeredQuestion: InterviewQuestion = correction
      ? question
      : { ...question, status: 'answered', answeredAt: timestamp };
    const updatedGap: KnowledgeGap = {
      ...gap,
      status: 'proposal-created',
      supportingSourceReferenceIds: unique([...gap.supportingSourceReferenceIds, source.id]),
      relatedClaimIds: unique([...gap.relatedClaimIds, claim.id]),
      updatedAt: timestamp,
    };
    let questions = scope.value.interviewQuestions.map((candidate) =>
      candidate.id === answeredQuestion.id ? answeredQuestion : candidate,
    );
    questions = this.appendConditionalFollowUps(questions, updatedGap, question, input);
    const next = this.activateNextQuestion({
      ...scope.value,
      sourceReferences: [...scope.value.sourceReferences, source],
      knowledgeClaims: [...scope.value.knowledgeClaims, claim],
      knowledgeGaps: scope.value.knowledgeGaps.map((candidate) =>
        candidate.id === updatedGap.id ? updatedGap : candidate,
      ),
      interviewQuestions: questions,
      interviewAnswers: [...scope.value.interviewAnswers, answer],
    });
    return this.commitWithOptionalReconciliation(next, answer);
  }

  submitEmployeeQuestion(input: EmployeeQuestionInput): DomainResult<EmployeeQuestion> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const validation = validateEmployeeQuestionInput(input);
    if (!validation.ok) return validation;

    if (input.correctsQuestionId !== undefined) {
      const corrected = scope.value.employeeQuestions.find(
        ({ id }) => id === input.correctsQuestionId,
      );
      if (corrected === undefined) {
        return domainFailure(
          'employee-question-not-found',
          'The question being corrected was not found.',
        );
      }
      if (
        corrected.companyId !== scope.value.company.id ||
        corrected.roleId !== scope.value.role.id
      ) {
        return domainFailure(
          'relationship-mismatch',
          'A correction must reference a question in the active company and role.',
        );
      }
      if (corrected.status === 'received' || corrected.status === 'evaluating') {
        return domainFailure(
          'invalid-transition',
          'A received question must be evaluated before a correction is submitted.',
        );
      }
    }

    const timestamp = this.clock();
    const question: EmployeeQuestion = {
      id: this.idFactory('employee-question'),
      companyId: scope.value.company.id,
      roleId: scope.value.role.id,
      employeeLabel: clean(input.employeeLabel),
      questionText: input.questionText,
      topicKey: input.topicKey,
      requestType: input.requestType,
      sensitivitySelection: input.sensitivitySelection,
      structuredContext: this.normalizeQuestionContext(input.structuredContext),
      status: 'received',
      submittedAt: timestamp,
      ...(input.correctsQuestionId === undefined
        ? {}
        : { correctsQuestionId: input.correctsQuestionId }),
      correlationId: this.idFactory('correlation'),
    };
    const event = this.createActivityEvent(
      scope.value,
      'question-received',
      'employee-question',
      question.id,
      question.employeeLabel,
      question.correlationId,
      {
        topicKey: question.topicKey,
        requestType: question.requestType,
        sensitivitySelection: question.sensitivitySelection,
      },
      timestamp,
    );
    return this.commit(
      {
        ...scope.value,
        employeeQuestions: [...scope.value.employeeQuestions, question],
        activityEvents: [...scope.value.activityEvents, event],
      },
      question,
    );
  }

  correctEmployeeQuestion(
    questionId: string,
    input: EmployeeQuestionInput,
  ): DomainResult<EmployeeQuestion> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const question = scope.value.employeeQuestions.find(({ id }) => id === questionId);
    if (question === undefined) {
      return domainFailure('employee-question-not-found', 'Employee question was not found.');
    }
    return this.submitEmployeeQuestion({
      ...input,
      correctsQuestionId: question.id,
    });
  }

  evaluateEmployeeQuestion(questionId: string): DomainResult<QuestionEvaluationOutcome> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const question = scope.value.employeeQuestions.find(({ id }) => id === questionId);
    if (question === undefined) {
      return domainFailure('employee-question-not-found', 'Employee question was not found.');
    }

    const existingEvaluation = scope.value.answerEligibilityEvaluations.find(
      (evaluation) => evaluation.questionId === question.id,
    );
    if (existingEvaluation !== undefined) {
      return this.existingQuestionOutcome(scope.value, question, existingEvaluation);
    }
    if (question.status !== 'received') {
      return domainFailure(
        'invalid-transition',
        `Cannot evaluate a question in ${question.status} status.`,
      );
    }

    const evaluatedAt = this.clock();
    const evaluatingQuestion: EmployeeQuestion = { ...question, status: 'evaluating' };
    const evaluationId = this.idFactory('eligibility-evaluation');
    const policy = evaluateQuestionPolicy(
      {
        ...scope.value,
        employeeQuestions: scope.value.employeeQuestions.map((candidate) =>
          candidate.id === question.id ? evaluatingQuestion : candidate,
        ),
      },
      evaluatingQuestion,
      evaluationId,
      evaluatedAt,
    );

    let next: PhaseOneSnapshot = {
      ...scope.value,
      answerEligibilityEvaluations: [
        ...scope.value.answerEligibilityEvaluations,
        policy.evaluation,
      ],
    };
    let gap: KnowledgeGap | undefined;
    if (policy.gapReason !== undefined) {
      const linked = this.linkQuestionGap(
        next,
        question,
        policy.evaluation,
        policy.gapReason,
        evaluatedAt,
      );
      next = linked.snapshot;
      gap = linked.gap;
    }

    const destination =
      policy.escalationReason === undefined ? undefined : this.escalationDestination(policy);
    let escalation: Escalation | undefined;
    if (policy.escalationReason !== undefined && destination !== undefined) {
      escalation = {
        id: this.idFactory('question-escalation'),
        companyId: question.companyId,
        roleId: question.roleId,
        questionId: question.id,
        reason: policy.escalationReason,
        urgency: policy.escalationUrgency ?? 'same-day',
        destination,
        requiredContext: this.escalationContext(question, policy.matchingRules[0]),
        status: 'open',
        createdAt: evaluatedAt,
        ...(gap === undefined ? {} : { relatedGapId: gap.id }),
        matchingBoundaryIds: policy.evaluation.matchingAuthorityBoundaryIds,
        matchingEscalationRuleIds: policy.evaluation.matchingEscalationRuleIds,
        correlationId: question.correlationId,
      };
      next = { ...next, escalations: [...next.escalations, escalation] };
    }

    const actualAnswerStatus: Answer['status'] =
      policy.answerStatus === 'escalated' && escalation === undefined
        ? 'withheld'
        : policy.answerStatus;
    const actualAnswerMode: Answer['answerMode'] =
      policy.answerStatus === 'escalated' && escalation === undefined
        ? 'withheld'
        : policy.answerMode;
    const answer: Answer = {
      id: this.idFactory('question-answer'),
      questionId: question.id,
      companyId: question.companyId,
      roleId: question.roleId,
      status: actualAnswerStatus,
      answerMode: actualAnswerMode,
      responseText: policy.responseText,
      citedClaimIds: actualAnswerStatus === 'delivered' ? policy.evaluation.eligibleClaimIds : [],
      citedSourceReferenceIds:
        actualAnswerStatus === 'delivered' ? policy.evaluation.eligibleSourceReferenceIds : [],
      citedApprovalDecisionIds:
        actualAnswerStatus === 'delivered' ? policy.evaluation.approvalDecisionIds : [],
      citedAuthorityBoundaryIds:
        actualAnswerStatus === 'delivered' ||
        actualAnswerStatus === 'prohibited' ||
        actualAnswerStatus === 'escalated'
          ? policy.evaluation.matchingAuthorityBoundaryIds
          : [],
      eligibilityEvaluationId: policy.evaluation.id,
      createdAt: evaluatedAt,
      ...(actualAnswerStatus === 'delivered' ? { deliveredAt: evaluatedAt } : {}),
      ...(policy.evaluation.withholdReason === undefined
        ? {}
        : { withheldReason: policy.evaluation.withholdReason }),
      correlationId: question.correlationId,
    };
    const finalQuestion: EmployeeQuestion = {
      ...question,
      status:
        actualAnswerStatus === 'delivered'
          ? 'answered'
          : actualAnswerStatus === 'escalated'
            ? 'escalated'
            : 'withheld',
    };
    const evaluationEvent = this.createActivityEvent(
      next,
      'question-evaluated',
      'answer-evaluation',
      policy.evaluation.id,
      'RoleKeep deterministic policy firewall',
      question.correlationId,
      { overallResult: policy.evaluation.overallResult },
      evaluatedAt,
    );
    const answerEvent = this.createActivityEvent(
      next,
      actualAnswerStatus === 'delivered' ? 'answer-delivered' : 'answer-withheld',
      'answer',
      answer.id,
      'RoleKeep deterministic policy firewall',
      question.correlationId,
      { status: actualAnswerStatus, answerMode: actualAnswerMode },
      evaluatedAt,
    );
    const gapEvent =
      gap === undefined
        ? undefined
        : this.createActivityEvent(
            next,
            'gap-linked-to-question',
            'knowledge-gap',
            gap.id,
            'RoleKeep deterministic policy firewall',
            question.correlationId,
            { topicKey: question.topicKey, reason: gap.reason },
            evaluatedAt,
          );
    const escalationEvent =
      escalation === undefined
        ? undefined
        : this.createActivityEvent(
            next,
            'escalation-opened',
            'escalation',
            escalation.id,
            'RoleKeep deterministic policy firewall',
            question.correlationId,
            { reason: escalation.reason, urgency: escalation.urgency },
            evaluatedAt,
          );
    const activityEvents = [
      ...next.activityEvents,
      evaluationEvent,
      answerEvent,
      ...(gapEvent === undefined ? [] : [gapEvent]),
      ...(escalationEvent === undefined ? [] : [escalationEvent]),
    ];
    next = {
      ...next,
      employeeQuestions: next.employeeQuestions.map((candidate) =>
        candidate.id === finalQuestion.id ? finalQuestion : candidate,
      ),
      answers: [...next.answers, answer],
      activityEvents,
    };
    const committed = this.commit(next);
    if (!committed.ok) return committed;
    return domainSuccess({
      question: finalQuestion,
      evaluation: policy.evaluation,
      answer,
      ...(escalation === undefined ? {} : { escalation }),
      ...(gap === undefined ? {} : { gap }),
    });
  }

  closeEmployeeQuestion(questionId: string): DomainResult<EmployeeQuestion> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const question = scope.value.employeeQuestions.find(({ id }) => id === questionId);
    if (question === undefined) {
      return domainFailure('employee-question-not-found', 'Employee question was not found.');
    }
    if (question.status === 'received' || question.status === 'evaluating') {
      return domainFailure(
        'invalid-transition',
        'A question can close only after a deterministic outcome exists.',
      );
    }
    if (question.status === 'closed') {
      return domainFailure('immutable-question', 'A closed question is immutable.');
    }
    const closed: EmployeeQuestion = {
      ...question,
      status: 'closed',
      closedAt: this.clock(),
    };
    return this.commit(
      {
        ...scope.value,
        employeeQuestions: scope.value.employeeQuestions.map((candidate) =>
          candidate.id === closed.id ? closed : candidate,
        ),
      },
      closed,
    );
  }

  assignEscalation(escalationId: string, assignedToLabel: string): DomainResult<Escalation> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const escalation = scope.value.escalations.find(({ id }) => id === escalationId);
    if (escalation === undefined) {
      return domainFailure('escalation-not-found', 'Escalation was not found.');
    }
    if (escalation.status !== 'open') {
      return domainFailure('invalid-transition', 'Only an open escalation can be assigned.');
    }
    if (clean(assignedToLabel).length === 0) {
      return domainFailure('validation-error', 'Assignment label is required.', 'assignedToLabel');
    }
    const timestamp = this.clock();
    const assignee = clean(assignedToLabel);
    const assigned: Escalation = {
      ...escalation,
      status: 'assigned',
      assignedAt: timestamp,
      assignedToLabel: assignee,
    };
    const event = this.createActivityEvent(
      scope.value,
      'escalation-assigned',
      'escalation',
      assigned.id,
      assignee,
      assigned.correlationId,
      { status: assigned.status },
      timestamp,
    );
    return this.commit(
      {
        ...scope.value,
        escalations: scope.value.escalations.map((candidate) =>
          candidate.id === assigned.id ? assigned : candidate,
        ),
        activityEvents: [...scope.value.activityEvents, event],
      },
      assigned,
    );
  }

  resolveEscalation(
    escalationId: string,
    resolutionSummary: string,
    resolvedByLabel: string,
  ): DomainResult<Escalation> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const escalation = scope.value.escalations.find(({ id }) => id === escalationId);
    if (escalation === undefined) {
      return domainFailure('escalation-not-found', 'Escalation was not found.');
    }
    if (escalation.status !== 'open' && escalation.status !== 'assigned') {
      return domainFailure(
        'invalid-transition',
        'Only an open or assigned escalation can be resolved.',
      );
    }
    if (clean(resolutionSummary).length === 0 || clean(resolvedByLabel).length === 0) {
      return domainFailure(
        'validation-error',
        'Resolution summary and resolver label are required.',
        clean(resolutionSummary).length === 0 ? 'resolutionSummary' : 'resolvedByLabel',
      );
    }
    const timestamp = this.clock();
    const resolver = clean(resolvedByLabel);
    const resolved: Escalation = {
      ...escalation,
      status: 'resolved',
      resolvedAt: timestamp,
      resolutionSummary: clean(resolutionSummary),
      resolvedByLabel: resolver,
    };
    const event = this.createActivityEvent(
      scope.value,
      'escalation-resolved',
      'escalation',
      resolved.id,
      resolver,
      resolved.correlationId,
      { status: resolved.status },
      timestamp,
    );
    return this.commit(
      {
        ...scope.value,
        escalations: scope.value.escalations.map((candidate) =>
          candidate.id === resolved.id ? resolved : candidate,
        ),
        activityEvents: [...scope.value.activityEvents, event],
      },
      resolved,
    );
  }

  closeEscalation(escalationId: string): DomainResult<Escalation> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const escalation = scope.value.escalations.find(({ id }) => id === escalationId);
    if (escalation === undefined) {
      return domainFailure('escalation-not-found', 'Escalation was not found.');
    }
    if (escalation.status !== 'resolved') {
      return domainFailure('invalid-transition', 'Only a resolved escalation can be closed.');
    }
    const closed: Escalation = { ...escalation, status: 'closed' };
    const timestamp = this.clock();
    const event = this.createActivityEvent(
      scope.value,
      'escalation-closed',
      'escalation',
      closed.id,
      closed.resolvedByLabel ?? closed.assignedToLabel ?? 'Owner',
      closed.correlationId,
      { status: closed.status },
      timestamp,
    );
    return this.commit(
      {
        ...scope.value,
        escalations: scope.value.escalations.map((candidate) =>
          candidate.id === closed.id ? closed : candidate,
        ),
        activityEvents: [...scope.value.activityEvents, event],
      },
      closed,
    );
  }

  prioritizedInterviewQuestions(): readonly InterviewQuestion[] {
    return this.prioritizedQuestions(this.getSnapshot().interviewQuestions);
  }

  selectEmployeeVisibleKnowledge(): readonly EmployeeVisibleKnowledge[] {
    return selectEmployeeVisibleKnowledge(this.getSnapshot());
  }

  private normalizeQuestionContext(context: StructuredQuestionContext): StructuredQuestionContext {
    switch (context.requestType) {
      case 'policy-lookup':
        return { ...context };
      case 'procedure-lookup':
        return { ...context };
      case 'decision-request':
        return { ...context };
      case 'exception-request':
        return { ...context };
      case 'financial-action':
        return { ...context };
      case 'emergency-action':
        return { ...context };
      case 'customer-commitment':
        return { ...context };
    }
  }

  private existingQuestionOutcome(
    snapshot: PhaseOneSnapshot,
    question: EmployeeQuestion,
    evaluation: AnswerEligibilityEvaluation,
  ): DomainResult<QuestionEvaluationOutcome> {
    const answer = snapshot.answers.find(
      (candidate) => candidate.eligibilityEvaluationId === evaluation.id,
    );
    if (answer === undefined) {
      return domainFailure(
        'answer-not-found',
        'The immutable answer for this evaluation was not found.',
      );
    }
    const escalation = snapshot.escalations.find(
      (candidate) => candidate.questionId === question.id,
    );
    const gap =
      escalation?.relatedGapId === undefined
        ? snapshot.knowledgeGaps.find((candidate) =>
            candidate.triggeringQuestionIds?.includes(question.id),
          )
        : snapshot.knowledgeGaps.find(({ id }) => id === escalation.relatedGapId);
    return domainSuccess({
      question,
      evaluation,
      answer,
      ...(escalation === undefined ? {} : { escalation }),
      ...(gap === undefined ? {} : { gap }),
    });
  }

  private linkQuestionGap(
    snapshot: PhaseOneSnapshot,
    question: EmployeeQuestion,
    evaluation: AnswerEligibilityEvaluation,
    reason: KnowledgeGapReason,
    timestamp: string,
  ): { readonly snapshot: PhaseOneSnapshot; readonly gap: KnowledgeGap } {
    const topic = getOperationalTopic(question.topicKey);
    const activeGap = snapshot.knowledgeGaps.find(
      (candidate) =>
        candidate.companyId === question.companyId &&
        candidate.roleId === question.roleId &&
        candidate.topicKey === question.topicKey &&
        ACTIVE_GAP_STATUSES.includes(candidate.status),
    );
    if (activeGap !== undefined) {
      const linked: KnowledgeGap = {
        ...activeGap,
        originalReason: activeGap.originalReason ?? activeGap.reason,
        triggeringQuestionIds: unique([...(activeGap.triggeringQuestionIds ?? []), question.id]),
        eligibilityEvaluationIds: unique([
          ...(activeGap.eligibilityEvaluationIds ?? []),
          evaluation.id,
        ]),
        updatedAt: timestamp,
      };
      return {
        snapshot: {
          ...snapshot,
          knowledgeGaps: snapshot.knowledgeGaps.map((candidate) =>
            candidate.id === linked.id ? linked : candidate,
          ),
        },
        gap: linked,
      };
    }

    const gap: KnowledgeGap = {
      id: this.idFactory('gap'),
      companyId: question.companyId,
      roleId: question.roleId,
      topicKey: question.topicKey,
      reason,
      description: this.questionGapDescription(topic.label, reason),
      impact: topic.whyItMatters,
      riskTier: topic.riskTier,
      status: 'open',
      supportingSourceReferenceIds: evaluation.eligibleSourceReferenceIds,
      relatedClaimIds: evaluation.eligibleClaimIds,
      createdAt: timestamp,
      updatedAt: timestamp,
      originalReason: reason,
      triggeringQuestionIds: [question.id],
      eligibilityEvaluationIds: [evaluation.id],
    };
    return {
      snapshot: { ...snapshot, knowledgeGaps: [...snapshot.knowledgeGaps, gap] },
      gap,
    };
  }

  private questionGapDescription(topicLabel: string, reason: KnowledgeGapReason): string {
    switch (reason) {
      case 'missing-evidence':
        return `${topicLabel} has no current approved knowledge for the employee request.`;
      case 'conflicting-evidence':
        return `${topicLabel} has explicit conflicting knowledge that blocks the employee request.`;
      case 'invalid-provenance':
        return `${topicLabel} has current guidance with invalid source or approval provenance.`;
      case 'authority-unclear':
        return `${topicLabel} lacks a compatible structured authority boundary for the employee request.`;
      case 'unsupported-request':
        return `${topicLabel} lacks approved policy or procedure for the selected request mode.`;
      case 'incomplete-evidence':
        return `${topicLabel} has incomplete evidence for the employee request.`;
    }
  }

  private escalationDestination(policy: PolicyFirewallDecision): string | undefined {
    const ruleDestination = policy.matchingRules.find(
      ({ destination }) => clean(destination).length > 0,
    )?.destination;
    if (ruleDestination !== undefined) return clean(ruleDestination);
    const boundaryDestination = policy.matchingBoundaries.find(
      ({ escalationDestination }) => clean(escalationDestination).length > 0,
    )?.escalationDestination;
    if (boundaryDestination !== undefined) return clean(boundaryDestination);
    return this.ownerFallbackDestination === undefined || this.ownerFallbackDestination.length === 0
      ? undefined
      : this.ownerFallbackDestination;
  }

  private escalationContext(
    question: EmployeeQuestion,
    rule: EscalationRule | undefined,
  ): readonly EscalationContextItem[] {
    const base: EscalationContextItem[] = [
      { label: 'Operational topic', value: question.topicKey },
      { label: 'Request type', value: question.requestType },
      { label: 'Sensitivity selection', value: question.sensitivitySelection },
    ];
    if (question.sensitivitySelection !== 'none') {
      return rule === undefined
        ? base
        : [...base, { label: 'Required by matching rule', value: rule.requiredContext }];
    }

    switch (question.structuredContext.requestType) {
      case 'policy-lookup':
        break;
      case 'procedure-lookup':
        if (question.structuredContext.currentStepLabel !== undefined) {
          base.push({
            label: 'Current step',
            value: question.structuredContext.currentStepLabel,
          });
        }
        break;
      case 'decision-request':
        base.push({
          label: 'Proposed action',
          value: question.structuredContext.proposedAction,
        });
        if (question.structuredContext.subject !== undefined) {
          base.push({ label: 'Subject', value: question.structuredContext.subject });
        }
        break;
      case 'exception-request':
        base.push(
          {
            label: 'Requested exception',
            value: question.structuredContext.requestedException,
          },
          { label: 'Reason', value: question.structuredContext.reason },
        );
        break;
      case 'financial-action':
        base.push(
          { label: 'Financial action', value: question.structuredContext.actionType },
          {
            label: 'Submitted amount',
            value: `${question.structuredContext.currency} ${question.structuredContext.amount.toFixed(2)}`,
          },
        );
        break;
      case 'emergency-action':
        base.push(
          { label: 'Urgency', value: question.structuredContext.urgency },
          {
            label: 'Emergency category',
            value: question.structuredContext.emergencyCategory,
          },
        );
        break;
      case 'customer-commitment':
        base.push({
          label: 'Commitment type',
          value: question.structuredContext.commitmentType,
        });
        if (
          question.structuredContext.amount !== undefined &&
          question.structuredContext.currency !== undefined
        ) {
          base.push({
            label: 'Commitment amount',
            value: `${question.structuredContext.currency} ${question.structuredContext.amount.toFixed(2)}`,
          });
        }
        if (question.structuredContext.commitmentDate !== undefined) {
          base.push({
            label: 'Commitment date',
            value: question.structuredContext.commitmentDate,
          });
        }
        break;
    }
    if (rule !== undefined) {
      base.push({ label: 'Required by matching rule', value: rule.requiredContext });
    }
    return base;
  }

  private createActivityEvent(
    snapshot: PhaseOneSnapshot,
    eventType: ActivityEventType,
    entityType: ActivityEvent['entityType'],
    entityId: string,
    actorLabel: string,
    correlationId: string,
    metadata: ActivityEvent['metadata'],
    occurredAt: string,
  ): ActivityEvent {
    if (snapshot.company === null || snapshot.role === null) {
      throw new Error('Activity events require an active company and role.');
    }
    return {
      id: this.idFactory('activity-event'),
      companyId: snapshot.company.id,
      roleId: snapshot.role.id,
      eventType,
      entityType,
      entityId,
      actorLabel,
      occurredAt,
      correlationId,
      metadata: { ...metadata },
    };
  }

  private requireActiveScope(): DomainResult<
    PhaseOneSnapshot & { readonly company: Company; readonly role: Role }
  > {
    const snapshot = this.getSnapshot();
    if (snapshot.company === null) {
      return domainFailure('company-not-found', 'Create a company before adding role knowledge.');
    }
    if (snapshot.role === null || snapshot.role.status !== 'active') {
      return domainFailure('role-not-found', 'An active role is required for this operation.');
    }
    return domainSuccess({ ...snapshot, company: snapshot.company, role: snapshot.role });
  }

  private validateSourceIds(
    snapshot: PhaseOneSnapshot,
    sourceReferenceIds: readonly string[],
  ): DomainResult<void> {
    const known = new Set(snapshot.sourceReferences.map(({ id }) => id));
    return sourceReferenceIds.some((id) => !known.has(id))
      ? domainFailure('source-not-found', 'One or more source references do not exist.')
      : domainSuccess(undefined);
  }

  private validateDecisionInput(input: ClaimDecisionInput): DomainResult<void> {
    if (clean(input.actorLabel).length === 0) {
      return domainFailure('validation-error', 'Decision actor label is required.', 'actorLabel');
    }
    return clean(input.reason).length === 0
      ? domainFailure('validation-error', 'Decision reason is required.', 'reason')
      : domainSuccess(undefined);
  }

  private createDecision(
    claim: KnowledgeClaim,
    input: ClaimDecisionInput,
    decision: 'approve' | 'reject',
    decidedAt: string,
  ): ApprovalDecision {
    return {
      id: this.idFactory('decision'),
      claimId: claim.id,
      decision,
      actorLabel: clean(input.actorLabel),
      reason: clean(input.reason),
      decidedAt,
      claimVersion: claim.version,
    };
  }

  private validateInterviewAnswerInput(
    question: InterviewQuestion,
    input: InterviewAnswerInput,
  ): DomainResult<void> {
    if (clean(input.actorLabel).length === 0) {
      return domainFailure('validation-error', 'Interview answer actor is required.', 'actorLabel');
    }
    if (clean(input.answer).length === 0) {
      return domainFailure('validation-error', 'An answer is required.', 'answer');
    }
    if (question.answerType === 'yes-no' && typeof input.structuredValue !== 'boolean') {
      return domainFailure(
        'validation-error',
        'Choose yes or no for this question.',
        'structuredValue',
      );
    }
    if (
      question.answerType === 'numeric-limit' &&
      (typeof input.structuredValue !== 'number' ||
        !Number.isFinite(input.structuredValue) ||
        input.structuredValue < 0)
    ) {
      return domainFailure(
        'validation-error',
        'Enter a nonnegative numeric limit.',
        'structuredValue',
      );
    }
    if (
      question.answerType === 'single-choice' &&
      (typeof input.structuredValue !== 'string' ||
        !question.answerOptions?.includes(input.structuredValue))
    ) {
      return domainFailure(
        'validation-error',
        'Choose one of the listed answers.',
        'structuredValue',
      );
    }
    return domainSuccess(undefined);
  }

  private appendConditionalFollowUps(
    existing: readonly InterviewQuestion[],
    gap: KnowledgeGap,
    answeredQuestion: InterviewQuestion,
    input: InterviewAnswerInput,
  ): InterviewQuestion[] {
    const questions = [...existing];
    const topic = getOperationalTopic(answeredQuestion.topicKey);
    const rules = topic.followUpRules.filter(
      (rule) =>
        rule.triggerTemplateKey === answeredQuestion.templateKey &&
        structuredValuesMatch(input.structuredValue, rule.equals),
    );
    for (const rule of rules) {
      rule.questions.forEach((template, index) => {
        const exists = questions.some(
          (question) => question.gapId === gap.id && question.templateKey === template.key,
        );
        if (!exists) questions.push(this.createInterviewQuestion(gap, template, index + 1));
      });
    }
    return questions;
  }

  private createInterviewQuestion(
    gap: KnowledgeGap,
    template: OperationalQuestionTemplate,
    sequence: number,
  ): InterviewQuestion {
    const topicIndex = OPERATIONAL_TOPICS.findIndex(({ key }) => key === gap.topicKey);
    const base = {
      id: this.idFactory('question'),
      companyId: gap.companyId,
      roleId: gap.roleId,
      gapId: gap.id,
      topicKey: gap.topicKey,
      templateKey: template.key,
      prompt: template.prompt,
      rationale: template.rationale,
      whatItUnlocks: template.whatItUnlocks,
      answerType: template.answerType,
      priority: operationalRiskPriority(gap.riskTier) * 10_000 + topicIndex * 100 + sequence,
      status: 'queued' as const,
      createdAt: this.clock(),
    };
    return template.answerOptions === undefined
      ? base
      : { ...base, answerOptions: [...template.answerOptions] };
  }

  private prioritizedQuestions(
    questions: readonly InterviewQuestion[],
  ): readonly InterviewQuestion[] {
    return [...questions]
      .filter(({ status }) => status === 'active' || status === 'queued')
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id),
      );
  }

  private activateNextQuestion(snapshot: PhaseOneSnapshot): PhaseOneSnapshot {
    if (snapshot.interviewQuestions.some(({ status }) => status === 'active')) return snapshot;
    const nextQuestion = this.prioritizedQuestions(snapshot.interviewQuestions)[0];
    if (nextQuestion === undefined) return snapshot;
    return {
      ...snapshot,
      interviewQuestions: snapshot.interviewQuestions.map((question) =>
        question.id === nextQuestion.id ? { ...question, status: 'active' as const } : question,
      ),
    };
  }

  private questionLinkedGapIsRemediated(snapshot: PhaseOneSnapshot, gap: KnowledgeGap): boolean {
    const triggeringQuestionIds = gap.triggeringQuestionIds ?? [];
    if (triggeringQuestionIds.length === 0) return true;
    const triggeringQuestions = triggeringQuestionIds.flatMap((questionId) => {
      const question = snapshot.employeeQuestions.find(({ id }) => id === questionId);
      return question === undefined ? [] : [question];
    });
    if (triggeringQuestions.length !== triggeringQuestionIds.length) return false;

    return triggeringQuestions.every((question) => {
      const originalEvaluation = snapshot.answerEligibilityEvaluations.find(
        (evaluation) =>
          evaluation.questionId === question.id &&
          (gap.eligibilityEvaluationIds ?? []).includes(evaluation.id),
      );
      const remediationReason: KnowledgeGapReason = (() => {
        switch (originalEvaluation?.overallResult) {
          case 'withheld-missing-knowledge':
            return 'missing-evidence';
          case 'withheld-conflicting-knowledge':
            return 'conflicting-evidence';
          case 'withheld-invalid-provenance':
            return 'invalid-provenance';
          case 'withheld-authority-unclear':
            return 'authority-unclear';
          case 'withheld-unsupported-request':
            return 'unsupported-request';
          default:
            return gap.originalReason ?? gap.reason;
        }
      })();
      const requiredGates = QUESTION_GAP_REMEDIATION_GATES[remediationReason];
      const currentDecision = evaluateQuestionPolicy(
        snapshot,
        question,
        `gap-reconciliation-${gap.id}`,
        gap.updatedAt,
      );
      const gateStatus = new Map(
        currentDecision.evaluation.gateResults.map(({ gateKey, status }) => [gateKey, status]),
      );
      return requiredGates.every((gateKey) => gateStatus.get(gateKey) === 'pass');
    });
  }

  private reconcileSnapshot(
    snapshot: PhaseOneSnapshot & { readonly company: Company; readonly role: Role },
  ): DomainResult<PhaseOneSnapshot> {
    const projection = evaluateTopicCoverage(snapshot);
    if (!projection.ok) return projection;
    let knowledgeGaps = [...snapshot.knowledgeGaps];

    for (const coverage of projection.value) {
      const activeGap = knowledgeGaps.find(
        (gap) => gap.topicKey === coverage.topic.key && ACTIVE_GAP_STATUSES.includes(gap.status),
      );
      if (coverage.state === 'approved') {
        if (
          activeGap !== undefined &&
          coverage.approvedClaim !== undefined &&
          this.questionLinkedGapIsRemediated(snapshot, activeGap)
        ) {
          const updated: KnowledgeGap = {
            ...activeGap,
            status: 'resolved',
            relatedClaimIds: unique([...activeGap.relatedClaimIds, coverage.approvedClaim.id]),
            supportingSourceReferenceIds: unique([
              ...activeGap.supportingSourceReferenceIds,
              ...coverage.approvedClaim.sourceReferenceIds,
            ]),
            resolvedByClaimId: coverage.approvedClaim.id,
            updatedAt: this.clock(),
          };
          knowledgeGaps = knowledgeGaps.map((gap) => (gap.id === updated.id ? updated : gap));
        }
        continue;
      }

      const dismissedGap = knowledgeGaps.find(
        (gap) => gap.topicKey === coverage.topic.key && gap.status === 'dismissed',
      );
      if (
        activeGap === undefined &&
        dismissedGap !== undefined &&
        (coverage.state === 'missing' || coverage.state === 'dismissed')
      ) {
        continue;
      }
      const relatedClaims = [...coverage.candidateClaims, ...coverage.conflictingClaims];
      const relatedClaimIds = unique(relatedClaims.map(({ id }) => id));
      const supportingSourceReferenceIds = unique(
        relatedClaims.flatMap(({ sourceReferenceIds }) => sourceReferenceIds),
      );
      const reason = this.gapReason(coverage.topic.key, coverage.state);
      const description = this.gapDescription(coverage.topic.label, coverage.state);
      if (activeGap === undefined) {
        const timestamp = this.clock();
        knowledgeGaps.push({
          id: this.idFactory('gap'),
          companyId: snapshot.company.id,
          roleId: snapshot.role.id,
          topicKey: coverage.topic.key,
          reason,
          description,
          impact: coverage.topic.whyItMatters,
          riskTier: coverage.topic.riskTier,
          status: 'open',
          supportingSourceReferenceIds,
          relatedClaimIds,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        continue;
      }

      const questionLinked = (activeGap.triggeringQuestionIds?.length ?? 0) > 0;
      const reconciledReason = questionLinked ? activeGap.reason : reason;
      const reconciledDescription = questionLinked ? activeGap.description : description;
      const reconciledSources = questionLinked
        ? unique([...activeGap.supportingSourceReferenceIds, ...supportingSourceReferenceIds])
        : supportingSourceReferenceIds;
      const reconciledClaims = questionLinked
        ? unique([...activeGap.relatedClaimIds, ...relatedClaimIds])
        : relatedClaimIds;
      const changed =
        activeGap.reason !== reconciledReason ||
        activeGap.description !== reconciledDescription ||
        JSON.stringify(activeGap.supportingSourceReferenceIds) !==
          JSON.stringify(reconciledSources) ||
        JSON.stringify(activeGap.relatedClaimIds) !== JSON.stringify(reconciledClaims);
      if (changed) {
        const updated: KnowledgeGap = {
          ...activeGap,
          reason: reconciledReason,
          description: reconciledDescription,
          supportingSourceReferenceIds: reconciledSources,
          relatedClaimIds: reconciledClaims,
          updatedAt: this.clock(),
        };
        knowledgeGaps = knowledgeGaps.map((gap) => (gap.id === updated.id ? updated : gap));
      }
    }

    const terminalGapIds = new Set(
      knowledgeGaps
        .filter(({ status }) => status === 'resolved' || status === 'dismissed')
        .map(({ id }) => id),
    );
    const interviewQuestions = snapshot.interviewQuestions.map((question) =>
      terminalGapIds.has(question.gapId) &&
      (question.status === 'queued' || question.status === 'active')
        ? { ...question, status: 'withdrawn' as const }
        : question,
    );
    return domainSuccess({ ...snapshot, knowledgeGaps, interviewQuestions });
  }

  private gapReason(
    topicKey: KnowledgeGap['topicKey'],
    state: 'candidate' | 'conflicting' | 'missing' | 'dismissed',
  ): KnowledgeGapReason {
    if (state === 'conflicting') return 'conflicting-evidence';
    if (state === 'candidate') return 'incomplete-evidence';
    return topicKey === 'authority-and-escalation' ? 'authority-unclear' : 'missing-evidence';
  }

  private gapDescription(topicLabel: string, state: string): string {
    if (state === 'conflicting') {
      return `${topicLabel} has an explicit conflicting-information claim that requires owner resolution.`;
    }
    if (state === 'candidate') {
      return `${topicLabel} has source-backed candidate knowledge, but no current approved claim.`;
    }
    return `${topicLabel} has no current source-backed candidate or approved claim.`;
  }

  private replaceSourceDocument(
    snapshot: PhaseOneSnapshot,
    document: SourceDocument,
  ): DomainResult<SourceDocument> {
    return this.commit(
      {
        ...snapshot,
        sourceDocuments: snapshot.sourceDocuments.map((candidate) =>
          candidate.id === document.id ? document : candidate,
        ),
      },
      document,
    );
  }

  private replaceGap(snapshot: PhaseOneSnapshot, gap: KnowledgeGap): DomainResult<KnowledgeGap> {
    return this.commit(
      {
        ...snapshot,
        knowledgeGaps: snapshot.knowledgeGaps.map((candidate) =>
          candidate.id === gap.id ? gap : candidate,
        ),
      },
      gap,
    );
  }

  private replaceClaim(
    snapshot: PhaseOneSnapshot,
    claim: KnowledgeClaim,
    reconcile = false,
  ): DomainResult<KnowledgeClaim> {
    const next = {
      ...snapshot,
      knowledgeClaims: snapshot.knowledgeClaims.map((candidate) =>
        candidate.id === claim.id ? claim : candidate,
      ),
    };
    return reconcile
      ? this.commitWithOptionalReconciliation(next, claim)
      : this.commit(next, claim);
  }

  private commitWithOptionalReconciliation<T>(next: PhaseOneSnapshot, value: T): DomainResult<T> {
    const usesPhaseTwoCoverage =
      next.knowledgeGaps.length > 0 ||
      next.interviewQuestions.length > 0 ||
      next.interviewAnswers.length > 0 ||
      next.knowledgeClaims.some(({ topicKey }) => topicKey !== undefined);
    if (!usesPhaseTwoCoverage || next.company === null || next.role === null) {
      return this.commit(next, value) as DomainResult<T>;
    }
    const reconciled = this.reconcileSnapshot({
      ...next,
      company: next.company,
      role: next.role,
    });
    if (!reconciled.ok) return reconciled;
    return this.commit(reconciled.value, value) as DomainResult<T>;
  }

  private commit<T = PhaseOneSnapshot>(
    next: PhaseOneSnapshot,
    value?: T,
  ): DomainResult<T extends PhaseOneSnapshot ? PhaseOneSnapshot : T> {
    const validation = validatePhaseOneSnapshot(next);
    if (!validation.ok) return validation;
    this.repository.replaceSnapshot(next);
    const committedValue = value ?? (this.getSnapshot() as T);
    return domainSuccess(committedValue) as DomainResult<
      T extends PhaseOneSnapshot ? PhaseOneSnapshot : T
    >;
  }
}
