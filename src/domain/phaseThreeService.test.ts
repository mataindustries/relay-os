import { describe, expect, it } from 'vitest';

import { InMemoryPhaseOneRepository } from '../infrastructure';
import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  PhaseOneService,
  evaluateQuestionPolicy,
  type AuthorityBoundary,
  type DomainErrorCode,
  type DomainResult,
  type EmployeeQuestion,
  type EscalationRule,
  type KnowledgeClaim,
  type OperationalTopicKey,
  type PhaseOneSnapshot,
  type Role,
  type SourceReference,
} from '.';

const FIXED_TIME = '2026-08-02T16:00:00.000Z';

const GATE_KEYS = [
  'scope-valid',
  'topic-valid',
  'request-context-valid',
  'current-approved-knowledge-present',
  'provenance-valid',
  'no-explicit-conflict',
  'sensitivity-clear',
  'authority-clear',
  'escalation-rule-clear',
  'answer-mode-supported',
] as const;

const ACTIVE_GAP_STATUSES = new Set(['open', 'question-ready', 'answered', 'proposal-created']);

type RequestType =
  | 'policy-lookup'
  | 'procedure-lookup'
  | 'decision-request'
  | 'exception-request'
  | 'financial-action'
  | 'emergency-action'
  | 'customer-commitment';

type SensitivitySelection =
  | 'none'
  | 'customer-personal-data'
  | 'credentials-or-access'
  | 'payment-data'
  | 'health-or-safety'
  | 'legal-or-regulatory'
  | 'other-sensitive';

type FinancialActionType = 'discount' | 'refund' | 'charge' | 'waive-fee' | 'other';
type CurrencyCode = 'USD' | 'CAD';
type EmergencyCategory =
  | 'gas-odor'
  | 'carbon-monoxide'
  | 'smoke-or-fire'
  | 'electrical-hazard'
  | 'water-leak'
  | 'no-heating-or-cooling'
  | 'other';
type CustomerCommitmentType =
  'arrival-window' | 'price-or-estimate' | 'service-availability' | 'completion-date' | 'other';

type TestStructuredContext =
  | { readonly requestType: 'policy-lookup' }
  | { readonly requestType: 'procedure-lookup'; readonly currentStepLabel?: string }
  | {
      readonly requestType: 'decision-request';
      readonly proposedAction: string;
      readonly subject?: string;
    }
  | {
      readonly requestType: 'exception-request';
      readonly requestedException: string;
      readonly reason: string;
    }
  | {
      readonly requestType: 'financial-action';
      readonly actionType: FinancialActionType;
      readonly amount: number;
      readonly currency: CurrencyCode;
    }
  | {
      readonly requestType: 'emergency-action';
      readonly urgency: 'same-day' | 'immediate';
      readonly emergencyCategory: EmergencyCategory;
    }
  | {
      readonly requestType: 'customer-commitment';
      readonly commitmentType: CustomerCommitmentType;
      readonly amount?: number;
      readonly currency?: CurrencyCode;
      readonly commitmentDate?: string;
    };

interface TestQuestionInput {
  readonly employeeLabel: string;
  readonly questionText: string;
  readonly topicKey: OperationalTopicKey;
  readonly requestType: RequestType;
  readonly sensitivitySelection: SensitivitySelection;
  readonly structuredContext: TestStructuredContext;
}

type StructuredAuthorityBoundary = AuthorityBoundary & {
  readonly topicKeys?: readonly OperationalTopicKey[];
  readonly applicableRequestTypes?: readonly RequestType[];
  readonly numericLimit?: number;
  readonly currency?: string;
  readonly structuredConstraintType?: string;
};

type StructuredEscalationRule = EscalationRule & {
  readonly topicKeys?: readonly OperationalTopicKey[];
  readonly applicableRequestTypes?: readonly RequestType[];
  readonly urgencyMatch?: 'routine' | 'same-day' | 'immediate';
  readonly sensitivityCategories?: readonly SensitivitySelection[];
};

interface RecordedQuestion extends TestQuestionInput {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly status: 'received' | 'evaluating' | 'answered' | 'withheld' | 'escalated' | 'closed';
  readonly submittedAt: string;
  readonly closedAt?: string;
  readonly correctsQuestionId?: string;
  readonly correlationId: string;
}

interface RecordedGateResult {
  readonly gateKey: (typeof GATE_KEYS)[number];
  readonly status: 'pass' | 'fail' | 'not-applicable';
  readonly reason: string;
  readonly supportingRecordIds: readonly string[];
}

interface RecordedEvaluation {
  readonly id: string;
  readonly questionId: string;
  readonly overallResult: string;
  readonly gateResults: readonly RecordedGateResult[];
  readonly eligibleClaimIds: readonly string[];
  readonly eligibleSourceReferenceIds: readonly string[];
  readonly approvalDecisionIds: readonly string[];
  readonly matchingAuthorityBoundaryIds: readonly string[];
  readonly matchingEscalationRuleIds: readonly string[];
  readonly withholdReason?: string;
  readonly correlationId: string;
}

interface RecordedAnswer {
  readonly id: string;
  readonly questionId: string;
  readonly status: 'delivered' | 'withheld' | 'escalated' | 'prohibited';
  readonly answerMode:
    | 'approved-guidance'
    | 'approved-guidance-with-authority'
    | 'known-escalation'
    | 'prohibited-action'
    | 'withheld';
  readonly responseText: string;
  readonly citedClaimIds: readonly string[];
  readonly citedSourceReferenceIds: readonly string[];
  readonly citedApprovalDecisionIds: readonly string[];
  readonly citedAuthorityBoundaryIds: readonly string[];
  readonly eligibilityEvaluationId: string;
  readonly correlationId: string;
}

interface RecordedEscalation {
  readonly id: string;
  readonly questionId: string;
  readonly reason: string;
  readonly urgency: 'routine' | 'same-day' | 'immediate';
  readonly destination: string;
  readonly requiredContext: unknown;
  readonly status: 'open' | 'assigned' | 'resolved' | 'closed';
  readonly assignedAt?: string;
  readonly resolvedAt?: string;
  readonly resolutionSummary?: string;
  readonly resolvedByLabel?: string;
  readonly relatedGapId?: string;
  readonly matchingBoundaryIds: readonly string[];
  readonly matchingEscalationRuleIds: readonly string[];
  readonly correlationId: string;
}

