import { describe, expect, it } from 'vitest';

import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  type ApprovalDecision,
  type AuthorityBoundary,
  type AuthorityBoundaryInput,
  type Company,
  type EscalationRule,
  type EscalationRuleInput,
  type KnowledgeClaim,
  type KnowledgeLifecycleStatus,
  type PermissionLevel,
  type PhaseOneSnapshot,
  type Responsibility,
  type Role,
  type SourceReference,
} from './entities';
import { PhaseOneService, selectEmployeeVisibleKnowledge } from './phaseOneService';
import type { PhaseOneRepository } from './repositories';
import { DomainError, type DomainErrorCode, type DomainResult } from './result';
import { validateAuthorityBoundaryInput, validateEscalationRuleInput } from './validation';

const FIXED_TIME = '2026-01-01T00:00:00.000Z';

const company = (overrides: Partial<Company> = {}): Company => ({
  id: 'company-1',
  name: 'Summit Comfort Heating & Air',
  industry: 'Residential HVAC',
  serviceArea: 'North Valley',
  contactInformation: {
    phone: '555-0100',
    email: 'office@summit-comfort.example',
  },
  operatingTimezone: 'America/Denver',
  status: 'active',
  createdAt: FIXED_TIME,
  updatedAt: FIXED_TIME,
  ...overrides,
});

const responsibility = (overrides: Partial<Responsibility> = {}): Responsibility => ({
  id: 'responsibility-1',
  roleId: 'role-1',
  title: 'Maintain the dispatch schedule',
  expectedOutcome: 'Every confirmed visit has an assigned technician.',
  frequency: 'Daily',
  completionEvidence: 'The dispatch board matches confirmed appointments.',
  status: 'active',
  ...overrides,
});

const boundary = (overrides: Partial<AuthorityBoundary> = {}): AuthorityBoundary => ({
  id: 'authority-1',
  roleId: 'role-1',
  subject: 'Schedule changes',
  permissionLevel: 'may-act-within-limit',
  limitOrConstraint: 'May move visits within the same business day.',
  escalationDestination: 'Service manager',
  notes: 'Customer and technician must both be notified.',
  ...overrides,
});

const escalation = (overrides: Partial<EscalationRule> = {}): EscalationRule => ({
  id: 'escalation-1',
  roleId: 'role-1',
  trigger: 'A customer reports a gas odor.',
  destination: 'On-call service manager',
  urgency: 'immediate',
  requiredContext: 'Customer name, address, callback number, and report.',
  expectedResponse: 'Manager acknowledges and directs the next action.',
  ...overrides,
});

const role = (overrides: Partial<Role> = {}): Role => ({
  id: 'role-1',
  companyId: 'company-1',
  title: 'Home-Service Office Manager / Dispatcher',
  mission: 'Keep customers informed and the service schedule actionable.',
  status: 'active',
  responsibilities: [responsibility()],
  authorityBoundaries: [boundary()],
  escalationRules: [escalation()],
  createdAt: FIXED_TIME,
  updatedAt: FIXED_TIME,
  ...overrides,
});

const source = (overrides: Partial<SourceReference> = {}): SourceReference => ({
  id: 'source-1',
  sourceTitle: 'Dispatcher handbook',
  sourceType: 'policy',
  sourceLocator: 'Section 2: schedule changes',
  excerpt: 'Same-day moves require customer and technician notification.',
  recordedAt: FIXED_TIME,
  ...overrides,
});

const claim = (
  lifecycleStatus: KnowledgeLifecycleStatus,
  overrides: Partial<KnowledgeClaim> = {},
): KnowledgeClaim => ({
  id: 'claim-1',
  companyId: 'company-1',
  roleId: 'role-1',
  statement: 'Notify both the customer and technician about a schedule move.',
  category: 'procedure',
  provenance: 'owner-authored',
  lifecycleStatus,
  sourceReferenceIds: ['source-1'],
  createdAt: FIXED_TIME,
  updatedAt: FIXED_TIME,
  version: 1,
  ...overrides,
});

