import { createContext } from 'react';

import type {
  ApprovedClaimRevisionInput,
  AnchoredSourceReferenceInput,
  ClaimDecisionInput,
  DomainResult,
  EmployeeVisibleKnowledge,
  InterviewAnswer,
  InterviewAnswerInput,
  InterviewQuestion,
  KnowledgeClaim,
  KnowledgeClaimInput,
  KnowledgeClaimUpdates,
  KnowledgeLifecycleStatus,
  KnowledgeGap,
  ManualExtractedClaimInput,
  PhaseOneSnapshot,
  SourceDocument,
  SourceDocumentInput,
  SourceDocumentRevisionInput,
  SourceDocumentUpdates,
  SourceReference,
  SourceReferenceInput,
  TopicCoverage,
} from '../domain';
import type { SetupActionResult } from '../features/setup/SetupPage';
import type { SetupDraft } from '../features/setup/setupDraft';

export interface RelaySessionValue {
  readonly snapshot: PhaseOneSnapshot;
  readonly setupDraft: SetupDraft;
  readonly setSetupDraft: (draft: SetupDraft) => void;
  readonly hasActiveSetup: boolean;
  readonly isFictionalDemo: boolean;
  readonly employeeVisibleKnowledge: readonly EmployeeVisibleKnowledge[];
  readonly coverageResult: DomainResult<readonly TopicCoverage[]>;
  readonly interviewQueue: readonly InterviewQuestion[];
  readonly completeSetup: (draft: SetupDraft) => SetupActionResult;
  readonly loadDemo: () => SetupActionResult;
  readonly createSourceReference: (input: SourceReferenceInput) => DomainResult<SourceReference>;
  readonly createSourceDocument: (input: SourceDocumentInput) => DomainResult<SourceDocument>;
  readonly updateSourceDocumentDraft: (
    documentId: string,
    updates: SourceDocumentUpdates,
  ) => DomainResult<SourceDocument>;
  readonly activateSourceDocument: (documentId: string) => DomainResult<SourceDocument>;
  readonly createSourceDocumentRevision: (
    input: SourceDocumentRevisionInput,
  ) => DomainResult<SourceDocument>;
  readonly createAnchoredSourceReference: (
    input: AnchoredSourceReferenceInput,
  ) => DomainResult<SourceReference>;
  readonly createKnowledgeClaim: (input: KnowledgeClaimInput) => DomainResult<KnowledgeClaim>;
  readonly createManualExtractedClaim: (
    input: ManualExtractedClaimInput,
  ) => DomainResult<KnowledgeClaim>;
  readonly updateKnowledgeClaim: (
    claimId: string,
    updates: KnowledgeClaimUpdates,
  ) => DomainResult<KnowledgeClaim>;
  readonly transitionKnowledgeClaim: (
    claimId: string,
    target: KnowledgeLifecycleStatus,
  ) => DomainResult<KnowledgeClaim>;
  readonly approveKnowledgeClaim: (input: ClaimDecisionInput) => DomainResult<KnowledgeClaim>;
  readonly rejectKnowledgeClaim: (input: ClaimDecisionInput) => DomainResult<KnowledgeClaim>;
  readonly createApprovedClaimRevision: (
    input: ApprovedClaimRevisionInput,
  ) => DomainResult<KnowledgeClaim>;
  readonly reconcileKnowledgeGaps: () => DomainResult<readonly KnowledgeGap[]>;
  readonly dismissKnowledgeGap: (gapId: string, reason: string) => DomainResult<KnowledgeGap>;
  readonly generateInterviewQuestions: () => DomainResult<readonly InterviewQuestion[]>;
  readonly skipInterviewQuestion: (
    questionId: string,
    reason: string,
  ) => DomainResult<InterviewQuestion>;
  readonly submitInterviewAnswer: (input: InterviewAnswerInput) => DomainResult<InterviewAnswer>;
}

export const RelaySessionContext = createContext<RelaySessionValue | null>(null);