interface RecordedActivityEvent {
  readonly id: string;
  readonly eventType: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly actorLabel: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

interface PhaseThreeSnapshotView {
  readonly employeeQuestions: readonly RecordedQuestion[];
  readonly answerEligibilityEvaluations: readonly RecordedEvaluation[];
  readonly answers: readonly RecordedAnswer[];
  readonly escalations: readonly RecordedEscalation[];
  readonly activityEvents: readonly RecordedActivityEvent[];
}

interface HarnessOptions {
  readonly boundaries?: readonly StructuredAuthorityBoundary[];
  readonly rules?: readonly StructuredEscalationRule[];
  readonly roleStatus?: Role['status'];
  /** `null` deliberately tests operation without a configured fallback. */
  readonly ownerFallbackDestination?: string | null;
}

function legacyBoundary(
  overrides: Partial<StructuredAuthorityBoundary> = {},
): StructuredAuthorityBoundary {
  return {
    id: 'boundary-legacy',
    roleId: 'role-one',
    subject: 'Legacy company commitments',
    permissionLevel: 'must-request-approval',
    limitOrConstraint: 'Retained Phase 1 owner wording only.',
    escalationDestination: 'Owner',
    notes: 'This unbound record cannot authorize a Phase 3 action.',
    ...overrides,
  };
}

function legacyRule(overrides: Partial<StructuredEscalationRule> = {}): StructuredEscalationRule {
  return {
    id: 'rule-legacy',
    roleId: 'role-one',
    trigger: 'Legacy owner-entered trigger.',
    destination: 'Owner',
    urgency: 'same-day',
    requiredContext: 'A safe request summary.',
    expectedResponse: 'The owner decides the next action.',
    ...overrides,
  };
}

function activeSnapshot(options: HarnessOptions = {}): PhaseOneSnapshot {
  return {
    ...EMPTY_PHASE_ONE_SNAPSHOT,
    company: {
      id: 'company-one',
      name: 'Fictional Service Company',
      industry: 'Home services',
      serviceArea: 'Fictional service area',
      contactInformation: { phone: 'Fictional contact withheld', email: 'owner@example.test' },
      operatingTimezone: 'America/Denver',
      status: 'active',
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
    role: {
      id: 'role-one',
      companyId: 'company-one',
      title: 'Home-Service Office Manager / Dispatcher',
      mission: 'Coordinate safe, source-backed office and dispatch work.',
      status: options.roleStatus ?? 'active',
      responsibilities: [
        {
          id: 'responsibility-one',
          roleId: 'role-one',
          title: 'Coordinate dispatch',
          expectedOutcome: 'Each accepted call has a complete handoff.',
          frequency: 'Every service day',
          completionEvidence: 'Dispatch record',
          status: 'active',
        },
      ],
      authorityBoundaries: options.boundaries ?? [legacyBoundary()],
      escalationRules: options.rules ?? [legacyRule()],
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
  };
}

function successful<T>(result: DomainResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw result.error;
  return result.value;
}

function failedWith<T>(result: DomainResult<T>, code: DomainErrorCode): void {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error(`Expected ${code}.`);
  expect(result.error.code).toBe(code);
}

function harness(options: HarnessOptions = {}): {
  readonly repository: InMemoryPhaseOneRepository;
  readonly service: PhaseOneService;
} {
  const repository = new InMemoryPhaseOneRepository();
  let idSequence = 0;
  let clockTick = 0;
  const ownerFallbackDestination =
    options.ownerFallbackDestination === undefined ? 'Owner' : options.ownerFallbackDestination;
  const serviceOptions = {
    idFactory: (prefix: string) => `phase-three-${prefix}-${++idSequence}`,
    clock: () => new Date(Date.UTC(2026, 7, 2, 16, 0, clockTick++)).toISOString(),
    ...(ownerFallbackDestination === null ? {} : { ownerFallbackDestination }),
  };
  const service = new PhaseOneService(repository, serviceOptions);
  successful(service.initializeSnapshot(activeSnapshot(options)));
  return { repository, service };
}

function emptyService(): PhaseOneService {
  return new PhaseOneService(new InMemoryPhaseOneRepository(), {
    idFactory: (prefix) => `empty-${prefix}`,
    clock: () => FIXED_TIME,
  });
}

function snapshotOf(service: PhaseOneService): PhaseThreeSnapshotView {
  return service.getSnapshot() as unknown as PhaseThreeSnapshotView;
}

function questionInput(overrides: Partial<TestQuestionInput> = {}): TestQuestionInput {
  return {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'What is the approved scheduling policy?',
    topicKey: 'scheduling',
    requestType: 'policy-lookup',
    sensitivitySelection: 'none',
    structuredContext: { requestType: 'policy-lookup' },
    ...overrides,
  };
}

function submitQuestion(
  service: PhaseOneService,
  input: TestQuestionInput = questionInput(),
): RecordedQuestion {
  return successful(service.submitEmployeeQuestion(input as never)) as RecordedQuestion;
}

function evaluateQuestion(service: PhaseOneService, questionId: string): void {
  successful(service.evaluateEmployeeQuestion(questionId));
}

function evaluationFor(service: PhaseOneService, questionId: string): RecordedEvaluation {
  const evaluation = snapshotOf(service).answerEligibilityEvaluations.find(
    (candidate) => candidate.questionId === questionId,
  );
  if (evaluation === undefined) throw new Error(`No evaluation for ${questionId}.`);
  return evaluation;
}

function answerFor(service: PhaseOneService, questionId: string): RecordedAnswer {
  const answer = snapshotOf(service).answers.find(
    (candidate) => candidate.questionId === questionId,
  );
  if (answer === undefined) throw new Error(`No answer for ${questionId}.`);
  return answer;
}

function escalationFor(service: PhaseOneService, questionId: string): RecordedEscalation {
  const escalation = snapshotOf(service).escalations.find(
    (candidate) => candidate.questionId === questionId,
  );
  if (escalation === undefined) throw new Error(`No escalation for ${questionId}.`);
  return escalation;
}

function createAvailableSource(
  service: PhaseOneService,
  title: string,
  content: string,
): SourceReference {
  const draft = successful(
    service.createSourceDocument({
      title,
      sourceType: 'policy',
      supplierLabel: 'Fictional owner',
      content,
    }),
  );
  const available = successful(service.activateSourceDocument(draft.id));
  return successful(
    service.createAnchoredSourceReference({
      sourceDocumentId: available.id,
      sourceDocumentVersion: available.version,
      startLine: 1,
      endLine: 1,
    }),
  );
}

function approveTopic(
  service: PhaseOneService,
  topicKey: OperationalTopicKey,
  statement = `Approved guidance for ${topicKey}.`,
  category: 'procedure' | 'general' = 'procedure',
): {
  readonly claim: KnowledgeClaim;
  readonly source: SourceReference;
  readonly approvalDecisionId: string;
} {
  const source = createAvailableSource(service, `Policy for ${topicKey}`, statement);
  const extracted = successful(
    service.createManualExtractedClaim({
      sourceReferenceId: source.id,
      topicKey,
      statement,
      category,
    }),
  );
  successful(service.transitionKnowledgeClaim(extracted.id, 'proposed'));
  const claim = successful(
    service.approveKnowledgeClaim({
      claimId: extracted.id,
      actorLabel: 'Fictional owner',
      reason: 'The exact source supports this current guidance.',
    }),
  );
  const decision = service
    .getSnapshot()
    .approvalDecisions.find(
      ({ claimId, claimVersion, decision: decisionType }) =>
        claimId === claim.id && claimVersion === claim.version && decisionType === 'approve',
    );
  if (decision === undefined) throw new Error('Expected approval decision.');
  return { claim, source, approvalDecisionId: decision.id };
}

function createConflict(service: PhaseOneService, topicKey: OperationalTopicKey): KnowledgeClaim {
  const source = createAvailableSource(
    service,
    `Conflicting note for ${topicKey}`,
    `Conflicting instruction for ${topicKey}.`,
  );
  return successful(
    service.createKnowledgeClaim({
      statement: `Conflicting instruction for ${topicKey}.`,
      category: 'decision-rule',
      provenance: 'source-extracted',
      lifecycleStatus: 'conflicting-information',
      sourceReferenceIds: [source.id],
      topicKey,
    }),
  );
}

function activeTopicGaps(service: PhaseOneService, topicKey: OperationalTopicKey) {
  return service
    .getSnapshot()
    .knowledgeGaps.filter(
      (gap) => gap.topicKey === topicKey && ACTIVE_GAP_STATUSES.has(gap.status),
    );
}

function actionInput(
  topicKey: OperationalTopicKey,
  proposedAction = 'Move this appointment to the next open window.',
): TestQuestionInput {
  return questionInput({
    questionText: 'May I take this action?',
    topicKey,
    requestType: 'decision-request',
    structuredContext: {
      requestType: 'decision-request',
      proposedAction,
      subject: 'Fictional service request',
    },
  });
}

function financialInput(amount: number, currency: CurrencyCode = 'USD'): TestQuestionInput {
  return questionInput({
    questionText: 'May I issue this fictional refund?',
    topicKey: 'refunds',
    requestType: 'financial-action',
    structuredContext: {
      requestType: 'financial-action',
      actionType: 'refund',
      amount,
      currency,
    },
  });
}

describe('Phase 3 employee-question validation and lifecycle', () => {
  it('requires an active company and role', () => {
    failedWith(
      emptyService().submitEmployeeQuestion(questionInput() as never),
      'company-not-found',
    );

    const { service } = harness({ roleStatus: 'draft' });
    failedWith(service.submitEmployeeQuestion(questionInput() as never), 'role-not-found');
  });

  it.each([
    ['question text', { questionText: ' ' }, 'validation-error'],
    ['employee label', { employeeLabel: '' }, 'validation-error'],
    ['topic', { topicKey: 'not-a-topic' as OperationalTopicKey }, 'invalid-topic'],
    ['request type', { requestType: 'chat' as RequestType }, 'invalid-request-type'],
    [
      'sensitivity',
      { sensitivitySelection: '' as SensitivitySelection },
      'invalid-sensitivity-selection',
    ],
  ] as const)(
    'rejects invalid explicit %s without writing a question',
    (_label, overrides, code) => {
      const { service } = harness();
      failedWith(
        service.submitEmployeeQuestion(questionInput(overrides) as never),
        code as DomainErrorCode,
      );
      expect(snapshotOf(service).employeeQuestions).toHaveLength(0);
      expect(snapshotOf(service).activityEvents).toHaveLength(0);
    },
  );

  it.each([
    [
      'mismatched discriminant',
      {
        requestType: 'decision-request',
        structuredContext: { requestType: 'policy-lookup' },
      },
    ],
    [
      'missing proposed action',
      {
        requestType: 'decision-request',
        structuredContext: { requestType: 'decision-request', proposedAction: ' ' },
      },
    ],
    [
      'missing exception reason',
      {
        requestType: 'exception-request',
        structuredContext: {
          requestType: 'exception-request',
          requestedException: 'Override the schedule',
          reason: '',
        },
      },
    ],
    [
      'negative financial amount',
      {
        requestType: 'financial-action',
        structuredContext: {
          requestType: 'financial-action',
          actionType: 'refund',
          amount: -1,
          currency: 'USD',
        },
      },
    ],
    [
      'non-finite financial amount',
      {
        requestType: 'financial-action',
        structuredContext: {
          requestType: 'financial-action',
          actionType: 'refund',
          amount: Number.NaN,
          currency: 'USD',
        },
      },
    ],
    [
      'blank financial currency',
      {
        requestType: 'financial-action',
        structuredContext: {
          requestType: 'financial-action',
          actionType: 'refund',
          amount: 10,
          currency: ' ',
        },
      },
    ],
    [
      'invalid emergency urgency',
      {
        requestType: 'emergency-action',
        structuredContext: {
          requestType: 'emergency-action',
          urgency: 'eventually',
          emergencyCategory: 'gas-odor',
        },
      },
    ],
    [
      'negative optional commitment amount',
      {
        requestType: 'customer-commitment',
        structuredContext: {
          requestType: 'customer-commitment',
          commitmentType: 'price-or-estimate',
          amount: -5,
          currency: 'USD',
        },
      },
    ],
    [
      'commitment amount without currency',
      {
        requestType: 'customer-commitment',
        structuredContext: {
          requestType: 'customer-commitment',
          commitmentType: 'price-or-estimate',
          amount: 25,
        },
      },
    ],
    [
      'invalid commitment date',
      {
        requestType: 'customer-commitment',
        structuredContext: {
          requestType: 'customer-commitment',
          commitmentType: 'completion-date',
          commitmentDate: 'not-a-date',
        },
      },
    ],
    [
      'impossible commitment date',
      {
        requestType: 'customer-commitment',
        structuredContext: {
          requestType: 'customer-commitment',
          commitmentType: 'completion-date',
          commitmentDate: '2026-02-31',
        },
      },
    ],
    [
      'completion-date commitment without a date',
      {
        requestType: 'customer-commitment',
        structuredContext: {
          requestType: 'customer-commitment',
          commitmentType: 'completion-date',
        },
      },
    ],
  ] as const)('rejects invalid structured context: %s', (_label, overrides) => {
    const { service } = harness();
    failedWith(
      service.submitEmployeeQuestion(questionInput(overrides as never) as never),
      'invalid-question-context',
    );
    expect(snapshotOf(service).employeeQuestions).toHaveLength(0);
  });

  it.each([
    ['policy-lookup', { requestType: 'policy-lookup' }],
    ['procedure-lookup', { requestType: 'procedure-lookup', currentStepLabel: 'Confirm caller' }],
    [
      'decision-request',
      { requestType: 'decision-request', proposedAction: 'Move the visit', subject: 'Schedule' },
    ],
    [
      'exception-request',
      {
        requestType: 'exception-request',
        requestedException: 'Use a later window',
        reason: 'Customer request',
      },
    ],
    [
      'financial-action',
      { requestType: 'financial-action', actionType: 'refund', amount: 0, currency: 'USD' },
    ],
    [
      'emergency-action',
      {
        requestType: 'emergency-action',
        urgency: 'immediate',
        emergencyCategory: 'gas-odor',
      },
    ],
    [
      'customer-commitment',
      {
        requestType: 'customer-commitment',
        commitmentType: 'arrival-window',
        commitmentDate: '2026-08-03',
      },
    ],
  ] as const)(
    'retains valid %s structured input without parsing question text',
    (requestType, context) => {
      const { service } = harness();
      const input = questionInput({
        questionText: 'Arbitrary wording that must not determine structured values.',
        requestType,
        structuredContext: context as TestStructuredContext,
      });
      const question = submitQuestion(service, input);

      expect(question).toMatchObject({
        employeeLabel: input.employeeLabel,
        questionText: input.questionText,
        requestType,
        structuredContext: context,
        sensitivitySelection: 'none',
        status: 'received',
      });
      expect(snapshotOf(service).activityEvents.map(({ eventType }) => eventType)).toEqual([
        'question-received',
      ]);
    },
  );

  it('keeps evaluated input immutable and appends a linked correction', () => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const original = submitQuestion(service);
    evaluateQuestion(service, original.id);
    const retainedOriginal = snapshotOf(service).employeeQuestions.find(
      ({ id }) => id === original.id,
    );

    const correctionInput = questionInput({
      questionText: 'Corrected employee wording.',
      structuredContext: { requestType: 'policy-lookup' },
    });
    const correction = successful(
      service.correctEmployeeQuestion(original.id, correctionInput as never),
    ) as RecordedQuestion;

    expect(correction).toMatchObject({
      questionText: 'Corrected employee wording.',
      correctsQuestionId: original.id,
      status: 'received',
    });
    expect(correction.id).not.toBe(original.id);
    expect(snapshotOf(service).employeeQuestions.find(({ id }) => id === original.id)).toEqual(
      retainedOriginal,
    );
    expect(snapshotOf(service).employeeQuestions).toHaveLength(2);
  });

  it('allows only a completed outcome to close and retains the closed time', () => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const question = submitQuestion(service);
    failedWith(service.closeEmployeeQuestion(question.id), 'invalid-transition');

    evaluateQuestion(service, question.id);
    const closed = successful(service.closeEmployeeQuestion(question.id)) as RecordedQuestion;
    expect(closed).toMatchObject({ id: question.id, status: 'closed' });
    expect(closed.closedAt).toBeDefined();
    failedWith(service.closeEmployeeQuestion(question.id), 'immutable-question');
  });
});

describe('Phase 3 pure policy-firewall and aggregate validation seams', () => {
  it('fails malformed scope, topic, request type, and context through explicit gates', () => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const submitted = submitQuestion(service);
    const snapshot = service.getSnapshot();
    const question = snapshot.employeeQuestions.find(({ id }) => id === submitted.id);
    if (question === undefined) throw new Error('Expected submitted question.');

    const malformed: readonly [string, EmployeeQuestion, (typeof GATE_KEYS)[number]][] = [
      ['scope', { ...question, companyId: 'wrong-company' }, 'scope-valid'],
      ['topic', { ...question, topicKey: 'not-a-topic' as OperationalTopicKey }, 'topic-valid'],
      [
        'request type',
        {
          ...question,
          requestType: 'chat',
          structuredContext: { requestType: 'chat' },
        } as unknown as EmployeeQuestion,
        'request-context-valid',
      ],
      [
        'context',
        {
          ...question,
          structuredContext: {
            requestType: 'decision-request',
            proposedAction: 'Mismatched context',
          },
        } as EmployeeQuestion,
        'request-context-valid',
      ],
    ];

    for (const [label, candidate, failedGate] of malformed) {
      const decision = evaluateQuestionPolicy(
        snapshot,
        candidate,
        `malformed-${label}`,
        FIXED_TIME,
      );
      expect(decision.evaluation.overallResult, label).toBe('withheld-unsupported-request');
      expect(
        decision.evaluation.gateResults.find(({ gateKey }) => gateKey === failedGate)?.status,
        label,
      ).toBe('fail');
      expect(
        decision.evaluation.gateResults.map(({ gateKey }) => gateKey),
        label,
      ).toEqual(GATE_KEYS);
    }
  });

  it.each([
    [
      'missing approval decision',
      (snapshot: PhaseOneSnapshot) => ({ ...snapshot, approvalDecisions: [] }),
    ],
    [
      'broken source reference',
      (snapshot: PhaseOneSnapshot) => ({ ...snapshot, sourceReferences: [] }),
    ],
  ] as const)('fails malformed %s provenance without throwing', (_label, breakSnapshot) => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const submitted = submitQuestion(service);
    const snapshot = service.getSnapshot();
    const question = snapshot.employeeQuestions.find(({ id }) => id === submitted.id);
    if (question === undefined) throw new Error('Expected submitted question.');

    const decision = evaluateQuestionPolicy(
      breakSnapshot(snapshot),
      question,
      'malformed-provenance',
      FIXED_TIME,
    );
    expect(decision.evaluation.overallResult).toBe('withheld-invalid-provenance');
    expect(
      decision.evaluation.gateResults.find(({ gateKey }) => gateKey === 'provenance-valid')?.status,
    ).toBe('fail');
  });