const decision = (
  knowledgeClaim: KnowledgeClaim,
  decisionType: 'approve' | 'reject',
  overrides: Partial<ApprovalDecision> = {},
): ApprovalDecision => ({
  id: `decision-${knowledgeClaim.id}`,
  claimId: knowledgeClaim.id,
  decision: decisionType,
  actorLabel: 'Fictional owner',
  reason: decisionType === 'approve' ? 'Matches the handbook.' : 'Not company policy.',
  decidedAt: FIXED_TIME,
  claimVersion: knowledgeClaim.version,
  ...overrides,
});

const snapshot = (overrides: Partial<PhaseOneSnapshot> = {}): PhaseOneSnapshot => ({
  company: company(),
  role: role(),
  sourceDocuments: [],
  sourceReferences: [source()],
  knowledgeClaims: [],
  approvalDecisions: [],
  knowledgeGaps: [],
  interviewQuestions: [],
  interviewAnswers: [],
  ...overrides,
});

class TestRepository implements PhaseOneRepository {
  private current: PhaseOneSnapshot = EMPTY_PHASE_ONE_SNAPSHOT;
  readonly writes: PhaseOneSnapshot[] = [];

  readSnapshot(): PhaseOneSnapshot {
    return this.current;
  }

  replaceSnapshot(next: PhaseOneSnapshot): void {
    this.current = next;
    this.writes.push(next);
  }
}

function successful<T>(result: DomainResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw result.error;
  return result.value;
}

function failedWith<T>(result: DomainResult<T>, code: DomainErrorCode): DomainError {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`Expected domain failure ${code}.`);
  expect(result.error).toBeInstanceOf(DomainError);
  expect(result.error.code).toBe(code);
  return result.error;
}

function harness(seed?: PhaseOneSnapshot): {
  readonly repository: TestRepository;
  readonly service: PhaseOneService;
} {
  const repository = new TestRepository();
  let clockTick = 0;
  let idSequence = 0;
  const service = new PhaseOneService(repository, {
    clock: () => new Date(Date.UTC(2026, 0, 1, 0, 0, clockTick++)).toISOString(),
    idFactory: (prefix) => `generated-${prefix}-${++idSequence}`,
  });

  if (seed !== undefined) successful(service.initializeSnapshot(seed));
  return { repository, service };
}

function snapshotForStatus(status: KnowledgeLifecycleStatus): {
  readonly seed: PhaseOneSnapshot;
  readonly claimId: string;
} {
  if (status === 'superseded') {
    const previous = claim('superseded', { id: 'claim-target' });
    const revision = claim('approved', {
      id: 'claim-revision',
      statement: 'Revised schedule notification rule.',
      version: 2,
      supersedesClaimId: previous.id,
    });
    return {
      seed: snapshot({
        knowledgeClaims: [previous, revision],
        approvalDecisions: [
          decision(previous, 'approve', { id: 'decision-previous' }),
          decision(revision, 'approve', { id: 'decision-revision' }),
        ],
      }),
      claimId: previous.id,
    };
  }

  const target = claim(status, { id: 'claim-target' });
  const approvalDecisions =
    status === 'approved'
      ? [decision(target, 'approve')]
      : status === 'rejected'
        ? [decision(target, 'reject')]
        : [];
  return {
    seed: snapshot({ knowledgeClaims: [target], approvalDecisions }),
    claimId: target.id,
  };
}

const GENERIC_TRANSITIONS = [
  ['extracted', 'proposed'],
  ['proposed', 'missing-information'],
  ['proposed', 'conflicting-information'],
  ['missing-information', 'proposed'],
  ['conflicting-information', 'proposed'],
] as const satisfies ReadonlyArray<readonly [KnowledgeLifecycleStatus, KnowledgeLifecycleStatus]>;

const ALL_STATUSES = [
  'extracted',
  'proposed',
  'approved',
  'rejected',
  'missing-information',
  'conflicting-information',
  'superseded',
] as const satisfies readonly KnowledgeLifecycleStatus[];

const PROHIBITED_DIRECT_TRANSITIONS = ALL_STATUSES.flatMap((from) =>
  ALL_STATUSES.flatMap((to) =>
    GENERIC_TRANSITIONS.some(([allowedFrom, allowedTo]) => allowedFrom === from && allowedTo === to)
      ? []
      : [
          {
            from,
            to,
            code:
              to === 'approved' || to === 'rejected'
                ? ('approval-decision-required' as const)
                : ('invalid-transition' as const),
          },
        ],
  ),
);

