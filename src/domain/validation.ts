import type {
  ActivateSetupInput,
  AuthorityBoundaryInput,
  EscalationRuleInput,
  KnowledgeClaimInput,
  PhaseOneSnapshot,
  ResponsibilityInput,
  RoleInput,
  SourceReferenceInput,
} from './entities';
import { domainFailure, domainSuccess, type DomainResult } from './result';

export const PERMISSION_LEVELS = [
  'may-decide',
  'may-act-within-limit',
  'must-request-approval',
  'must-escalate',
  'prohibited',
] as const;

export const ESCALATION_URGENCIES = ['routine', 'same-day', 'immediate'] as const;
export const ROLE_STATUSES = ['draft', 'active', 'retired'] as const;
export const RESPONSIBILITY_STATUSES = ['active', 'inactive'] as const;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function required(value: string, field: string, label: string): DomainResult<void> {
  return isBlank(value)
    ? domainFailure('validation-error', `${label} is required.`, field)
    : domainSuccess(undefined);
}

function firstFailure(results: readonly DomainResult<void>[]): DomainResult<void> {
  return results.find((result) => !result.ok) ?? domainSuccess(undefined);
}

export function validateResponsibilityInput(input: ResponsibilityInput): DomainResult<void> {
  const base = firstFailure([
    required(input.title, 'responsibility.title', 'Responsibility title'),
    required(input.expectedOutcome, 'responsibility.expectedOutcome', 'Expected outcome'),
    required(input.frequency, 'responsibility.frequency', 'Frequency'),
    required(input.completionEvidence, 'responsibility.completionEvidence', 'Completion evidence'),
  ]);
  if (!base.ok) return base;

  return RESPONSIBILITY_STATUSES.includes(input.status)
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'Responsibility status is invalid.',
        'responsibility.status',
      );
}

export function validateAuthorityBoundaryInput(input: AuthorityBoundaryInput): DomainResult<void> {
  const base = firstFailure([
    required(input.subject, 'authorityBoundary.subject', 'Authority subject'),
    required(
      input.limitOrConstraint,
      'authorityBoundary.limitOrConstraint',
      'Authority limit or constraint',
    ),
    required(
      input.escalationDestination,
      'authorityBoundary.escalationDestination',
      'Authority escalation destination',
    ),
  ]);
  if (!base.ok) return base;

  return PERMISSION_LEVELS.includes(input.permissionLevel)
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'Permission level is invalid.',
        'authorityBoundary.permissionLevel',
      );
}

export function validateEscalationRuleInput(input: EscalationRuleInput): DomainResult<void> {
  const base = firstFailure([
    required(input.trigger, 'escalationRule.trigger', 'Escalation trigger'),
    required(input.destination, 'escalationRule.destination', 'Escalation destination'),
    required(
      input.requiredContext,
      'escalationRule.requiredContext',
      'Required escalation context',
    ),
    required(
      input.expectedResponse,
      'escalationRule.expectedResponse',
      'Expected escalation response',
    ),
  ]);
  if (!base.ok) return base;

  return ESCALATION_URGENCIES.includes(input.urgency)
    ? domainSuccess(undefined)
    : domainFailure('validation-error', 'Escalation urgency is invalid.', 'escalationRule.urgency');
}

export function validateRoleInput(input: RoleInput): DomainResult<void> {
  const base = firstFailure([
    required(input.title, 'role.title', 'Role title'),
    required(input.mission, 'role.mission', 'Role mission'),
  ]);
  if (!base.ok) return base;

  if (!ROLE_STATUSES.includes(input.status)) {
    return domainFailure('validation-error', 'Role status is invalid.', 'role.status');
  }
  if (input.responsibilities.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one responsibility is required.',
      'role.responsibilities',
    );
  }
  if (input.authorityBoundaries.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one authority boundary is required.',
      'role.authorityBoundaries',
    );
  }
  if (input.escalationRules.length === 0) {
    return domainFailure(
      'validation-error',
      'At least one escalation rule is required.',
      'role.escalationRules',
    );
  }

  return firstFailure([
    ...input.responsibilities.map(validateResponsibilityInput),
    ...input.authorityBoundaries.map(validateAuthorityBoundaryInput),
    ...input.escalationRules.map(validateEscalationRuleInput),
  ]);
}

export function validateActivateSetupInput(input: ActivateSetupInput): DomainResult<void> {
  const company = input.company;
  const base = firstFailure([
    required(company.name, 'company.name', 'Business name'),
    required(company.industry, 'company.industry', 'Industry'),
    required(company.serviceArea, 'company.serviceArea', 'Service area'),
    required(company.phone, 'company.phone', 'Phone'),
    required(company.email, 'company.email', 'Email'),
    required(company.operatingTimezone, 'company.operatingTimezone', 'Operating timezone'),
  ]);
  if (!base.ok) return base;
  if (!/^\S+@\S+\.\S+$/.test(company.email.trim())) {
    return domainFailure('validation-error', 'Enter a valid email address.', 'company.email');
  }

  const role = validateRoleInput(input.role);
  if (!role.ok) return role;
  return input.role.status === 'active'
    ? domainSuccess(undefined)
    : domainFailure(
        'validation-error',
        'The role must be active to complete setup.',
        'role.status',
      );
}

export function validateSourceReferenceInput(input: SourceReferenceInput): DomainResult<void> {
  return firstFailure([
    required(input.sourceTitle, 'sourceReference.sourceTitle', 'Source title'),
    required(input.sourceType, 'sourceReference.sourceType', 'Source type'),
    required(input.sourceLocator, 'sourceReference.sourceLocator', 'Source locator'),
  ]);
}

