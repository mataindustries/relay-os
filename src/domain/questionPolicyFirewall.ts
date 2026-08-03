import type {
  AnswerEligibilityEvaluation,
  AnswerEligibilityGateKey,
  AnswerEligibilityGateResult,
  AnswerEligibilityResult,
  AnswerMode,
  AnswerStatus,
  AuthorityBoundary,
  CurrencyCode,
  EmployeeQuestion,
  EmployeeQuestionInput,
  EmployeeQuestionRequestType,
  EmployeeSensitivitySelection,
  EmployeeVisibleKnowledge,
  EscalationReason,
  EscalationRule,
  EscalationUrgency,
  KnowledgeGapReason,
  PhaseOneSnapshot,
  StructuredQuestionContext,
} from './entities';
import { selectEmployeeVisibleKnowledge } from './employeeVisibility';
import { isOperationalTopicKey } from './operationalTopics';
import { domainFailure, domainSuccess, type DomainResult } from './result';
import { excerptSourceLines, sourceDocumentLocator } from './sourceDocuments';

export const EMPLOYEE_QUESTION_REQUEST_TYPES = [
  'policy-lookup',
  'procedure-lookup',
  'decision-request',
  'exception-request',
  'financial-action',
  'emergency-action',
  'customer-commitment',
] as const;

export const EMPLOYEE_SENSITIVITY_SELECTIONS = [
  'none',
  'customer-personal-data',
  'credentials-or-access',
  'payment-data',
  'health-or-safety',
  'legal-or-regulatory',
  'other-sensitive',
] as const;

export const CURRENCY_CODES = ['USD', 'CAD'] as const;
export const FINANCIAL_ACTION_TYPES = [
  'discount',
  'refund',
  'charge',
  'waive-fee',
  'other',
] as const;
export const EMERGENCY_CATEGORIES = [
  'gas-odor',
  'carbon-monoxide',
  'smoke-or-fire',
  'electrical-hazard',
  'water-leak',
  'no-heating-or-cooling',
  'other',
] as const;
export const CUSTOMER_COMMITMENT_TYPES = [
  'arrival-window',
  'price-or-estimate',
  'service-availability',
  'completion-date',
  'other',
] as const;

export const ANSWER_ELIGIBILITY_GATE_ORDER: readonly AnswerEligibilityGateKey[] = Object.freeze([
  'scope-valid',
  'topic-valid',
  'request-context-valid',
  'current-approved-knowledge-present',
  'provenance-valid',
  'no-explicit-conflict',
  'sensitivity-clear',
  'authority-clear',
  'escalation-rule-clear',
  'answer-mode-supported',
]);

const INFORMATIONAL_REQUEST_TYPES: readonly EmployeeQuestionRequestType[] = [
  'policy-lookup',
  'procedure-lookup',
];

const BOUNDARY_PRECEDENCE: Readonly<Record<AuthorityBoundary['permissionLevel'], number>> = {
  prohibited: 0,
  'must-escalate': 1,
  'must-request-approval': 2,
  'may-act-within-limit': 3,
  'may-decide': 4,
};

const URGENCY_PRECEDENCE: Readonly<Record<EscalationUrgency, number>> = {
  immediate: 0,
  'same-day': 1,
  routine: 2,
};

function clean(value: string): string {
  return value.trim();
}

function isNonnegativeAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validOptionalText(value: unknown): boolean {
  return value === undefined || (typeof value === 'string' && clean(value).length > 0);
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
}

export function isEmployeeQuestionRequestType(value: string): value is EmployeeQuestionRequestType {
  return EMPLOYEE_QUESTION_REQUEST_TYPES.some((candidate) => candidate === value);
}

export function isEmployeeSensitivitySelection(
  value: string,
): value is EmployeeSensitivitySelection {
  return EMPLOYEE_SENSITIVITY_SELECTIONS.some((candidate) => candidate === value);
}

export function isInformationalRequestType(requestType: EmployeeQuestionRequestType): boolean {
  return INFORMATIONAL_REQUEST_TYPES.includes(requestType);
}