  it('rejects a seeded delivered answer whose recorded evidence is not eligible', () => {
    const { service } = harness();
    const approved = approveTopic(service, 'scheduling');
    const proposedSource = createAvailableSource(
      service,
      'Unapproved scheduling note',
      'Unapproved scheduling statement.',
    );
    const proposed = successful(
      service.createKnowledgeClaim({
        statement: 'Unapproved scheduling statement.',
        category: 'procedure',
        provenance: 'source-extracted',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: [proposedSource.id],
        topicKey: 'scheduling',
      }),
    );
    const question = submitQuestion(service);
    evaluateQuestion(service, question.id);
    const snapshot = service.getSnapshot();
    const evaluation = snapshot.answerEligibilityEvaluations[0]!;
    const answer = snapshot.answers[0]!;
    const forged: PhaseOneSnapshot = {
      ...snapshot,
      answerEligibilityEvaluations: [
        {
          ...evaluation,
          eligibleClaimIds: [proposed.id],
          eligibleSourceReferenceIds: [proposedSource.id],
          approvalDecisionIds: [approved.approvalDecisionId],
        },
      ],
      answers: [
        {
          ...answer,
          citedClaimIds: [proposed.id],
          citedSourceReferenceIds: [proposedSource.id],
          citedApprovalDecisionIds: [approved.approvalDecisionId],
        },
      ],
    };

    failedWith(emptyService().initializeSnapshot(forged), 'relationship-mismatch');
  });
});

