export type CompanyStatus = 'active';
export type RoleStatus = 'draft' | 'active' | 'retired';
export type ResponsibilityStatus = 'active' | 'inactive';

export type PermissionLevel =
  'may-decide' | 'may-act-within-limit' | 'must-request-approval' | 'must-escalate' | 'prohibited';

export type EscalationUrgency = 'routine' | 'same-day' | 'immediate';

export type SourceDocumentType =
  | 'job-description'
  | 'existing-sop'
  | 'policy'
  | 'checklist'
  | 'customer-script'
  | 'dispatch-note'
  | 'owner-note'
  | 'interview-record'
  | 'other';

export type SourceType = SourceDocumentType | 'service-manual' | 'interview' | 'owner-interview';

export type SourceCaptureMethod = 'manual-paste';
export type SourceDocumentStatus = 'draft' | 'available' | 'superseded' | 'withdrawn';

export type OperationalTopicKey =
  | 'lead-intake'
  | 'service-area'
  | 'scheduling'
  | 'rescheduling-and-cancellation'
  | 'urgency-and-emergency'
  | 'after-hours'
  | 'technician-late-or-absent'
  | 'pricing-and-estimates'
  | 'discounts'
  | 'payments'
  | 'refunds'
  | 'customer-complaints'
  | 'permits-and-approvals'
  | 'job-completion-proof'
  | 'customer-data-and-privacy'
  | 'authority-and-escalation';

export type OperationalRiskTier = 'critical' | 'high' | 'normal';
export type InterviewAnswerType =
  | 'short-text'
  | 'long-text'
  | 'yes-no'
  | 'numeric-limit'
  | 'person-or-destination'
  | 'single-choice';

export type InterviewStructuredValue = string | number | boolean;

export type KnowledgeCategory =
  | 'procedure'
  | 'decision-rule'
  | 'authority-boundary'
  | 'escalation-rule'
  | 'responsibility'
  | 'general';

export type KnowledgeProvenance =
  'owner-authored' | 'source-extracted' | 'owner-interview-derived' | 'generated-like';

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
  readonly companyId?: string;
  readonly roleId?: string;
  readonly sourceDocumentId?: string;
  readonly sourceDocumentVersion?: number;
  readonly startLine?: number;
  readonly endLine?: number;
}

export interface SourceDocumentLine {
  readonly lineNumber: number;
  readonly text: string;
}