export function validateStructuredQuestionContext(
  requestType: EmployeeQuestionRequestType,
  context: StructuredQuestionContext,
): DomainResult<void> {
  if (context === null || typeof context !== 'object' || context.requestType !== requestType) {
    return domainFailure(
      'invalid-question-context',
      'Structured question context must match the selected request type.',
      'structuredContext.requestType',
    );
  }

  switch (context.requestType) {
    case 'policy-lookup':
      return domainSuccess(undefined);
    case 'procedure-lookup':
      return validOptionalText(context.currentStepLabel)
        ? domainSuccess(undefined)
        : domainFailure(
            'invalid-question-context',
            'Current step must be omitted or contain text.',
            'structuredContext.currentStepLabel',
          );
    case 'decision-request':
      if (clean(context.proposedAction).length === 0) {
        return domainFailure(
          'invalid-question-context',
          'A proposed action is required.',
          'structuredContext.proposedAction',
        );
      }
      return validOptionalText(context.subject)
        ? domainSuccess(undefined)
        : domainFailure(
            'invalid-question-context',
            'Subject must be omitted or contain text.',
            'structuredContext.subject',
          );
    case 'exception-request':
      if (clean(context.requestedException).length === 0 || clean(context.reason).length === 0) {
        return domainFailure(
          'invalid-question-context',
          'Requested exception and reason are required.',
          clean(context.requestedException).length === 0
            ? 'structuredContext.requestedException'
            : 'structuredContext.reason',
        );
      }
      return domainSuccess(undefined);
    case 'financial-action':
      if (!FINANCIAL_ACTION_TYPES.includes(context.actionType)) {
        return domainFailure(
          'invalid-question-context',
          'Choose a supported financial action type.',
          'structuredContext.actionType',
        );
      }
      if (!isNonnegativeAmount(context.amount)) {
        return domainFailure(
          'invalid-question-context',
          'Enter a finite nonnegative amount.',
          'structuredContext.amount',
        );
      }
      return CURRENCY_CODES.includes(context.currency)
        ? domainSuccess(undefined)
        : domainFailure(
            'invalid-question-context',
            'Choose a supported currency.',
            'structuredContext.currency',
          );
    case 'emergency-action':
      if (context.urgency !== 'same-day' && context.urgency !== 'immediate') {
        return domainFailure(
          'invalid-question-context',
          'Emergency urgency must be same-day or immediate.',
          'structuredContext.urgency',
        );
      }
      return EMERGENCY_CATEGORIES.includes(context.emergencyCategory)
        ? domainSuccess(undefined)
        : domainFailure(
            'invalid-question-context',
            'Choose a supported emergency category.',
            'structuredContext.emergencyCategory',
          );
    case 'customer-commitment': {
      if (!CUSTOMER_COMMITMENT_TYPES.includes(context.commitmentType)) {
        return domainFailure(
          'invalid-question-context',
          'Choose a supported commitment type.',
          'structuredContext.commitmentType',
        );
      }
      const hasAmount = context.amount !== undefined;
      const hasCurrency = context.currency !== undefined;
      if (hasAmount !== hasCurrency) {
        return domainFailure(
          'invalid-question-context',
          'Commitment amount and currency must be supplied together.',
          'structuredContext.amount',
        );
      }
      if (
        hasAmount &&
        (!isNonnegativeAmount(context.amount) || !CURRENCY_CODES.includes(context.currency!))
      ) {
        return domainFailure(
          'invalid-question-context',
          'Commitment amount and currency are invalid.',
          'structuredContext.amount',
        );
      }
      if (context.commitmentDate !== undefined && !validDate(context.commitmentDate)) {
        return domainFailure(
          'invalid-question-context',
          'Commitment date must be a valid YYYY-MM-DD date.',
          'structuredContext.commitmentDate',
        );
      }
      if (context.commitmentType === 'completion-date' && context.commitmentDate === undefined) {
        return domainFailure(
          'invalid-question-context',
          'A completion-date commitment requires an explicit date.',
          'structuredContext.commitmentDate',
        );
      }
      return domainSuccess(undefined);
    }
  }

  return domainFailure(
    'invalid-question-context',
    'Structured question context uses an unsupported request type.',
    'structuredContext.requestType',
  );
}

