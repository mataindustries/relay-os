import type { PhaseOneService, PhaseOneSnapshot } from '../domain';

export const SUMMIT_COMFORT_DEMO_COMPANY_ID = 'demo-company-summit-comfort';
export const SUMMIT_COMFORT_DEMO_ROLE_ID = 'demo-role-office-manager-dispatcher';

const CREATED_AT = '2026-08-01T12:00:00.000Z';
const APPROVED_AT = '2026-08-01T12:15:00.000Z';
const REJECTED_AT = '2026-08-01T12:20:00.000Z';

/**
 * Creates a fresh copy of the fixed Phase 1 fixture. Every name, locator,
 * statement, contact detail, identifier, and timestamp is fictional.
 */
export function createSummitComfortDemoSnapshot(): PhaseOneSnapshot {
  return {
    company: {
      id: SUMMIT_COMFORT_DEMO_COMPANY_ID,
      name: 'Summit Comfort Heating & Air',
      industry: 'Residential heating and air conditioning (fictional)',
      serviceArea: 'Fictional North Valley service area',
      contactInformation: {
        phone: '+1-202-555-0147',
        email: 'office@summitcomfort.example',
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
        },
      ],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    },
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
        sourceReferenceIds: ['demo-source-safety-note'],
        createdAt: CREATED_AT,
        updatedAt: APPROVED_AT,
        version: 1,
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
        sourceReferenceIds: ['demo-source-customer-update-note'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        version: 1,
      },
      {
        id: 'demo-claim-discount-authority',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement: 'A dispatcher may promise a 15% service-recovery discount without approval.',
        category: 'authority-boundary',
        provenance: 'generated-like',
        lifecycleStatus: 'rejected',
        sourceReferenceIds: ['demo-source-discount-note'],
        createdAt: CREATED_AT,
        updatedAt: REJECTED_AT,
        version: 1,
      },
      {
        id: 'demo-claim-cancellation-fee-conflict',
        companyId: SUMMIT_COMFORT_DEMO_COMPANY_ID,
        roleId: SUMMIT_COMFORT_DEMO_ROLE_ID,
        statement: 'The fee for a cancellation inside 24 hours is $79.',
        category: 'general',
        provenance: 'source-extracted',
        lifecycleStatus: 'conflicting-information',
        sourceReferenceIds: ['demo-source-fee-note-a', 'demo-source-fee-note-b'],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
        version: 1,
      },
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
    ],
  };
}

/** Installs the fixed fixture through the same validated service used by the UI. */
export function loadSummitComfortDemo(service: PhaseOneService) {
  return service.initializeSnapshot(createSummitComfortDemoSnapshot());
}