describe('Phase 1 aggregate relationships', () => {
  it('rejects a role that does not belong to the active company', () => {
    const { repository, service } = harness();

    const error = failedWith(
      service.initializeSnapshot(snapshot({ role: role({ companyId: 'different-company' }) })),
      'relationship-mismatch',
    );

    expect(error.field).toBe('role.companyId');
    expect(repository.readSnapshot()).toEqual(EMPTY_PHASE_ONE_SNAPSHOT);
  });

  it.each([
    {
      record: 'responsibility',
      role: role({ responsibilities: [responsibility({ roleId: 'different-role' })] }),
      field: 'responsibility.roleId',
    },
    {
      record: 'authority boundary',
      role: role({ authorityBoundaries: [boundary({ roleId: 'different-role' })] }),
      field: 'authorityBoundary.roleId',
    },
    {
      record: 'escalation rule',
      role: role({ escalationRules: [escalation({ roleId: 'different-role' })] }),
      field: 'escalationRule.roleId',
    },
  ])('rejects a nested $record owned by another role', ({ role: invalidRole, field }) => {
    const { service } = harness();

    const error = failedWith(
      service.initializeSnapshot(snapshot({ role: invalidRole })),
      'relationship-mismatch',
    );

    expect(error.field).toBe(field);
  });
});

describe('role-system validation', () => {
  const validBoundaryInput: AuthorityBoundaryInput = {
    subject: 'Refunds',
    permissionLevel: 'must-request-approval',
    limitOrConstraint: 'All refunds require owner approval.',
    escalationDestination: 'Owner',
    notes: 'Include the invoice number.',
  };

  it.each([
    ['subject', { ...validBoundaryInput, subject: ' ' }, 'authorityBoundary.subject'],
    [
      'limit',
      { ...validBoundaryInput, limitOrConstraint: '' },
      'authorityBoundary.limitOrConstraint',
    ],
    [
      'escalation destination',
      { ...validBoundaryInput, escalationDestination: '' },
      'authorityBoundary.escalationDestination',
    ],
  ] as const)('requires an authority-boundary %s', (_label, invalidInput, expectedField) => {
    const error = failedWith(validateAuthorityBoundaryInput(invalidInput), 'validation-error');

    expect(error.field).toBe(expectedField);
  });

  it('rejects a permission level outside the constrained vocabulary', () => {
    const error = failedWith(
      validateAuthorityBoundaryInput({
        ...validBoundaryInput,
        permissionLevel: 'owner-only' as PermissionLevel,
      }),
      'validation-error',
    );

    expect(error.field).toBe('authorityBoundary.permissionLevel');
  });

  const validEscalationInput: EscalationRuleInput = {
    trigger: 'A customer reports a gas odor.',
    destination: 'On-call service manager',
    urgency: 'immediate',
    requiredContext: 'Customer, address, callback number, and report.',
    expectedResponse: 'Acknowledge and direct the next action.',
  };

  it.each([
    ['trigger', { ...validEscalationInput, trigger: '' }, 'escalationRule.trigger'],
    ['destination', { ...validEscalationInput, destination: ' ' }, 'escalationRule.destination'],
    [
      'required context',
      { ...validEscalationInput, requiredContext: '' },
      'escalationRule.requiredContext',
    ],
    [
      'expected response',
      { ...validEscalationInput, expectedResponse: '' },
      'escalationRule.expectedResponse',
    ],
  ] as const)('requires an escalation-rule %s', (_label, invalidInput, expectedField) => {
    const error = failedWith(validateEscalationRuleInput(invalidInput), 'validation-error');

    expect(error.field).toBe(expectedField);
  });

  it('rejects an urgency outside the constrained vocabulary', () => {
    const error = failedWith(
      validateEscalationRuleInput({
        ...validEscalationInput,
        urgency: 'whenever' as 'immediate',
      }),
      'validation-error',
    );

    expect(error.field).toBe('escalationRule.urgency');
  });
});

