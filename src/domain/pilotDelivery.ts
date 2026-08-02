import type {
  ActivityEvent,
  Answer,
  AnswerEligibilityEvaluation,
  ApprovalDecision,
  AuthorityBoundary,
  Company,
  EmployeeQuestion,
  Escalation,
  EscalationRule,
  KnowledgeGap,
  OperationalRiskTier,
  OperationalTopic,
  PhaseOneSnapshot,
  Responsibility,
  Role,
  SourceDocument,
  SourceReference,
  TopicCoverageState,
} from './entities';
import { evaluateTopicCoverage } from './coverage';
import { selectEmployeeVisibleKnowledge } from './employeeVisibility';
import { OPERATIONAL_TOPICS, operationalRiskPriority } from './operationalTopics';
import { domainFailure, domainSuccess, type DomainResult } from './result';

export const PILOT_HANDOFF_SCHEMA_VERSION = 'relayos-pilot-handoff/v1' as const;

const ACTIVE_GAP_STATUSES = new Set(['open', 'question-ready', 'answered', 'proposal-created']);
const ACTIVE_ESCALATION_STATUSES = new Set(['open', 'assigned']);

export interface PilotDemoCounts {
  readonly responsibilities: number;
  readonly authorityBoundaries: number;
  readonly escalationRules: number;
  readonly sourceDocuments: number;
  readonly sourceReferences: number;
  readonly approvedKnowledge: number;
  readonly coverageTopics: number;
  readonly openGaps: number;
  readonly employeeQuestions: number;
  readonly answers: number;
  readonly deliveredAnswers: number;
  readonly escalations: number;
  readonly activeEscalations: number;
  readonly questionLinkedGaps: number;
  readonly approvalDecisions: number;
  readonly activityEvents: number;
}

export interface ApprovedGuidanceGroup {
  readonly topic: OperationalTopic | null;
  readonly items: ReturnType<typeof selectEmployeeVisibleKnowledge>;
}

export interface RoleTransferPriority {
  readonly id: string;
  readonly source: 'knowledge-gap' | 'escalation';
  readonly title: string;
  readonly detail: string;
  readonly riskTier: OperationalRiskTier;
}

export interface PilotCoverageExport {
  readonly topicKey: string;
  readonly topicLabel: string;
  readonly riskTier: OperationalRiskTier;
  readonly state: TopicCoverageState;
  readonly approvedClaimId?: string;
  readonly gapId?: string;
  readonly candidateCount: number;
  readonly conflictingCount: number;
}

export type PilotSourceDocumentExport = Omit<SourceDocument, 'content' | 'lines'> & {
  readonly content?: string;
  readonly lines?: SourceDocument['lines'];
};

export type PilotSourceReferenceExport = Omit<SourceReference, 'excerpt'> & {
  readonly excerpt?: string;
};

export interface PilotQuestionExport {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly topicKey: EmployeeQuestion['topicKey'];
  readonly requestType: EmployeeQuestion['requestType'];
  readonly sensitivitySelection: EmployeeQuestion['sensitivitySelection'];
  readonly status: EmployeeQuestion['status'];
  readonly submittedAt: string;
  readonly correctsQuestionId?: string;
  readonly correlationId: string;
}

export interface PilotEscalationExport {
  readonly id: string;
  readonly companyId: string;
  readonly roleId: string;
  readonly questionId: string;
  readonly reason: Escalation['reason'];
  readonly urgency: Escalation['urgency'];
  readonly destination: string;
  readonly requiredContextLabels: readonly string[];
  readonly status: Escalation['status'];
  readonly createdAt: string;
  readonly assignedAt?: string;
  readonly resolvedAt?: string;
  readonly relatedGapId?: string;
  readonly matchingBoundaryIds: readonly string[];
  readonly matchingEscalationRuleIds: readonly string[];
  readonly correlationId: string;
}

export interface PilotHandoffPackage {
  readonly schemaVersion: typeof PILOT_HANDOFF_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly company: Company | null;
  readonly role: Omit<Role, 'responsibilities' | 'authorityBoundaries' | 'escalationRules'> | null;
  readonly responsibilities: readonly Responsibility[];
  readonly authorityBoundaries: readonly AuthorityBoundary[];
  readonly escalationRules: readonly EscalationRule[];
  readonly sourceMetadata: {
    readonly documents: readonly PilotSourceDocumentExport[];
    readonly references: readonly PilotSourceReferenceExport[];
    readonly includesSourceText: boolean;
  };
  readonly approvedKnowledge: readonly {
    readonly claim: ReturnType<typeof selectEmployeeVisibleKnowledge>[number]['claim'];
    readonly sourceReferenceIds: readonly string[];
    readonly approvalDecisionIds: readonly string[];
  }[];
  readonly approvalDecisions: readonly ApprovalDecision[];
  readonly coverageStates: readonly PilotCoverageExport[];
  readonly gaps: readonly Omit<KnowledgeGap, 'dismissedReason'>[];
  readonly questions: readonly PilotQuestionExport[];
  readonly evaluations: readonly AnswerEligibilityEvaluation[];
  readonly answers: readonly Answer[];
  readonly escalations: readonly PilotEscalationExport[];
  readonly safeActivityEvents: readonly ActivityEvent[];
  readonly limitations: readonly string[];
}

