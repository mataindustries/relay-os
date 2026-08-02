import { useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  PhaseOneService,
  evaluateTopicCoverage,
  selectEmployeeVisibleKnowledge,
  type AnchoredSourceReferenceInput,
  type ApprovedClaimRevisionInput,
  type ClaimDecisionInput,
  type DomainResult,
  type EmployeeQuestionInput,
  type InterviewAnswerInput,
  type KnowledgeClaimInput,
  type KnowledgeClaimUpdates,
  type KnowledgeLifecycleStatus,
  type ManualExtractedClaimInput,
  type SourceDocumentInput,
  type SourceDocumentRevisionInput,
  type SourceDocumentUpdates,
  type SourceReferenceInput,
} from '../domain';
import {
  loadSummitComfortDemo,
  resetSummitComfortDemo,
  SUMMIT_COMFORT_DEMO_COMPANY_ID,
} from '../demo';
import type { SetupActionResult } from '../features/setup/SetupPage';
import { createInitialSetupDraft, type SetupDraft } from '../features/setup/setupDraft';
import { InMemoryPhaseOneRepository } from '../infrastructure';
import { RelaySessionContext, type RelaySessionValue } from './relaySessionContext';

export interface RelaySessionProviderProps {
  readonly children: ReactNode;
  readonly service?: PhaseOneService | undefined;
  readonly clock?: (() => string) | undefined;
}

