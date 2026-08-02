import { describe, expect, it } from 'vitest';

import { InMemoryPhaseOneRepository } from '../infrastructure';
import {
  EMPTY_PHASE_ONE_SNAPSHOT,
  OPERATIONAL_TOPICS,
  PhaseOneService,
  evaluateTopicCoverage,
  numberSourceLines,
  type DomainErrorCode,
  type DomainResult,
  type InterviewAnswer,
  type KnowledgeClaim,
  type OperationalTopicKey,
  type PhaseOneSnapshot,
  type SourceDocument,
  type SourceReference,
} from '.';

const FIXED_TIME = '2026-08-02T12:00:00.000Z';

function activeSnapshot(overrides: Partial<PhaseOneSnapshot> = {}): PhaseOneSnapshot {
  return {
    company: {
      id: 'company-one',
      name: 'Fictional Service Company',
      industry: 'Home services',
      serviceArea: 'Fictional service area',
      contactInformation: { phone: '555-0100', email: 'owner@example.test' },
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
      status: 'active',
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
      authorityBoundaries: [
        {
          id: 'boundary-one',
          roleId: 'role-one',
          subject: 'Company commitments',
          permissionLevel: 'must-request-approval',
          limitOrConstraint: 'Escalate commitments outside approved instructions.',
          escalationDestination: 'Owner',
          notes: '',
        },
      ],
      escalationRules: [
        {
          id: 'escalation-one',
          roleId: 'role-one',
          trigger: 'Evidence or authority is missing.',
          destination: 'Owner',
          urgency: 'same-day',
          requiredContext: 'Request and available evidence',
          expectedResponse: 'Owner chooses the operational response.',
        },
      ],
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    },
    sourceDocuments: [],
    sourceReferences: [],
    knowledgeClaims: [],
    approvalDecisions: [],
    knowledgeGaps: [],
    interviewQuestions: [],
    interviewAnswers: [],
    employeeQuestions: [],
    answerEligibilityEvaluations: [],
    answers: [],
    escalations: [],
    activityEvents: [],
    ...overrides,
  };
}

