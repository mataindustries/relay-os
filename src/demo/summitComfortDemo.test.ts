import { describe, expect, it } from 'vitest';

import { ANSWER_ELIGIBILITY_GATE_ORDER, PhaseOneService, evaluateTopicCoverage } from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import {
  createSummitComfortDemoSnapshot,
  loadSummitComfortDemo,
  resetSummitComfortDemo,
} from './summitComfortDemo';

const ORIGINAL_SOURCE_IDS = [
  'demo-source-safety-note',
  'demo-source-customer-update-note',
  'demo-source-discount-note',
  'demo-source-fee-note-a',
  'demo-source-fee-note-b',
  'demo-source-job-v1-anchor',
  'demo-source-job-v2-anchor',
  'demo-source-checklist-late-anchor',
  'demo-source-policy-safety-anchor',
  'demo-source-policy-discount-anchor',
  'demo-source-policy-fee-anchor',
  'demo-source-interview-after-hours',
] as const;

const EXPECTED_DEMO_RESULTS = [
  'answer-eligible',
  'answer-eligible',
  'answer-eligible',
  'escalation-required',
  'escalation-required',
  'escalation-required',
  'prohibited',
  'withheld-missing-knowledge',
  'withheld-conflicting-knowledge',
  'withheld-sensitive',
  'withheld-authority-unclear',
  'escalation-required',
  'answer-eligible',
  'escalation-required',
  'answer-eligible',
  'escalation-required',
] as const;