describe('knowledge lifecycle', () => {
  it.each(GENERIC_TRANSITIONS)('permits the generic %s -> %s transition', (from, to) => {
    const state = snapshotForStatus(from);
    const { service } = harness(state.seed);

    const transitioned = successful(service.transitionKnowledgeClaim(state.claimId, to));

    expect(transitioned.lifecycleStatus).toBe(to);
    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === state.claimId)?.lifecycleStatus,
    ).toBe(to);
  });

  it.each(PROHIBITED_DIRECT_TRANSITIONS)(
    'rejects the direct $from -> $to transition with $code',
    ({ from, to, code }) => {
      const state = snapshotForStatus(from);
      const { service } = harness(state.seed);

      failedWith(service.transitionKnowledgeClaim(state.claimId, to), code);

      expect(
        service.getSnapshot().knowledgeClaims.find(({ id }) => id === state.claimId)
          ?.lifecycleStatus,
      ).toBe(from);
    },
  );

  it('requires explicit decision operations for both approval and rejection', () => {
    const proposed = claim('proposed');
    const { service } = harness(snapshot({ knowledgeClaims: [proposed] }));

    failedWith(
      service.transitionKnowledgeClaim(proposed.id, 'approved'),
      'approval-decision-required',
    );
    failedWith(
      service.transitionKnowledgeClaim(proposed.id, 'rejected'),
      'approval-decision-required',
    );
    expect(service.getSnapshot().approvalDecisions).toHaveLength(0);
  });

  it.each([
    { actorLabel: '', reason: 'Matches the source.', field: 'actorLabel' },
    { actorLabel: 'Owner', reason: ' ', field: 'reason' },
  ])('requires $field on an approval decision', ({ actorLabel, reason, field }) => {
    const proposed = claim('proposed');
    const { service } = harness(snapshot({ knowledgeClaims: [proposed] }));

    const error = failedWith(
      service.approveKnowledgeClaim({ claimId: proposed.id, actorLabel, reason }),
      'validation-error',
    );

    expect(error.field).toBe(field);
    expect(service.getSnapshot().approvalDecisions).toHaveLength(0);
  });

  it('permits proposed knowledge to become approved through an explicit decision', () => {
    const proposed = claim('proposed');
    const { service } = harness(snapshot({ knowledgeClaims: [proposed] }));

    const approved = successful(
      service.approveKnowledgeClaim({
        claimId: proposed.id,
        actorLabel: ' Owner ',
        reason: ' Confirmed against policy. ',
      }),
    );
    const [recordedDecision] = service.getSnapshot().approvalDecisions;

    expect(approved.lifecycleStatus).toBe('approved');
    expect(recordedDecision).toMatchObject({
      claimId: proposed.id,
      claimVersion: 1,
      decision: 'approve',
      actorLabel: 'Owner',
      reason: 'Confirmed against policy.',
    });
  });

  it.each(['extracted', 'proposed', 'missing-information', 'conflicting-information'] as const)(
    'permits %s knowledge to become rejected through an explicit decision',
    (status) => {
      const target = claim(status);
      const { service } = harness(snapshot({ knowledgeClaims: [target] }));

      const rejected = successful(
        service.rejectKnowledgeClaim({
          claimId: target.id,
          actorLabel: 'Owner',
          reason: 'This is not company policy.',
        }),
      );

      expect(rejected.lifecycleStatus).toBe('rejected');
      expect(service.getSnapshot().approvalDecisions).toEqual([
        expect.objectContaining({
          claimId: target.id,
          claimVersion: 1,
          decision: 'reject',
        }),
      ]);
    },
  );

  it('requires at least one source before approval and records no decision on failure', () => {
    const proposed = claim('proposed', { sourceReferenceIds: [] });
    const { service } = harness(snapshot({ sourceReferences: [], knowledgeClaims: [proposed] }));

    failedWith(
      service.approveKnowledgeClaim({
        claimId: proposed.id,
        actorLabel: 'Owner',
        reason: 'Looks correct.',
      }),
      'missing-source',
    );

    expect(service.getSnapshot().knowledgeClaims[0]?.lifecycleStatus).toBe('proposed');
    expect(service.getSnapshot().approvalDecisions).toHaveLength(0);
  });

  it('appends decisions without altering earlier history', () => {
    const proposed = claim('proposed', { id: 'claim-to-approve' });
    const extracted = claim('extracted', { id: 'claim-to-reject' });
    const { service } = harness(snapshot({ knowledgeClaims: [proposed, extracted] }));

    successful(
      service.approveKnowledgeClaim({
        claimId: proposed.id,
        actorLabel: 'Owner',
        reason: 'Source verified.',
      }),
    );
    const originalHistory = service.getSnapshot().approvalDecisions;
    const originalDecision = originalHistory[0];
    successful(
      service.rejectKnowledgeClaim({
        claimId: extracted.id,
        actorLabel: 'Owner',
        reason: 'Contradicts the operating policy.',
      }),
    );

    expect(originalHistory).toHaveLength(1);
    expect(service.getSnapshot().approvalDecisions).toHaveLength(2);
    expect(service.getSnapshot().approvalDecisions[0]).toEqual(originalDecision);
    expect(service.getSnapshot().approvalDecisions.map(({ decision }) => decision)).toEqual([
      'approve',
      'reject',
    ]);
  });

  it('rejects attempts to edit an approved claim in place', () => {
    const approved = claim('approved');
    const seed = snapshot({
      knowledgeClaims: [approved],
      approvalDecisions: [decision(approved, 'approve')],
    });
    const { service } = harness(seed);
    const before = service.getSnapshot();

    failedWith(
      service.updateKnowledgeClaim(approved.id, {
        statement: 'A silent replacement statement.',
      }),
      'immutable-approved-claim',
    );

    expect(service.getSnapshot()).toEqual(before);
  });

  it('does not allow superseded status to be assigned directly', () => {
    const approved = claim('approved');
    const { service } = harness(
      snapshot({
        knowledgeClaims: [approved],
        approvalDecisions: [decision(approved, 'approve')],
      }),
    );

    failedWith(service.transitionKnowledgeClaim(approved.id, 'superseded'), 'invalid-transition');
    expect(service.getSnapshot().knowledgeClaims[0]?.lifecycleStatus).toBe('approved');
  });
});

