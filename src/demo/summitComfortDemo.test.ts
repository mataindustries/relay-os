import { describe, expect, it } from 'vitest';

import { PhaseOneService } from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { createSummitComfortDemoSnapshot, loadSummitComfortDemo } from './summitComfortDemo';

describe('Summit Comfort demonstration record', () => {
  it('contains the fixed fictional Phase 1 record and required lifecycle examples', () => {
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
    expect(snapshot.sourceReferences).toHaveLength(5);
    expect(snapshot.knowledgeClaims.map(({ lifecycleStatus }) => lifecycleStatus)).toEqual([
      'approved',
      'proposed',
      'rejected',
      'conflicting-information',
    ]);
    expect(snapshot.approvalDecisions.map(({ decision }) => decision)).toEqual([
      'approve',
      'reject',
    ]);
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
    expect(secondLoad.sourceReferences).toHaveLength(5);
    expect(secondLoad.knowledgeClaims).toHaveLength(4);
    expect(secondLoad.approvalDecisions).toHaveLength(2);
  });
});
