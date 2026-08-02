import {
  OPERATIONAL_TOPICS,
  PhaseOneService,
  numberSourceLines,
  operationalRiskPriority,
  ownerInterviewLocator,
  sourceDocumentLocator,
  type ApprovalDecision,
  type DomainResult,
  type EmployeeQuestionInput,
  type KnowledgeClaim,
  type KnowledgeGap,
  type PhaseOneSnapshot,
  type QuestionEvaluationOutcome,
  type SourceDocument,
  type SourceReference,
} from '../domain';
import { InMemoryPhaseOneRepository } from '../infrastructure';

export const SUMMIT_COMFORT_DEMO_COMPANY_ID = 'demo-company-summit-comfort';
export const SUMMIT_COMFORT_DEMO_ROLE_ID = 'demo-role-office-manager-dispatcher';

const CREATED_AT = '2026-08-01T12:00:00.000Z';
const APPROVED_AT = '2026-08-01T12:15:00.000Z';
const REJECTED_AT = '2026-08-01T12:20:00.000Z';
const ANSWERED_AT = '2026-08-01T12:25:00.000Z';
const PHASE_THREE_KNOWLEDGE_AT = '2026-08-01T12:30:00.000Z';

const JOB_DESCRIPTION_V1 = [
  'Coordinate incoming calls and maintain the service schedule.',
  'Record customer contact, service address, equipment, and reported symptoms.',
].join('\n');
const JOB_DESCRIPTION_V2 = [
  'Coordinate incoming calls and maintain the service schedule.',
  'Record customer contact, service address, equipment, reported symptoms, and access notes.',
  'Use only approved instructions and escalate missing authority to the owner.',
].join('\n');
const DISPATCH_CHECKLIST = [
  'Confirm the dispatch board at the start of the service day.',
  'Contact the customer when a technician will arrive more than 30 minutes late.',
  'Record the revised arrival window and customer contact time.',
].join('\n');
const CUSTOMER_POLICY = [
  'Hazard reports are escalated immediately; office staff do not troubleshoot the hazard.',
  'Only the owner may authorize a discount, waived fee, or service credit.',
  'The current cancellation fee inside 24 hours is $95.',
].join('\n');

