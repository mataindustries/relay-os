export const CANONICAL_ROLE_TITLE = 'Home-Service Office Manager / Dispatcher';

export const ROLE_STATUSES = ['draft', 'active', 'retired'] as const;
export type SetupRoleStatus = (typeof ROLE_STATUSES)[number];

export const PERMISSION_LEVELS = [
  'may-decide',
  'may-act-within-limit',
  'must-request-approval',
  'must-escalate',
  'prohibited',
] as const;
export type SetupPermissionLevel = (typeof PERMISSION_LEVELS)[number];

export const ESCALATION_URGENCIES = ['routine', 'same-day', 'immediate'] as const;
export type SetupEscalationUrgency = (typeof ESCALATION_URGENCIES)[number];

export interface CompanySetupDraft {
  readonly name: string;
  readonly industry: string;
  readonly serviceArea: string;
  readonly phone: string;
  readonly email: string;
  readonly operatingTimezone: string;
}

export interface RoleSetupDraft {
  readonly title: string;
  readonly mission: string;
  readonly status: SetupRoleStatus;
}

export interface ResponsibilitySetupDraft {
  /** Stable only while this controlled setup draft exists. */
  readonly draftId: string;
  readonly title: string;
  readonly expectedOutcome: string;
  readonly frequency: string;
  readonly completionEvidence: string;
  readonly status: 'active' | 'inactive';
}

export interface AuthorityBoundarySetupDraft {
  /** Stable only while this controlled setup draft exists. */
  readonly draftId: string;
  readonly subject: string;
  readonly permissionLevel: SetupPermissionLevel;
  readonly limitOrConstraint: string;
  readonly escalationDestination: string;
  readonly notes: string;
}

export interface EscalationRuleSetupDraft {
  /** Stable only while this controlled setup draft exists. */
  readonly draftId: string;
  readonly trigger: string;
  readonly destination: string;
  readonly urgency: SetupEscalationUrgency;
  readonly requiredContext: string;
  readonly expectedResponse: string;
}

/**
 * A domain-independent input shape for the Phase 1 setup submission boundary.
 * Domain IDs, timestamps, relationship checks, and activation are deliberately
 * assigned by the application/domain service after this draft is submitted.
 */
export interface SetupDraft {
  readonly company: CompanySetupDraft;
  readonly role: RoleSetupDraft;
  readonly responsibilities: readonly ResponsibilitySetupDraft[];
  readonly authorityBoundaries: readonly AuthorityBoundarySetupDraft[];
  readonly escalationRules: readonly EscalationRuleSetupDraft[];
}

export type SetupValidationErrors = Readonly<Record<string, string>>;

function createEmptyResponsibility(draftId = 'responsibility-1'): ResponsibilitySetupDraft {
  return {
    draftId,
    title: '',
    expectedOutcome: '',
    frequency: '',
    completionEvidence: '',
    status: 'active',
  };
}

function createEmptyAuthorityBoundary(
  draftId = 'authority-boundary-1',
): AuthorityBoundarySetupDraft {
  return {
    draftId,
    subject: '',
    permissionLevel: 'may-decide',
    limitOrConstraint: '',
    escalationDestination: '',
    notes: '',
  };
}

function createEmptyEscalationRule(draftId = 'escalation-rule-1'): EscalationRuleSetupDraft {
  return {
    draftId,
    trigger: '',
    destination: '',
    urgency: 'routine',
    requiredContext: '',
    expectedResponse: '',
  };
}

export function createInitialSetupDraft(): SetupDraft {
  return {
    company: {
      name: '',
      industry: '',
      serviceArea: '',
      phone: '',
      email: '',
      operatingTimezone: '',
    },
    role: {
      title: CANONICAL_ROLE_TITLE,
      mission: '',
      status: 'draft',
    },
    responsibilities: [createEmptyResponsibility()],
    authorityBoundaries: [createEmptyAuthorityBoundary()],
    escalationRules: [createEmptyEscalationRule()],
  };
}

function required(value: string, message: string): string | undefined {
  return value.trim().length === 0 ? message : undefined;
}

function assignError(errors: Record<string, string>, key: string, error: string | undefined): void {
  if (error !== undefined) {
    errors[key] = error;
  }
}

export function validateCompanyStep(company: CompanySetupDraft): SetupValidationErrors {
  const errors: Record<string, string> = {};

  assignError(errors, 'company.name', required(company.name, 'Enter the business name.'));
  assignError(errors, 'company.industry', required(company.industry, 'Enter the industry.'));
  assignError(
    errors,
    'company.serviceArea',
    required(company.serviceArea, 'Enter the service area.'),
  );
  assignError(errors, 'company.phone', required(company.phone, 'Enter a contact phone number.'));
  assignError(errors, 'company.email', required(company.email, 'Enter a contact email address.'));

  if (company.email.trim().length > 0 && !/^\S+@\S+\.\S+$/.test(company.email.trim())) {
    errors['company.email'] = 'Enter a valid contact email address.';
  }

  assignError(
    errors,
    'company.operatingTimezone',
    required(company.operatingTimezone, 'Select the operating timezone.'),
  );

  return errors;
}