export function RelaySessionProvider({
  children,
  service: suppliedService,
  clock: suppliedClock,
}: RelaySessionProviderProps) {
  const [service] = useState(
    () =>
      suppliedService ??
      new PhaseOneService(new InMemoryPhaseOneRepository(), {
        ownerFallbackDestination: 'Owner',
      }),
  );
  const [snapshot, setSnapshot] = useState(() => service.getSnapshot());
  const [setupDraft, setSetupDraft] = useState(createInitialSetupDraft);
  const [currentTime] = useState<() => string>(
    () => suppliedClock ?? (() => new Date().toISOString()),
  );

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
      const result = perform(() => {
        const activation = service.activateSetup({
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
        });
        if (!activation.ok) return activation;
        const reconciliation = service.reconcileKnowledgeGaps();
        return reconciliation.ok ? activation : { ok: false as const, error: reconciliation.error };
      });
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

  const resetDemo = useCallback((): SetupActionResult => {
    const result = perform(() => resetSummitComfortDemo(service));
    return result.ok
      ? {
          ok: true,
          message:
            'The fictional Summit Comfort records were reset. Any changes made to fictional demo records in this page session were discarded.',
        }
      : { ok: false, message: result.error.message };
  }, [perform, service]);

  const createSourceReference = useCallback(
    (input: SourceReferenceInput) => perform(() => service.createSourceReference(input)),
    [perform, service],
  );
  const createSourceDocument = useCallback(
    (input: SourceDocumentInput) => perform(() => service.createSourceDocument(input)),
    [perform, service],
  );
  const updateSourceDocumentDraft = useCallback(
    (documentId: string, updates: SourceDocumentUpdates) =>
      perform(() => service.updateSourceDocumentDraft(documentId, updates)),
    [perform, service],
  );
  const activateSourceDocument = useCallback(
    (documentId: string) => perform(() => service.activateSourceDocument(documentId)),
    [perform, service],
  );
  const createSourceDocumentRevision = useCallback(
    (input: SourceDocumentRevisionInput) =>
      perform(() => service.createSourceDocumentRevision(input)),
    [perform, service],
  );
  const createAnchoredSourceReference = useCallback(
    (input: AnchoredSourceReferenceInput) =>
      perform(() => service.createAnchoredSourceReference(input)),
    [perform, service],
  );
  const createKnowledgeClaim = useCallback(
    (input: KnowledgeClaimInput) => perform(() => service.createKnowledgeClaim(input)),
    [perform, service],
  );
  const createManualExtractedClaim = useCallback(
    (input: ManualExtractedClaimInput) => perform(() => service.createManualExtractedClaim(input)),
    [perform, service],
  );
  const updateKnowledgeClaim = useCallback(
    (claimId: string, updates: KnowledgeClaimUpdates) =>
      perform(() => service.updateKnowledgeClaim(claimId, updates)),
    [perform, service],
  );
  const transitionKnowledgeClaim = useCallback(
    (claimId: string, target: KnowledgeLifecycleStatus) =>
      perform(() => service.transitionKnowledgeClaim(claimId, target)),
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
  const reconcileKnowledgeGaps = useCallback(
    () => perform(() => service.reconcileKnowledgeGaps()),
    [perform, service],
  );
  const dismissKnowledgeGap = useCallback(
    (gapId: string, reason: string) => perform(() => service.dismissKnowledgeGap(gapId, reason)),
    [perform, service],
  );
  const generateInterviewQuestions = useCallback(
    () => perform(() => service.generateInterviewQuestions()),
    [perform, service],
  );
  const skipInterviewQuestion = useCallback(
    (questionId: string, reason: string) =>
      perform(() => service.skipInterviewQuestion(questionId, reason)),
    [perform, service],
  );
  const submitInterviewAnswer = useCallback(
    (input: InterviewAnswerInput) => perform(() => service.submitInterviewAnswer(input)),
    [perform, service],
  );
  const submitEmployeeQuestion = useCallback(
    (input: EmployeeQuestionInput) => perform(() => service.submitEmployeeQuestion(input)),
    [perform, service],
  );
  const evaluateEmployeeQuestion = useCallback(
    (questionId: string) => perform(() => service.evaluateEmployeeQuestion(questionId)),
    [perform, service],
  );
  const assignEscalation = useCallback(
    (escalationId: string, assignedToLabel: string) =>
      perform(() => service.assignEscalation(escalationId, assignedToLabel)),
    [perform, service],
  );
  const resolveEscalation = useCallback(
    (escalationId: string, resolutionSummary: string, resolvedByLabel: string) =>
      perform(() => service.resolveEscalation(escalationId, resolutionSummary, resolvedByLabel)),
    [perform, service],
  );
  const closeEscalation = useCallback(
    (escalationId: string) => perform(() => service.closeEscalation(escalationId)),
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
      coverageResult: evaluateTopicCoverage(snapshot),
      interviewQueue: service.prioritizedInterviewQuestions(),
      currentTime,
      completeSetup,
      loadDemo,
      resetDemo,
      createSourceReference,
      createSourceDocument,
      updateSourceDocumentDraft,
      activateSourceDocument,
      createSourceDocumentRevision,
      createAnchoredSourceReference,
      createKnowledgeClaim,
      createManualExtractedClaim,
      updateKnowledgeClaim,
      transitionKnowledgeClaim,
      approveKnowledgeClaim,
      rejectKnowledgeClaim,
      createApprovedClaimRevision,
      reconcileKnowledgeGaps,
      dismissKnowledgeGap,
      generateInterviewQuestions,
      skipInterviewQuestion,
      submitInterviewAnswer,
      submitEmployeeQuestion,
      evaluateEmployeeQuestion,
      assignEscalation,
      resolveEscalation,
      closeEscalation,
    }),
    [
      approveKnowledgeClaim,
      completeSetup,
      createAnchoredSourceReference,
      createApprovedClaimRevision,
      createKnowledgeClaim,
      createManualExtractedClaim,
      createSourceDocument,
      createSourceReference,
      currentTime,
      dismissKnowledgeGap,
      generateInterviewQuestions,
      loadDemo,
      resetDemo,
      reconcileKnowledgeGaps,
      rejectKnowledgeClaim,
      setupDraft,
      skipInterviewQuestion,
      snapshot,
      submitInterviewAnswer,
      submitEmployeeQuestion,
      evaluateEmployeeQuestion,
      assignEscalation,
      resolveEscalation,
      closeEscalation,
      updateKnowledgeClaim,
      transitionKnowledgeClaim,
      updateSourceDocumentDraft,
      activateSourceDocument,
      createSourceDocumentRevision,
      service,
    ],
  );

  return <RelaySessionContext.Provider value={value}>{children}</RelaySessionContext.Provider>;
}
