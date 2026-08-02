import { describe, expect, it } from 'vitest';

import type { PhaseOneSnapshot } from '../domain';
import { createSummitComfortDemoSnapshot } from '../demo';
import { InMemoryPhaseOneRepository } from './inMemoryPhaseOneRepository';

const emptySnapshot = (): PhaseOneSnapshot => ({
  company: null,
  role: null,
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
});

describe('InMemoryPhaseOneRepository', () => {
  it('starts empty and replaces the complete snapshot atomically', () => {
    const repository = new InMemoryPhaseOneRepository();
    const replacement = emptySnapshot();

    repository.replaceSnapshot(replacement);

    expect(repository.readSnapshot()).toEqual(replacement);
  });

  it('defensively copies snapshots on writes and reads', () => {
    const initial = createSummitComfortDemoSnapshot();
    const expectedSourceReferenceCount = initial.sourceReferences.length;
    const repository = new InMemoryPhaseOneRepository(initial);

    (initial.sourceReferences as unknown as { id: string }[]).length = 0;
    const firstRead = repository.readSnapshot();
    (firstRead.company as { name: string }).name = 'Mutated outside the repository';
    (firstRead.role?.responsibilities as unknown as { title: string }[])[0]!.title =
      'Mutated outside the repository';

    const secondRead = repository.readSnapshot();

    expect(secondRead.sourceReferences).toHaveLength(expectedSourceReferenceCount);
    expect(secondRead.company?.name).toBe('Summit Comfort Heating & Air');
    expect(secondRead.role?.responsibilities[0]?.title).toBe('Maintain the dispatch schedule');
  });

  it('defensively copies nested Phase 3 records on writes and reads', () => {
    const replacement = createSummitComfortDemoSnapshot();
    const expectedStructuredContext = {
      ...replacement.employeeQuestions[0]!.structuredContext,
    };
    const expectedSupportingRecordIds = [
      ...replacement.answerEligibilityEvaluations[0]!.gateResults[0]!.supportingRecordIds,
    ];
    const expectedRequiredContext = replacement.escalations[0]!.requiredContext.map((item) => ({
      ...item,
    }));
    const expectedMetadata = { ...replacement.activityEvents[0]!.metadata };
    const repository = new InMemoryPhaseOneRepository();

    repository.replaceSnapshot(replacement);

    (
      replacement.employeeQuestions[0]!.structuredContext as {
        requestType: string;
      }
    ).requestType = 'mutated-on-write';
    (
      replacement.answerEligibilityEvaluations[0]!.gateResults[0]!.supportingRecordIds as string[]
    ).push('mutated-on-write');
    (
      replacement.escalations[0]!.requiredContext[0] as {
        value: string;
      }
    ).value = 'Mutated on write';
    (
      replacement.activityEvents[0]!.metadata as Record<string, string | number | boolean>
    ).mutatedOnWrite = true;

    const firstRead = repository.readSnapshot();

    expect(firstRead.employeeQuestions[0]!.structuredContext).toEqual(expectedStructuredContext);
    expect(firstRead.answerEligibilityEvaluations[0]!.gateResults[0]!.supportingRecordIds).toEqual(
      expectedSupportingRecordIds,
    );
    expect(firstRead.escalations[0]!.requiredContext).toEqual(expectedRequiredContext);
    expect(firstRead.activityEvents[0]!.metadata).toEqual(expectedMetadata);

    (
      firstRead.employeeQuestions[0]!.structuredContext as {
        requestType: string;
      }
    ).requestType = 'mutated-on-read';
    (
      firstRead.answerEligibilityEvaluations[0]!.gateResults[0]!.supportingRecordIds as string[]
    ).push('mutated-on-read');
    (
      firstRead.escalations[0]!.requiredContext[0] as {
        value: string;
      }
    ).value = 'Mutated on read';
    (
      firstRead.activityEvents[0]!.metadata as Record<string, string | number | boolean>
    ).mutatedOnRead = true;

    const secondRead = repository.readSnapshot();

    expect(secondRead.employeeQuestions[0]!.structuredContext).toEqual(expectedStructuredContext);
    expect(secondRead.answerEligibilityEvaluations[0]!.gateResults[0]!.supportingRecordIds).toEqual(
      expectedSupportingRecordIds,
    );
    expect(secondRead.escalations[0]!.requiredContext).toEqual(expectedRequiredContext);
    expect(secondRead.activityEvents[0]!.metadata).toEqual(expectedMetadata);
  });
});