export function validateKnowledgeClaimInput(input: KnowledgeClaimInput): DomainResult<void> {
  return firstFailure([
    required(input.statement, 'knowledgeClaim.statement', 'Claim statement'),
    required(input.category, 'knowledgeClaim.category', 'Claim category'),
    required(input.provenance, 'knowledgeClaim.provenance', 'Claim provenance'),
  ]);
}

function duplicateId(values: readonly { readonly id: string }[]): string | undefined {
  const seen = new Set<string>();
  return values.find(({ id }) => (seen.has(id) ? true : !seen.add(id)))?.id;
}

export function validatePhaseOneSnapshot(
  snapshot: PhaseOneSnapshot,
): DomainResult<PhaseOneSnapshot> {
  if (snapshot.company === null) {
    const hasOrphans =
      snapshot.role !== null ||
      snapshot.sourceReferences.length > 0 ||
      snapshot.knowledgeClaims.length > 0 ||
      snapshot.approvalDecisions.length > 0;
    return hasOrphans
      ? domainFailure(
          'relationship-mismatch',
          'A company is required before role or knowledge records.',
        )
      : domainSuccess(snapshot);
  }

  if (snapshot.company.status !== 'active') {
    return domainFailure('relationship-mismatch', 'The Phase 1 company must be active.');
  }
  if (snapshot.role === null) {
    return snapshot.knowledgeClaims.length === 0 && snapshot.approvalDecisions.length === 0
      ? domainSuccess(snapshot)
      : domainFailure('role-not-found', 'Knowledge records require an active role.');
  }
  if (snapshot.role.companyId !== snapshot.company.id) {
    return domainFailure(
      'relationship-mismatch',
      'The role must belong to the active company.',
      'role.companyId',
    );
  }

  const roleValidation = validateRoleInput(snapshot.role);
  if (!roleValidation.ok) return roleValidation;
  for (const responsibility of snapshot.role.responsibilities) {
    if (responsibility.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every responsibility must belong to the active role.',
        'responsibility.roleId',
      );
    }
  }
  for (const boundary of snapshot.role.authorityBoundaries) {
    if (boundary.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every authority boundary must belong to the active role.',
        'authorityBoundary.roleId',
      );
    }
  }
  for (const rule of snapshot.role.escalationRules) {
    if (rule.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every escalation rule must belong to the active role.',
        'escalationRule.roleId',
      );
    }
  }

  const allIdentified = [
    snapshot.company,
    snapshot.role,
    ...snapshot.role.responsibilities,
    ...snapshot.role.authorityBoundaries,
    ...snapshot.role.escalationRules,
    ...snapshot.sourceReferences,
    ...snapshot.knowledgeClaims,
    ...snapshot.approvalDecisions,
  ];
  const duplicate = duplicateId(allIdentified);
  if (duplicate !== undefined) {
    return domainFailure('duplicate-record', `Duplicate record id: ${duplicate}.`);
  }

  const sourceIds = new Set(snapshot.sourceReferences.map(({ id }) => id));
  const claimIds = new Set(snapshot.knowledgeClaims.map(({ id }) => id));
  for (const decision of snapshot.approvalDecisions) {
    const claim = snapshot.knowledgeClaims.find(({ id }) => id === decision.claimId);
    if (!claim || decision.claimVersion !== claim.version) {
      return domainFailure(
        'relationship-mismatch',
        'Every approval decision must reference an existing exact claim version.',
      );
    }
  }

  for (const claim of snapshot.knowledgeClaims) {
    if (claim.companyId !== snapshot.company.id || claim.roleId !== snapshot.role.id) {
      return domainFailure(
        'relationship-mismatch',
        'Every knowledge claim must belong to the active company and role.',
      );
    }
    if (claim.version < 1 || !Number.isInteger(claim.version)) {
      return domainFailure('validation-error', 'Claim versions must be positive integers.');
    }
    if (claim.sourceReferenceIds.some((sourceId) => !sourceIds.has(sourceId))) {
      return domainFailure(
        'source-not-found',
        'A claim references source metadata that does not exist.',
      );
    }
    if (claim.supersedesClaimId !== undefined) {
      const previous = snapshot.knowledgeClaims.find(({ id }) => id === claim.supersedesClaimId);
      if (!previous || previous.version >= claim.version) {
        return domainFailure(
          'relationship-mismatch',
          'A revision must reference an older claim version.',
        );
      }
    }

    const decisions = snapshot.approvalDecisions.filter(
      ({ claimId, claimVersion }) => claimId === claim.id && claimVersion === claim.version,
    );
    if (
      (claim.lifecycleStatus === 'approved' || claim.lifecycleStatus === 'superseded') &&
      (claim.sourceReferenceIds.length === 0 ||
        !decisions.some(({ decision }) => decision === 'approve'))
    ) {
      return domainFailure(
        'approval-decision-required',
        'Approved knowledge requires source provenance and an approval decision.',
      );
    }
    if (
      claim.lifecycleStatus === 'rejected' &&
      !decisions.some(({ decision }) => decision === 'reject')
    ) {
      return domainFailure(
        'approval-decision-required',
        'Rejected knowledge requires an explicit rejection decision.',
      );
    }
    if (claim.lifecycleStatus === 'superseded') {
      const approvedRevision = snapshot.knowledgeClaims.some(
        (candidate) =>
          candidate.supersedesClaimId === claim.id && candidate.lifecycleStatus === 'approved',
      );
      if (!approvedRevision) {
        return domainFailure(
          'invalid-transition',
          'Knowledge may be superseded only by an approved revision.',
        );
      }
    }
  }

  if ([...claimIds].length !== snapshot.knowledgeClaims.length) {
    return domainFailure('duplicate-record', 'Knowledge claim IDs must be unique.');
  }
  return domainSuccess(snapshot);
}