function copyStrings<T extends string>(values: readonly T[]): readonly T[] {
  return [...values];
}

function cloneCompany(company: Company | null): Company | null {
  return company === null
    ? null
    : {
        ...company,
        contactInformation: { ...company.contactInformation },
      };
}

function cloneRoleIdentity(
  role: Role | null,
): Omit<Role, 'responsibilities' | 'authorityBoundaries' | 'escalationRules'> | null {
  if (role === null) return null;
  return {
    id: role.id,
    companyId: role.companyId,
    title: role.title,
    mission: role.mission,
    status: role.status,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  };
}

export function derivePilotDemoCounts(snapshot: PhaseOneSnapshot): DomainResult<PilotDemoCounts> {
  const coverage = evaluateTopicCoverage(snapshot);
  if (!coverage.ok) return coverage;

  const approvedKnowledge = selectEmployeeVisibleKnowledge(snapshot);
  const openGaps = snapshot.knowledgeGaps.filter(({ status }) => ACTIVE_GAP_STATUSES.has(status));

  return domainSuccess({
    responsibilities: snapshot.role?.responsibilities.length ?? 0,
    authorityBoundaries: snapshot.role?.authorityBoundaries.length ?? 0,
    escalationRules: snapshot.role?.escalationRules.length ?? 0,
    sourceDocuments: snapshot.sourceDocuments.length,
    sourceReferences: snapshot.sourceReferences.length,
    approvedKnowledge: approvedKnowledge.length,
    coverageTopics: coverage.value.length,
    openGaps: openGaps.length,
    employeeQuestions: snapshot.employeeQuestions.length,
    answers: snapshot.answers.length,
    deliveredAnswers: snapshot.answers.filter(({ status }) => status === 'delivered').length,
    escalations: snapshot.escalations.length,
    activeEscalations: snapshot.escalations.filter(({ status }) =>
      ACTIVE_ESCALATION_STATUSES.has(status),
    ).length,
    questionLinkedGaps: openGaps.filter(
      ({ triggeringQuestionIds }) => (triggeringQuestionIds?.length ?? 0) > 0,
    ).length,
    approvalDecisions: snapshot.approvalDecisions.length,
    activityEvents: snapshot.activityEvents.length,
  });
}

export function groupApprovedGuidance(
  snapshot: PhaseOneSnapshot,
): readonly ApprovedGuidanceGroup[] {
  const approved = selectEmployeeVisibleKnowledge(snapshot);
  const groups = OPERATIONAL_TOPICS.flatMap((topic) => {
    const items = approved.filter(({ claim }) => claim.topicKey === topic.key);
    return items.length === 0 ? [] : [{ topic, items }];
  });
  const uncategorized = approved.filter(({ claim }) => claim.topicKey === undefined);
  return uncategorized.length === 0 ? groups : [...groups, { topic: null, items: uncategorized }];
}

function topicLabel(topicKey: KnowledgeGap['topicKey']): string {
  return OPERATIONAL_TOPICS.find(({ key }) => key === topicKey)?.label ?? topicKey;
}

function escalationRisk(escalation: Escalation): OperationalRiskTier {
  if (escalation.urgency === 'immediate') return 'critical';
  if (escalation.urgency === 'same-day') return 'high';
  return 'normal';
}