function serviceHarness(seed: PhaseOneSnapshot = activeSnapshot()): {
  readonly repository: InMemoryPhaseOneRepository;
  readonly service: PhaseOneService;
} {
  const repository = new InMemoryPhaseOneRepository();
  let sequence = 0;
  let clockTick = 0;
  const service = new PhaseOneService(repository, {
    idFactory: (prefix) => `phase-two-${prefix}-${++sequence}`,
    clock: () => new Date(Date.UTC(2026, 7, 2, 12, 0, clockTick++)).toISOString(),
  });
  successful(service.initializeSnapshot(seed));
  return { repository, service };
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

function createAvailableDocument(service: PhaseOneService, content = 'First line\nSecond line') {
  const draft = successful(
    service.createSourceDocument({
      title: 'Dispatch checklist',
      sourceType: 'checklist',
      supplierLabel: 'Fictional owner',
      content,
    }),
  );
  return successful(service.activateSourceDocument(draft.id));
}

function createManualSource(service: PhaseOneService): SourceReference {
  return successful(
    service.createSourceReference({
      sourceTitle: 'Owner note',
      sourceType: 'owner-note',
      sourceLocator: 'Manual note, section 1',
      excerpt: 'Explicit fictional evidence.',
    }),
  );
}

function createCandidate(
  service: PhaseOneService,
  topicKey: OperationalTopicKey,
  statement = `Candidate for ${topicKey}.`,
): KnowledgeClaim {
  const source = createManualSource(service);
  return successful(
    service.createManualExtractedClaim({
      sourceReferenceId: source.id,
      topicKey,
      statement,
      category: 'procedure',
    }),
  );
}

function approveCandidate(service: PhaseOneService, claim: KnowledgeClaim): KnowledgeClaim {
  successful(service.transitionKnowledgeClaim(claim.id, 'proposed'));
  return successful(
    service.approveKnowledgeClaim({
      claimId: claim.id,
      actorLabel: 'Owner',
      reason: 'Confirmed against the exact evidence.',
    }),
  );
}

function currentQuestion(service: PhaseOneService) {
  return service.getSnapshot().interviewQuestions.find(({ status }) => status === 'active');
}

function advanceToTopic(service: PhaseOneService, topicKey: OperationalTopicKey) {
  successful(service.generateInterviewQuestions());
  let active = currentQuestion(service);
  while (active !== undefined && active.topicKey !== topicKey) {
    successful(
      service.skipInterviewQuestion(active.id, 'Address this gap after the focused test.'),
    );
    active = currentQuestion(service);
  }
  expect(active?.topicKey).toBe(topicKey);
  if (active === undefined) throw new Error(`No active question for ${topicKey}.`);
  return active;
}

describe('Phase 2 source documents', () => {
  it('normalizes line endings and activates a nonblank draft with stable one-based lines', () => {
    const { service } = serviceHarness();
    const draft = successful(
      service.createSourceDocument({
        title: ' Office checklist ',
        sourceType: 'checklist',
        supplierLabel: ' Owner ',
        content: 'Open board\r\nConfirm calls\rClose board',
      }),
    );

    expect(draft).toMatchObject({
      title: 'Office checklist',
      supplierLabel: 'Owner',
      status: 'draft',
      content: 'Open board\nConfirm calls\nClose board',
      lines: [
        { lineNumber: 1, text: 'Open board' },
        { lineNumber: 2, text: 'Confirm calls' },
        { lineNumber: 3, text: 'Close board' },
      ],
    });
    expect(successful(service.activateSourceDocument(draft.id)).status).toBe('available');
  });

  it('rejects blank activation without changing the draft', () => {
    const { service } = serviceHarness();
    const draft = successful(
      service.createSourceDocument({
        title: 'Empty note',
        sourceType: 'owner-note',
        supplierLabel: 'Owner',
        content: ' \n ',
      }),
    );

    failedWith(service.activateSourceDocument(draft.id), 'validation-error');
    expect(service.getSnapshot().sourceDocuments[0]?.status).toBe('draft');
  });

  it('validates document ownership at the aggregate boundary', () => {
    const invalid: SourceDocument = {
      id: 'document-one',
      companyId: 'different-company',
      roleId: 'role-one',
      title: 'Invalid document',
      sourceType: 'policy',
      supplierLabel: 'Owner',
      captureMethod: 'manual-paste',
      content: 'Policy text',
      lines: numberSourceLines('Policy text'),
      version: 1,
      status: 'available',
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
    };
    const repository = new InMemoryPhaseOneRepository();
    const service = new PhaseOneService(repository);

    failedWith(
      service.initializeSnapshot(activeSnapshot({ sourceDocuments: [invalid] })),
      'relationship-mismatch',
    );
    expect(repository.readSnapshot()).toEqual(EMPTY_PHASE_ONE_SNAPSHOT);
  });

  it('keeps available content immutable and corrects it through an activated revision', () => {
    const { service } = serviceHarness();
    const original = createAvailableDocument(service);

    failedWith(
      service.updateSourceDocumentDraft(original.id, { content: 'Silent replacement' }),
      'immutable-source-document',
    );
    const revision = successful(
      service.createSourceDocumentRevision({
        documentId: original.id,
        content: 'First corrected line\nSecond line',
      }),
    );
    expect(revision).toMatchObject({
      version: 2,
      status: 'draft',
      supersedesDocumentId: original.id,
    });
    expect(service.getSnapshot().sourceDocuments[0]).toEqual(original);

    const activated = successful(service.activateSourceDocument(revision.id));
    const history = service.getSnapshot().sourceDocuments;
    expect(activated.status).toBe('available');
    expect(history.find(({ id }) => id === original.id)?.status).toBe('superseded');
    expect(history.find(({ id }) => id === original.id)?.content).toBe(original.content);
  });

  it('rejects invalid document transitions and retains withdrawn evidence', () => {
    const { service } = serviceHarness();
    const available = createAvailableDocument(service);
    failedWith(service.activateSourceDocument(available.id), 'invalid-transition');
    const withdrawn = successful(service.withdrawSourceDocument(available.id));
    expect(withdrawn.status).toBe('withdrawn');
    failedWith(service.withdrawSourceDocument(available.id), 'invalid-transition');
    expect(service.getSnapshot().sourceDocuments).toHaveLength(1);
  });
});

describe('Phase 2 anchored source references', () => {
  it('derives the exact inclusive excerpt and locator from an available version', () => {
    const { service } = serviceHarness();
    const document = createAvailableDocument(service, 'One\nTwo\nThree');
    const reference = successful(
      service.createAnchoredSourceReference({
        sourceDocumentId: document.id,
        sourceDocumentVersion: 1,
        startLine: 2,
        endLine: 3,
      }),
    );

    expect(reference).toMatchObject({
      sourceDocumentId: document.id,
      sourceDocumentVersion: 1,
      startLine: 2,
      endLine: 3,
      excerpt: 'Two\nThree',
      sourceLocator: `Document ${document.id} v1, lines 2-3`,
    });
  });

  it.each([
    ['missing document', 'missing-document', 1, 1, 1, 'document-not-found'],
    ['missing version', 'actual', 9, 1, 1, 'document-version-not-found'],
    ['zero start', 'actual', 1, 0, 1, 'invalid-line-range'],
    ['reversed range', 'actual', 1, 2, 1, 'invalid-line-range'],
    ['end past content', 'actual', 1, 1, 9, 'invalid-line-range'],
  ] as const)(
    'rejects a %s anchor',
    (_case, requestedId, version, startLine, endLine, errorCode) => {
      const { service } = serviceHarness();
      const document = createAvailableDocument(service);
      failedWith(
        service.createAnchoredSourceReference({
          sourceDocumentId: requestedId === 'actual' ? document.id : requestedId,
          sourceDocumentVersion: version,
          startLine,
          endLine,
        }),
        errorCode,
      );
      expect(service.getSnapshot().sourceReferences).toHaveLength(0);
    },
  );

  it('preserves a historical anchor after a document revision is activated', () => {
    const { service } = serviceHarness();
    const original = createAvailableDocument(service, 'Original line\nStable evidence');
    const reference = successful(
      service.createAnchoredSourceReference({
        sourceDocumentId: original.id,
        sourceDocumentVersion: original.version,
        startLine: 1,
        endLine: 1,
      }),
    );
    const revision = successful(
      service.createSourceDocumentRevision({ documentId: original.id, content: 'Corrected line' }),
    );
    successful(service.activateSourceDocument(revision.id));

    expect(service.getSnapshot().sourceReferences[0]).toEqual(reference);
    expect(service.getSnapshot().sourceReferences[0]?.excerpt).toBe('Original line');
  });

  it('keeps Phase 1 metadata-only references valid', () => {
    const { service } = serviceHarness();
    const source = createManualSource(service);
    expect(source.sourceDocumentId).toBeUndefined();
    expect(source.sourceLocator).toBe('Manual note, section 1');
  });
});

describe('manual extraction and deterministic coverage', () => {
  it('creates a source-backed topic-assigned extracted claim that remains unapproved', () => {
    const { service } = serviceHarness();
    const candidate = createCandidate(service, 'scheduling');

    expect(candidate).toMatchObject({
      topicKey: 'scheduling',
      provenance: 'source-extracted',
      lifecycleStatus: 'extracted',
    });
    expect(candidate.sourceReferenceIds).toHaveLength(1);
    expect(service.selectEmployeeVisibleKnowledge()).toHaveLength(0);
  });

  it('rejects invalid topics and missing source references', () => {
    const { service } = serviceHarness();
    const source = createManualSource(service);
    failedWith(
      service.createManualExtractedClaim({
        sourceReferenceId: source.id,
        topicKey: 'not-a-topic' as OperationalTopicKey,
        statement: 'Invalid topic candidate.',
        category: 'general',
      }),
      'invalid-topic',
    );
    failedWith(
      service.createManualExtractedClaim({
        sourceReferenceId: 'missing-source',
        topicKey: 'scheduling',
        statement: 'Missing source candidate.',
        category: 'general',
      }),
      'source-not-found',
    );
  });

  it('distinguishes approved, candidate, conflicting, and missing explicit topics', () => {
    const { service } = serviceHarness();
    approveCandidate(service, createCandidate(service, 'scheduling'));
    createCandidate(service, 'payments');
    const conflictSource = createManualSource(service);
    successful(
      service.createKnowledgeClaim({
        statement: 'Two cancellation amounts are explicitly unresolved.',
        category: 'decision-rule',
        provenance: 'source-extracted',
        lifecycleStatus: 'conflicting-information',
        sourceReferenceIds: [conflictSource.id],
        topicKey: 'rescheduling-and-cancellation',
      }),
    );
    const coverage = successful(evaluateTopicCoverage(service.getSnapshot()));
    const states = Object.fromEntries(coverage.map(({ topic, state }) => [topic.key, state]));

    expect(states.scheduling).toBe('approved');
    expect(states.payments).toBe('candidate');
    expect(states['rescheduling-and-cancellation']).toBe('conflicting');
    expect(states['job-completion-proof']).toBe('missing');
  });

  it('reports dismissed only from an explicit reasoned gap dismissal', () => {
    const { service } = serviceHarness();
    successful(service.reconcileKnowledgeGaps());
    const gap = service
      .getSnapshot()
      .knowledgeGaps.find(({ topicKey }) => topicKey === 'job-completion-proof');
    if (gap === undefined) throw new Error('Expected gap.');
    failedWith(service.dismissKnowledgeGap(gap.id, ' '), 'validation-error');
    successful(service.dismissKnowledgeGap(gap.id, 'This topic does not apply to this role.'));
    const beforeReconciliation = service.getSnapshot().knowledgeGaps;
    successful(service.reconcileKnowledgeGaps());

    const coverage = successful(evaluateTopicCoverage(service.getSnapshot()));
    expect(coverage.find(({ topic }) => topic.key === gap.topicKey)?.state).toBe('dismissed');
    expect(service.getSnapshot().knowledgeGaps).toEqual(beforeReconciliation);
  });

  it('never infers topic coverage from claim wording', () => {
    const { service } = serviceHarness();
    const source = createManualSource(service);
    successful(
      service.createKnowledgeClaim({
        statement: 'The word discounts appears here, but no topic is assigned.',
        category: 'general',
        provenance: 'owner-authored',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: [source.id],
      }),
    );
    const coverage = successful(evaluateTopicCoverage(service.getSnapshot()));
    expect(coverage.find(({ topic }) => topic.key === 'discounts')?.state).toBe('missing');
  });

  it('returns stable catalog ordering and fails closed for invalid linked support', () => {
    const { service } = serviceHarness();
    const first = successful(evaluateTopicCoverage(service.getSnapshot()));
    const second = successful(evaluateTopicCoverage(service.getSnapshot()));
    expect(first.map(({ topic }) => topic.key)).toEqual(OPERATIONAL_TOPICS.map(({ key }) => key));
    expect(second).toEqual(first);

    const invalid = activeSnapshot({
      knowledgeGaps: [
        {
          id: 'gap-invalid',
          companyId: 'company-one',
          roleId: 'role-one',
          topicKey: 'scheduling',
          reason: 'incomplete-evidence',
          description: 'Invalid linked support.',
          impact: OPERATIONAL_TOPICS.find(({ key }) => key === 'scheduling')?.whyItMatters ?? '',
          riskTier: 'high',
          status: 'open',
          supportingSourceReferenceIds: ['missing-source'],
          relatedClaimIds: [],
          createdAt: FIXED_TIME,
          updatedAt: FIXED_TIME,
        },
      ],
    });
    failedWith(evaluateTopicCoverage(invalid), 'relationship-mismatch');
  });

  it('reconciles idempotently with one active gap per topic', () => {
    const { service } = serviceHarness();
    const first = successful(service.reconcileKnowledgeGaps());
    const firstSnapshot = service.getSnapshot();
    const second = successful(service.reconcileKnowledgeGaps());

    expect(first).toHaveLength(OPERATIONAL_TOPICS.length);
    expect(second).toEqual(first);
    expect(service.getSnapshot()).toEqual(firstSnapshot);
    expect(new Set(second.map(({ topicKey }) => topicKey)).size).toBe(second.length);
  });

  it('resolves only the correct gap after approval and not after rejection or unrelated approval', () => {
    const { service } = serviceHarness();
    const scheduling = createCandidate(service, 'scheduling');
    const payments = createCandidate(service, 'payments');
    successful(service.transitionKnowledgeClaim(scheduling.id, 'proposed'));
    successful(
      service.rejectKnowledgeClaim({
        claimId: scheduling.id,
        actorLabel: 'Owner',
        reason: 'This candidate needs correction.',
      }),
    );
    let schedulingGap = service
      .getSnapshot()
      .knowledgeGaps.find(
        ({ topicKey, status }) => topicKey === 'scheduling' && status !== 'resolved',
      );
    expect(schedulingGap?.status).not.toBe('resolved');

    approveCandidate(service, payments);
    schedulingGap = service
      .getSnapshot()
      .knowledgeGaps.find(({ topicKey }) => topicKey === 'scheduling');
    const paymentsGap = service
      .getSnapshot()
      .knowledgeGaps.find(({ topicKey }) => topicKey === 'payments');
    expect(schedulingGap?.status).not.toBe('resolved');
    expect(paymentsGap).toMatchObject({ status: 'resolved', resolvedByClaimId: payments.id });
  });

  it('retains gap-resolution history when an approved claim is later superseded', () => {
    const { service } = serviceHarness();
    const original = approveCandidate(service, createCandidate(service, 'payments'));
    const revision = successful(
      service.createApprovedClaimRevision({
        claimId: original.id,
        statement: 'Revised approved payment handling.',
      }),
    );

    successful(
      service.approveKnowledgeClaim({
        claimId: revision.id,
        actorLabel: 'Owner',
        reason: 'The revised source-backed wording is current.',
      }),
    );
    const gap = service.getSnapshot().knowledgeGaps.find(({ topicKey }) => topicKey === 'payments');
    expect(
      service.getSnapshot().knowledgeClaims.find(({ id }) => id === original.id)?.lifecycleStatus,
    ).toBe('superseded');
    expect(gap).toMatchObject({ status: 'resolved', resolvedByClaimId: original.id });
    expect(
      successful(evaluateTopicCoverage(service.getSnapshot())).find(
        ({ topic }) => topic.key === 'payments',
      )?.approvedClaim?.id,
    ).toBe(revision.id);
  });

  it('returns typed errors for invalid knowledge-gap transitions', () => {
    const { service } = serviceHarness();
    const [gap] = successful(service.reconcileKnowledgeGaps());
    if (gap === undefined) throw new Error('Expected gap.');
    failedWith(service.transitionKnowledgeGap(gap.id, 'resolved'), 'invalid-transition');
    successful(service.dismissKnowledgeGap(gap.id, 'Not applicable.'));
    failedWith(service.transitionKnowledgeGap(gap.id, 'open'), 'invalid-transition');
  });
});

describe('deterministic Knowledge Gap Interviewer', () => {
  it('generates idempotent risk-prioritized questions and activates only one', () => {
    const { service } = serviceHarness();
    const first = successful(service.generateInterviewQuestions());
    const questionCount = service.getSnapshot().interviewQuestions.length;
    const second = successful(service.generateInterviewQuestions());

    expect(first[0]).toMatchObject({ topicKey: 'urgency-and-emergency', status: 'active' });
    expect(
      service.getSnapshot().interviewQuestions.filter(({ status }) => status === 'active'),
    ).toHaveLength(1);
    expect(service.getSnapshot().interviewQuestions).toHaveLength(questionCount);
    expect(second).toEqual(first);
  });

  it('creates no question for a topic already covered by current approved knowledge', () => {
    const { service } = serviceHarness();
    approveCandidate(service, createCandidate(service, 'urgency-and-emergency'));
    successful(service.generateInterviewQuestions());
    expect(
      service
        .getSnapshot()
        .interviewQuestions.some(({ topicKey }) => topicKey === 'urgency-and-emergency'),
    ).toBe(false);
  });

  it('requires a skip reason and leaves the underlying gap unresolved', () => {
    const { service } = serviceHarness();
    const [question] = successful(service.generateInterviewQuestions());
    if (question === undefined) throw new Error('Expected question.');
    failedWith(service.skipInterviewQuestion(question.id, ''), 'validation-error');
    const skipped = successful(
      service.skipInterviewQuestion(question.id, 'Owner will return later.'),
    );
    expect(skipped).toMatchObject({ status: 'skipped', skippedReason: 'Owner will return later.' });
    expect(
      service.getSnapshot().knowledgeGaps.find(({ id }) => id === question.gapId)?.status,
    ).not.toBe('resolved');
  });

  it('validates required and structured answers', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    failedWith(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: ' ',
        structuredValue: true,
      }),
      'validation-error',
    );
    failedWith(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'Yes',
      }),
      'validation-error',
    );
  });

  it('retains the exact answer and creates exact interview provenance plus an unapproved claim', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    const exactAnswer = 'No — all discounts require prior owner approval.';
    const answer = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: ' Fictional owner ',
        answer: exactAnswer,
        structuredValue: false,
      }),
    );
    const snapshot = service.getSnapshot();
    const source = snapshot.sourceReferences.find(({ id }) => id === answer.sourceReferenceId);
    const claim = snapshot.knowledgeClaims.find(({ id }) => id === answer.generatedClaimId);

    expect(answer).toMatchObject({ answer: exactAnswer, actorLabel: 'Fictional owner' });
    expect(source).toMatchObject({
      sourceType: 'owner-interview',
      excerpt: exactAnswer,
      sourceLocator: `Owner interview question ${question.id}; answer ${answer.id}`,
    });
    expect(claim).toMatchObject({
      statement: exactAnswer,
      topicKey: 'discounts',
      provenance: 'owner-interview-derived',
      lifecycleStatus: 'proposed',
      sourceReferenceIds: [source?.id],
    });
    expect(service.selectEmployeeVisibleKnowledge()).toHaveLength(0);
  });

  it('creates explicit discount follow-ups only for a yes answer', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'Yes',
        structuredValue: true,
      }),
    );
    const followUps = service
      .getSnapshot()
      .interviewQuestions.filter(
        ({ gapId, templateKey }) =>
          gapId === question.gapId &&
          (templateKey === 'discounts-limit' || templateKey === 'discounts-approval-required'),
      );

    expect(followUps).toHaveLength(2);
    expect(followUps.find(({ templateKey }) => templateKey === 'discounts-limit')).toMatchObject({
      answerType: 'numeric-limit',
      status: 'active',
    });
  });

  it.each([
    ['after-hours', 'after-hours-primary', ['after-hours-qualifies', 'after-hours-destination']],
    ['urgency-and-emergency', 'emergency-primary', ['emergency-conditions', 'emergency-context']],
    ['refunds', 'refunds-primary', ['refunds-authorizer', 'refunds-limit']],
    ['permits-and-approvals', 'permits-primary', ['permits-information', 'permits-destination']],
  ] as const)('uses explicit follow-up rules for %s', (topicKey, primaryKey, expectedKeys) => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, topicKey);
    expect(question.templateKey).toBe(primaryKey);
    successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'Yes',
        structuredValue: true,
      }),
    );
    const keys = service
      .getSnapshot()
      .interviewQuestions.filter(({ gapId }) => gapId === question.gapId)
      .map(({ templateKey }) => templateKey);
    expect(keys).toEqual(expect.arrayContaining([...expectedKeys]));
  });

  it('does not edit an answered question in place and appends a corrected answer and candidate', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    const original = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'No',
        structuredValue: false,
      }),
    );
    failedWith(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'Yes',
        structuredValue: true,
      }),
      'invalid-transition',
    );
    const correction = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'Yes',
        structuredValue: true,
        correctsAnswerId: original.id,
      }),
    );

    expect(service.getSnapshot().interviewAnswers).toHaveLength(2);
    expect(service.getSnapshot().interviewAnswers[0]).toEqual(original);
    expect(correction.correctsAnswerId).toBe(original.id);
    expect(correction.generatedClaimId).not.toBe(original.generatedClaimId);
  });

  it('keeps a rejected interview proposal and its gap history unresolved', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    const answer = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'No discounts are delegated.',
        structuredValue: false,
      }),
    );
    successful(
      service.rejectKnowledgeClaim({
        claimId: answer.generatedClaimId,
        actorLabel: 'Owner',
        reason: 'The answer needs corrected wording.',
      }),
    );

    expect(service.getSnapshot().interviewAnswers).toContainEqual(answer);
    expect(
      service.getSnapshot().knowledgeGaps.find(({ id }) => id === question.gapId)?.status,
    ).not.toBe('resolved');
  });

  it('resolves the related gap only after the existing approval operation succeeds', () => {
    const { service } = serviceHarness();
    const question = advanceToTopic(service, 'discounts');
    const answer = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'All discounts require owner approval.',
        structuredValue: false,
      }),
    );
    expect(
      service.getSnapshot().knowledgeGaps.find(({ id }) => id === question.gapId)?.status,
    ).toBe('proposal-created');

    successful(
      service.approveKnowledgeClaim({
        claimId: answer.generatedClaimId,
        actorLabel: 'Owner',
        reason: 'This exact interview answer is the approved company rule.',
      }),
    );
    const gap = service.getSnapshot().knowledgeGaps.find(({ id }) => id === question.gapId);
    expect(gap).toMatchObject({
      status: 'resolved',
      resolvedByClaimId: answer.generatedClaimId,
    });
    expect(service.selectEmployeeVisibleKnowledge().map(({ claim }) => claim.id)).toEqual([
      answer.generatedClaimId,
    ]);
  });
});

describe('Phase 2 repository behavior', () => {
  it('defensively copies nested source and interview records', () => {
    const { repository, service } = serviceHarness();
    createAvailableDocument(service);
    const question = advanceToTopic(service, 'discounts');
    const answer: InterviewAnswer = successful(
      service.submitInterviewAnswer({
        questionId: question.id,
        actorLabel: 'Owner',
        answer: 'No',
        structuredValue: false,
      }),
    );
    const read = repository.readSnapshot();
    (read.sourceDocuments[0] as { content: string }).content = 'Mutated caller copy';
    (read.interviewAnswers[0] as { answer: string }).answer = 'Mutated answer copy';

    expect(repository.readSnapshot().sourceDocuments[0]?.content).not.toBe('Mutated caller copy');
    expect(repository.readSnapshot().interviewAnswers[0]).toEqual(answer);
  });
});
