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
  readonly topicKeys?: readonly OperationalTopicKey[];
  readonly applicableRequestTypes?: readonly EmployeeQuestionRequestType[];
  readonly numericLimit?: number;
  readonly currency?: CurrencyCode;
  readonly structuredConstraintType?: 'amount-limit';
}

export interface EscalationRule {
  readonly id: string;
  readonly roleId: string;
  readonly trigger: string;
  readonly destination: string;
  readonly urgency: EscalationUrgency;
  readonly requiredContext: string;
  readonly expectedResponse: string;
  readonly topicKeys?: readonly OperationalTopicKey[];
  readonly applicableRequestTypes?: readonly EmployeeQuestionRequestType[];
  readonly urgencyMatch?: EscalationUrgency;
  readonly sensitivityCategories?: readonly EmployeeSensitivitySelection[];
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
  | 'missing-evidence'
  | 'incomplete-evidence'
  | 'conflicting-evidence'
  | 'authority-unclear'
  | 'invalid-provenance'
  | 'unsupported-request';

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
  readonly originalReason?: KnowledgeGapReason;
  readonly triggeringQuestionIds?: readonly string[];
  readonly eligibilityEvaluationIds?: readonly string[];
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

export type EmployeeQuestionRequestType =
  | 'policy-lookup'
  | 'procedure-lookup'
  | 'decision-request'
  | 'exception-request'
  | 'financial-action'
  | 'emergency-action'
  | 'customer-commitment';

export type EmployeeSensitivitySelection =
  | 'none'
  | 'customer-personal-data'
  | 'credentials-or-access'
  | 'payment-data'
  | 'health-or-safety'
  | 'legal-or-regulatory'
  | 'other-sensitive';

export type CurrencyCode = 'USD' | 'CAD';
export type FinancialActionType = 'discount' | 'refund' | 'charge' | 'waive-fee' | 'other';
export type EmergencyCategory =
  | 'gas-odor'
  | 'carbon-monoxide'
  | 'smoke-or-fire'
  | 'electrical-hazard'
  | 'water-leak'
  | 'no-heating-or-cooling'
  | 'other';
export type CustomerCommitmentType =
  'arrival-window' | 'price-or-estimate' | 'service-availability' | 'completion-date' | 'other';

export interface PolicyLookupContext {
  readonly requestType: 'policy-lookup';
}

export interface ProcedureLookupContext {
  readonly requestType: 'procedure-lookup';
  readonly currentStepLabel?: string;
}

export interface DecisionRequestContext {
  readonly requestType: 'decision-request';
  readonly proposedAction: string;
  readonly subject?: string;
}

export interface ExceptionRequestContext {
  readonly requestType: 'exception-request';
  readonly requestedException: string;
  readonly reason: string;
}

export interface FinancialActionContext {
  readonly requestType: 'financial-action';
  readonly actionType: FinancialActionType;
  readonly amount: number;
  readonly currency: CurrencyCode;
}

export interface EmergencyActionContext {
  readonly requestType: 'emergency-action';
  readonly urgency: Extract<EscalationUrgency, 'same-day' | 'immediate'>;
  readonly emergencyCategory: EmergencyCategory;
}

export interface CustomerCommitmentContext {
  readonly requestType: 'customer-commitment';
  readonly commitmentType: CustomerCommitmentType;
  readonly amount?: number;
  readonly currency?: CurrencyCode;
  readonly commitmentDate?: string;
}

export type StructuredQuestionContext =
  | PolicyLookupContext
  | ProcedureLookupContext
  | DecisionRequestContext
  | ExceptionRequestContext
  | FinancialActionContext
  | EmergencyActionContext
  | CustomerCommitmentContext;

export type EmployeeQuestionStatus =
  'received' | 'evaluating' | 'answered' | 'withheld' | 'escalated' | 'closed';

export interface EmployeeQuestion {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly employeeLabel: string;
  readonly questionText: string;
  readonly topicKey: OperationalTopicKey;
  readonly requestType: EmployeeQuestionRequestType;
  readonly sensitivitySelection: EmployeeSensitivitySelection;
  readonly structuredContext: StructuredQuestionContext;
  readonly status: EmployeeQuestionStatus;
  readonly submittedAt: string;
  readonly closedAt?: string;
  readonly correctsQuestionId?: string;
  readonly correlationId: string;
}

export interface EmployeeQuestionInput {
  readonly employeeLabel: string;
  readonly questionText: string;
  readonly topicKey: OperationalTopicKey;
  readonly requestType: EmployeeQuestionRequestType;
  readonly sensitivitySelection: EmployeeSensitivitySelection;
  readonly structuredContext: StructuredQuestionContext;
  readonly correctsQuestionId?: string;
}

export type AnswerEligibilityResult =
  | 'answer-eligible'
  | 'escalation-required'
  | 'prohibited'
  | 'withheld-missing-knowledge'
  | 'withheld-conflicting-knowledge'
  | 'withheld-invalid-provenance'
  | 'withheld-sensitive'
  | 'withheld-authority-unclear'
  | 'withheld-unsupported-request';

export type AnswerEligibilityGateKey =
  | 'scope-valid'
  | 'topic-valid'
  | 'request-context-valid'
  | 'current-approved-knowledge-present'
  | 'provenance-valid'
  | 'no-explicit-conflict'
  | 'sensitivity-clear'
  | 'authority-clear'
  | 'escalation-rule-clear'
  | 'answer-mode-supported';

export type AnswerEligibilityGateStatus = 'pass' | 'fail' | 'not-applicable';

export interface AnswerEligibilityGateResult {
  readonly gateKey: AnswerEligibilityGateKey;
  readonly status: AnswerEligibilityGateStatus;
  readonly reason: string;
  readonly supportingRecordIds: readonly string[];
}

export interface AnswerEligibilityEvaluation {
  readonly id: string;
  readonly questionId: string;
  readonly evaluatedAt: string;
  readonly overallResult: AnswerEligibilityResult;
  readonly gateResults: readonly AnswerEligibilityGateResult[];
  readonly eligibleClaimIds: readonly string[];
  readonly eligibleSourceReferenceIds: readonly string[];
  readonly approvalDecisionIds: readonly string[];
  readonly matchingAuthorityBoundaryIds: readonly string[];
  readonly matchingEscalationRuleIds: readonly string[];
  readonly withholdReason?: AnswerEligibilityResult;
  readonly correlationId: string;
}

export type AnswerStatus = 'delivered' | 'withheld' | 'escalated' | 'prohibited';
export type AnswerMode =
  | 'approved-guidance'
  | 'approved-guidance-with-authority'
  | 'known-escalation'
  | 'prohibited-action'
  | 'withheld';

export interface Answer {
  readonly id: string;
  readonly questionId: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly status: AnswerStatus;
  readonly answerMode: AnswerMode;
  readonly responseText: string;
  readonly citedClaimIds: readonly string[];
  readonly citedSourceReferenceIds: readonly string[];
  readonly citedApprovalDecisionIds: readonly string[];
  readonly citedAuthorityBoundaryIds: readonly string[];
  readonly eligibilityEvaluationId: string;
  readonly createdAt: string;
  readonly deliveredAt?: string;
  readonly withheldReason?: AnswerEligibilityResult;
  readonly correlationId: string;
}

export type EscalationReason =
  | 'approval-required'
  | 'mandatory-escalation'
  | 'emergency'
  | 'sensitive-context'
  | 'authority-unclear'
  | 'missing-knowledge'
  | 'conflicting-knowledge'
  | 'invalid-provenance'
  | 'unsupported-request';

export type EscalationStatus = 'open' | 'assigned' | 'resolved' | 'closed';

export interface EscalationContextItem {
  readonly label: string;
  readonly value: string;
}

export interface Escalation {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly questionId: string;
  readonly reason: EscalationReason;
  readonly urgency: EscalationUrgency;
  readonly destination: string;
  readonly requiredContext: readonly EscalationContextItem[];
  readonly status: EscalationStatus;
  readonly createdAt: string;
  readonly assignedAt?: string;
  readonly assignedToLabel?: string;
  readonly resolvedAt?: string;
  readonly resolutionSummary?: string;
  readonly resolvedByLabel?: string;
  readonly relatedGapId?: string;
  readonly matchingBoundaryIds: readonly string[];
  readonly matchingEscalationRuleIds: readonly string[];
  readonly correlationId: string;
}

export type ActivityEventType =
  | 'question-received'
  | 'question-evaluated'
  | 'answer-delivered'
  | 'answer-withheld'
  | 'escalation-opened'
  | 'escalation-assigned'
  | 'escalation-resolved'
  | 'escalation-closed'
  | 'gap-linked-to-question';

export type ActivityEntityType =
  'employee-question' | 'answer-evaluation' | 'answer' | 'escalation' | 'knowledge-gap';

export type ActivityMetadataValue = string | number | boolean;

export interface ActivityEvent {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly eventType: ActivityEventType;
  readonly entityType: ActivityEntityType;
  readonly entityId: string;
  readonly actorLabel: string;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly metadata: Readonly<Record<string, ActivityMetadataValue>>;
}

export interface QuestionEvaluationOutcome {
  readonly question: EmployeeQuestion;
  readonly evaluation: AnswerEligibilityEvaluation;
  readonly answer: Answer;
  readonly escalation?: Escalation;
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
  readonly employeeQuestions: readonly EmployeeQuestion[];
  readonly answerEligibilityEvaluations: readonly AnswerEligibilityEvaluation[];
  readonly answers: readonly Answer[];
  readonly escalations: readonly Escalation[];
  readonly activityEvents: readonly ActivityEvent[];
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
  employeeQuestions: Object.freeze([]),
  answerEligibilityEvaluations: Object.freeze([]),
  answers: Object.freeze([]),
  escalations: Object.freeze([]),
  activityEvents: Object.freeze([]),
});