describe('approved knowledge revisions', () => {
  function approvedHarness(): {
    readonly original: KnowledgeClaim;
    readonly repository: TestRepository;
    readonly service: PhaseOneService;
  } {
    const original = claim('approved');
    return {
      original,
      ...harness(
        snapshot({
          knowledgeClaims: [original],
          approvalDecisions: [decision(original, 'approve')],
        }),
      ),
    };
  }

  it('creates a new proposed version while preserving the approved predecessor', () => {
    const { original, service } = approvedHarness();

    const revision = successful(
      service.createApprovedClaimRevision({
        claimId: original.id,
        statement: 'Notify both parties before moving the visit.',
      }),
    );
    const storedOriginal = service
      .getSnapshot()
      .knowledgeClaims.find(({ id }) => id === original.id);

    expect(revision).toMatchObject({
      lifecycleStatus: 'proposed',
      version: 2,
      supersedesClaimId: original.id,
    });
    expect(revision.id).not.toBe(original.id);
    expect(storedOriginal).toEqual(original);
    expect(service.selectEmployeeVisibleKnowledge().map(({ claim }) => claim.id)).toEqual([
      original.id,
    ]);
  });

  it('leaves the approved predecessor current when its revision is rejected', () => {
    const { original, service } = approvedHarness();
    const revision = successful(
      service.createApprovedClaimRevision({
        claimId: original.id,
        statement: 'An owner-reviewed alternate wording.',
      }),
    );

    successful(
      service.rejectKnowledgeClaim({
        claimId: revision.id,
        actorLabel: 'Owner',
        reason: 'The original wording is clearer.',
      }),
    );
    const state = service.getSnapshot();

    expect(state.knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus).toBe(
      'approved',
    );
    expect(state.knowledgeClaims.find(({ id }) => id === revision.id)?.lifecycleStatus).toBe(
      'rejected',
    );
    expect(service.selectEmployeeVisibleKnowledge().map(({ claim }) => claim.id)).toEqual([
      original.id,
    ]);
  });

  it('supersedes the predecessor atomically only when revision approval succeeds', () => {
    const { original, repository, service } = approvedHarness();
    const revision = successful(
      service.createApprovedClaimRevision({
        claimId: original.id,
        statement: 'Notify both parties and note the confirmation time.',
      }),
    );
    const writesBeforeApproval = repository.writes.length;

    const approvedRevision = successful(
      service.approveKnowledgeClaim({
        claimId: revision.id,
        actorLabel: 'Owner',
        reason: 'The policy source supports this clarification.',
      }),
    );
    const state = service.getSnapshot();

    expect(repository.writes).toHaveLength(writesBeforeApproval + 1);
    expect(approvedRevision.lifecycleStatus).toBe('approved');
    expect(state.knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus).toBe(
      'superseded',
    );
    expect(state.knowledgeClaims.find(({ id }) => id === revision.id)?.lifecycleStatus).toBe(
      'approved',
    );
    expect(state.approvalDecisions).toHaveLength(2);
    expect(service.selectEmployeeVisibleKnowledge().map(({ claim }) => claim.id)).toEqual([
      revision.id,
    ]);
  });

  it('preserves the approved predecessor when revision approval fails', () => {
    const { original, service } = approvedHarness();
    const revision = successful(
      service.createApprovedClaimRevision({
        claimId: original.id,
        statement: 'An unsourced replacement.',
        sourceReferenceIds: [],
      }),
    );

    failedWith(
      service.approveKnowledgeClaim({
        claimId: revision.id,
        actorLabel: 'Owner',
        reason: 'Attempted approval.',
      }),
      'missing-source',
    );

    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus,
    ).toBe('approved');
    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === revision.id)?.lifecycleStatus,
    ).toBe('proposed');
    expect(service.getSnapshot().approvalDecisions).toHaveLength(1);
  });
});