describe('Phase 3 deterministic retrieval, gates, and answer composition', () => {
  it('retrieves only current approved knowledge for the explicit topic', () => {
    const { service } = harness();
    const scheduling = approveTopic(
      service,
      'scheduling',
      'Confirm the approved arrival window before dispatch.',
    );
    approveTopic(service, 'payments', 'Collect payment only through the approved payment flow.');
    const question = submitQuestion(
      service,
      questionInput({
        questionText: 'The words refund and discount appear here but must not drive retrieval.',
        topicKey: 'scheduling',
      }),
    );

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);
    const answer = answerFor(service, question.id);

    expect(evaluation.overallResult).toBe('answer-eligible');
    expect(evaluation.eligibleClaimIds).toEqual([scheduling.claim.id]);
    expect(answer.citedClaimIds).toEqual([scheduling.claim.id]);
    expect(answer.citedSourceReferenceIds).toEqual([scheduling.source.id]);
    expect(answer.citedApprovalDecisionIds).toEqual([scheduling.approvalDecisionId]);
  });

  it('records all gates in fixed order and composes cited informational guidance with a disclaimer', () => {
    const { service } = harness();
    const approved = approveTopic(
      service,
      'scheduling',
      'Confirm the service window with the customer before dispatch.',
    );
    const question = submitQuestion(service);

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);
    const answer = answerFor(service, question.id);

    expect(evaluation.gateResults.map(({ gateKey }) => gateKey)).toEqual(GATE_KEYS);
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'authority-clear')?.status,
    ).toBe('not-applicable');
    expect(answer).toMatchObject({
      status: 'delivered',
      answerMode: 'approved-guidance',
      citedClaimIds: [approved.claim.id],
      citedSourceReferenceIds: [approved.source.id],
      citedApprovalDecisionIds: [approved.approvalDecisionId],
      eligibilityEvaluationId: evaluation.id,
      correlationId: question.correlationId,
    });
    expect(answer.responseText).toContain('Approved company guidance');
    expect(answer.responseText).toContain(approved.claim.statement);
    expect(answer.responseText.toLowerCase()).toContain('does not authorize');
    expect(answer.responseText).toContain('Sources');
  });

  it('keeps multiple eligible claims and their provenance in one stable cited order', () => {
    const { service } = harness();
    const first = approveTopic(
      service,
      'scheduling',
      'First, confirm the customer availability window.',
    );
    const second = approveTopic(
      service,
      'scheduling',
      'Then record the confirmed window on the dispatch board.',
    );
    const question = submitQuestion(service);

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);
    const answer = answerFor(service, question.id);

    expect(new Set(evaluation.eligibleClaimIds)).toEqual(
      new Set([first.claim.id, second.claim.id]),
    );
    expect(new Set(evaluation.eligibleSourceReferenceIds)).toEqual(
      new Set([first.source.id, second.source.id]),
    );
    expect(new Set(evaluation.approvalDecisionIds)).toEqual(
      new Set([first.approvalDecisionId, second.approvalDecisionId]),
    );
    expect(answer.citedClaimIds).toEqual(evaluation.eligibleClaimIds);
    const orderedStatements = evaluation.eligibleClaimIds.map((claimId) => {
      const claim = service.getSnapshot().knowledgeClaims.find(({ id }) => id === claimId);
      if (claim === undefined) throw new Error(`Missing eligible claim ${claimId}.`);
      return claim.statement;
    });
    expect(
      orderedStatements.every(
        (statement, index) =>
          index === 0 ||
          answer.responseText.indexOf(orderedStatements[index - 1] ?? '') <
            answer.responseText.indexOf(statement),
      ),
    ).toBe(true);
  });

  it('withholds for an explicit same-topic conflict and links a real conflict gap', () => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const conflicting = createConflict(service, 'scheduling');
    const question = submitQuestion(service);

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);
    const answer = answerFor(service, question.id);
    const escalation = escalationFor(service, question.id);

    expect(evaluation.overallResult).toBe('withheld-conflicting-knowledge');
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'no-explicit-conflict'),
    ).toMatchObject({ status: 'fail', supportingRecordIds: [conflicting.id] });
    expect(answer).toMatchObject({ status: 'escalated', answerMode: 'withheld' });
    expect(escalation).toMatchObject({ reason: 'conflicting-knowledge', status: 'open' });
    const [gap] = activeTopicGaps(service, 'scheduling');
    expect(gap).toMatchObject({ reason: 'conflicting-evidence' });
    successful(service.reconcileKnowledgeGaps());
    expect(activeTopicGaps(service, 'scheduling')).toEqual([
      expect.objectContaining({ id: gap?.id, reason: 'conflicting-evidence' }),
    ]);
  });

  it('fails the answer-mode gate when a procedure lookup has no approved procedure claim', () => {
    const { service } = harness();
    approveTopic(
      service,
      'scheduling',
      'The dispatch board is the system of record for fictional appointments.',
      'general',
    );
    const question = submitQuestion(
      service,
      questionInput({
        requestType: 'procedure-lookup',
        structuredContext: { requestType: 'procedure-lookup' },
      }),
    );

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);

    expect(evaluation.overallResult).toBe('withheld-unsupported-request');
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'answer-mode-supported'),
    ).toMatchObject({ status: 'fail' });
    expect(escalationFor(service, question.id).reason).toBe('unsupported-request');
    const [gap] = activeTopicGaps(service, 'scheduling');
    expect(gap).toMatchObject({ reason: 'unsupported-request' });
    successful(service.reconcileKnowledgeGaps());
    expect(activeTopicGaps(service, 'scheduling')).toEqual([
      expect.objectContaining({ id: gap?.id, reason: 'unsupported-request' }),
    ]);
  });

  it('fails the provenance gate when current guidance cites a withdrawn source version', () => {
    const { service } = harness();
    const approved = approveTopic(service, 'scheduling');
    const documentId = approved.source.sourceDocumentId;
    if (documentId === undefined) throw new Error('Expected anchored source document.');
    successful(service.withdrawSourceDocument(documentId));
    const question = submitQuestion(service);

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);

    expect(evaluation.overallResult).toBe('withheld-invalid-provenance');
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'provenance-valid'),
    ).toMatchObject({ status: 'fail' });
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'provenance-valid')
        ?.supportingRecordIds,
    ).toContain(approved.source.id);
    expect(escalationFor(service, question.id)).toMatchObject({
      reason: 'invalid-provenance',
      status: 'open',
    });
    const [gap] = activeTopicGaps(service, 'scheduling');
    expect(gap).toMatchObject({ reason: 'invalid-provenance' });
    successful(service.reconcileKnowledgeGaps());
    expect(activeTopicGaps(service, 'scheduling')).toEqual([
      expect.objectContaining({ id: gap?.id, reason: 'invalid-provenance' }),
    ]);
  });

  it('uses safety precedence: sensitivity beats prohibited authority and later failures', () => {
    const boundary = legacyBoundary({
      id: 'boundary-prohibited-sensitive',
      topicKeys: ['customer-data-and-privacy'],
      applicableRequestTypes: ['decision-request'],
      permissionLevel: 'prohibited',
    });
    const rule = legacyRule({
      id: 'rule-sensitive-routing',
      topicKeys: ['customer-data-and-privacy'],
      applicableRequestTypes: ['decision-request'],
      sensitivityCategories: ['customer-personal-data'],
      destination: 'Privacy owner',
    });
    const { service } = harness({ boundaries: [boundary], rules: [rule] });
    approveTopic(service, 'customer-data-and-privacy');
    const question = submitQuestion(service, {
      ...actionInput('customer-data-and-privacy', 'Share the customer record.'),
      sensitivitySelection: 'customer-personal-data',
    });

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);

    expect(evaluation.overallResult).toBe('withheld-sensitive');
    expect(
      evaluation.gateResults.find(({ gateKey }) => gateKey === 'sensitivity-clear')?.status,
    ).toBe('fail');
    expect(answerFor(service, question.id).status).toBe('escalated');
    expect(escalationFor(service, question.id)).toMatchObject({
      destination: 'Privacy owner',
      matchingEscalationRuleIds: [rule.id],
    });
    expect(activeTopicGaps(service, 'customer-data-and-privacy')).toHaveLength(0);
  });

  it('gives a grounded prohibited boundary precedence over conflict', () => {
    const boundary = legacyBoundary({
      id: 'boundary-prohibited',
      topicKeys: ['discounts'],
      applicableRequestTypes: ['decision-request'],
      permissionLevel: 'prohibited',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'discounts');
    createConflict(service, 'discounts');
    const question = submitQuestion(service, actionInput('discounts', 'Promise a discount.'));

    evaluateQuestion(service, question.id);
    const evaluation = evaluationFor(service, question.id);
    const answer = answerFor(service, question.id);

    expect(evaluation.overallResult).toBe('prohibited');
    expect(answer).toMatchObject({
      status: 'prohibited',
      answerMode: 'prohibited-action',
      citedAuthorityBoundaryIds: [boundary.id],
    });
    expect(snapshotOf(service).escalations).toHaveLength(0);
    expect(activeTopicGaps(service, 'discounts')).toHaveLength(0);
  });

  it('gives a matching mandatory rule precedence over missing knowledge without a fake gap', () => {
    const rule = legacyRule({
      id: 'rule-emergency',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['emergency-action'],
      urgencyMatch: 'immediate',
      destination: 'On-call owner',
      urgency: 'immediate',
    });
    const { service } = harness({ rules: [rule] });
    const question = submitQuestion(
      service,
      questionInput({
        questionText: 'A fictional caller reports a hazard.',
        topicKey: 'urgency-and-emergency',
        requestType: 'emergency-action',
        structuredContext: {
          requestType: 'emergency-action',
          urgency: 'immediate',
          emergencyCategory: 'gas-odor',
        },
      }),
    );

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id)).toMatchObject({
      overallResult: 'escalation-required',
      matchingEscalationRuleIds: [rule.id],
    });
    expect(escalationFor(service, question.id)).toMatchObject({
      destination: 'On-call owner',
      reason: 'emergency',
    });
    expect(activeTopicGaps(service, 'urgency-and-emergency')).toHaveLength(0);
  });

  it('uses missing knowledge precedence before unclear action authority', () => {
    const { service } = harness();
    const question = submitQuestion(service, actionInput('refunds', 'Issue a refund.'));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe('withheld-missing-knowledge');
    expect(escalationFor(service, question.id).reason).toBe('missing-knowledge');
    expect(activeTopicGaps(service, 'refunds')).toEqual([
      expect.objectContaining({ reason: 'missing-evidence' }),
    ]);
  });
});

