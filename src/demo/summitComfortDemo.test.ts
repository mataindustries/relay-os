import { describe, expect, it } from 'vitest';

import { PhaseOneService, evaluateTopicCoverage } from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { createSummitComfortDemoSnapshot, loadSummitComfortDemo } from './summitComfortDemo';

describe('Summit Comfort demonstration record', () => {
  it('contains the fixed fictional Phase 1 and Phase 2 lifecycle examples', () => {
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
    expect(snapshot.role?.authorityBoundaries).toHaveLength(2);
    expect(snapshot.role?.escalationRules).toHaveLength(2);
    expect(snapshot.sourceDocuments).toHaveLength(4);
    expect(snapshot.sourceDocuments.map(({ status }) => status)).toEqual([
      'superseded',
      'available',
      'available',
      'available',
    ]);
    expect(snapshot.sourceReferences).toHaveLength(12);
    expect(snapshot.knowledgeClaims.map(({ lifecycleStatus }) => lifecycleStatus)).toEqual([
      'approved',
      'proposed',
      'rejected',
      'conflicting-information',
      'proposed',
    ]);
    expect(snapshot.approvalDecisions.map(({ decision }) => decision)).toEqual([
      'approve',
      'reject',
    ]);
    expect(snapshot.knowledgeGaps).toHaveLength(15);
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
      'technician-late-or-absent': 'candidate',
      'rescheduling-and-cancellation': 'conflicting',
      'after-hours': 'candidate',
      payments: 'missing',
    });
  });

  it('loads through domain validation and remains idempotent when selected repeatedly', () => {
    const repository = new InMemoryPhaseOneRepository();
    const service = new PhaseOneService(repository);

    expect(loadSummitComfortDemo(service).ok).toBe(true);
    const firstLoad = repository.readSnapshot();
    expect(loadSummitComfortDemo(service).ok).toBe(true);
    const secondLoad = repository.readSnapshot();

    expect(secondLoad).toEqual(firstLoad);
    expect(secondLoad.role?.responsibilities).toHaveLength(3);
    expect(secondLoad.sourceDocuments).toHaveLength(4);
    expect(secondLoad.sourceReferences).toHaveLength(12);
    expect(secondLoad.knowledgeClaims).toHaveLength(5);
    expect(secondLoad.approvalDecisions).toHaveLength(2);
    expect(secondLoad.knowledgeGaps).toHaveLength(15);
    expect(secondLoad.interviewQuestions).toHaveLength(15);
    expect(secondLoad.interviewAnswers).toHaveLength(1);
  });
});
