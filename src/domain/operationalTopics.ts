import type {
  InterviewStructuredValue,
  OperationalRiskTier,
  OperationalTopic,
  OperationalTopicKey,
} from './entities';

const noFollowUps = Object.freeze([]);

export const OPERATIONAL_TOPICS: readonly OperationalTopic[] = Object.freeze([
  {
    key: 'lead-intake',
    label: 'Lead intake',
    description: 'The information and actions required when a new service request arrives.',
    riskTier: 'normal',
    whyItMatters: 'Complete intake prevents avoidable callbacks and gives dispatch enough context.',
    expectedEvidenceCategories: ['job-description', 'existing-sop', 'checklist', 'customer-script'],
    primaryQuestion: {
      key: 'lead-intake-primary',
      prompt: 'What information must the office collect before accepting a new service request?',
      rationale: 'No approved lead-intake instruction is recorded for this role.',
      whatItUnlocks: 'A reviewable intake rule for consistent customer and job details.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Prepare complete service-call records'],
  },
  {
    key: 'service-area',
    label: 'Service area',
    description: 'Where the company accepts work and how exceptions are handled.',
    riskTier: 'normal',
    whyItMatters: 'Dispatch needs a clear geographic boundary before promising service.',
    expectedEvidenceCategories: ['policy', 'dispatch-note', 'owner-note'],
    primaryQuestion: {
      key: 'service-area-primary',
      prompt: 'Which locations are inside the normal service area, and who approves exceptions?',
      rationale: 'No approved service-area rule is recorded for this role.',
      whatItUnlocks: 'A reviewable boundary for accepting or escalating out-of-area requests.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Service-area exceptions'],
  },
  {
    key: 'scheduling',
    label: 'Scheduling',
    description: 'How calls are placed on the schedule and assigned to a technician.',
    riskTier: 'high',
    whyItMatters: 'Scheduling decisions affect customer commitments and technician capacity.',
    expectedEvidenceCategories: ['existing-sop', 'checklist', 'dispatch-note'],
    primaryQuestion: {
      key: 'scheduling-primary',
      prompt: 'What rules determine the appointment window and technician assignment?',
      rationale: 'No approved scheduling rule is recorded for this role.',
      whatItUnlocks: 'A reviewable scheduling procedure tied to capacity and skills.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Maintain the dispatch schedule'],
  },
  {
    key: 'rescheduling-and-cancellation',
    label: 'Rescheduling and cancellation',
    description: 'Customer and company schedule changes, notice, fees, and escalation.',
    riskTier: 'high',
    whyItMatters: 'Unclear changes create conflicting promises, fees, and capacity decisions.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'customer-script'],
    primaryQuestion: {
      key: 'rescheduling-primary',
      prompt: 'What must happen when a customer reschedules or cancels, including any fees?',
      rationale: 'The current evidence is absent, incomplete, or explicitly conflicting.',
      whatItUnlocks: 'A reviewable change and cancellation rule.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Customer updates', 'Cancellation fees'],
  },
  {
    key: 'urgency-and-emergency',
    label: 'Urgency and emergency',
    description: 'Qualifying urgent or emergency requests and the required safe handoff.',
    riskTier: 'critical',
    whyItMatters: 'Incorrect handling can create immediate safety and authority risks.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'checklist', 'customer-script'],
    primaryQuestion: {
      key: 'emergency-primary',
      prompt: 'Does the company accept urgent or emergency service requests?',
      rationale: 'RoleKeep needs an explicit answer before documenting emergency handling.',
      whatItUnlocks: 'If yes, focused questions about qualifying conditions and dispatch context.',
      answerType: 'yes-no',
    },
    followUpRules: [
      {
        triggerTemplateKey: 'emergency-primary',
        equals: true,
        questions: [
          {
            key: 'emergency-conditions',
            prompt: 'What exact conditions qualify as urgent or emergency requests?',
            rationale: 'Accepted emergencies require explicit qualifying conditions.',
            whatItUnlocks: 'A reviewable emergency classification rule.',
            answerType: 'long-text',
          },
          {
            key: 'emergency-context',
            prompt: 'What context must dispatch collect, and where must it be escalated?',
            rationale: 'A safe emergency handoff requires specified context and destination.',
            whatItUnlocks: 'A reviewable emergency dispatch and escalation instruction.',
            answerType: 'long-text',
          },
        ],
      },
    ],
    relatedConcepts: ['Immediate safety escalation'],
  },
  {
    key: 'after-hours',
    label: 'After-hours',
    description: 'What service is offered outside normal hours and who receives escalations.',
    riskTier: 'critical',
    whyItMatters:
      'After-hours promises need explicit limits, eligibility, and an accountable recipient.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'dispatch-note', 'owner-note'],
    primaryQuestion: {
      key: 'after-hours-primary',
      prompt: 'Does the company provide any after-hours service?',
      rationale: 'No approved after-hours policy is recorded for this role.',
      whatItUnlocks: 'If yes, focused questions about qualification and escalation.',
      answerType: 'yes-no',
    },
    followUpRules: [
      {
        triggerTemplateKey: 'after-hours-primary',
        equals: true,
        questions: [
          {
            key: 'after-hours-qualifies',
            prompt: 'What qualifies for after-hours service?',
            rationale: 'After-hours availability needs an explicit eligibility boundary.',
            whatItUnlocks: 'A reviewable after-hours qualification rule.',
            answerType: 'long-text',
          },
          {
            key: 'after-hours-destination',
            prompt: 'Who receives the after-hours escalation?',
            rationale: 'Dispatch needs one accountable after-hours destination.',
            whatItUnlocks: 'A reviewable after-hours escalation destination.',
            answerType: 'person-or-destination',
          },
        ],
      },
    ],
    relatedConcepts: ['On-call owner', 'After-hours authority'],
  },
  {
    key: 'technician-late-or-absent',
    label: 'Technician late or absent',
    description: 'Customer updates and reassignment when a technician is delayed or unavailable.',
    riskTier: 'high',
    whyItMatters: 'Fast, bounded handling protects customer commitments and schedule accuracy.',
    expectedEvidenceCategories: ['existing-sop', 'checklist', 'customer-script', 'dispatch-note'],
    primaryQuestion: {
      key: 'technician-late-primary',
      prompt: 'What must the dispatcher do when a technician is late or cannot attend?',
      rationale: 'No complete approved late-or-absent procedure is recorded.',
      whatItUnlocks: 'A reviewable customer update, reassignment, and escalation procedure.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Coordinate customer updates', 'Schedule adjustments'],
  },
  {
    key: 'pricing-and-estimates',
    label: 'Pricing and estimates',
    description: 'What pricing information may be quoted and when an estimate needs review.',
    riskTier: 'high',
    whyItMatters: 'Unsupported pricing promises create financial and customer-service risk.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'customer-script'],
    primaryQuestion: {
      key: 'pricing-primary',
      prompt: 'What pricing or estimate information may the office provide without approval?',
      rationale: 'No approved pricing and estimate boundary is recorded.',
      whatItUnlocks: 'A reviewable quoting and escalation boundary.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Pricing authority'],
  },
  {
    key: 'discounts',
    label: 'Discounts',
    description: 'Who may approve discounts and the exact limits and exceptions.',
    riskTier: 'critical',
    whyItMatters: 'Discount authority changes company commitments and must have explicit limits.',
    expectedEvidenceCategories: ['policy', 'owner-note'],
    primaryQuestion: {
      key: 'discounts-primary',
      prompt: 'May the office manager approve any discount without prior owner approval?',
      rationale: 'Discount authority is absent or unclear in approved knowledge.',
      whatItUnlocks: 'If yes, exact limit and approval-exception questions.',
      answerType: 'yes-no',
    },
    followUpRules: [
      {
        triggerTemplateKey: 'discounts-primary',
        equals: true,
        questions: [
          {
            key: 'discounts-limit',
            prompt: 'What is the maximum discount the office manager may approve?',
            rationale: 'Delegated discount authority requires an exact numeric limit.',
            whatItUnlocks: 'A reviewable discount limit.',
            answerType: 'numeric-limit',
          },
          {
            key: 'discounts-approval-required',
            prompt: 'When is owner approval still required, even within that limit?',
            rationale: 'A numeric limit alone does not define exceptions or sensitive cases.',
            whatItUnlocks: 'A reviewable exception and escalation rule.',
            answerType: 'long-text',
          },
        ],
      },
    ],
    relatedConcepts: ['Customer discounts and service credits', 'Owner approval'],
  },
  {
    key: 'payments',
    label: 'Payments',
    description: 'Accepted payment methods, collection timing, and failed-payment handling.',
    riskTier: 'high',
    whyItMatters: 'Payment handling affects customer data and company funds.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'checklist'],
    primaryQuestion: {
      key: 'payments-primary',
      prompt: 'Which payment methods may the office accept, and what happens when payment fails?',
      rationale: 'No approved payment-handling instruction is recorded.',
      whatItUnlocks: 'A reviewable collection and failed-payment procedure.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Payment handling', 'Customer data'],
  },
  {
    key: 'refunds',
    label: 'Refunds',
    description: 'Who may authorize refunds and the amount or conditions allowed.',
    riskTier: 'critical',
    whyItMatters: 'Refunds move company funds and require explicit authorization.',
    expectedEvidenceCategories: ['policy', 'owner-note'],
    primaryQuestion: {
      key: 'refunds-primary',
      prompt: 'Are customer refunds allowed?',
      rationale: 'No approved refund authority rule is recorded.',
      whatItUnlocks: 'If yes, focused authorization and limit questions.',
      answerType: 'yes-no',
    },
    followUpRules: [
      {
        triggerTemplateKey: 'refunds-primary',
        equals: true,
        questions: [
          {
            key: 'refunds-authorizer',
            prompt: 'Who may authorize a refund?',
            rationale: 'Refunds require an accountable decision maker.',
            whatItUnlocks: 'A reviewable refund authority boundary.',
            answerType: 'person-or-destination',
          },
          {
            key: 'refunds-limit',
            prompt: 'What is the maximum refund that person may authorize?',
            rationale: 'Delegated refund authority requires an exact limit.',
            whatItUnlocks: 'A reviewable refund limit.',
            answerType: 'numeric-limit',
          },
        ],
      },
    ],
    relatedConcepts: ['Refund authority', 'Owner approval'],
  },
  {
    key: 'customer-complaints',
    label: 'Customer complaints',
    description: 'How complaints are documented, handled, and escalated.',
    riskTier: 'high',
    whyItMatters: 'Complaint handling needs consistent records and bounded promises.',
    expectedEvidenceCategories: ['existing-sop', 'customer-script', 'policy'],
    primaryQuestion: {
      key: 'complaints-primary',
      prompt: 'How should the office record and respond to a customer complaint?',
      rationale: 'No approved customer-complaint procedure is recorded.',
      whatItUnlocks: 'A reviewable complaint response and escalation procedure.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Customer recovery', 'Escalation'],
  },
  {
    key: 'permits-and-approvals',
    label: 'Permits and approvals',
    description: 'When permit information is needed and who must be contacted.',
    riskTier: 'critical',
    whyItMatters: 'Permit handling can affect whether work may be scheduled or performed.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'checklist'],
    primaryQuestion: {
      key: 'permits-primary',
      prompt: 'Can the work handled by this role involve permits or external approvals?',
      rationale: 'No approved permit-handling boundary is recorded.',
      whatItUnlocks: 'If yes, focused collection and escalation questions.',
      answerType: 'yes-no',
    },
    followUpRules: [
      {
        triggerTemplateKey: 'permits-primary',
        equals: true,
        questions: [
          {
            key: 'permits-information',
            prompt: 'What permit or approval information must the office collect?',
            rationale: 'Permit-related calls require a defined minimum information set.',
            whatItUnlocks: 'A reviewable permit-intake checklist.',
            answerType: 'long-text',
          },
          {
            key: 'permits-destination',
            prompt: 'When and how should the owner or project lead be contacted?',
            rationale: 'The role needs an explicit permit escalation point.',
            whatItUnlocks: 'A reviewable contact and escalation rule.',
            answerType: 'person-or-destination',
          },
        ],
      },
    ],
    relatedConcepts: ['Permit collection', 'Project lead escalation'],
  },
  {
    key: 'job-completion-proof',
    label: 'Job completion proof',
    description: 'The records that demonstrate a service call or job is complete.',
    riskTier: 'normal',
    whyItMatters: 'Completion evidence supports billing, follow-up, and accurate handoffs.',
    expectedEvidenceCategories: ['existing-sop', 'checklist', 'dispatch-note'],
    primaryQuestion: {
      key: 'completion-proof-primary',
      prompt: 'What proof must be recorded before the office marks a job complete?',
      rationale: 'No approved completion-evidence rule is recorded.',
      whatItUnlocks: 'A reviewable job-completion checklist.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Completion evidence'],
  },
  {
    key: 'customer-data-and-privacy',
    label: 'Customer data and privacy',
    description: 'Which customer information is collected, shared, and protected.',
    riskTier: 'critical',
    whyItMatters: 'The office handles customer contact, location, and payment-related information.',
    expectedEvidenceCategories: ['policy', 'existing-sop', 'checklist'],
    primaryQuestion: {
      key: 'privacy-primary',
      prompt: 'What customer information may the office collect or share, and with whom?',
      rationale: 'No approved customer-data boundary is recorded.',
      whatItUnlocks: 'A reviewable data-handling and escalation rule.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Customer records', 'Payment handling'],
  },
  {
    key: 'authority-and-escalation',
    label: 'Authority and escalation',
    description: 'The role-wide boundary between independent action and owner involvement.',
    riskTier: 'critical',
    whyItMatters: 'The employee must know where authority ends before making company commitments.',
    expectedEvidenceCategories: ['job-description', 'policy', 'existing-sop', 'owner-note'],
    primaryQuestion: {
      key: 'authority-primary',
      prompt: 'Which decisions must always be escalated, and to whom?',
      rationale: 'Approved role-wide authority and escalation evidence is missing or incomplete.',
      whatItUnlocks: 'A reviewable authority boundary and escalation destination.',
      answerType: 'long-text',
    },
    followUpRules: noFollowUps,
    relatedConcepts: ['Authority boundaries', 'Escalation rules'],
  },
]);

export const OPERATIONAL_TOPIC_KEYS: readonly OperationalTopicKey[] = Object.freeze(
  OPERATIONAL_TOPICS.map(({ key }) => key),
);

export function isOperationalTopicKey(value: string): value is OperationalTopicKey {
  return OPERATIONAL_TOPIC_KEYS.some((key) => key === value);
}

export function getOperationalTopic(key: OperationalTopicKey): OperationalTopic {
  const topic = OPERATIONAL_TOPICS.find((candidate) => candidate.key === key);
  if (topic === undefined) throw new Error(`Unknown operational topic: ${key}`);
  return topic;
}

export function operationalRiskPriority(riskTier: OperationalRiskTier): number {
  switch (riskTier) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    case 'normal':
      return 2;
  }
}

export function structuredValuesMatch(
  left: InterviewStructuredValue | undefined,
  right: InterviewStructuredValue,
): boolean {
  return left === right;
}