describe('Phase 3 structured authority and escalation binding', () => {
  it.each([
    ['prohibited', 'prohibited', 'prohibited'],
    ['must-request-approval', 'escalation-required', 'escalated'],
    ['must-escalate', 'escalation-required', 'escalated'],
  ] as const)(
    'honors an explicitly bound informational %s restriction before knowledge retrieval',
    (permissionLevel, expectedResult, expectedStatus) => {
      const boundary = legacyBoundary({
        id: `boundary-informational-${permissionLevel}`,
        topicKeys: ['scheduling'],
        applicableRequestTypes: ['policy-lookup'],
        permissionLevel,
        escalationDestination: 'Fictional owner',
      });
      const { service } = harness({ boundaries: [boundary] });
      const question = submitQuestion(service);

      evaluateQuestion(service, question.id);
      expect(evaluationFor(service, question.id)).toMatchObject({
        overallResult: expectedResult,
        matchingAuthorityBoundaryIds: [boundary.id],
      });
      expect(answerFor(service, question.id).status).toBe(expectedStatus);
      expect(activeTopicGaps(service, 'scheduling')).toHaveLength(0);
    },
  );

  it('permits a matching may-decide action and cites its structured boundary', () => {
    const boundary = legacyBoundary({
      id: 'boundary-may-decide',
      topicKeys: ['scheduling'],
      applicableRequestTypes: ['decision-request'],
      permissionLevel: 'may-decide',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'scheduling');
    const question = submitQuestion(service, actionInput('scheduling'));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id)).toMatchObject({
      overallResult: 'answer-eligible',
      matchingAuthorityBoundaryIds: [boundary.id],
    });
    expect(answerFor(service, question.id)).toMatchObject({
      status: 'delivered',
      answerMode: 'approved-guidance-with-authority',
      citedAuthorityBoundaryIds: [boundary.id],
    });
  });

  it.each([
    [99, 'answer-eligible'],
    [100, 'answer-eligible'],
    [101, 'escalation-required'],
  ] as const)('evaluates a structural USD limit at amount %s', (amount, expected) => {
    const boundary = legacyBoundary({
      id: 'boundary-refund-limit',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-act-within-limit',
      structuredConstraintType: 'amount-limit',
      numericLimit: 100,
      currency: 'USD',
      escalationDestination: 'Owner',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'refunds');
    const question = submitQuestion(service, financialInput(amount));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe(expected);
    if (amount <= 100) {
      expect(answerFor(service, question.id)).toMatchObject({
        status: 'delivered',
        answerMode: 'approved-guidance-with-authority',
      });
    } else {
      expect(escalationFor(service, question.id)).toMatchObject({
        destination: 'Owner',
        matchingBoundaryIds: [boundary.id],
      });
      expect(activeTopicGaps(service, 'refunds')).toHaveLength(0);
    }
  });

  it('fails closed on a currency mismatch', () => {
    const boundary = legacyBoundary({
      id: 'boundary-cad-only',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-act-within-limit',
      structuredConstraintType: 'amount-limit',
      numericLimit: 100,
      currency: 'CAD',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'refunds');
    const question = submitQuestion(service, financialInput(10, 'USD'));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe('withheld-authority-unclear');
    expect(answerFor(service, question.id).status).not.toBe('delivered');
    expect(activeTopicGaps(service, 'refunds')).toEqual([
      expect.objectContaining({ reason: 'authority-unclear' }),
    ]);
  });

  it('uses the most restrictive compatible amount limit when several boundaries match', () => {
    const broad = legacyBoundary({
      id: 'boundary-limit-a-broad',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-act-within-limit',
      structuredConstraintType: 'amount-limit',
      numericLimit: 500,
      currency: 'USD',
      escalationDestination: 'Owner',
    });
    const narrow = legacyBoundary({
      id: 'boundary-limit-z-narrow',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-act-within-limit',
      structuredConstraintType: 'amount-limit',
      numericLimit: 100,
      currency: 'USD',
      escalationDestination: 'Owner',
    });
    const { service } = harness({ boundaries: [broad, narrow] });
    approveTopic(service, 'refunds');
    const question = submitQuestion(service, financialInput(300));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id)).toMatchObject({
      overallResult: 'escalation-required',
      matchingAuthorityBoundaryIds: [broad.id, narrow.id],
    });
    expect(escalationFor(service, question.id).reason).toBe('approval-required');
    expect(activeTopicGaps(service, 'refunds')).toHaveLength(0);
  });

  it('rejects and independently fails closed on may-decide financial authority', () => {
    const invalidBoundary = legacyBoundary({
      id: 'boundary-invalid-financial-decision',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-decide',
    });
    failedWith(
      emptyService().initializeSnapshot(activeSnapshot({ boundaries: [invalidBoundary] })),
      'invalid-request-type',
    );

    const { service } = harness();
    approveTopic(service, 'refunds');
    const submitted = submitQuestion(service, financialInput(10));
    const snapshot = service.getSnapshot();
    const question = snapshot.employeeQuestions.find(({ id }) => id === submitted.id)!;
    const malformedSnapshot: PhaseOneSnapshot = {
      ...snapshot,
      role: { ...snapshot.role!, authorityBoundaries: [invalidBoundary] },
    };
    expect(
      evaluateQuestionPolicy(
        malformedSnapshot,
        question,
        'malformed-financial-authority',
        FIXED_TIME,
      ).evaluation.overallResult,
    ).toBe('withheld-authority-unclear');
  });

  it('never parses a numeric limit from the retained Phase 1 text', () => {
    const boundary = legacyBoundary({
      id: 'boundary-free-text-limit',
      topicKeys: ['refunds'],
      applicableRequestTypes: ['financial-action'],
      permissionLevel: 'may-act-within-limit',
      limitOrConstraint: 'The dispatcher may issue refunds up to $1,000.',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'refunds');
    const question = submitQuestion(service, financialInput(1));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe('withheld-authority-unclear');
    expect(answerFor(service, question.id).responseText).not.toContain('1,000');
  });

  it.each([
    ['must-request-approval', 'approval-required'],
    ['must-escalate', 'mandatory-escalation'],
  ] as const)(
    'routes %s through its explicit destination without creating a gap',
    (level, reason) => {
      const boundary = legacyBoundary({
        id: `boundary-${level}`,
        topicKeys: ['discounts'],
        applicableRequestTypes: ['decision-request'],
        permissionLevel: level,
        escalationDestination: 'Fictional owner',
      });
      const { service } = harness({ boundaries: [boundary] });
      approveTopic(service, 'discounts');
      const question = submitQuestion(service, actionInput('discounts', 'Promise a discount.'));

      evaluateQuestion(service, question.id);
      expect(evaluationFor(service, question.id).overallResult).toBe('escalation-required');
      expect(answerFor(service, question.id)).toMatchObject({
        status: 'escalated',
        answerMode: 'known-escalation',
        citedAuthorityBoundaryIds: [boundary.id],
      });
      expect(escalationFor(service, question.id)).toMatchObject({
        reason,
        destination: 'Fictional owner',
        matchingBoundaryIds: [boundary.id],
      });
      expect(activeTopicGaps(service, 'discounts')).toHaveLength(0);
    },
  );

  it('treats an unbound Phase 1 boundary as unclear authority and links an authority gap', () => {
    const { service } = harness({
      boundaries: [
        legacyBoundary({
          permissionLevel: 'may-decide',
          subject: 'Scheduling — the wording resembles this exact request.',
        }),
      ],
    });
    approveTopic(service, 'scheduling');
    const question = submitQuestion(service, actionInput('scheduling'));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe('withheld-authority-unclear');
    expect(evaluationFor(service, question.id).matchingAuthorityBoundaryIds).toEqual([]);
    const [gap] = activeTopicGaps(service, 'scheduling');
    expect(gap).toMatchObject({ reason: 'authority-unclear' });
    successful(service.reconcileKnowledgeGaps());
    expect(activeTopicGaps(service, 'scheduling')).toEqual([
      expect.objectContaining({ id: gap?.id, reason: 'authority-unclear' }),
    ]);
  });

  it('matches sensitivity only through an explicit rule and creates no fake gap', () => {
    const rule = legacyRule({
      id: 'rule-payment-data',
      topicKeys: ['payments'],
      applicableRequestTypes: ['policy-lookup'],
      sensitivityCategories: ['payment-data'],
      destination: 'Payment-data owner',
      urgency: 'immediate',
    });
    const { service } = harness({ rules: [rule] });
    approveTopic(service, 'payments');
    const question = submitQuestion(
      service,
      questionInput({
        questionText: 'How should I handle this sensitive payment question?',
        topicKey: 'payments',
        sensitivitySelection: 'payment-data',
      }),
    );

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id)).toMatchObject({
      overallResult: 'withheld-sensitive',
      matchingEscalationRuleIds: [rule.id],
    });
    expect(escalationFor(service, question.id).destination).toBe('Payment-data owner');
    expect(activeTopicGaps(service, 'payments')).toHaveLength(0);
  });

  it('does not match a rule with the wrong request type or urgency', () => {
    const wrongRequest = legacyRule({
      id: 'rule-wrong-request',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['policy-lookup'],
      urgencyMatch: 'same-day',
      destination: 'Policy owner',
    });
    const wrongUrgency = legacyRule({
      id: 'rule-wrong-urgency',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['emergency-action'],
      urgencyMatch: 'immediate',
      destination: 'Immediate owner',
    });
    const { service } = harness({ rules: [wrongRequest, wrongUrgency] });
    approveTopic(service, 'urgency-and-emergency');
    const question = submitQuestion(
      service,
      questionInput({
        topicKey: 'urgency-and-emergency',
        requestType: 'emergency-action',
        structuredContext: {
          requestType: 'emergency-action',
          urgency: 'same-day',
          emergencyCategory: 'no-heating-or-cooling',
        },
      }),
    );

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).matchingEscalationRuleIds).toEqual([]);
    expect(escalationFor(service, question.id).destination).toBe('Owner');
    expect(escalationFor(service, question.id).destination).not.toBe('Policy owner');
    expect(escalationFor(service, question.id).destination).not.toBe('Immediate owner');
  });

  it('uses stable urgency and identifier priority when several explicit rules match', () => {
    const routine = legacyRule({
      id: 'rule-z-routine',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['emergency-action'],
      destination: 'Routine owner',
      urgency: 'routine',
    });
    const immediateB = legacyRule({
      id: 'rule-b-immediate',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['emergency-action'],
      destination: 'Immediate owner B',
      urgency: 'immediate',
    });
    const immediateA = legacyRule({
      id: 'rule-a-immediate',
      topicKeys: ['urgency-and-emergency'],
      applicableRequestTypes: ['emergency-action'],
      destination: 'Immediate owner A',
      urgency: 'immediate',
    });
    const { service } = harness({ rules: [routine, immediateB, immediateA] });
    const question = submitQuestion(
      service,
      questionInput({
        topicKey: 'urgency-and-emergency',
        requestType: 'emergency-action',
        structuredContext: {
          requestType: 'emergency-action',
          urgency: 'immediate',
          emergencyCategory: 'gas-odor',
        },
      }),
    );

    evaluateQuestion(service, question.id);

    expect(evaluationFor(service, question.id).matchingEscalationRuleIds).toEqual([
      immediateA.id,
      immediateB.id,
      routine.id,
    ]);
    expect(escalationFor(service, question.id).destination).toBe('Immediate owner A');
  });

  it('does not invent an escalation destination when no fallback is configured', () => {
    const { service } = harness({ ownerFallbackDestination: null });
    const question = submitQuestion(service, questionInput({ topicKey: 'payments' }));

    evaluateQuestion(service, question.id);
    expect(evaluationFor(service, question.id).overallResult).toBe('withheld-missing-knowledge');
    expect(answerFor(service, question.id).status).toBe('withheld');
    expect(snapshotOf(service).escalations).toHaveLength(0);
    expect(activeTopicGaps(service, 'payments')).toHaveLength(1);
  });
});

