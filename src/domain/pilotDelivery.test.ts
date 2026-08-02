import { describe, expect, it } from 'vitest';

import { createSummitComfortDemoSnapshot } from '../demo';
import {
  PILOT_HANDOFF_SCHEMA_VERSION,
  createPilotHandoffPackage,
  derivePilotDemoCounts,
  deriveRoleTransferPriorities,
  groupApprovedGuidance,
  pilotHandoffFilename,
  serializePilotHandoffPackage,
} from './pilotDelivery';

const EXPORTED_AT = '2026-08-02T12:00:00.000Z';

describe('Phase 4 pilot delivery projections', () => {
  it('derives demo counts from actual snapshot collections', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const result = derivePilotDemoCounts(snapshot);

    expect(result.ok).toBe(true);
    if (!result.ok) throw result.error;
    expect(result.value).toMatchObject({
      responsibilities: snapshot.role?.responsibilities.length,
      authorityBoundaries: snapshot.role?.authorityBoundaries.length,
      sourceDocuments: snapshot.sourceDocuments.length,
      approvedKnowledge: 6,
      coverageTopics: 16,
      employeeQuestions: 16,
      answers: 16,
      escalations: 10,
      approvalDecisions: 7,
      activityEvents: 63,
    });
  });

  it('groups only current employee-visible approved guidance', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const groups = groupApprovedGuidance(snapshot);
    const statements = groups.flatMap(({ items }) => items.map(({ claim }) => claim.statement));

    expect(statements).toContain(
      'A dispatcher may approve a service-recovery discount up to USD 100; a larger discount requires owner approval.',
    );
    expect(statements).not.toContain(
      'A dispatcher may promise a 15% service-recovery discount without approval.',
    );
    expect(statements).not.toContain('The fee for a cancellation inside 24 hours is $79.');
    expect(statements).not.toContain('No after-hours service is offered.');
    expect(
      groups
        .flatMap(({ items }) => items)
        .every(({ claim }) => claim.lifecycleStatus === 'approved'),
    ).toBe(true);
  });

  it('derives priorities only from active critical/high gaps and unresolved escalations', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const priorities = deriveRoleTransferPriorities(snapshot);

    expect(priorities.length).toBeGreaterThan(0);
    expect(priorities).toContainEqual(
      expect.objectContaining({
        source: 'knowledge-gap',
        title: 'Resolve the Refunds knowledge gap',
      }),
    );
    expect(priorities).toContainEqual(
      expect.objectContaining({
        source: 'escalation',
        title: expect.stringContaining('escalation'),
      }),
    );
    for (const priority of priorities.filter(({ source }) => source === 'knowledge-gap')) {
      expect(['critical', 'high']).toContain(priority.riskTier);
    }
  });
});

describe('pilot handoff export', () => {
  it('uses a versioned deterministic structure and approved-only knowledge', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const first = createPilotHandoffPackage(snapshot, { exportedAt: EXPORTED_AT });
    const second = createPilotHandoffPackage(snapshot, { exportedAt: EXPORTED_AT });

    expect(first.ok).toBe(true);
    expect(second).toEqual(first);
    if (!first.ok) throw first.error;
    expect(first.value.schemaVersion).toBe(PILOT_HANDOFF_SCHEMA_VERSION);
    expect(first.value.exportedAt).toBe(EXPORTED_AT);
    expect(first.value.company?.name).toBe('Summit Comfort Heating & Air');
    expect(first.value.responsibilities).toHaveLength(3);
    expect(first.value.coverageStates).toHaveLength(16);
    expect(first.value.questions).toHaveLength(16);
    expect(first.value.answers).toHaveLength(16);
    expect(
      first.value.approvedKnowledge.every(({ claim }) => claim.lifecycleStatus === 'approved'),
    ).toBe(true);
    expect(
      first.value.approvedKnowledge.some(
        ({ claim }) => claim.id === 'demo-claim-discount-authority',
      ),
    ).toBe(false);
  });

  it('excludes raw source, question, context, and escalation-resolution fields by default', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const result = createPilotHandoffPackage(snapshot, { exportedAt: EXPORTED_AT });

    expect(result.ok).toBe(true);
    if (!result.ok) throw result.error;
    expect(result.value.sourceMetadata.includesSourceText).toBe(false);
    for (const document of result.value.sourceMetadata.documents) {
      expect(document).not.toHaveProperty('content');
      expect(document).not.toHaveProperty('lines');
    }
    for (const reference of result.value.sourceMetadata.references) {
      expect(reference).not.toHaveProperty('excerpt');
    }
    for (const question of result.value.questions) {
      expect(question).not.toHaveProperty('questionText');
      expect(question).not.toHaveProperty('structuredContext');
      expect(question).not.toHaveProperty('employeeLabel');
    }
    for (const escalation of result.value.escalations) {
      expect(escalation).not.toHaveProperty('resolutionSummary');
      expect(escalation).not.toHaveProperty('resolvedByLabel');
      expect(escalation).not.toHaveProperty('requiredContext');
    }
    expect(serializePilotHandoffPackage(result.value)).not.toContain(
      'The fictional owner handled this one request; the resolution is not company policy.',
    );
  });

  it('includes source text only through the explicit option', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const result = createPilotHandoffPackage(snapshot, {
      exportedAt: EXPORTED_AT,
      includeSourceText: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw result.error;
    expect(result.value.sourceMetadata.includesSourceText).toBe(true);
    expect(result.value.sourceMetadata.documents[0]).toHaveProperty('content');
    expect(result.value.sourceMetadata.documents[0]).toHaveProperty('lines');
    expect(result.value.sourceMetadata.references.some((reference) => 'excerpt' in reference)).toBe(
      true,
    );
  });

  it('does not mutate the session snapshot', () => {
    const snapshot = createSummitComfortDemoSnapshot();
    const before = JSON.stringify(snapshot);

    expect(createPilotHandoffPackage(snapshot, { exportedAt: EXPORTED_AT }).ok).toBe(true);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it('rejects an invalid application timestamp', () => {
    const result = createPilotHandoffPackage(createSummitComfortDemoSnapshot(), {
      exportedAt: 'not-a-date',
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected invalid export time to fail.');
    expect(result.error.code).toBe('validation-error');
  });

  it('creates a safe company-derived filename', () => {
    expect(pilotHandoffFilename('Summit Comfort Heating & Air')).toBe(
      'summit-comfort-heating-air-relayos-pilot-handoff.json',
    );
    expect(pilotHandoffFilename('../../ Secrets & Co.')).toBe(
      'secrets-co-relayos-pilot-handoff.json',
    );
    expect(pilotHandoffFilename('')).toBe('company-relayos-pilot-handoff.json');
  });
});