const DEMO_DOCUMENTS: readonly SourceDocument[] = [
  {
    id: 'demo-document-job-description-v1',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    title: 'Office manager job description (fictional)',
    sourceType: 'job-description',
    supplierLabel: 'Fictional owner',
    captureMethod: 'manual-paste',
    content: JOB_DESCRIPTION_V1,
    lines: numberSourceLines(JOB_DESCRIPTION_V1),
    version: 1,
    status: 'superseded',
    createdAt: CREATED_AT,
    updatedAt: APPROVED_AT,
  },
  {
    id: 'demo-document-job-description-v2',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    title: 'Office manager job description (fictional)',
    sourceType: 'job-description',
    supplierLabel: 'Fictional owner',
    captureMethod: 'manual-paste',
    content: JOB_DESCRIPTION_V2,
    lines: numberSourceLines(JOB_DESCRIPTION_V2),
    version: 2,
    status: 'available',
    createdAt: APPROVED_AT,
    updatedAt: APPROVED_AT,
    supersedesDocumentId: 'demo-document-job-description-v1',
  },
  {
    id: 'demo-document-dispatch-checklist',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    title: 'Daily dispatch checklist (fictional)',
    sourceType: 'checklist',
    supplierLabel: 'Fictional service manager',
    captureMethod: 'manual-paste',
    content: DISPATCH_CHECKLIST,
    lines: numberSourceLines(DISPATCH_CHECKLIST),
    version: 1,
    status: 'available',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 'demo-document-customer-policy',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    title: 'Customer handling policy (fictional)',
    sourceType: 'policy',
    supplierLabel: 'Fictional owner',
    captureMethod: 'manual-paste',
    content: CUSTOMER_POLICY,
    lines: numberSourceLines(CUSTOMER_POLICY),
    version: 1,
    status: 'available',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
];

const DEMO_ANCHORED_REFERENCES: readonly SourceReference[] = [
  {
    id: 'demo-source-job-v1-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Office manager job description (fictional)',
    sourceType: 'job-description',
    sourceLocator: sourceDocumentLocator('demo-document-job-description-v1', 1, 1, 2),
    excerpt: JOB_DESCRIPTION_V1,
    recordedAt: CREATED_AT,
    sourceDocumentId: 'demo-document-job-description-v1',
    sourceDocumentVersion: 1,
    startLine: 1,
    endLine: 2,
  },
  {
    id: 'demo-source-job-v2-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Office manager job description (fictional)',
    sourceType: 'job-description',
    sourceLocator: sourceDocumentLocator('demo-document-job-description-v2', 2, 2, 3),
    excerpt: numberSourceLines(JOB_DESCRIPTION_V2)
      .slice(1, 3)
      .map(({ text }) => text)
      .join('\n'),
    recordedAt: APPROVED_AT,
    sourceDocumentId: 'demo-document-job-description-v2',
    sourceDocumentVersion: 2,
    startLine: 2,
    endLine: 3,
  },
  {
    id: 'demo-source-checklist-late-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Daily dispatch checklist (fictional)',
    sourceType: 'checklist',
    sourceLocator: sourceDocumentLocator('demo-document-dispatch-checklist', 1, 2, 3),
    excerpt:
      'Contact the customer when a technician will arrive more than 30 minutes late.\nRecord the revised arrival window and customer contact time.',
    recordedAt: CREATED_AT,
    sourceDocumentId: 'demo-document-dispatch-checklist',
    sourceDocumentVersion: 1,
    startLine: 2,
    endLine: 3,
  },
  {
    id: 'demo-source-policy-safety-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Customer handling policy (fictional)',
    sourceType: 'policy',
    sourceLocator: sourceDocumentLocator('demo-document-customer-policy', 1, 1, 1),
    excerpt:
      'Hazard reports are escalated immediately; office staff do not troubleshoot the hazard.',
    recordedAt: CREATED_AT,
    sourceDocumentId: 'demo-document-customer-policy',
    sourceDocumentVersion: 1,
    startLine: 1,
    endLine: 1,
  },
  {
    id: 'demo-source-policy-discount-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Customer handling policy (fictional)',
    sourceType: 'policy',
    sourceLocator: sourceDocumentLocator('demo-document-customer-policy', 1, 2, 2),
    excerpt: 'Only the owner may authorize a discount, waived fee, or service credit.',
    recordedAt: CREATED_AT,
    sourceDocumentId: 'demo-document-customer-policy',
    sourceDocumentVersion: 1,
    startLine: 2,
    endLine: 2,
  },
  {
    id: 'demo-source-policy-fee-anchor',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Customer handling policy (fictional)',
    sourceType: 'policy',
    sourceLocator: sourceDocumentLocator('demo-document-customer-policy', 1, 3, 3),
    excerpt: 'The current cancellation fee inside 24 hours is $95.',
    recordedAt: CREATED_AT,
    sourceDocumentId: 'demo-document-customer-policy',
    sourceDocumentVersion: 1,
    startLine: 3,
    endLine: 3,
  },
];

const PHASE_THREE_SOURCE_REFERENCES: readonly SourceReference[] = [
  {
    id: 'demo-source-phase-three-scheduling-policy',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Same-day scheduling authority note (fictional)',
    sourceType: 'owner-note',
    sourceLocator: 'Manual entry: Phase 3 scheduling policy, section 1',
    excerpt:
      'The dispatcher may move a non-emergency appointment within the same service day when the customer and technician are notified.',
    recordedAt: PHASE_THREE_KNOWLEDGE_AT,
  },
  {
    id: 'demo-source-phase-three-payment-limit',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Payment adjustment authority note (fictional)',
    sourceType: 'owner-note',
    sourceLocator: 'Manual entry: Phase 3 payment policy, section 1',
    excerpt:
      'The dispatcher may waive a payment-processing fee up to USD 100; larger amounts require owner approval.',
    recordedAt: PHASE_THREE_KNOWLEDGE_AT,
  },
  {
    id: 'demo-source-phase-three-pricing-current',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Current diagnostic estimate note (fictional)',
    sourceType: 'owner-note',
    sourceLocator: 'Manual entry: Phase 3 pricing note, current',
    excerpt: 'The standard diagnostic estimate is USD 89 before approved additions.',
    recordedAt: PHASE_THREE_KNOWLEDGE_AT,
  },
  {
    id: 'demo-source-phase-three-pricing-conflict',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    sourceTitle: 'Unresolved diagnostic estimate note (fictional)',
    sourceType: 'owner-note',
    sourceLocator: 'Manual entry: Phase 3 pricing note, unresolved',
    excerpt: 'The standard diagnostic estimate is USD 79.',
    recordedAt: PHASE_THREE_KNOWLEDGE_AT,
  },
];

const PHASE_THREE_KNOWLEDGE_CLAIMS: readonly KnowledgeClaim[] = [
  {
    id: 'demo-claim-phase-three-scheduling-guidance',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    statement:
      'A dispatcher may move a non-emergency appointment within the same service day after notifying the customer and technician.',
    category: 'decision-rule',
    provenance: 'owner-authored',
    lifecycleStatus: 'approved',
    sourceReferenceIds: ['demo-source-phase-three-scheduling-policy'],
    createdAt: PHASE_THREE_KNOWLEDGE_AT,
    updatedAt: PHASE_THREE_KNOWLEDGE_AT,
    version: 1,
    topicKey: 'scheduling',
  },
  {
    id: 'demo-claim-phase-three-payment-limit',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    statement:
      'A dispatcher may waive a payment-processing fee up to USD 100; a larger amount requires owner approval.',
    category: 'authority-boundary',
    provenance: 'owner-authored',
    lifecycleStatus: 'approved',
    sourceReferenceIds: ['demo-source-phase-three-payment-limit'],
    createdAt: PHASE_THREE_KNOWLEDGE_AT,
    updatedAt: PHASE_THREE_KNOWLEDGE_AT,
    version: 1,
    topicKey: 'payments',
  },
  {
    id: 'demo-claim-phase-three-pricing-current',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    statement: 'The standard diagnostic estimate is USD 89 before approved additions.',
    category: 'general',
    provenance: 'owner-authored',
    lifecycleStatus: 'approved',
    sourceReferenceIds: ['demo-source-phase-three-pricing-current'],
    createdAt: PHASE_THREE_KNOWLEDGE_AT,
    updatedAt: PHASE_THREE_KNOWLEDGE_AT,
    version: 1,
    topicKey: 'pricing-and-estimates',
  },
  {
    id: 'demo-claim-phase-three-pricing-conflict',
    companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
    roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
    statement: 'The standard diagnostic estimate is USD 79.',
    category: 'general',
    provenance: 'source-extracted',
    lifecycleStatus: 'conflicting-information',
    sourceReferenceIds: [
      'demo-source-phase-three-pricing-current',
      'demo-source-phase-three-pricing-conflict',
    ],
    createdAt: PHASE_THREE_KNOWLEDGE_AT,
    updatedAt: PHASE_THREE_KNOWLEDGE_AT,
    version: 1,
    topicKey: 'pricing-and-estimates',
  },
];

const PHASE_THREE_APPROVAL_DECISIONS: readonly ApprovalDecision[] = [
  {
    id: 'demo-decision-phase-three-scheduling',
    claimId: 'demo-claim-phase-three-scheduling-guidance',
    decision: 'approve',
    actorLabel: 'Fictional owner',
    reason: 'Matches the fictional same-day scheduling authority note.',
    decidedAt: PHASE_THREE_KNOWLEDGE_AT,
    claimVersion: 1,
  },
  {
    id: 'demo-decision-phase-three-payment-limit',
    claimId: 'demo-claim-phase-three-payment-limit',
    decision: 'approve',
    actorLabel: 'Fictional owner',
    reason: 'Matches the fictional structured payment limit.',
    decidedAt: PHASE_THREE_KNOWLEDGE_AT,
    claimVersion: 1,
  },
  {
    id: 'demo-decision-phase-three-pricing-current',
    claimId: 'demo-claim-phase-three-pricing-current',
    decision: 'approve',
    actorLabel: 'Fictional owner',
    reason: 'Confirms the current fictional diagnostic estimate while retaining the conflict.',
    decidedAt: PHASE_THREE_KNOWLEDGE_AT,
    claimVersion: 1,
  },
];

function demoGapSupport(topicKey: KnowledgeGap['topicKey']): {
  readonly relatedClaimIds: readonly string[];
  readonly supportingSourceReferenceIds: readonly string[];
} {
  switch (topicKey) {
    case 'rescheduling-and-cancellation':
      return {
        relatedClaimIds: ['demo-claim-cancellation-fee-conflict'],
        supportingSourceReferenceIds: ['demo-source-fee-note-a', 'demo-source-policy-fee-anchor'],
      };
    case 'after-hours':
      return {
        relatedClaimIds: ['demo-claim-after-hours-interview'],
        supportingSourceReferenceIds: ['demo-source-interview-after-hours'],
      };
    case 'technician-late-or-absent':
      return {
        relatedClaimIds: ['demo-claim-late-customer-update'],
        supportingSourceReferenceIds: ['demo-source-checklist-late-anchor'],
      };
    default:
      return { relatedClaimIds: [], supportingSourceReferenceIds: [] };
  }
}

function createDemoKnowledgeGaps(): readonly KnowledgeGap[] {
  return OPERATIONAL_TOPICS.flatMap((topic) => {
    if (topic.key === 'urgency-and-emergency') return [];
    const support = demoGapSupport(topic.key);
    const conflicting = topic.key === 'rescheduling-and-cancellation';
    const candidate = topic.key === 'after-hours' || topic.key === 'technician-late-or-absent';
    const reason = conflicting
      ? ('conflicting-evidence' as const)
      : candidate
        ? ('incomplete-evidence' as const)
        : topic.key === 'authority-and-escalation'
          ? ('authority-unclear' as const)
          : ('missing-evidence' as const);
    const description = conflicting
      ? `${topic.label} has explicit conflicting evidence in the fictional demo.`
      : candidate
        ? `${topic.label} has a source-backed candidate but no approved current claim.`
        : `${topic.label} has no source-backed candidate or approved current claim.`;
    return [
      {
        id: `demo-gap-${topic.key}`,
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        topicKey: topic.key,
        reason,
        description,
        impact: topic.whyItMatters,
        riskTier: topic.riskTier,
        status:
          topic.key === 'after-hours' ? ('proposal-created' as const) : ('question-ready' as const),
        supportingSourceReferenceIds: support.supportingSourceReferenceIds,
        relatedClaimIds: support.relatedClaimIds,
        createdAt: CREATED_AT,
        updatedAt: topic.key === 'after-hours' ? ANSWERED_AT : CREATED_AT,
      },
    ];
  });
}

function createDemoInterviewQuestions(): PhaseOneSnapshot['interviewQuestions'] {
  return OPERATIONAL_TOPICS.flatMap((topic, topicIndex) => {
    if (topic.key === 'urgency-and-emergency') return [];
    const template = topic.primaryQuestion;
    const base = {
      id: `demo-question-${template.key}`,
      companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
      roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
      gapId: `demo-gap-${topic.key}`,
      topicKey: topic.key,
      templateKey: template.key,
      prompt: template.prompt,
      rationale: template.rationale,
      whatItUnlocks: template.whatItUnlocks,
      answerType: template.answerType,
      priority: operationalRiskPriority(topic.riskTier) * 10_000 + topicIndex * 100,
      status:
        topic.key === 'after-hours'
          ? ('answered' as const)
          : topic.key === 'discounts'
            ? ('active' as const)
            : ('queued' as const),
      createdAt: CREATED_AT,
      ...(topic.key === 'after-hours' ? { answeredAt: ANSWERED_AT } : {}),
    };
    return [
      template.answerOptions === undefined
        ? base
        : { ...base, answerOptions: [...template.answerOptions] },
    ];
  });
}

/** Creates the fixed Phase 1-3 seed before deterministic question evaluation. */
function createSummitComfortDemoSeed(): PhaseOneSnapshot {
  return {
    company: {
      id: SUMMIT_COMFORT_DEMO_COMPANY_ID,
      name: 'Summit Comfort Heating & Air',
      industry: 'Residential heating and air conditioning (fictional)',
      serviceArea: 'Fictional North Valley service area',
      contactInformation: {
        phone: 'Fictional demo contact withheld',
        email: 'Fictional demo contact withheld',
      },
      operatingTimezone: 'America/Denver',
      status: 'active',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    },
    role: {
      id: SUMMIT_COMFORT_DEMO_ROLE_ID,
      companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
      title: 'Home-Service Office Manager / Dispatcher',
      mission:
        'Keep each service call moving from customer request through technician handoff while protecting safety, schedule quality, and owner authority.',
      status: 'active',
      responsibilities: [
        {
          id: 'demo-responsibility-dispatch-schedule',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          title: 'Maintain the dispatch schedule',
          expectedOutcome:
            'Every accepted service call has an assigned technician and an accurate customer arrival window.',
          frequency: 'Throughout each service day',
          completionEvidence: 'Current dispatch board and customer confirmation notes',
          status: 'active',
        },
        {
          id: 'demo-responsibility-call-records',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          title: 'Prepare complete service-call records',
          expectedOutcome:
            'Technicians receive customer, equipment, symptom, access, and callback details before travel.',
          frequency: 'For every service call',
          completionEvidence: 'Completed call record with required dispatch fields',
          status: 'active',
        },
        {
          id: 'demo-responsibility-customer-updates',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          title: 'Coordinate customer updates',
          expectedOutcome:
            'Customers receive prompt, accurate schedule changes without unsupported promises.',
          frequency: 'Whenever an arrival window or assignment changes',
          completionEvidence: 'Timestamped customer-contact note',
          status: 'active',
        },
      ],
      authorityBoundaries: [
        {
          id: 'demo-boundary-schedule-adjustments',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Same-day schedule adjustments',
          permissionLevel: 'may-act-within-limit',
          limitOrConstraint:
            'May shift a non-emergency arrival window by up to 60 minutes when the change creates no overtime or service-area exception.',
          escalationDestination: 'Service manager',
          notes: 'Safety calls always take priority and follow the emergency escalation rule.',
        },
        {
          id: 'demo-boundary-discounts',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Customer discounts and service credits',
          permissionLevel: 'must-request-approval',
          limitOrConstraint:
            'No discount, waived fee, or service credit may be promised without written owner approval.',
          escalationDestination: 'Owner',
          notes: 'Record the customer concern and requested remedy before escalation.',
          topicKeys: ['discounts'],
          applicableRequestTypes: ['exception-request'],
        },
        {
          id: 'demo-boundary-phase-three-scheduling-decision',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Same-day non-emergency rescheduling decision',
          permissionLevel: 'may-decide',
          limitOrConstraint:
            'May decide a same-day non-emergency move after notifying the customer and technician.',
          escalationDestination: 'Service manager',
          notes: 'This structured binding does not apply to emergencies or capacity exceptions.',
          topicKeys: ['scheduling'],
          applicableRequestTypes: ['decision-request'],
        },
        {
          id: 'demo-boundary-phase-three-payment-limit',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Payment-processing fee adjustments',
          permissionLevel: 'may-act-within-limit',
          limitOrConstraint: 'May waive up to USD 100; larger amounts require owner approval.',
          escalationDestination: 'Owner',
          notes: 'The limit is represented structurally and is never parsed from this note.',
          topicKeys: ['payments'],
          applicableRequestTypes: ['financial-action'],
          numericLimit: 100,
          currency: 'USD',
          structuredConstraintType: 'amount-limit',
        },
        {
          id: 'demo-boundary-phase-three-complaint-escalation',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Customer complaint remedy decisions',
          permissionLevel: 'must-escalate',
          limitOrConstraint: 'The service manager decides any remedy outside approved guidance.',
          escalationDestination: 'Service manager',
          notes: 'The dispatcher records the concern without promising a remedy.',
          topicKeys: ['customer-complaints'],
          applicableRequestTypes: ['decision-request'],
        },
        {
          id: 'demo-boundary-phase-three-refund-prohibited',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          subject: 'Direct customer refunds',
          permissionLevel: 'prohibited',
          limitOrConstraint: 'The dispatcher must not issue a refund directly.',
          escalationDestination: 'Owner',
          notes: 'A prohibition is an outcome, not a knowledge gap.',
          topicKeys: ['refunds'],
          applicableRequestTypes: ['financial-action'],
        },
      ],
      escalationRules: [
        {
          id: 'demo-escalation-safety-hazard',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          trigger:
            'A caller reports gas odor, a carbon-monoxide alarm, smoke, fire, or visible electrical arcing.',
          destination: 'Emergency services when appropriate, then the on-call owner',
          urgency: 'immediate',
          requiredContext:
            'Customer name, service address, callback number, reported hazard, and whether everyone has left the building',
          expectedResponse:
            'Stop routine troubleshooting, direct the caller to safety guidance, and notify the on-call owner immediately.',
          topicKeys: ['urgency-and-emergency'],
          applicableRequestTypes: ['emergency-action'],
          urgencyMatch: 'immediate',
        },
        {
          id: 'demo-escalation-capacity',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          trigger:
            'Accepted same-day demand exceeds available technician capacity or requires an unavailable skill.',
          destination: 'Service manager',
          urgency: 'same-day',
          requiredContext:
            'Open calls, customer commitments, technician locations, skill requirements, and remaining arrival windows',
          expectedResponse:
            'The service manager chooses the priority order, reassignment, overtime, or rescheduling response.',
          topicKeys: ['scheduling'],
          applicableRequestTypes: ['customer-commitment'],
        },
        {
          id: 'demo-escalation-phase-three-sensitive-payment-data',
          roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
          trigger: 'An employee marks a customer-data question as containing payment data.',
          destination: 'Fictional privacy lead',
          urgency: 'immediate',
          requiredContext:
            'Operational topic, request type, and sensitivity category only; do not copy payment values',
          expectedResponse:
            'The privacy lead supplies the approved handling path without requesting raw payment values.',
          topicKeys: ['customer-data-and-privacy'],
          applicableRequestTypes: ['policy-lookup'],
          sensitivityCategories: ['payment-data'],
        },
      ],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    },
    sourceDocuments: [...DEMO_DOCUMENTS],
    sourceReferences: [
      {
        id: 'demo-source-safety-note',
        sourceTitle: 'Dispatch safety escalation note (fictional)',
        sourceType: 'owner-note',
        sourceLocator: 'Manual entry: safety note, section 1',
        excerpt:
          'Hazard reports are escalated immediately; office staff do not troubleshoot gas, fire, carbon monoxide, or electrical hazards.',
        recordedAt: CREATED_AT,
      },
      {
        id: 'demo-source-customer-update-note',
        sourceTitle: 'Customer arrival-window note (fictional)',
        sourceType: 'owner-note',
        sourceLocator: 'Manual entry: dispatch note, section 2',
        excerpt: 'Contact the customer when a technician will arrive more than 30 minutes late.',
        recordedAt: CREATED_AT,
      },
      {
        id: 'demo-source-discount-note',
        sourceTitle: 'Service recovery authority note (fictional)',
        sourceType: 'owner-note',
        sourceLocator: 'Manual entry: owner policy note, section 3',
        excerpt: 'Only the owner may authorize a discount, waived fee, or service credit.',
        recordedAt: CREATED_AT,
      },
      {
        id: 'demo-source-fee-note-a',
        sourceTitle: 'Older cancellation note (fictional)',
        sourceType: 'owner-note',
        sourceLocator: 'Manual entry: front-desk note, revision A',
        excerpt: 'A cancellation inside 24 hours has a $79 fee.',
        recordedAt: CREATED_AT,
      },
      {
        id: 'demo-source-fee-note-b',
        sourceTitle: 'Newer cancellation note (fictional)',
        sourceType: 'owner-note',
        sourceLocator: 'Manual entry: operations note, revision B',
        excerpt: 'A cancellation inside 24 hours has a $95 fee.',
        recordedAt: CREATED_AT,
      },
      ...DEMO_ANCHORED_REFERENCES,
      {
        id: 'demo-source-interview-after-hours',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        sourceTitle: 'Owner interview — After-hours',
        sourceType: 'owner-interview',
        sourceLocator: ownerInterviewLocator(
          'demo-question-after-hours-primary',
          'demo-answer-after-hours',
        ),
        excerpt: 'No after-hours service is offered.',
        recordedAt: ANSWERED_AT,
      },
      ...PHASE_THREE_SOURCE_REFERENCES,
    ],
    knowledgeClaims: [
      {
        id: 'demo-claim-safety-escalation',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement:
          'Hazard reports involving gas odor, a carbon-monoxide alarm, smoke, fire, or visible electrical arcing must be escalated immediately; the dispatcher must not troubleshoot the hazard.',
        category: 'escalation-rule',
        provenance: 'owner-authored',
        lifecycleStatus: 'approved',
        sourceReferenceIds: ['demo-source-policy-safety-anchor'],
        createdAt: CREATED_AT,
        updatedAt: APPROVED_AT,
        version: 1,
        topicKey: 'urgency-and-emergency',
      },
      {
        id: 'demo-claim-late-customer-update',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement:
          'Contact the customer with a revised arrival window whenever a technician will arrive more than 30 minutes late.',
        category: 'procedure',
        provenance: 'generated-like',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: ['demo-source-checklist-late-anchor'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        version: 1,
        topicKey: 'technician-late-or-absent',
      },
      {
        id: 'demo-claim-discount-authority',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement: 'A dispatcher may promise a 15% service-recovery discount without approval.',
        category: 'authority-boundary',
        provenance: 'generated-like',
        lifecycleStatus: 'rejected',
        sourceReferenceIds: ['demo-source-policy-discount-anchor'],
        createdAt: CREATED_AT,
        updatedAt: REJECTED_AT,
        version: 1,
        topicKey: 'discounts',
      },
      {
        id: 'demo-claim-cancellation-fee-conflict',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement: 'The fee for a cancellation inside 24 hours is $79.',
        category: 'general',
        provenance: 'source-extracted',
        lifecycleStatus: 'conflicting-information',
        sourceReferenceIds: ['demo-source-fee-note-a', 'demo-source-policy-fee-anchor'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        version: 1,
        topicKey: 'rescheduling-and-cancellation',
      },
      {
        id: 'demo-claim-after-hours-interview',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement: 'No after-hours service is offered.',
        category: 'general',
        provenance: 'owner-interview-derived',
        lifecycleStatus: 'proposed',
        sourceReferenceIds: ['demo-source-interview-after-hours'],
        createdAt: ANSWERED_AT,
        updatedAt: ANSWERED_AT,
        version: 1,
        topicKey: 'after-hours',
      },
      ...PHASE_THREE_KNOWLEDGE_CLAIMS,
    ],
    approvalDecisions: [
      {
        id: 'demo-decision-approve-safety',
        claimId: 'demo-claim-safety-escalation',
        decision: 'approve',
        actorLabel: 'Fictional owner',
        reason: 'This matches the written safety escalation instruction.',
        decidedAt: APPROVED_AT,
        claimVersion: 1,
      },
      {
        id: 'demo-decision-reject-discount',
        claimId: 'demo-claim-discount-authority',
        decision: 'reject',
        actorLabel: 'Fictional owner',
        reason: 'The source reserves all discount and credit decisions for the owner.',
        decidedAt: REJECTED_AT,
        claimVersion: 1,
      },
      ...PHASE_THREE_APPROVAL_DECISIONS,
    ],
    knowledgeGaps: createDemoKnowledgeGaps(),
    interviewQuestions: createDemoInterviewQuestions(),
    interviewAnswers: [
      {
        id: 'demo-answer-after-hours',
        questionId: 'demo-question-after-hours-primary',
        gapId: 'demo-gap-after-hours',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        actorLabel: 'Fictional owner',
        answer: 'No after-hours service is offered.',
        structuredValue: false,
        answeredAt: ANSWERED_AT,
        sourceReferenceId: 'demo-source-interview-after-hours',
        generatedClaimId: 'demo-claim-after-hours-interview',
      },
    ],
    employeeQuestions: [],
    answerEligibilityEvaluations: [],
    answers: [],
    escalations: [],
    activityEvents: [],
  };
}

const PHASE_THREE_QUESTION_INPUTS: readonly EmployeeQuestionInput[] = [
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'What is the approved guidance for a reported safety hazard?',
    topicKey: 'urgency-and-emergency',
    requestType: 'policy-lookup',
    sensitivitySelection: 'none',
    structuredContext: { requestType: 'policy-lookup' },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I move this non-emergency appointment within the same service day?',
    topicKey: 'scheduling',
    requestType: 'decision-request',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'decision-request',
      proposedAction: 'Move a non-emergency appointment within the same service day',
      subject: 'Fictional appointment',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I waive a fictional payment-processing fee of USD 75?',
    topicKey: 'payments',
    requestType: 'financial-action',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'financial-action',
      actionType: 'waive-fee',
      amount: 75,
      currency: 'USD',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I waive a fictional payment-processing fee of USD 125?',
    topicKey: 'payments',
    requestType: 'financial-action',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'financial-action',
      actionType: 'waive-fee',
      amount: 125,
      currency: 'USD',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I make a fictional exception to the discount rule?',
    topicKey: 'discounts',
    requestType: 'exception-request',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'exception-request',
      requestedException: 'Apply a discount without prior written approval',
      reason: 'Fictional service-recovery request',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I choose a remedy for this fictional customer complaint?',
    topicKey: 'customer-complaints',
    requestType: 'decision-request',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'decision-request',
      proposedAction: 'Choose a customer complaint remedy',
      subject: 'Fictional complaint',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I issue a fictional USD 25 refund directly?',
    topicKey: 'refunds',
    requestType: 'financial-action',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'financial-action',
      actionType: 'refund',
      amount: 25,
      currency: 'USD',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'What is the approved lead-intake procedure?',
    topicKey: 'lead-intake',
    requestType: 'procedure-lookup',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'procedure-lookup',
      currentStepLabel: 'New request received',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'What diagnostic estimate should I communicate?',
    topicKey: 'pricing-and-estimates',
    requestType: 'policy-lookup',
    sensitivitySelection: 'none',
    structuredContext: { requestType: 'policy-lookup' },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'How should I route a payment-data question without including payment values?',
    topicKey: 'customer-data-and-privacy',
    requestType: 'policy-lookup',
    sensitivitySelection: 'payment-data',
    structuredContext: { requestType: 'policy-lookup' },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'May I promise service availability for this fictional request?',
    topicKey: 'urgency-and-emergency',
    requestType: 'customer-commitment',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'customer-commitment',
      commitmentType: 'service-availability',
    },
  },
  {
    employeeLabel: 'Fictional dispatcher',
    questionText: 'How should I route a fictional immediate gas-odor report?',
    topicKey: 'urgency-and-emergency',
    requestType: 'emergency-action',
    sensitivitySelection: 'none',
    structuredContext: {
      requestType: 'emergency-action',
      urgency: 'immediate',
      emergencyCategory: 'gas-odor',
    },
  },
];

function successful<T>(result: DomainResult<T>): T {
  if (!result.ok) throw result.error;
  return result.value;
}

/**
 * Creates fresh deterministic Phase 0-3 records. Every name, locator,
 * statement, question, identifier, and timestamp is fictional.
 */
export function createSummitComfortDemoSnapshot(): PhaseOneSnapshot {
  const repository = new InMemoryPhaseOneRepository();
  const idCounts = new Map<string, number>();
  let clockTick = 0;
  const service = new PhaseOneService(repository, {
    clock: () => new Date(Date.UTC(2026, 7, 1, 13, 0, clockTick++)).toISOString(),
    idFactory: (prefix) => {
      const next = (idCounts.get(prefix) ?? 0) + 1;
      idCounts.set(prefix, next);
      return `demo-phase-three-${prefix}-${next}`;
    },
    ownerFallbackDestination: 'Fictional owner',
  });

  successful(service.initializeSnapshot(createSummitComfortDemoSeed()));
  successful(service.reconcileKnowledgeGaps());
  const outcomes: QuestionEvaluationOutcome[] = PHASE_THREE_QUESTION_INPUTS.map((input) => {
    const question = successful(service.submitEmployeeQuestion(input));
    return successful(service.evaluateEmployeeQuestion(question.id));
  });

  const resolvedExample = outcomes.at(-1)?.escalation;
  if (resolvedExample === undefined) {
    throw new Error('The deterministic resolved-escalation example was not created.');
  }
  successful(service.assignEscalation(resolvedExample.id, 'Fictional on-call owner'));
  successful(
    service.resolveEscalation(
      resolvedExample.id,
      'The fictional owner handled this one request; the resolution is not company policy.',
      'Fictional on-call owner',
    ),
  );

  return service.getSnapshot();
}

/** Installs the fixed fixture through the same validated service used by the UI. */
export function loadSummitComfortDemo(service: PhaseOneService) {
  return service.initializeSnapshot(createSummitComfortDemoSnapshot());
}