export function deriveRoleTransferPriorities(
  snapshot: PhaseOneSnapshot,
): readonly RoleTransferPriority[] {
  const gaps = snapshot.knowledgeGaps
    .filter(
      ({ status, riskTier }) =>
        ACTIVE_GAP_STATUSES.has(status) && (riskTier === 'critical' || riskTier === 'high'),
    )
    .map((gap): RoleTransferPriority => ({
      id: gap.id,
      source: 'knowledge-gap',
      title: `Resolve the ${topicLabel(gap.topicKey)} knowledge gap`,
      detail: gap.description,
      riskTier: gap.riskTier,
    }));
  const escalations = snapshot.escalations
    .filter(({ status }) => ACTIVE_ESCALATION_STATUSES.has(status))
    .map((escalation): RoleTransferPriority => {
      const question = snapshot.employeeQuestions.find(({ id }) => id === escalation.questionId);
      const label = question === undefined ? 'recorded' : topicLabel(question.topicKey);
      return {
        id: escalation.id,
        source: 'escalation',
        title: `Resolve the ${label} escalation`,
        detail: `${escalation.reason.replaceAll('-', ' ')} routed to ${escalation.destination}.`,
        riskTier: escalationRisk(escalation),
      };
    });

  return [...gaps, ...escalations].sort(
    (left, right) =>
      operationalRiskPriority(left.riskTier) - operationalRiskPriority(right.riskTier) ||
      left.source.localeCompare(right.source) ||
      left.id.localeCompare(right.id),
  );
}

function exportSourceDocument(
  document: SourceDocument,
  includeSourceText: boolean,
): PilotSourceDocumentExport {
  const { content, lines, ...metadata } = document;
  return includeSourceText
    ? {
        ...metadata,
        content,
        lines: lines.map((line) => ({ ...line })),
      }
    : metadata;
}

function exportSourceReference(
  reference: SourceReference,
  includeSourceText: boolean,
): PilotSourceReferenceExport {
  const { excerpt, ...metadata } = reference;
  return includeSourceText && excerpt !== undefined ? { ...metadata, excerpt } : metadata;
}

function exportGap(gap: KnowledgeGap): Omit<KnowledgeGap, 'dismissedReason'> {
  const { dismissedReason: _dismissedReason, ...safeGap } = gap;
  void _dismissedReason;
  return {
    ...safeGap,
    supportingSourceReferenceIds: copyStrings(gap.supportingSourceReferenceIds),
    relatedClaimIds: copyStrings(gap.relatedClaimIds),
    ...(gap.triggeringQuestionIds === undefined
      ? {}
      : { triggeringQuestionIds: copyStrings(gap.triggeringQuestionIds) }),
    ...(gap.eligibilityEvaluationIds === undefined
      ? {}
      : { eligibilityEvaluationIds: copyStrings(gap.eligibilityEvaluationIds) }),
  };
}

function exportQuestion(question: EmployeeQuestion): PilotQuestionExport {
  return {
    id: question.id,
    companyId: question.companyId,
    roleId: question.roleId,
    topicKey: question.topicKey,
    requestType: question.requestType,
    sensitivitySelection: question.sensitivitySelection,
    status: question.status,
    submittedAt: question.submittedAt,
    ...(question.correctsQuestionId === undefined
      ? {}
      : { correctsQuestionId: question.correctsQuestionId }),
    correlationId: question.correlationId,
  };
}

function exportEscalation(escalation: Escalation): PilotEscalationExport {
  return {
    id: escalation.id,
    companyId: escalation.companyId,
    roleId: escalation.roleId,
    questionId: escalation.questionId,
    reason: escalation.reason,
    urgency: escalation.urgency,
    destination: escalation.destination,
    requiredContextLabels: escalation.requiredContext.map(({ label }) => label),
    status: escalation.status,
    createdAt: escalation.createdAt,
    ...(escalation.assignedAt === undefined ? {} : { assignedAt: escalation.assignedAt }),
    ...(escalation.resolvedAt === undefined ? {} : { resolvedAt: escalation.resolvedAt }),
    ...(escalation.relatedGapId === undefined ? {} : { relatedGapId: escalation.relatedGapId }),
    matchingBoundaryIds: copyStrings(escalation.matchingBoundaryIds),
    matchingEscalationRuleIds: copyStrings(escalation.matchingEscalationRuleIds),
    correlationId: escalation.correlationId,
  };
}

