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
    const repository = new InMemoryPhaseOneRepository(initial);

    (initial.sourceReferences as unknown as { id: string }[]).length = 0;
    const firstRead = repository.readSnapshot();
    (firstRead.company as { name: string }).name = 'Mutated outside the repository';
    (firstRead.role?.responsibilities as unknown as { title: string }[])[0]!.title =
      'Mutated outside the repository';

    const secondRead = repository.readSnapshot();

    expect(secondRead.sourceReferences).toHaveLength(12);
    expect(secondRead.company?.name).toBe('Summit Comfort Heating & Air');
    expect(secondRead.role?.responsibilities[0]?.title).toBe('Maintain the dispatch schedule');
  });
});
