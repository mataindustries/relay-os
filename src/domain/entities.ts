export type CompanyStatus = 'active';
export type RoleStatus = 'draft' | 'active' | 'retired';
export type ResponsibilityStatus = 'active' | 'inactive';

export type PermissionLevel =
  'may-decide' | 'may-act-within-limit' | 'must-request-approval' | 'must-escalate' | 'prohibited';

export type EscalationUrgency = 'routine' | 'same-day' | 'immediate';

export type SourceType = 'owner-note' | 'policy' | 'service-manual' | 'interview' | 'other';

export type KnowledgeCategory =
  | 'procedure'
  | 'decision-rule'
  | 'authority-boundary'
  | 'escalation-rule'
  | 'responsibility'
  | 'general';

export type KnowledgeProvenance = 'owner-authored' | 'source-extracted' | 'generated-like';

export type KnowledgeLifecycleStatus =
  | 'extracted'
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'missing-information'
  | 'conflicting-information'
  | 'superseded';

export type ApprovalDecisionType = 'approve' | 'reject';

export interface ContactInformation {
  readonly phone: string;
  readonly email: string;
}

export interface Company {
  readonly id: string;
  readonly name: string;
  readonly industry: string;
  readonly serviceArea: string;
  readonly contactInformation: ContactInformation;
  readonly operatingTimezone: string;
  readonly status: CompanyStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Responsibility {
  readonly id: string;
  readonly roleId: string;
  readonly title: string;
  readonly expectedOutcome: string;
  readonly frequency: string;
  readonly completionEvidence: string;
  readonly status: ResponsibilityStatus;
}

export interface AuthorityBoundary {
  readonly id: string;
  readonly roleId: string;
  readonly subject: string;
  readonly permissionLevel: PermissionLevel;
  readonly limitOrConstraint: string;
  readonly escalationDestination: string;
  readonly notes: string;
}

export interface EscalationRule {
  readonly id: string;
  readonly roleId: string;
  readonly trigger: string;
  readonly destination: string;
  readonly urgency: EscalationUrgency;
  readonly requiredContext: string;
  readonly expectedResponse: string;
}

export interface Role {
  readonly id: string;
  readonly companyId: string;
  readonly title: string;
  readonly mission: string;
  readonly status: RoleStatus;
  readonly responsibilities: readonly Responsibility[];
  readonly authorityBoundaries: readonly AuthorityBoundary[];
  readonly escalationRules: readonly EscalationRule[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SourceReference {
  readonly id: string;
  readonly sourceTitle: string;
  readonly sourceType: SourceType;
  readonly sourceLocator: string;
  readonly excerpt?: string;
  readonly recordedAt: string;
}

export interface KnowledgeClaim {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly statement: string;
  readonly category: KnowledgeCategory;
  readonly provenance: KnowledgeProvenance;
  readonly lifecycleStatus: KnowledgeLifecycleStatus;
  readonly sourceReferenceIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly supersedesClaimId?: string;
}

export interface ApprovalDecision {
  readonly id: string;
  readonly claimId: string;
  readonly decision: ApprovalDecisionType;
  readonly actorLabel: string;
  readonly reason: string;
  readonly decidedAt: string;
  readonly claimVersion: number;
}

export interface CompanyInput {
  readonly name: string;
  readonly industry: string;
  readonly serviceArea: string;
  readonly phone: string;
  readonly email: string;
  readonly operatingTimezone: string;
}

export type ResponsibilityInput = Omit<Responsibility, 'id' | 'roleId'>;
export type AuthorityBoundaryInput = Omit<AuthorityBoundary, 'id' | 'roleId'>;
export type EscalationRuleInput = Omit<EscalationRule, 'id' | 'roleId'>;

export interface RoleInput {
  readonly title: string;
  readonly mission: string;
  readonly status: RoleStatus;
  readonly responsibilities: readonly ResponsibilityInput[];
  readonly authorityBoundaries: readonly AuthorityBoundaryInput[];
  readonly escalationRules: readonly EscalationRuleInput[];
}

export interface ActivateSetupInput {
  readonly company: CompanyInput;
  readonly role: RoleInput;
}

export type SourceReferenceInput = Omit<SourceReference, 'id' | 'recordedAt'>;

export interface KnowledgeClaimInput {
  readonly statement: string;
  readonly category: KnowledgeCategory;
  readonly provenance: KnowledgeProvenance;
  readonly lifecycleStatus:
    'extracted' | 'proposed' | 'missing-information' | 'conflicting-information';
  readonly sourceReferenceIds: readonly string[];
}

export interface KnowledgeClaimUpdates {
  readonly statement?: string;
  readonly category?: KnowledgeCategory;
  readonly provenance?: KnowledgeProvenance;
  readonly sourceReferenceIds?: readonly string[];
}

export interface ClaimDecisionInput {
  readonly claimId: string;
  readonly actorLabel: string;
  readonly reason: string;
}

export interface ApprovedClaimRevisionInput {
  readonly claimId: string;
  readonly statement: string;
  readonly category?: KnowledgeCategory;
  readonly provenance?: KnowledgeProvenance;
  readonly sourceReferenceIds?: readonly string[];
}

export interface EmployeeVisibleKnowledge {
  readonly claim: KnowledgeClaim & { readonly lifecycleStatus: 'approved' };
  readonly sourceReferences: readonly SourceReference[];
  readonly approvalDecisions: readonly ApprovalDecision[];
}

export interface PhaseOneSnapshot {
  readonly company: Company | null;
  readonly role: Role | null;
  readonly sourceReferences: readonly SourceReference[];
  readonly knowledgeClaims: readonly KnowledgeClaim[];
  readonly approvalDecisions: readonly ApprovalDecision[];
}

export const EMPTY_PHASE_ONE_SNAPSHOT: PhaseOneSnapshot = Object.freeze({
  company: null,
  role: null,
  sourceReferences: Object.freeze([]),
  knowledgeClaims: Object.freeze([]),
  approvalDecisions: Object.freeze([]),
});