describe('Phase 3 idempotency, escalation lifecycle, gaps, and activity trace', () => {
  it('returns the immutable outcome when the same question is evaluated again', () => {
    const { service } = harness();
    const question = submitQuestion(service, questionInput({ topicKey: 'payments' }));
    evaluateQuestion(service, question.id);
    const first = snapshotOf(service);

    evaluateQuestion(service, question.id);
    const second = snapshotOf(service);

    expect(second).toEqual(first);
    expect(
      second.answerEligibilityEvaluations.filter(({ questionId }) => questionId === question.id),
    ).toHaveLength(1);
    expect(second.answers.filter(({ questionId }) => questionId === question.id)).toHaveLength(1);
    expect(second.escalations.filter(({ questionId }) => questionId === question.id)).toHaveLength(
      1,
    );
    expect(activeTopicGaps(service, 'payments')).toHaveLength(1);
  });

  it('reuses the active gap but retains a distinct escalation for each question', () => {
    const { service } = harness();
    const firstQuestion = submitQuestion(service, questionInput({ topicKey: 'payments' }));
    evaluateQuestion(service, firstQuestion.id);
    const firstEscalation = escalationFor(service, firstQuestion.id);
    const [firstGap] = activeTopicGaps(service, 'payments');
    if (firstGap === undefined) throw new Error('Expected a payments gap.');

    const secondQuestion = submitQuestion(
      service,
      questionInput({
        questionText: 'A second missing payment-policy question.',
        topicKey: 'payments',
      }),
    );
    evaluateQuestion(service, secondQuestion.id);

    expect(activeTopicGaps(service, 'payments')).toEqual([
      expect.objectContaining({ id: firstGap.id }),
    ]);
    expect(escalationFor(service, secondQuestion.id).id).not.toBe(firstEscalation.id);
    expect(snapshotOf(service).escalations.filter(({ status }) => status === 'open')).toHaveLength(
      2,
    );
  });

  it('resolves a question-created missing gap only after approval while preserving history', () => {
    const { service } = harness();
    const question = submitQuestion(service, questionInput({ topicKey: 'payments' }));
    evaluateQuestion(service, question.id);
    const evaluationBefore = evaluationFor(service, question.id);
    const answerBefore = answerFor(service, question.id);
    const [gapBefore] = activeTopicGaps(service, 'payments');
    if (gapBefore === undefined) throw new Error('Expected a question-created payments gap.');

    const approved = approveTopic(
      service,
      'payments',
      'Use the approved fictional payment intake procedure.',
    );
    const gapAfter = service.getSnapshot().knowledgeGaps.find(({ id }) => id === gapBefore.id);

    expect(gapAfter).toMatchObject({
      status: 'resolved',
      originalReason: 'missing-evidence',
      resolvedByClaimId: approved.claim.id,
    });
    expect(evaluationFor(service, question.id)).toEqual(evaluationBefore);
    expect(answerFor(service, question.id)).toEqual(answerBefore);
    expect(answerFor(service, question.id).status).toBe('escalated');
    expect(activeTopicGaps(service, 'payments')).toHaveLength(0);
  });

  it('enforces assign, resolve, and close transitions and appends trace events', () => {
    const boundary = legacyBoundary({
      id: 'boundary-owner-approval',
      topicKeys: ['discounts'],
      applicableRequestTypes: ['decision-request'],
      permissionLevel: 'must-request-approval',
      escalationDestination: 'Fictional owner',
    });
    const { service } = harness({ boundaries: [boundary] });
    approveTopic(service, 'discounts');
    const question = submitQuestion(service, actionInput('discounts'));
    evaluateQuestion(service, question.id);
    const escalation = escalationFor(service, question.id);
    const initialEvents = [...snapshotOf(service).activityEvents];

    failedWith(service.closeEscalation(escalation.id), 'invalid-transition');
    failedWith(service.assignEscalation(escalation.id, ' '), 'validation-error');
    const assigned = successful(
      service.assignEscalation(escalation.id, 'Service owner'),
    ) as RecordedEscalation;
    expect(assigned).toMatchObject({ status: 'assigned' });
    expect(assigned.assignedAt).toBeDefined();
    failedWith(service.assignEscalation(escalation.id, 'Other owner'), 'invalid-transition');
    failedWith(service.resolveEscalation(escalation.id, '', 'Service owner'), 'validation-error');

    const resolved = successful(
      service.resolveEscalation(
        escalation.id,
        'Owner handled this one request; no policy was created.',
        'Service owner',
      ),
    ) as RecordedEscalation;
    expect(resolved).toMatchObject({
      status: 'resolved',
      resolutionSummary: 'Owner handled this one request; no policy was created.',
      resolvedByLabel: 'Service owner',
    });
    expect(resolved.resolvedAt).toBeDefined();

    const closed = successful(service.closeEscalation(escalation.id)) as RecordedEscalation;
    expect(closed.status).toBe('closed');
    failedWith(service.resolveEscalation(escalation.id, 'Again', 'Owner'), 'invalid-transition');

    const events = snapshotOf(service).activityEvents;
    expect(events.slice(0, initialEvents.length)).toEqual(initialEvents);
    expect(events.slice(initialEvents.length).map(({ eventType }) => eventType)).toEqual([
      'escalation-assigned',
      'escalation-resolved',
      'escalation-closed',
    ]);
  });

  it('resolving an escalation creates no policy and does not resolve its knowledge gap', () => {
    const { service } = harness();
    const question = submitQuestion(service, questionInput({ topicKey: 'payments' }));
    evaluateQuestion(service, question.id);
    const escalation = escalationFor(service, question.id);
    const claimsBefore = service.getSnapshot().knowledgeClaims;
    const decisionsBefore = service.getSnapshot().approvalDecisions;
    const gapBefore = service
      .getSnapshot()
      .knowledgeGaps.find(({ id }) => id === escalation.relatedGapId);
    if (gapBefore === undefined) throw new Error('Expected related gap.');

    successful(service.assignEscalation(escalation.id, 'Fictional owner'));
    successful(
      service.resolveEscalation(
        escalation.id,
        'Handled this employee question only.',
        'Fictional owner',
      ),
    );

    expect(service.getSnapshot().knowledgeClaims).toEqual(claimsBefore);
    expect(service.getSnapshot().approvalDecisions).toEqual(decisionsBefore);
    expect(service.getSnapshot().knowledgeGaps.find(({ id }) => id === gapBefore.id)).toEqual(
      gapBefore,
    );
  });

  it('records a deterministic correlated delivered-answer event sequence', () => {
    const { service } = harness();
    approveTopic(service, 'scheduling');
    const eventsBeforeQuestion = snapshotOf(service).activityEvents.length;
    const question = submitQuestion(service);
    evaluateQuestion(service, question.id);
    const events = snapshotOf(service).activityEvents.slice(eventsBeforeQuestion);

    expect(events.map(({ eventType }) => eventType)).toEqual([
      'question-received',
      'question-evaluated',
      'answer-delivered',
    ]);
    expect(new Set(events.map(({ correlationId }) => correlationId))).toEqual(
      new Set([question.correlationId]),
    );
    expect(events.every(({ id, occurredAt }) => id.length > 0 && occurredAt.length > 0)).toBe(true);
  });

  it('never copies raw sensitive question text into activity events or escalation context', () => {
    const secretText = 'Do not repeat fake-card-value 4111-DO-NOT-STORE.';
    const rule = legacyRule({
      id: 'rule-sensitive-safe-events',
      topicKeys: ['payments'],
      applicableRequestTypes: ['policy-lookup'],
      sensitivityCategories: ['payment-data'],
      destination: 'Payment-data owner',
    });
    const { service } = harness({ rules: [rule] });
    approveTopic(service, 'payments');
    const question = submitQuestion(
      service,
      questionInput({
        questionText: secretText,
        topicKey: 'payments',
        sensitivitySelection: 'payment-data',
      }),
    );
    evaluateQuestion(service, question.id);

    expect(JSON.stringify(snapshotOf(service).activityEvents)).not.toContain(secretText);
    expect(JSON.stringify(escalationFor(service, question.id).requiredContext)).not.toContain(
      secretText,
    );
    expect(
      snapshotOf(service).employeeQuestions.find(({ id }) => id === question.id)?.questionText,
    ).toBe(secretText);
  });
});