export function createPilotHandoffPackage(
  snapshot: PhaseOneSnapshot,
  options: { readonly exportedAt: string; readonly includeSourceText?: boolean },
): DomainResult<PilotHandoffPackage> {
  if (!Number.isFinite(Date.parse(options.exportedAt))) {
    return domainFailure(
      'validation-error',
      'Export time must be a valid date-time.',
      'exportedAt',
    );
  }

  const coverage = evaluateTopicCoverage(snapshot);
  if (!coverage.ok) return coverage;
  const includeSourceText = options.includeSourceText === true;
  const approved = selectEmployeeVisibleKnowledge(snapshot);
  const role = snapshot.role;

  return domainSuccess({
    schemaVersion: PILOT_HANDOFF_SCHEMA_VERSION,
    exportedAt: options.exportedAt,
    company: cloneCompany(snapshot.company),
    role: cloneRoleIdentity(role),
    responsibilities: role?.responsibilities.map((responsibility) => ({ ...responsibility })) ?? [],
    authorityBoundaries:
      role?.authorityBoundaries.map((boundary) => ({
        ...boundary,
        ...(boundary.topicKeys === undefined ? {} : { topicKeys: copyStrings(boundary.topicKeys) }),
        ...(boundary.applicableRequestTypes === undefined
          ? {}
          : { applicableRequestTypes: copyStrings(boundary.applicableRequestTypes) }),
      })) ?? [],
    escalationRules:
      role?.escalationRules.map((rule) => ({
        ...rule,
        ...(rule.topicKeys === undefined ? {} : { topicKeys: copyStrings(rule.topicKeys) }),
        ...(rule.applicableRequestTypes === undefined
          ? {}
          : { applicableRequestTypes: copyStrings(rule.applicableRequestTypes) }),
        ...(rule.sensitivityCategories === undefined
          ? {}
          : { sensitivityCategories: copyStrings(rule.sensitivityCategories) }),
      })) ?? [],
    sourceMetadata: {
      documents: snapshot.sourceDocuments.map((document) =>
        exportSourceDocument(document, includeSourceText),
      ),
      references: snapshot.sourceReferences.map((reference) =>
        exportSourceReference(reference, includeSourceText),
      ),
      includesSourceText: includeSourceText,
    },
    approvedKnowledge: approved.map(({ claim, sourceReferences, approvalDecisions }) => ({
      claim: { ...claim, sourceReferenceIds: copyStrings(claim.sourceReferenceIds) },
      sourceReferenceIds: sourceReferences.map(({ id }) => id),
      approvalDecisionIds: approvalDecisions.map(({ id }) => id),
    })),
    approvalDecisions: snapshot.approvalDecisions.map((decision) => ({ ...decision })),
    coverageStates: coverage.value.map((entry) => ({
      topicKey: entry.topic.key,
      topicLabel: entry.topic.label,
      riskTier: entry.topic.riskTier,
      state: entry.state,
      ...(entry.approvedClaim === undefined ? {} : { approvedClaimId: entry.approvedClaim.id }),
      ...(entry.gap === undefined ? {} : { gapId: entry.gap.id }),
      candidateCount: entry.candidateClaims.length,
      conflictingCount: entry.conflictingClaims.length,
    })),
    gaps: snapshot.knowledgeGaps.map(exportGap),
    questions: snapshot.employeeQuestions.map(exportQuestion),
    evaluations: snapshot.answerEligibilityEvaluations.map((evaluation) => ({
      ...evaluation,
      gateResults: evaluation.gateResults.map((gate) => ({
        ...gate,
        supportingRecordIds: copyStrings(gate.supportingRecordIds),
      })),
      eligibleClaimIds: copyStrings(evaluation.eligibleClaimIds),
      eligibleSourceReferenceIds: copyStrings(evaluation.eligibleSourceReferenceIds),
      approvalDecisionIds: copyStrings(evaluation.approvalDecisionIds),
      matchingAuthorityBoundaryIds: copyStrings(evaluation.matchingAuthorityBoundaryIds),
      matchingEscalationRuleIds: copyStrings(evaluation.matchingEscalationRuleIds),
    })),
    answers: snapshot.answers.map((answer) => ({
      ...answer,
      citedClaimIds: copyStrings(answer.citedClaimIds),
      citedSourceReferenceIds: copyStrings(answer.citedSourceReferenceIds),
      citedApprovalDecisionIds: copyStrings(answer.citedApprovalDecisionIds),
      citedAuthorityBoundaryIds: copyStrings(answer.citedAuthorityBoundaryIds),
    })),
    escalations: snapshot.escalations.map(exportEscalation),
    safeActivityEvents: snapshot.activityEvents.map((event) => ({
      ...event,
      metadata: { ...event.metadata },
    })),
    limitations: [
      'This package was exported from current browser memory and is not durable storage.',
      'Phase 4 does not provide import, authentication, authorization, or multi-user history.',
      includeSourceText
        ? 'Source text was included only because the owner explicitly confirmed that option.'
        : 'Raw source text and source-reference excerpts were excluded by default.',
      'Raw employee question text and structured free-text context are excluded.',
    ],
  });
}

export function pilotHandoffFilename(companyName: string | undefined): string {
  const safeBase = (companyName ?? 'company')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return `${safeBase.length === 0 ? 'company' : safeBase}-relayos-pilot-handoff.json`;
}

export function serializePilotHandoffPackage(pilotPackage: PilotHandoffPackage): string {
  return `${JSON.stringify(pilotPackage, null, 2)}\n`;
}