export function validateEmployeeQuestionInput(input: EmployeeQuestionInput): DomainResult<void> {
  if (clean(input.employeeLabel).length === 0) {
    return domainFailure(
      'validation-error',
      'Employee label is required.',
      'employeeQuestion.employeeLabel',
    );
  }
  if (clean(input.questionText).length === 0) {
    return domainFailure(
      'validation-error',
      'Question text is required.',
      'employeeQuestion.questionText',
    );
  }
  if (!isOperationalTopicKey(input.topicKey)) {
    return domainFailure('invalid-topic', 'Choose a valid operational topic.', 'topicKey');
  }
  if (!isEmployeeQuestionRequestType(input.requestType)) {
    return domainFailure('invalid-request-type', 'Choose a valid request type.', 'requestType');
  }
  if (!isEmployeeSensitivitySelection(input.sensitivitySelection)) {
    return domainFailure(
      'invalid-sensitivity-selection',
      'Choose a sensitivity value explicitly.',
      'sensitivitySelection',
    );
  }
  return validateStructuredQuestionContext(input.requestType, input.structuredContext);
}

function uniqueStable(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function gate(
  gateKey: AnswerEligibilityGateKey,
  status: AnswerEligibilityGateResult['status'],
  reason: string,
  supportingRecordIds: readonly string[] = [],
): AnswerEligibilityGateResult {
  return { gateKey, status, reason, supportingRecordIds: uniqueStable(supportingRecordIds) };
}

function currentApprovedClaimsForTopic(
  snapshot: PhaseOneSnapshot,
  question: EmployeeQuestion,
): PhaseOneSnapshot['knowledgeClaims'] {
  return snapshot.knowledgeClaims
    .filter(
      (claim) =>
        claim.companyId === question.companyId &&
        claim.roleId === question.roleId &&
        claim.topicKey === question.topicKey &&
        claim.lifecycleStatus === 'approved' &&
        !snapshot.knowledgeClaims.some(
          (candidate) =>
            candidate.supersedesClaimId === claim.id && candidate.lifecycleStatus === 'approved',
        ),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function sourceProvenanceIsValid(
  snapshot: PhaseOneSnapshot,
  knowledge: EmployeeVisibleKnowledge,
): boolean {
  const claim = knowledge.claim;
  if (
    knowledge.sourceReferences.length !== claim.sourceReferenceIds.length ||
    knowledge.approvalDecisions.length === 0
  ) {
    return false;
  }
  if (
    !knowledge.approvalDecisions.every(
      (decision) =>
        decision.claimId === claim.id &&
        decision.claimVersion === claim.version &&
        decision.decision === 'approve',
    )
  ) {
    return false;
  }

  return knowledge.sourceReferences.every((source) => {
    const hasScope = source.companyId !== undefined || source.roleId !== undefined;
    if (hasScope && (source.companyId !== claim.companyId || source.roleId !== claim.roleId)) {
      return false;
    }
    const anchor = [
      source.sourceDocumentId,
      source.sourceDocumentVersion,
      source.startLine,
      source.endLine,
    ];
    const hasAnyAnchor = anchor.some((value) => value !== undefined);
    if (!hasAnyAnchor) return true;
    if (!anchor.every((value) => value !== undefined)) return false;
    const document = snapshot.sourceDocuments.find(
      ({ id, version }) =>
        id === source.sourceDocumentId && version === source.sourceDocumentVersion,
    );
    if (document === undefined || document.status === 'draft' || document.status === 'withdrawn') {
      return false;
    }
    const startLine = source.startLine as number;
    const endLine = source.endLine as number;
    if (
      !Number.isInteger(startLine) ||
      !Number.isInteger(endLine) ||
      startLine < 1 ||
      endLine < startLine ||
      endLine > document.lines.length
    ) {
      return false;
    }
    return (
      source.sourceTitle === document.title &&
      source.sourceType === document.sourceType &&
      source.sourceLocator ===
        sourceDocumentLocator(document.id, document.version, startLine, endLine) &&
      source.excerpt === excerptSourceLines(document.lines, startLine, endLine)
    );
  });
}

function matchingBoundaries(
  snapshot: PhaseOneSnapshot,
  question: EmployeeQuestion,
): readonly AuthorityBoundary[] {
  return [...(snapshot.role?.authorityBoundaries ?? [])]
    .filter(
      (boundary) =>
        boundary.roleId === question.roleId &&
        boundary.topicKeys !== undefined &&
        boundary.topicKeys.includes(question.topicKey) &&
        boundary.applicableRequestTypes !== undefined &&
        boundary.applicableRequestTypes.includes(question.requestType),
    )
    .sort(
      (left, right) =>
        BOUNDARY_PRECEDENCE[left.permissionLevel] - BOUNDARY_PRECEDENCE[right.permissionLevel] ||
        left.id.localeCompare(right.id),
    );
}

function questionUrgency(question: EmployeeQuestion): EscalationUrgency | undefined {
  return question.structuredContext.requestType === 'emergency-action'
    ? question.structuredContext.urgency
    : undefined;
}

function matchingRules(
  snapshot: PhaseOneSnapshot,
  question: EmployeeQuestion,
): readonly EscalationRule[] {
  const urgency = questionUrgency(question);
  return [...(snapshot.role?.escalationRules ?? [])]
    .filter(
      (rule) =>
        rule.roleId === question.roleId &&
        rule.topicKeys !== undefined &&
        rule.topicKeys.includes(question.topicKey) &&
        rule.applicableRequestTypes !== undefined &&
        rule.applicableRequestTypes.includes(question.requestType) &&
        (rule.urgencyMatch === undefined || rule.urgencyMatch === urgency) &&
        (rule.sensitivityCategories === undefined ||
          rule.sensitivityCategories.includes(question.sensitivitySelection)),
    )
    .sort(
      (left, right) =>
        URGENCY_PRECEDENCE[left.urgency] - URGENCY_PRECEDENCE[right.urgency] ||
        left.id.localeCompare(right.id),
    );
}

function amountAndCurrency(
  context: StructuredQuestionContext,
): { readonly amount: number; readonly currency: CurrencyCode } | undefined {
  if (context.requestType === 'financial-action') {
    return { amount: context.amount, currency: context.currency };
  }
  if (
    context.requestType === 'customer-commitment' &&
    context.amount !== undefined &&
    context.currency !== undefined
  ) {
    return { amount: context.amount, currency: context.currency };
  }
  return undefined;
}

type AuthorityDisposition =
  | 'informational'
  | 'allowed'
  | 'approval-required'
  | 'mandatory-escalation'
  | 'prohibited'
  | 'unclear';

function authorityDisposition(
  question: EmployeeQuestion,
  boundaries: readonly AuthorityBoundary[],
): AuthorityDisposition {
  if (boundaries.some(({ permissionLevel }) => permissionLevel === 'prohibited')) {
    return 'prohibited';
  }
  if (boundaries.some(({ permissionLevel }) => permissionLevel === 'must-escalate')) {
    return 'mandatory-escalation';
  }
  if (boundaries.some(({ permissionLevel }) => permissionLevel === 'must-request-approval')) {
    return 'approval-required';
  }
  if (isInformationalRequestType(question.requestType)) return 'informational';

  const limited = boundaries.filter(
    ({ permissionLevel }) => permissionLevel === 'may-act-within-limit',
  );
  if (limited.length > 0) {
    const submitted = amountAndCurrency(question.structuredContext);
    if (submitted === undefined) return 'unclear';
    const compatible = limited.filter(
      (boundary) =>
        boundary.structuredConstraintType === 'amount-limit' &&
        typeof boundary.numericLimit === 'number' &&
        Number.isFinite(boundary.numericLimit) &&
        boundary.numericLimit >= 0 &&
        boundary.currency === submitted.currency,
    );
    if (compatible.length === 0) return 'unclear';
    const safestLimit = Math.min(...compatible.map(({ numericLimit }) => numericLimit!));
    return submitted.amount <= safestLimit ? 'allowed' : 'approval-required';
  }

  if (boundaries.some(({ permissionLevel }) => permissionLevel === 'may-decide')) {
    const amount = amountAndCurrency(question.structuredContext);
    return question.requestType === 'financial-action' ||
      question.requestType === 'emergency-action' ||
      amount !== undefined
      ? 'unclear'
      : 'allowed';
  }
  return 'unclear';
}

function answerModeIsSupported(
  question: EmployeeQuestion,
  knowledge: readonly EmployeeVisibleKnowledge[],
): boolean {
  if (question.requestType !== 'procedure-lookup') return true;
  return knowledge.some(({ claim }) => claim.category === 'procedure');
}

export interface PolicyFirewallDecision {
  readonly evaluation: AnswerEligibilityEvaluation;
  readonly eligibleKnowledge: readonly EmployeeVisibleKnowledge[];
  readonly matchingBoundaries: readonly AuthorityBoundary[];
  readonly matchingRules: readonly EscalationRule[];
  readonly answerStatus: AnswerStatus;
  readonly answerMode: AnswerMode;
  readonly responseText: string;
  readonly escalationReason?: EscalationReason;
  readonly escalationUrgency?: EscalationUrgency;
  readonly gapReason?: KnowledgeGapReason;
}

function withheldText(result: AnswerEligibilityResult): string {
  switch (result) {
    case 'withheld-missing-knowledge':
      return 'Answer withheld\nRoleKeep has no current approved company guidance for the selected topic. Human review is required.';
    case 'withheld-conflicting-knowledge':
      return 'Answer withheld\nRoleKeep found an explicit conflict in the selected topic. Human review is required.';
    case 'withheld-invalid-provenance':
      return 'Answer withheld\nCurrent guidance did not pass source and approval provenance checks. Human review is required.';
    case 'withheld-sensitive':
      return 'Answer withheld\nThis request was marked sensitive. Do not paste sensitive values; follow the recorded escalation path.';
    case 'withheld-authority-unclear':
      return 'Answer withheld\nNo compatible structured authority boundary permits this action. Human review is required.';
    case 'withheld-unsupported-request':
      return 'Answer withheld\nThe approved records do not support this request mode. Human review is required.';
    case 'answer-eligible':
    case 'escalation-required':
    case 'prohibited':
      return 'Answer withheld\nRoleKeep cannot deliver guidance for this outcome.';
  }
}

function composeEligibleText(
  question: EmployeeQuestion,
  knowledge: readonly EmployeeVisibleKnowledge[],
  boundaries: readonly AuthorityBoundary[],
): string {
  const guidance = knowledge
    .map(({ claim }, index) => `${index + 1}. ${claim.statement}`)
    .join('\n');
  const authority = isInformationalRequestType(question.requestType)
    ? 'This is informational guidance only. It does not authorize an action.'
    : boundaries.some(({ permissionLevel }) => permissionLevel === 'may-act-within-limit')
      ? 'The submitted structured amount is within the matching recorded authority limit.'
      : 'A matching structured authority boundary permits this request.';
  return `Approved company guidance\n${guidance}\n\nAuthority for this request\n${authority}\n\nSources\nThe cited source references and approval decisions are attached to this answer.`;
}

export function evaluateQuestionPolicy(
  snapshot: PhaseOneSnapshot,
  question: EmployeeQuestion,
  evaluationId: string,
  evaluatedAt: string,
): PolicyFirewallDecision {
  const scopeValid =
    snapshot.company !== null &&
    snapshot.role !== null &&
    snapshot.role.status === 'active' &&
    question.companyId === snapshot.company.id &&
    question.roleId === snapshot.role.id;
  const topicValid = isOperationalTopicKey(question.topicKey);
  const requestTypeValid = isEmployeeQuestionRequestType(question.requestType);
  const contextValidation = requestTypeValid
    ? validateStructuredQuestionContext(question.requestType, question.structuredContext)
    : domainFailure('invalid-request-type', 'Choose a valid request type.', 'requestType');
  const contextValid = contextValidation.ok;
  const currentApprovedClaims = currentApprovedClaimsForTopic(snapshot, question);
  const visibleById = new Map(
    selectEmployeeVisibleKnowledge(snapshot).map((knowledge) => [knowledge.claim.id, knowledge]),
  );
  const eligibleKnowledge = currentApprovedClaims.flatMap((claim) => {
    const knowledge = visibleById.get(claim.id);
    return knowledge === undefined ? [] : [knowledge];
  });
  const provenanceValid =
    currentApprovedClaims.length > 0 &&
    eligibleKnowledge.length === currentApprovedClaims.length &&
    eligibleKnowledge.every((knowledge) => sourceProvenanceIsValid(snapshot, knowledge));
  const conflicts = snapshot.knowledgeClaims
    .filter(
      (claim) =>
        claim.companyId === question.companyId &&
        claim.roleId === question.roleId &&
        claim.topicKey === question.topicKey &&
        claim.lifecycleStatus === 'conflicting-information',
    )
    .sort((left, right) => left.id.localeCompare(right.id));
  const boundaries = matchingBoundaries(snapshot, question);
  const rules = matchingRules(snapshot, question);
  const authority = authorityDisposition(question, boundaries);
  const supportedMode = answerModeIsSupported(question, eligibleKnowledge);

  let overallResult: AnswerEligibilityResult;
  let answerStatus: AnswerStatus;
  let answerMode: AnswerMode;
  let responseText: string;
  let escalationReason: EscalationReason | undefined;
  let escalationUrgency: EscalationUrgency | undefined;
  let gapReason: KnowledgeGapReason | undefined;

  if (!scopeValid || !topicValid || !contextValid) {
    overallResult = 'withheld-unsupported-request';
    answerStatus = 'withheld';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'unsupported-request';
    escalationUrgency = 'routine';
  } else if (question.sensitivitySelection !== 'none') {
    overallResult = 'withheld-sensitive';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'sensitive-context';
    escalationUrgency = rules[0]?.urgency ?? 'immediate';
  } else if (authority === 'prohibited') {
    overallResult = 'prohibited';
    answerStatus = 'prohibited';
    answerMode = 'prohibited-action';
    responseText =
      'Prohibited action\nThe matching structured authority boundary prohibits this request. Do not proceed.';
  } else if (
    authority === 'mandatory-escalation' ||
    authority === 'approval-required' ||
    rules.length > 0
  ) {
    overallResult = 'escalation-required';
    answerStatus = 'escalated';
    answerMode = 'known-escalation';
    responseText =
      'Owner approval\nA matching structured authority boundary or escalation rule requires human action. RoleKeep has withheld action guidance.';
    escalationReason =
      question.requestType === 'emergency-action'
        ? 'emergency'
        : authority === 'approval-required'
          ? 'approval-required'
          : 'mandatory-escalation';
    escalationUrgency = rules[0]?.urgency ?? questionUrgency(question) ?? 'same-day';
  } else if (currentApprovedClaims.length === 0) {
    overallResult = 'withheld-missing-knowledge';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'missing-knowledge';
    escalationUrgency = 'same-day';
    gapReason = 'missing-evidence';
  } else if (!provenanceValid) {
    overallResult = 'withheld-invalid-provenance';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'invalid-provenance';
    escalationUrgency = 'same-day';
    gapReason = 'invalid-provenance';
  } else if (conflicts.length > 0) {
    overallResult = 'withheld-conflicting-knowledge';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'conflicting-knowledge';
    escalationUrgency = 'same-day';
    gapReason = 'conflicting-evidence';
  } else if (authority === 'unclear') {
    overallResult = 'withheld-authority-unclear';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'authority-unclear';
    escalationUrgency = 'same-day';
    gapReason = 'authority-unclear';
  } else if (!supportedMode) {
    overallResult = 'withheld-unsupported-request';
    answerStatus = 'escalated';
    answerMode = 'withheld';
    responseText = withheldText(overallResult);
    escalationReason = 'unsupported-request';
    escalationUrgency = 'same-day';
    gapReason = 'unsupported-request';
  } else {
    overallResult = 'answer-eligible';
    answerStatus = 'delivered';
    answerMode = isInformationalRequestType(question.requestType)
      ? 'approved-guidance'
      : 'approved-guidance-with-authority';
    responseText = composeEligibleText(question, eligibleKnowledge, boundaries);
  }

  const terminalBeforeKnowledge =
    !scopeValid ||
    !topicValid ||
    !contextValid ||
    question.sensitivitySelection !== 'none' ||
    authority === 'prohibited' ||
    authority === 'mandatory-escalation' ||
    authority === 'approval-required' ||
    rules.length > 0;
  const gateResults: readonly AnswerEligibilityGateResult[] = [
    gate(
      'scope-valid',
      scopeValid ? 'pass' : 'fail',
      scopeValid ? 'Question matches the active company and role.' : 'Question scope is invalid.',
      scopeValid ? [question.companyId, question.roleId] : [],
    ),
    gate(
      'topic-valid',
      topicValid ? 'pass' : 'fail',
      topicValid ? 'The explicit operational topic is valid.' : 'The topic is invalid.',
      topicValid ? [question.topicKey] : [],
    ),
    gate(
      'request-context-valid',
      contextValid ? 'pass' : 'fail',
      contextValid
        ? 'The explicit request type and structured context are valid.'
        : 'Structured request context is invalid.',
    ),
    gate(
      'current-approved-knowledge-present',
      terminalBeforeKnowledge
        ? 'not-applicable'
        : currentApprovedClaims.length > 0
          ? 'pass'
          : 'fail',
      terminalBeforeKnowledge
        ? 'An earlier policy outcome does not require approved guidance retrieval.'
        : currentApprovedClaims.length > 0
          ? 'Current approved same-topic knowledge exists.'
          : 'No current approved same-topic knowledge exists.',
      currentApprovedClaims.map(({ id }) => id),
    ),
    gate(
      'provenance-valid',
      terminalBeforeKnowledge || currentApprovedClaims.length === 0
        ? 'not-applicable'
        : provenanceValid
          ? 'pass'
          : 'fail',
      terminalBeforeKnowledge || currentApprovedClaims.length === 0
        ? 'Provenance is not applicable without retrieved approved guidance.'
        : provenanceValid
          ? 'Every retrieved claim has valid source and exact approval provenance.'
          : 'At least one retrieved claim has invalid source or approval provenance.',
      eligibleKnowledge.flatMap(({ sourceReferences, approvalDecisions }) => [
        ...sourceReferences.map(({ id }) => id),
        ...approvalDecisions.map(({ id }) => id),
      ]),
    ),
    gate(
      'no-explicit-conflict',
      terminalBeforeKnowledge ? 'not-applicable' : conflicts.length === 0 ? 'pass' : 'fail',
      terminalBeforeKnowledge
        ? 'Conflict inspection is not applicable after an earlier policy outcome.'
        : conflicts.length === 0
          ? 'No explicit same-topic conflict record exists.'
          : 'Explicit same-topic conflicting knowledge exists.',
      conflicts.map(({ id }) => id),
    ),
    gate(
      'sensitivity-clear',
      question.sensitivitySelection === 'none' ? 'pass' : 'fail',
      question.sensitivitySelection === 'none'
        ? 'The employee selected no sensitive category.'
        : 'The employee selected a sensitive category; answer delivery is blocked.',
      rules.map(({ id }) => id),
    ),
    gate(
      'authority-clear',
      authority === 'informational'
        ? 'not-applicable'
        : authority === 'allowed' || authority === 'prohibited'
          ? 'pass'
          : 'fail',
      authority === 'informational'
        ? 'Informational guidance does not grant action authority.'
        : authority === 'allowed'
          ? 'A compatible structured authority boundary permits the request.'
          : authority === 'prohibited'
            ? 'A structured authority boundary explicitly prohibits the request.'
            : authority === 'approval-required' || authority === 'mandatory-escalation'
              ? 'A structured authority boundary requires human action.'
              : 'No compatible structured authority boundary permits the request.',
      boundaries.map(({ id }) => id),
    ),
    gate(
      'escalation-rule-clear',
      rules.length === 0 ? 'pass' : 'fail',
      rules.length === 0
        ? 'No matching structured escalation rule requires routing.'
        : 'A matching structured escalation rule requires routing.',
      rules.map(({ id }) => id),
    ),
    gate(
      'answer-mode-supported',
      overallResult === 'answer-eligible'
        ? 'pass'
        : overallResult === 'withheld-unsupported-request'
          ? 'fail'
          : 'not-applicable',
      overallResult === 'answer-eligible'
        ? 'A fixed deterministic answer mode is supported.'
        : overallResult === 'withheld-unsupported-request'
          ? 'The approved records do not support this request mode.'
          : 'Answer mode is not applicable to this earlier policy outcome.',
    ),
  ];

  const eligibleClaimIds = eligibleKnowledge.map(({ claim }) => claim.id);
  const eligibleSourceReferenceIds = uniqueStable(
    eligibleKnowledge.flatMap(({ sourceReferences }) =>
      sourceReferences.map(({ id }) => id).sort((left, right) => left.localeCompare(right)),
    ),
  );
  const approvalDecisionIds = uniqueStable(
    eligibleKnowledge.flatMap(({ approvalDecisions }) =>
      approvalDecisions.map(({ id }) => id).sort((left, right) => left.localeCompare(right)),
    ),
  );
  const evaluation: AnswerEligibilityEvaluation = {
    id: evaluationId,
    questionId: question.id,
    evaluatedAt,
    overallResult,
    gateResults,
    eligibleClaimIds,
    eligibleSourceReferenceIds,
    approvalDecisionIds,
    matchingAuthorityBoundaryIds: boundaries.map(({ id }) => id),
    matchingEscalationRuleIds: rules.map(({ id }) => id),
    ...(overallResult.startsWith('withheld-') ? { withholdReason: overallResult } : {}),
    correlationId: question.correlationId,
  };

  return {
    evaluation,
    eligibleKnowledge,
    matchingBoundaries: boundaries,
    matchingRules: rules,
    answerStatus,
    answerMode,
    responseText,
    ...(escalationReason === undefined ? {} : { escalationReason }),
    ...(escalationUrgency === undefined ? {} : { escalationUrgency }),
    ...(gapReason === undefined ? {} : { gapReason }),
  };
}