describe('Summit Comfort demonstration record', () => {
  it('preserves every fixed fictional Phase 1 and Phase 2 record while adding structured bindings', () => {
    const snapshot = createSummitComfortDemoSnapshot();

    expect(snapshot.company).toMatchObject({
      id: 'demo-company-summit-comfort',
      name: 'Summit Comfort Heating & Air',
      industry: expect.stringContaining('fictional'),
    });
    expect(snapshot.role).toMatchObject({
      title: 'Home-Service Office Manager / Dispatcher',
      status: 'active',
    });
    expect(snapshot.role?.responsibilities).toHaveLength(3);
    expect(snapshot.role?.authorityBoundaries.map(({ id }) => id)).toEqual([
      'demo-boundary-schedule-adjustments',
      'demo-boundary-discounts',
      'demo-boundary-phase-four-discount-limit',
      'demo-boundary-phase-three-scheduling-decision',
      'demo-boundary-phase-three-payment-limit',
      'demo-boundary-phase-three-complaint-escalation',
      'demo-boundary-phase-three-refund-prohibited',
      'demo-boundary-phase-four-late-commitment',
    ]);
    expect(snapshot.role?.escalationRules.map(({ id }) => id)).toEqual([
      'demo-escalation-safety-hazard',
      'demo-escalation-capacity',
      'demo-escalation-phase-three-sensitive-payment-data',
    ]);
    expect(snapshot.role?.authorityBoundaries[0]?.topicKeys).toBeUndefined();
    expect(
      snapshot.role?.authorityBoundaries.find(
        ({ id }) => id === 'demo-boundary-phase-three-payment-limit',
      ),
    ).toMatchObject({
      permissionLevel: 'may-act-within-limit',
      numericLimit: 100,
      currency: 'USD',
      structuredConstraintType: 'amount-limit',
    });

    expect(snapshot.sourceDocuments).toHaveLength(4);
    expect(snapshot.sourceDocuments.map(({ status }) => status)).toEqual([
      'superseded',
      'available',
      'available',
      'available',
    ]);
    expect(snapshot.sourceReferences.map(({ id }) => id).slice(0, 12)).toEqual(ORIGINAL_SOURCE_IDS);
    expect(
      snapshot.knowledgeClaims.slice(0, 5).map(({ lifecycleStatus }) => lifecycleStatus),
    ).toEqual(['approved', 'approved', 'rejected', 'conflicting-information', 'proposed']);
    expect(snapshot.approvalDecisions.slice(0, 2).map(({ decision }) => decision)).toEqual([
      'approve',
      'reject',
    ]);
    expect(snapshot.knowledgeGaps.filter(({ id }) => id.startsWith('demo-gap-'))).toHaveLength(15);
    expect(snapshot.interviewQuestions).toHaveLength(15);
    expect(snapshot.interviewQuestions.filter(({ status }) => status === 'active')).toHaveLength(1);
    expect(snapshot.interviewAnswers).toHaveLength(1);

    const coverage = evaluateTopicCoverage(snapshot);
    expect(coverage.ok).toBe(true);
    if (!coverage.ok) throw coverage.error;
    expect(
      Object.fromEntries(coverage.value.map(({ topic, state }) => [topic.key, state])),
    ).toMatchObject({
      'urgency-and-emergency': 'approved',
      scheduling: 'approved',
      payments: 'approved',
      'pricing-and-estimates': 'approved',
      'technician-late-or-absent': 'approved',
      discounts: 'approved',
      'rescheduling-and-cancellation': 'conflicting',
      'after-hours': 'candidate',
    });
  });

  it('preserves all twelve Phase 3 examples and adds four pilot scenarios with complete gate traces', () => {
    const snapshot = createSummitComfortDemoSnapshot();

    expect(snapshot.employeeQuestions).toHaveLength(16);
    expect(snapshot.answerEligibilityEvaluations).toHaveLength(16);
    expect(snapshot.answers).toHaveLength(16);
    expect(snapshot.answerEligibilityEvaluations.map(({ overallResult }) => overallResult)).toEqual(
      EXPECTED_DEMO_RESULTS,
    );
    for (const evaluation of snapshot.answerEligibilityEvaluations) {
      expect(evaluation.gateResults.map(({ gateKey }) => gateKey)).toEqual(
        ANSWER_ELIGIBILITY_GATE_ORDER,
      );
      expect(evaluation.gateResults).toHaveLength(10);
    }

    expect(snapshot.answers.map(({ status }) => status)).toEqual([
      'delivered',
      'delivered',
      'delivered',
      'escalated',
      'escalated',
      'escalated',
      'prohibited',
      'escalated',
      'escalated',
      'escalated',
      'escalated',
      'escalated',
      'delivered',
      'escalated',
      'delivered',
      'escalated',
    ]);
    expect(snapshot.answers.map(({ answerMode }) => answerMode)).toEqual([
      'approved-guidance',
      'approved-guidance-with-authority',
      'approved-guidance-with-authority',
      'known-escalation',
      'known-escalation',
      'known-escalation',
      'prohibited-action',
      'withheld',
      'withheld',
      'withheld',
      'withheld',
      'known-escalation',
      'approved-guidance-with-authority',
      'known-escalation',
      'approved-guidance',
      'known-escalation',
    ]);

    expect(snapshot.answers[0]).toMatchObject({
      citedClaimIds: ['demo-claim-safety-escalation'],
      citedSourceReferenceIds: ['demo-source-policy-safety-anchor'],
      citedApprovalDecisionIds: ['demo-decision-approve-safety'],
    });
    expect(snapshot.answers[0]?.responseText).toContain('informational guidance only');
    expect(snapshot.answers[1]).toMatchObject({
      citedClaimIds: ['demo-claim-phase-three-scheduling-guidance'],
      citedAuthorityBoundaryIds: ['demo-boundary-phase-three-scheduling-decision'],
    });
    expect(snapshot.answers[2]).toMatchObject({
      citedClaimIds: ['demo-claim-phase-three-payment-limit'],
      citedAuthorityBoundaryIds: ['demo-boundary-phase-three-payment-limit'],
    });
    expect(snapshot.answers[6]).toMatchObject({
      status: 'prohibited',
      citedClaimIds: [],
      citedAuthorityBoundaryIds: ['demo-boundary-phase-three-refund-prohibited'],
    });
    expect(snapshot.answers[12]).toMatchObject({
      status: 'delivered',
      citedClaimIds: ['demo-claim-phase-four-discount-limit'],
      citedSourceReferenceIds: ['demo-source-policy-discount-anchor'],
      citedApprovalDecisionIds: ['demo-decision-phase-four-discount-limit'],
      citedAuthorityBoundaryIds: ['demo-boundary-phase-four-discount-limit'],
    });
    expect(snapshot.answers[13]).toMatchObject({
      status: 'escalated',
      citedAuthorityBoundaryIds: ['demo-boundary-phase-four-discount-limit'],
    });
    expect(snapshot.answers[14]).toMatchObject({
      status: 'delivered',
      citedClaimIds: ['demo-claim-late-customer-update'],
      citedSourceReferenceIds: ['demo-source-checklist-late-anchor'],
      citedApprovalDecisionIds: ['demo-decision-approve-late-customer-update'],
    });
    expect(snapshot.answers[15]).toMatchObject({
      status: 'escalated',
      citedAuthorityBoundaryIds: ['demo-boundary-phase-four-late-commitment'],
    });

    snapshot.employeeQuestions.forEach((question, index) => {
      const evaluation = snapshot.answerEligibilityEvaluations[index];
      const answer = snapshot.answers[index];
      expect(evaluation?.questionId).toBe(question.id);
      expect(answer?.questionId).toBe(question.id);
      expect(evaluation?.correlationId).toBe(question.correlationId);
      expect(answer?.correlationId).toBe(question.correlationId);
    });
  });

  it('links only genuine deficiencies and creates no fake gap for known policy outcomes', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const questions = snapshot.employeeQuestions;
    const evaluations = snapshot.answerEligibilityEvaluations;
    const escalationsByQuestion = new Map(
      snapshot.escalations.map((escalation) => [escalation.questionId, escalation]),
    );

    const missingGap = snapshot.knowledgeGaps.find(({ id }) => id === 'demo-gap-lead-intake');
    expect(missingGap).toMatchObject({
      reason: 'missing-evidence',
      originalReason: 'missing-evidence',
      triggeringQuestionIds: [questions[7]?.id],
      eligibilityEvaluationIds: [evaluations[7]?.id],
    });

    const conflictGap = snapshot.knowledgeGaps.find(
      ({ topicKey, status }) => topicKey === 'pricing-and-estimates' && status === 'open',
    );
    expect(conflictGap).toMatchObject({
      reason: 'conflicting-evidence',
      originalReason: 'conflicting-evidence',
      triggeringQuestionIds: [questions[8]?.id],
      eligibilityEvaluationIds: [evaluations[8]?.id],
    });

    const authorityGap = snapshot.knowledgeGaps.find(
      ({ topicKey, status }) => topicKey === 'urgency-and-emergency' && status === 'open',
    );
    expect(authorityGap).toMatchObject({
      reason: 'authority-unclear',
      originalReason: 'authority-unclear',
      triggeringQuestionIds: [questions[10]?.id],
      eligibilityEvaluationIds: [evaluations[10]?.id],
    });

    expect(escalationsByQuestion.get(questions[7]!.id)?.relatedGapId).toBe(missingGap?.id);
    expect(escalationsByQuestion.get(questions[8]!.id)?.relatedGapId).toBe(conflictGap?.id);
    expect(escalationsByQuestion.get(questions[10]!.id)?.relatedGapId).toBe(authorityGap?.id);

    for (const index of [3, 4, 5, 9, 11, 13, 15]) {
      expect(escalationsByQuestion.get(questions[index]!.id)?.relatedGapId).toBeUndefined();
      expect(
        snapshot.knowledgeGaps.some((gap) =>
          gap.triggeringQuestionIds?.includes(questions[index]!.id),
        ),
      ).toBe(false);
    }
    expect(escalationsByQuestion.has(questions[6]!.id)).toBe(false);
    expect(snapshot.escalations).toHaveLength(10);
    expect(snapshot.knowledgeGaps).toHaveLength(17);
  });

  it('retains a resolved escalation and safe append-only trace without creating policy', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const resolvedQuestion = snapshot.employeeQuestions[11]!;
    const resolved = snapshot.escalations.find(
      ({ questionId }) => questionId === resolvedQuestion.id,
    );

    expect(resolved).toMatchObject({
      status: 'resolved',
      reason: 'emergency',
      destination: 'Emergency services when appropriate, then the on-call owner',
      assignedToLabel: 'Fictional on-call owner',
      resolvedByLabel: 'Fictional on-call owner',
    });
    expect(resolved?.relatedGapId).toBeUndefined();
    expect(resolved?.resolutionSummary).toContain('not company policy');
    expect(snapshot.knowledgeClaims).toHaveLength(10);
    expect(snapshot.approvalDecisions).toHaveLength(7);
    expect(snapshot.activityEvents).toHaveLength(63);

    const trace = snapshot.activityEvents.filter(
      ({ correlationId }) => correlationId === resolvedQuestion.correlationId,
    );
    expect(trace.map(({ eventType }) => eventType)).toEqual([
      'question-received',
      'question-evaluated',
      'answer-withheld',
      'escalation-opened',
      'escalation-assigned',
      'escalation-resolved',
    ]);
    expect(
      snapshot.activityEvents.every((event) =>
        snapshot.employeeQuestions.every(
          (question) => !JSON.stringify(event.metadata).includes(question.questionText),
        ),
      ),
    ).toBe(true);
  });

  it('loads through domain validation and remains deterministic and idempotent', () => {
    const firstCreated = createSummitComfortDemoSnapshot();
    expect(createSummitComfortDemoSnapshot()).toEqual(firstCreated);

    const repository = new InMemoryPhaseOneRepository();
    const service = new PhaseOneService(repository);
    expect(loadSummitComfortDemo(service).ok).toBe(true);
    const firstLoad = repository.readSnapshot();
    expect(loadSummitComfortDemo(service).ok).toBe(true);
    const secondLoad = repository.readSnapshot();

    expect(secondLoad).toEqual(firstLoad);
    expect(secondLoad).toEqual(firstCreated);
    expect(secondLoad.sourceDocuments).toHaveLength(4);
    expect(secondLoad.sourceReferences).toHaveLength(16);
    expect(secondLoad.knowledgeClaims).toHaveLength(10);
    expect(secondLoad.approvalDecisions).toHaveLength(7);
    expect(secondLoad.interviewQuestions).toHaveLength(15);
    expect(secondLoad.interviewAnswers).toHaveLength(1);
    expect(secondLoad.employeeQuestions).toHaveLength(16);
    expect(secondLoad.answerEligibilityEvaluations).toHaveLength(16);
    expect(secondLoad.answers).toHaveLength(16);
    expect(secondLoad.escalations).toHaveLength(10);
    expect(secondLoad.activityEvents).toHaveLength(63);
  });

  it('resets only an active fictional fixture and remains idempotent', () => {
    const repository = new InMemoryPhaseOneRepository();
    const service = new PhaseOneService(repository);
    expect(loadSummitComfortDemo(service).ok).toBe(true);
    const original = service.getSnapshot();
    const openEscalation = original.escalations.find(({ status }) => status === 'open');
    expect(openEscalation).toBeDefined();
    expect(service.assignEscalation(openEscalation!.id, 'Changed fictional assignee').ok).toBe(
      true,
    );

    expect(resetSummitComfortDemo(service).ok).toBe(true);
    expect(service.getSnapshot()).toEqual(original);
    expect(resetSummitComfortDemo(service).ok).toBe(true);
    expect(service.getSnapshot()).toEqual(original);

    const nonDemo = new PhaseOneService(new InMemoryPhaseOneRepository());
    expect(
      nonDemo.activateSetup({
        company: {
          name: 'Private session company',
          industry: 'Home services',
          serviceArea: 'Local area',
          phone: '555-0100',
          email: 'owner@example.com',
          operatingTimezone: 'America/Denver',
        },
        role: {
          title: 'Home-Service Office Manager / Dispatcher',
          mission: 'Coordinate safe and accurate service operations.',
          status: 'active',
          responsibilities: [
            {
              title: 'Maintain the schedule',
              expectedOutcome: 'Every accepted call has an accurate assignment.',
              frequency: 'Daily',
              completionEvidence: 'Current dispatch board',
              status: 'active',
            },
          ],
          authorityBoundaries: [
            {
              subject: 'Schedule changes',
              permissionLevel: 'must-request-approval',
              limitOrConstraint: 'Owner approval is required.',
              escalationDestination: 'Owner',
              notes: 'No automatic authority.',
            },
          ],
          escalationRules: [
            {
              trigger: 'An exception requires owner judgment.',
              destination: 'Owner',
              urgency: 'same-day',
              requiredContext: 'Topic and requested decision',
              expectedResponse: 'Owner records the one-time decision.',
            },
          ],
        },
      }).ok,
    ).toBe(true);
    const privateSnapshot = nonDemo.getSnapshot();
    expect(resetSummitComfortDemo(nonDemo).ok).toBe(false);
    expect(nonDemo.getSnapshot()).toEqual(privateSnapshot);
  });
});
