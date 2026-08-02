import { createContext } from 'react';

import type {
  ApprovedClaimRevisionInput,
  ClaimDecisionInput,
  DomainResult,
  EmployeeVisibleKnowledge,
  KnowledgeClaim,
  KnowledgeClaimInput,
  PhaseOneSnapshot,
  SourceReference,
  SourceReferenceInput,
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
  readonly completeSetup: (draft: SetupDraft) => SetupActionResult;
  readonly loadDemo: () => SetupActionResult;
  readonly createSourceReference: (input: SourceReferenceInput) => DomainResult<SourceReference>;
  readonly createKnowledgeClaim: (input: KnowledgeClaimInput) => DomainResult<KnowledgeClaim>;
  readonly approveKnowledgeClaim: (input: ClaimDecisionInput) => DomainResult<KnowledgeClaim>;
  readonly rejectKnowledgeClaim: (input: ClaimDecisionInput) => DomainResult<KnowledgeClaim>;
  readonly createApprovedClaimRevision: (
    input: ApprovedClaimRevisionInput,
  ) => DomainResult<KnowledgeClaim>;
}

export const RelaySessionContext = createContext<RelaySessionValue | null>(null);
