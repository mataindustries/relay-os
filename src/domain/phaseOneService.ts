import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  type ActivateSetupInput,
  type AnchoredSourceReferenceInput,
  type ApprovalDecision,
  type ApprovedClaimRevisionInput,
  type AuthorityBoundary,
  type ClaimDecisionInput,
  type Company,
  type EmployeeVisibleKnowledge,
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
  type Responsibility,
  type Role,
  type SourceDocument,
  type SourceDocumentInput,
  type SourceDocumentRevisionInput,
  type SourceDocumentUpdates,
  type SourceReference,
  type SourceReferenceInput,
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

  constructor(
    private readonly repository: PhaseOneRepository,
    options: PhaseOneServiceOptions = {},
  ) {
    let sequence = 0;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.idFactory = options.idFactory ?? ((prefix) => `${prefix}-${++sequence}`);
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

  prioritizedInterviewQuestions(): readonly InterviewQuestion[] {
    return this.prioritizedQuestions(this.getSnapshot().interviewQuestions);
  }

  selectEmployeeVisibleKnowledge(): readonly EmployeeVisibleKnowledge[] {
    return selectEmployeeVisibleKnowledge(this.getSnapshot());
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
        if (activeGap !== undefined && coverage.approvedClaim !== undefined) {
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

      const changed =
        activeGap.reason !== reason ||
        activeGap.description !== description ||
        JSON.stringify(activeGap.supportingSourceReferenceIds) !==
          JSON.stringify(supportingSourceReferenceIds) ||
        JSON.stringify(activeGap.relatedClaimIds) !== JSON.stringify(relatedClaimIds);
      if (changed) {
        const updated: KnowledgeGap = {
          ...activeGap,
          reason,
          description,
          supportingSourceReferenceIds,
          relatedClaimIds,
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
