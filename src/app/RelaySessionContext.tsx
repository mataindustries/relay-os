import { useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  PhaseOneService,
  selectEmployeeVisibleKnowledge,
  type ApprovedClaimRevisionInput,
  type ClaimDecisionInput,
  type DomainResult,
  type KnowledgeClaimInput,
  type SourceReferenceInput,
} from '../domain';
import { loadSummitComfortDemo, SUMMIT_COMFORT_DEMO_COMPANY_ID } from '../demo';
import type { SetupActionResult } from '../features/setup/SetupPage';
import { createInitialSetupDraft, type SetupDraft } from '../features/setup/setupDraft';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { RelaySessionContext, type RelaySessionValue } from './relaySessionContext';

export interface RelaySessionProviderProps {
  readonly children: ReactNode;
  readonly service?: PhaseOneService | undefined;
}

export function RelaySessionProvider({
  children,
  service: suppliedService,
}: RelaySessionProviderProps) {
  const [service] = useState(
    () => suppliedService ?? new PhaseOneService(new InMemoryPhaseOneRepository()),
  );
  const [snapshot, setSnapshot] = useState(() => service.getSnapshot());
  const [setupDraft, setSetupDraft] = useState(createInitialSetupDraft);

  const perform = useCallback(
    <T,>(operation: () => DomainResult<T>): DomainResult<T> => {
      const result = operation();
      if (result.ok) setSnapshot(service.getSnapshot());
      return result;
    },
    [service],
  );

  const completeSetup = useCallback(
    (draft: SetupDraft): SetupActionResult => {
      const result = perform(() =>
        service.activateSetup({
          company: draft.company,
          role: {
            ...draft.role,
            responsibilities: draft.responsibilities.map((item) => ({
              title: item.title,
              expectedOutcome: item.expectedOutcome,
              frequency: item.frequency,
              completionEvidence: item.completionEvidence,
              status: item.status,
            })),
            authorityBoundaries: draft.authorityBoundaries.map((item) => ({
              subject: item.subject,
              permissionLevel: item.permissionLevel,
              limitOrConstraint: item.limitOrConstraint,
              escalationDestination: item.escalationDestination,
              notes: item.notes,
            })),
            escalationRules: draft.escalationRules.map((item) => ({
              trigger: item.trigger,
              destination: item.destination,
              urgency: item.urgency,
              requiredContext: item.requiredContext,
              expectedResponse: item.expectedResponse,
            })),
          },
        }),
      );
      return result.ok
        ? {
            ok: true,
            message: `${result.value.company?.name ?? 'The company'} and its role are active for this page session.`,
          }
        : { ok: false, message: result.error.message };
    },
    [perform, service],
  );

  const loadDemo = useCallback((): SetupActionResult => {
    const alreadyLoaded = service.getSnapshot().company?.id === SUMMIT_COMFORT_DEMO_COMPANY_ID;
    const result = perform(() => loadSummitComfortDemo(service));
    if (!result.ok) return { ok: false, message: result.error.message };
    return {
      ok: true,
      message: alreadyLoaded
        ? 'The fictional HVAC demo was already loaded; no records were duplicated.'
        : 'The fictional Summit Comfort Heating & Air demo is active for this page session.',
    };
  }, [perform, service]);

  const createSourceReference = useCallback(
    (input: SourceReferenceInput) => perform(() => service.createSourceReference(input)),
    [perform, service],
  );
  const createKnowledgeClaim = useCallback(
    (input: KnowledgeClaimInput) => perform(() => service.createKnowledgeClaim(input)),
    [perform, service],
  );
  const approveKnowledgeClaim = useCallback(
    (input: ClaimDecisionInput) => perform(() => service.approveKnowledgeClaim(input)),
    [perform, service],
  );
  const rejectKnowledgeClaim = useCallback(
    (input: ClaimDecisionInput) => perform(() => service.rejectKnowledgeClaim(input)),
    [perform, service],
  );
  const createApprovedClaimRevision = useCallback(
    (input: ApprovedClaimRevisionInput) =>
      perform(() => service.createApprovedClaimRevision(input)),
    [perform, service],
  );

  const value = useMemo<RelaySessionValue>(
    () => ({
      snapshot,
      setupDraft,
      setSetupDraft,
      hasActiveSetup: snapshot.company !== null && snapshot.role !== null,
      isFictionalDemo: snapshot.company?.id === SUMMIT_COMFORT_DEMO_COMPANY_ID,
      employeeVisibleKnowledge: selectEmployeeVisibleKnowledge(snapshot),
      completeSetup,
      loadDemo,
      createSourceReference,
      createKnowledgeClaim,
      approveKnowledgeClaim,
      rejectKnowledgeClaim,
      createApprovedClaimRevision,
    }),
    [
      approveKnowledgeClaim,
      completeSetup,
      createApprovedClaimRevision,
      createKnowledgeClaim,
      createSourceReference,
      loadDemo,
      rejectKnowledgeClaim,
      setupDraft,
      snapshot,
    ],
  );

  return <RelaySessionContext.Provider value={value}>{children}</RelaySessionContext.Provider>;
}