export function validateRoleStep(
  role: RoleSetupDraft,
  requireActive = false,
): SetupValidationErrors {
  const errors: Record<string, string> = {};

  assignError(errors, 'role.title', required(role.title, 'Enter the role title.'));
  assignError(errors, 'role.mission', required(role.mission, 'Enter the role mission.'));

  if (requireActive && role.status !== 'active') {
    errors['role.status'] = 'Set the role status to active before completing setup.';
  }

  return errors;
}

export function validateResponsibilitiesStep(
  responsibilities: readonly ResponsibilitySetupDraft[],
): SetupValidationErrors {
  const errors: Record<string, string> = {};

  if (responsibilities.length === 0) {
    errors.responsibilities = 'Add at least one responsibility.';
    return errors;
  }

  responsibilities.forEach((responsibility) => {
    const prefix = `responsibilities.${responsibility.draftId}`;
    assignError(
      errors,
      `${prefix}.title`,
      required(responsibility.title, 'Enter the responsibility title.'),
    );
    assignError(
      errors,
      `${prefix}.expectedOutcome`,
      required(responsibility.expectedOutcome, 'Enter the expected outcome.'),
    );
    assignError(
      errors,
      `${prefix}.frequency`,
      required(responsibility.frequency, 'Enter how often this responsibility occurs.'),
    );
    assignError(
      errors,
      `${prefix}.completionEvidence`,
      required(responsibility.completionEvidence, 'Enter the completion evidence.'),
    );
  });

  if (!responsibilities.some((responsibility) => responsibility.status === 'active')) {
    errors.responsibilities = 'Keep at least one responsibility active.';
  }

  return errors;
}

export function validateAuthorityAndEscalationStep(
  authorityBoundaries: readonly AuthorityBoundarySetupDraft[],
  escalationRules: readonly EscalationRuleSetupDraft[],
): SetupValidationErrors {
  const errors: Record<string, string> = {};

  if (authorityBoundaries.length === 0) {
    errors.authorityBoundaries = 'Add at least one authority boundary.';
  }

  authorityBoundaries.forEach((boundary) => {
    const prefix = `authorityBoundaries.${boundary.draftId}`;
    assignError(
      errors,
      `${prefix}.subject`,
      required(boundary.subject, 'Enter the authority subject.'),
    );
    assignError(
      errors,
      `${prefix}.limitOrConstraint`,
      required(boundary.limitOrConstraint, 'Enter the limit or constraint.'),
    );
    assignError(
      errors,
      `${prefix}.escalationDestination`,
      required(boundary.escalationDestination, 'Enter who receives an escalation.'),
    );
  });

  if (escalationRules.length === 0) {
    errors.escalationRules = 'Add at least one escalation rule.';
  }

  escalationRules.forEach((rule) => {
    const prefix = `escalationRules.${rule.draftId}`;
    assignError(
      errors,
      `${prefix}.trigger`,
      required(rule.trigger, 'Enter the escalation trigger.'),
    );
    assignError(
      errors,
      `${prefix}.destination`,
      required(rule.destination, 'Enter the escalation destination.'),
    );
    assignError(
      errors,
      `${prefix}.requiredContext`,
      required(rule.requiredContext, 'Enter the context required for escalation.'),
    );
    assignError(
      errors,
      `${prefix}.expectedResponse`,
      required(rule.expectedResponse, 'Enter the expected response.'),
    );
  });

  return errors;
}

export function validateSetupDraft(draft: SetupDraft): SetupValidationErrors {
  return {
    ...validateCompanyStep(draft.company),
    ...validateRoleStep(draft.role, true),
    ...validateResponsibilitiesStep(draft.responsibilities),
    ...validateAuthorityAndEscalationStep(draft.authorityBoundaries, draft.escalationRules),
  };
}

export function createResponsibilityDraft(
  responsibilities: readonly ResponsibilitySetupDraft[],
): ResponsibilitySetupDraft {
  return createEmptyResponsibility(nextDraftId('responsibility', responsibilities));
}

export function createAuthorityBoundaryDraft(
  authorityBoundaries: readonly AuthorityBoundarySetupDraft[],
): AuthorityBoundarySetupDraft {
  return createEmptyAuthorityBoundary(nextDraftId('authority-boundary', authorityBoundaries));
}

export function createEscalationRuleDraft(
  escalationRules: readonly EscalationRuleSetupDraft[],
): EscalationRuleSetupDraft {
  return createEmptyEscalationRule(nextDraftId('escalation-rule', escalationRules));
}

function nextDraftId(prefix: string, records: readonly { readonly draftId: string }[]): string {
  const existingIds = new Set(records.map(({ draftId }) => draftId));
  let sequence = 1;

  while (existingIds.has(`${prefix}-${sequence}`)) {
    sequence += 1;
  }

  return `${prefix}-${sequence}`;
}
