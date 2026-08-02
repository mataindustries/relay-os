import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  type ActivateSetupInput,
  type ApprovalDecision,
  type ApprovedClaimRevisionInput,
  type AuthorityBoundary,
  type ClaimDecisionInput,
  type Company,
  type EmployeeVisibleKnowledge,
  type EscalationRule,
  type KnowledgeClaim,
  type KnowledgeClaimInput,
  type KnowledgeClaimUpdates,
  type KnowledgeLifecycleStatus,
  type PhaseOneSnapshot,
  type Responsibility,
  type Role,
  type SourceReference,
  type SourceReferenceInput,
} from './entities';
import type { PhaseOneRepository } from './repositories';
import { domainFailure, domainSuccess, type DomainResult } from './result';
import {
  validateActivateSetupInput,
  validateKnowledgeClaimInput,
  validatePhaseOneSnapshot,
  validateSourceReferenceInput,
} from './validation';

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

export function selectEmployeeVisibleKnowledge(
  snapshot: PhaseOneSnapshot,
): readonly EmployeeVisibleKnowledge[] {
  const { company, role } = snapshot;
  if (company === null || role === null || role.status !== 'active') return [];

  return snapshot.knowledgeClaims.flatMap((claim) => {
    if (
      claim.companyId !== company.id ||
      claim.roleId !== role.id ||
      claim.lifecycleStatus !== 'approved'
    ) {
      return [];
    }

    const hasApprovedRevision = snapshot.knowledgeClaims.some(
      (candidate) =>
        candidate.supersedesClaimId === claim.id && candidate.lifecycleStatus === 'approved',
    );
    if (hasApprovedRevision || claim.sourceReferenceIds.length === 0) return [];

    const sourceReferences = claim.sourceReferenceIds.flatMap((sourceId) => {
      const source = snapshot.sourceReferences.find(({ id }) => id === sourceId);
      return source === undefined ? [] : [source];
    });
    if (sourceReferences.length !== claim.sourceReferenceIds.length) return [];

    const approvalDecisions = snapshot.approvalDecisions.filter(
      (decision) =>
        decision.claimId === claim.id &&
        decision.claimVersion === claim.version &&
        decision.decision === 'approve',
    );
    if (approvalDecisions.length === 0) return [];

    return [
      {
        claim: { ...claim, lifecycleStatus: 'approved' },
        sourceReferences,
        approvalDecisions,
      },
    ];
  });
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

  createSourceReference(input: SourceReferenceInput): DomainResult<SourceReference> {
    const scope = this.requireActiveScope();
    if (!scope.ok) return scope;
    const validation = validateSourceReferenceInput(input);
    if (!validation.ok) return validation;

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
    };
    return this.commit(
      { ...scope.value, knowledgeClaims: [...scope.value.knowledgeClaims, claim] },
      claim,
    );
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
    };
    return this.replaceClaim(scope.value, updated);
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
    return this.replaceClaim(scope.value, updated);
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
    return this.commit(
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
    return this.commit(next, rejected);
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
    };
    return this.commit(
      {
        ...scope.value,
        knowledgeClaims: [...scope.value.knowledgeClaims, revision],
      },
      revision,
    );
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

  private replaceClaim(
    snapshot: PhaseOneSnapshot,
    claim: KnowledgeClaim,
  ): DomainResult<KnowledgeClaim> {
    return this.commit(
      {
        ...snapshot,
        knowledgeClaims: snapshot.knowledgeClaims.map((candidate) =>
          candidate.id === claim.id ? claim : candidate,
        ),
      },
      claim,
    );
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