describe('source provenance and employee visibility', () => {
  it('rejects unknown source references on creation and initialization', () => {
    const { service } = harness(snapshot());

    failedWith(
      service.createKnowledgeClaim({
        statement: 'An unsupported proposed rule.',
        category: 'general',
        provenance: 'owner-authored',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: ['missing-source'],
      }),
      'source-not-found',
    );
    expect(service.getSnapshot().knowledgeClaims).toHaveLength(0);

    const invalidClaim = claim('proposed', {
      sourceReferenceIds: ['missing-source'],
    });
    const fresh = harness();
    failedWith(
      fresh.service.initializeSnapshot(snapshot({ knowledgeClaims: [invalidClaim] })),
      'source-not-found',
    );
  });

  it('selects only current approved claims retaining source and approval provenance', () => {
    const extracted = claim('extracted', { id: 'claim-extracted' });
    const proposed = claim('proposed', { id: 'claim-proposed' });
    const rejected = claim('rejected', { id: 'claim-rejected' });
    const missing = claim('missing-information', { id: 'claim-missing' });
    const conflicting = claim('conflicting-information', {
      id: 'claim-conflicting',
    });
    const superseded = claim('superseded', { id: 'claim-superseded' });
    const staleApproved = claim('approved', { id: 'claim-stale-approved' });
    const currentRevision = claim('approved', {
      id: 'claim-current-revision',
      version: 2,
      supersedesClaimId: staleApproved.id,
    });
    const currentApproved = claim('approved', { id: 'claim-current-approved' });
    const approvedWithoutSource = claim('approved', {
      id: 'claim-approved-without-source',
      sourceReferenceIds: [],
    });
    const approvedWithoutDecision = claim('approved', {
      id: 'claim-approved-without-decision',
    });
    const state = snapshot({
      knowledgeClaims: [
        extracted,
        proposed,
        rejected,
        missing,
        conflicting,
        superseded,
        staleApproved,
        currentRevision,
        currentApproved,
        approvedWithoutSource,
        approvedWithoutDecision,
      ],
      approvalDecisions: [
        decision(rejected, 'reject'),
        decision(superseded, 'approve'),
        decision(staleApproved, 'approve'),
        decision(currentRevision, 'approve'),
        decision(currentApproved, 'approve'),
        decision(approvedWithoutSource, 'approve'),
      ],
    });

    const visible = selectEmployeeVisibleKnowledge(state);

    expect(visible.map(({ claim: visibleClaim }) => visibleClaim.id)).toEqual([
      currentRevision.id,
      currentApproved.id,
    ]);
    for (const item of visible) {
      expect(item.claim.lifecycleStatus).toBe('approved');
      expect(item.sourceReferences).toHaveLength(1);
      expect(item.approvalDecisions).toEqual([
        expect.objectContaining({
          claimId: item.claim.id,
          claimVersion: item.claim.version,
          decision: 'approve',
        }),
      ]);
    }
  });
});