export interface SourceDocument {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly title: string;
  readonly sourceType: SourceDocumentType;
  readonly supplierLabel: string;
  readonly captureMethod: SourceCaptureMethod;
  readonly content: string;
  readonly lines: readonly SourceDocumentLine[];
  readonly version: number;
  readonly status: SourceDocumentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly supersedesDocumentId?: string;
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
  readonly topicKey?: OperationalTopicKey;
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

export interface SourceDocumentInput {
  readonly title: string;
  readonly sourceType: SourceDocumentType;
  readonly supplierLabel: string;
  readonly content: string;
}

export interface SourceDocumentUpdates {
  readonly title?: string;
  readonly sourceType?: SourceDocumentType;
  readonly supplierLabel?: string;
  readonly content?: string;
}

export interface SourceDocumentRevisionInput extends SourceDocumentUpdates {
  readonly documentId: string;
}

export interface AnchoredSourceReferenceInput {
  readonly sourceDocumentId: string;
  readonly sourceDocumentVersion: number;
  readonly startLine: number;
  readonly endLine: number;
}

export interface KnowledgeClaimInput {
  readonly statement: string;
  readonly category: KnowledgeCategory;
  readonly provenance: KnowledgeProvenance;
  readonly lifecycleStatus:
    'extracted' | 'proposed' | 'missing-information' | 'conflicting-information';
  readonly sourceReferenceIds: readonly string[];
  readonly topicKey?: OperationalTopicKey;
}

export interface KnowledgeClaimUpdates {
  readonly statement?: string;
  readonly category?: KnowledgeCategory;
  readonly provenance?: KnowledgeProvenance;
  readonly sourceReferenceIds?: readonly string[];
  readonly topicKey?: OperationalTopicKey;
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
  readonly topicKey?: OperationalTopicKey;
}

export interface ManualExtractedClaimInput {
  readonly sourceReferenceId: string;
  readonly topicKey: OperationalTopicKey;
  readonly statement: string;
  readonly category: KnowledgeCategory;
}

export type KnowledgeGapReason =
  'missing-evidence' | 'incomplete-evidence' | 'conflicting-evidence' | 'authority-unclear';

export type KnowledgeGapStatus =
  'open' | 'question-ready' | 'answered' | 'proposal-created' | 'resolved' | 'dismissed';

export interface KnowledgeGap {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly topicKey: OperationalTopicKey;
  readonly reason: KnowledgeGapReason;
  readonly description: string;
  readonly impact: string;
  readonly riskTier: OperationalRiskTier;
  readonly status: KnowledgeGapStatus;
  readonly supportingSourceReferenceIds: readonly string[];
  readonly relatedClaimIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedByClaimId?: string;
  readonly dismissedReason?: string;
}

export type InterviewQuestionStatus = 'queued' | 'active' | 'answered' | 'skipped' | 'withdrawn';

export interface InterviewQuestion {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly gapId: string;
  readonly topicKey: OperationalTopicKey;
  readonly templateKey: string;
  readonly prompt: string;
  readonly rationale: string;
  readonly whatItUnlocks: string;
  readonly answerType: InterviewAnswerType;
  readonly answerOptions?: readonly string[];
  readonly priority: number;
  readonly status: InterviewQuestionStatus;
  readonly createdAt: string;
  readonly answeredAt?: string;
  readonly skippedReason?: string;
}

export interface InterviewAnswer {
  readonly id: string;
  readonly questionId: string;
  readonly gapId: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly actorLabel: string;
  readonly answer: string;
  readonly structuredValue?: InterviewStructuredValue;
  readonly answeredAt: string;
  readonly sourceReferenceId: string;
  readonly generatedClaimId: string;
  readonly correctsAnswerId?: string;
}

export interface InterviewAnswerInput {
  readonly questionId: string;
  readonly actorLabel: string;
  readonly answer: string;
  readonly structuredValue?: InterviewStructuredValue;
  readonly correctsAnswerId?: string;
}

export interface OperationalQuestionTemplate {
  readonly key: string;
  readonly prompt: string;
  readonly rationale: string;
  readonly whatItUnlocks: string;
  readonly answerType: InterviewAnswerType;
  readonly answerOptions?: readonly string[];
}

export interface OperationalFollowUpRule {
  readonly triggerTemplateKey: string;
  readonly equals: InterviewStructuredValue;
  readonly questions: readonly OperationalQuestionTemplate[];
}

export interface OperationalTopic {
  readonly key: OperationalTopicKey;
  readonly label: string;
  readonly description: string;
  readonly riskTier: OperationalRiskTier;
  readonly whyItMatters: string;
  readonly expectedEvidenceCategories: readonly SourceDocumentType[];
  readonly primaryQuestion: OperationalQuestionTemplate;
  readonly followUpRules: readonly OperationalFollowUpRule[];
  readonly relatedConcepts: readonly string[];
}

export type TopicCoverageState = 'approved' | 'candidate' | 'conflicting' | 'missing' | 'dismissed';

export interface TopicCoverage {
  readonly topic: OperationalTopic;
  readonly state: TopicCoverageState;
  readonly approvedClaim?: KnowledgeClaim;
  readonly candidateClaims: readonly KnowledgeClaim[];
  readonly conflictingClaims: readonly KnowledgeClaim[];
  readonly supportingSourceReferences: readonly SourceReference[];
  readonly gap?: KnowledgeGap;
}

export interface EmployeeVisibleKnowledge {
  readonly claim: KnowledgeClaim & { readonly lifecycleStatus: 'approved' };
  readonly sourceReferences: readonly SourceReference[];
  readonly approvalDecisions: readonly ApprovalDecision[];
}

export interface PhaseOneSnapshot {
  readonly company: Company | null;
  readonly role: Role | null;
  readonly sourceDocuments: readonly SourceDocument[];
  readonly sourceReferences: readonly SourceReference[];
  readonly knowledgeClaims: readonly KnowledgeClaim[];
  readonly approvalDecisions: readonly ApprovalDecision[];
  readonly knowledgeGaps: readonly KnowledgeGap[];
  readonly interviewQuestions: readonly InterviewQuestion[];
  readonly interviewAnswers: readonly InterviewAnswer[];
}

export const EMPTY_PHASE_ONE_SNAPSHOT: PhaseOneSnapshot = Object.freeze({
  company: null,
  role: null,
  sourceDocuments: Object.freeze([]),
  sourceReferences: Object.freeze([]),
  knowledgeClaims: Object.freeze([]),
  approvalDecisions: Object.freeze([]),
  knowledgeGaps: Object.freeze([]),
  interviewQuestions: Object.freeze([]),
  interviewAnswers: Object.freeze([]),
});
