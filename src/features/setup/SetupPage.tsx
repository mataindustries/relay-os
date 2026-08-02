import { useState, type FormEvent, type ReactNode } from 'react';

import {
  ESCALATION_URGENCIES,
  PERMISSION_LEVELS,
  ROLE_STATUSES,
  createAuthorityBoundaryDraft,
  createEscalationRuleDraft,
  createResponsibilityDraft,
  validateAuthorityAndEscalationStep,
  validateCompanyStep,
  validateResponsibilitiesStep,
  validateRoleStep,
  validateSetupDraft,
  type AuthorityBoundarySetupDraft,
  type EscalationRuleSetupDraft,
  type ResponsibilitySetupDraft,
  type SetupDraft,
  type SetupEscalationUrgency,
  type SetupPermissionLevel,
  type SetupRoleStatus,
  type SetupValidationErrors,
} from './setupDraft';

export interface SetupActionResult {
  readonly ok: boolean;
  readonly message: string;
}

export interface SetupPageProps {
  readonly draft: SetupDraft;
  readonly onDraftChange: (draft: SetupDraft) => void;
  readonly onComplete: (draft: SetupDraft) => SetupActionResult;
  readonly onLoadDemo: () => SetupActionResult;
  readonly hasActiveSetup: boolean;
}

type SetupStep = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = ['Company', 'Role', 'Responsibilities', 'Authority', 'Review'] as const;

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'UTC',
] as const;

const PERMISSION_LABELS: Record<SetupPermissionLevel, string> = {
  'may-decide': 'May decide',
  'may-act-within-limit': 'May act within a limit',
  'must-request-approval': 'Must request approval',
  'must-escalate': 'Must escalate',
  prohibited: 'Prohibited',
};

const URGENCY_LABELS: Record<SetupEscalationUrgency, string> = {
  routine: 'Routine',
  'same-day': 'Same day',
  immediate: 'Immediate',
};

const STATUS_LABELS: Record<SetupRoleStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  retired: 'Retired',
};

interface TextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly error?: string | undefined;
  readonly type?: 'text' | 'email' | 'tel';
  readonly multiline?: boolean;
  readonly hint?: string | undefined;
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  multiline = false,
  hint,
}: TextFieldProps) {
  const descriptionIds = [
    hint === undefined ? undefined : `${id}-hint`,
    error ? `${id}-error` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const inputProps = {
    id,
    value,
    'aria-required': true,
    'aria-invalid': error !== undefined,
    'aria-describedby': descriptionIds.length > 0 ? descriptionIds : undefined,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
  } as const;

  return (
    <div className="setup-field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p className="setup-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {multiline ? <textarea {...inputProps} rows={3} /> : <input {...inputProps} type={type} />}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

interface SelectFieldProps<T extends string> {
  readonly id: string;
  readonly label: string;
  readonly value: T | '';
  readonly onChange: (value: T) => void;
  readonly options: readonly T[];
  readonly getOptionLabel: (option: T) => string;
  readonly error?: string | undefined;
  readonly placeholder?: string | undefined;
}

function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  getOptionLabel,
  error,
  placeholder,
}: SelectFieldProps<T>) {
  return (
    <div className="setup-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        aria-required="true"
        aria-invalid={error !== undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { readonly id: string; readonly error?: string | undefined }) {
  return error ? (
    <p className="setup-field-error" id={id} role="alert">
      {error}
    </p>
  ) : null;
}

function CollectionError({ children }: { readonly children?: ReactNode }) {
  return children ? (
    <p className="setup-field-error" role="alert">
      {children}
    </p>
  ) : null;
}

export function SetupPage({
  draft,
  onDraftChange,
  onComplete,
  onLoadDemo,
  hasActiveSetup,
}: SetupPageProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>(0);
  const [errors, setErrors] = useState<SetupValidationErrors>({});
  const [feedback, setFeedback] = useState<SetupActionResult | null>(null);

  function clearErrors(...keys: string[]): void {
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      keys.forEach((key) => delete nextErrors[key]);
      return nextErrors;
    });
    setFeedback(null);
  }

  function clearErrorsWithPrefix(prefix: string): void {
    setErrors((currentErrors) =>
      Object.fromEntries(Object.entries(currentErrors).filter(([key]) => !key.startsWith(prefix))),
    );
    setFeedback(null);
  }

  function changeCompany(field: keyof SetupDraft['company'], value: string): void {
    onDraftChange({
      ...draft,
      company: { ...draft.company, [field]: value },
    });
    clearErrors(`company.${field}`);
  }

  function changeRole<K extends keyof SetupDraft['role']>(
    field: K,
    value: SetupDraft['role'][K],
  ): void {
    onDraftChange({
      ...draft,
      role: { ...draft.role, [field]: value },
    });
    clearErrors(`role.${field}`);
  }

  function updateResponsibility(draftId: string, changes: Partial<ResponsibilitySetupDraft>): void {
    onDraftChange({
      ...draft,
      responsibilities: draft.responsibilities.map((responsibility) =>
        responsibility.draftId === draftId ? { ...responsibility, ...changes } : responsibility,
      ),
    });
    Object.keys(changes).forEach((field) => clearErrors(`responsibilities.${draftId}.${field}`));
    if (changes.status !== undefined) {
      clearErrors('responsibilities');
    }
  }

  function removeResponsibility(draftId: string): void {
    onDraftChange({
      ...draft,
      responsibilities: draft.responsibilities.filter(
        (responsibility) => responsibility.draftId !== draftId,
      ),
    });
    clearErrorsWithPrefix(`responsibilities.${draftId}`);
  }

  function updateAuthorityBoundary(
    draftId: string,
    changes: Partial<AuthorityBoundarySetupDraft>,
  ): void {
    onDraftChange({
      ...draft,
      authorityBoundaries: draft.authorityBoundaries.map((boundary) =>
        boundary.draftId === draftId ? { ...boundary, ...changes } : boundary,
      ),
    });
    Object.keys(changes).forEach((field) => clearErrors(`authorityBoundaries.${draftId}.${field}`));
  }

  function removeAuthorityBoundary(draftId: string): void {
    onDraftChange({
      ...draft,
      authorityBoundaries: draft.authorityBoundaries.filter(
        (boundary) => boundary.draftId !== draftId,
      ),
    });
    clearErrorsWithPrefix(`authorityBoundaries.${draftId}`);
  }

  function updateEscalationRule(draftId: string, changes: Partial<EscalationRuleSetupDraft>): void {
    onDraftChange({
      ...draft,
      escalationRules: draft.escalationRules.map((rule) =>
        rule.draftId === draftId ? { ...rule, ...changes } : rule,
      ),
    });
    Object.keys(changes).forEach((field) => clearErrors(`escalationRules.${draftId}.${field}`));
  }

  function removeEscalationRule(draftId: string): void {
    onDraftChange({
      ...draft,
      escalationRules: draft.escalationRules.filter((rule) => rule.draftId !== draftId),
    });
    clearErrorsWithPrefix(`escalationRules.${draftId}`);
  }

  function validateCurrentStep(): SetupValidationErrors {
    switch (currentStep) {
      case 0:
        return validateCompanyStep(draft.company);
      case 1:
        return validateRoleStep(draft.role);
      case 2:
        return validateResponsibilitiesStep(draft.responsibilities);
      case 3:
        return validateAuthorityAndEscalationStep(draft.authorityBoundaries, draft.escalationRules);
      case 4:
        return validateSetupDraft(draft);
    }
  }

  function firstInvalidStep(validationErrors: SetupValidationErrors): SetupStep {
    const keys = Object.keys(validationErrors);
    if (keys.some((key) => key.startsWith('company.'))) return 0;
    if (keys.some((key) => key.startsWith('role.'))) return 1;
    if (keys.some((key) => key.startsWith('responsibilities'))) return 2;
    if (
      keys.some((key) => key.startsWith('authorityBoundaries') || key.startsWith('escalationRules'))
    )
      return 3;
    return 4;
  }

  function moveForward(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const validationErrors = validateCurrentStep();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (currentStep === 4) {
        setCurrentStep(firstInvalidStep(validationErrors));
      }
      return;
    }

    setErrors({});
    setFeedback(null);

    if (currentStep === 4) {
      setFeedback(onComplete(draft));
      return;
    }

    setCurrentStep((currentStep + 1) as SetupStep);
  }

  function loadDemo(): void {
    setErrors({});
    setFeedback(onLoadDemo());
  }

  return (
    <section className="setup-page" aria-labelledby="setup-page-title">
      <header className="setup-page-header">
        <p className="phase-label">Phase 2 · Session-only role setup</p>
        <h1 id="setup-page-title">Define the role being transferred</h1>
        <p className="setup-intro">
          Record one company and one operational role, then review the full definition before
          activation.
        </p>
      </header>

      <aside className="setup-session-notice" aria-label="Session storage notice">
        <strong>Current page session only.</strong> Setup data is held in memory and disappears when
        this page is reloaded. It is not saved to a browser or database.
      </aside>

      <section className="setup-demo-panel" aria-labelledby="setup-demo-title">
        <h2 id="setup-demo-title">Fictional HVAC demonstration</h2>
        <p>
          Load the fixed Summit Comfort Heating &amp; Air example. Every record is fictional, uses
          no external service, and repeated loading should not create duplicates.
        </p>
        <button className="setup-secondary-button" type="button" onClick={loadDemo}>
          Load fictional HVAC demo
        </button>
      </section>

      {hasActiveSetup ? (
        <p className="setup-active-notice" role="status">
          One company and role are active in this page session.
        </p>
      ) : null}

      {feedback ? (
        <p
          className={feedback.ok ? 'setup-feedback-success' : 'setup-feedback-error'}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      <nav className="setup-progress" aria-label="Setup progress">
        <ol>
          {STEP_LABELS.map((label, index) => (
            <li key={label} aria-current={index === currentStep ? 'step' : undefined}>
              <span>Step {index + 1}</span> {label}
            </li>
          ))}
        </ol>
      </nav>

      <form className="setup-form" noValidate onSubmit={moveForward}>
        {currentStep === 0 ? (
          <CompanyStep draft={draft} errors={errors} onChange={changeCompany} />
        ) : null}
        {currentStep === 1 ? (
          <RoleStep draft={draft} errors={errors} onChange={changeRole} />
        ) : null}
        {currentStep === 2 ? (
          <ResponsibilitiesStep
            draft={draft}
            errors={errors}
            onUpdate={updateResponsibility}
            onRemove={removeResponsibility}
            onAdd={() => {
              onDraftChange({
                ...draft,
                responsibilities: [
                  ...draft.responsibilities,
                  createResponsibilityDraft(draft.responsibilities),
                ],
              });
              clearErrors('responsibilities');
            }}
          />
        ) : null}
        {currentStep === 3 ? (
          <AuthorityAndEscalationStep
            draft={draft}
            errors={errors}
            onUpdateBoundary={updateAuthorityBoundary}
            onRemoveBoundary={removeAuthorityBoundary}
            onAddBoundary={() => {
              onDraftChange({
                ...draft,
                authorityBoundaries: [
                  ...draft.authorityBoundaries,
                  createAuthorityBoundaryDraft(draft.authorityBoundaries),
                ],
              });
              clearErrors('authorityBoundaries');
            }}
            onUpdateRule={updateEscalationRule}
            onRemoveRule={removeEscalationRule}
            onAddRule={() => {
              onDraftChange({
                ...draft,
                escalationRules: [
                  ...draft.escalationRules,
                  createEscalationRuleDraft(draft.escalationRules),
                ],
              });
              clearErrors('escalationRules');
            }}
          />
        ) : null}
        {currentStep === 4 ? <ReviewStep draft={draft} /> : null}

        <div className="setup-form-actions">
          {currentStep > 0 ? (
            <button
              className="setup-secondary-button"
              type="button"
              onClick={() => {
                setErrors({});
                setFeedback(null);
                setCurrentStep((currentStep - 1) as SetupStep);
              }}
            >
              Back
            </button>
          ) : null}
          <button className="setup-primary-button" type="submit">
            {submitLabel(currentStep)}
          </button>
        </div>
      </form>
    </section>
  );
}

interface CompanyStepProps {
  readonly draft: SetupDraft;
  readonly errors: SetupValidationErrors;
  readonly onChange: (field: keyof SetupDraft['company'], value: string) => void;
}

function CompanyStep({ draft, errors, onChange }: CompanyStepProps) {
  return (
    <fieldset className="setup-step">
      <legend>Company</legend>
      <p>Describe the one business this role serves. Every field is required.</p>
      <div className="setup-form-grid">
        <TextField
          id="setup-company-name"
          label="Business name"
          value={draft.company.name}
          error={errors['company.name']}
          onChange={(value) => onChange('name', value)}
        />
        <TextField
          id="setup-company-industry"
          label="Industry"
          value={draft.company.industry}
          error={errors['company.industry']}
          onChange={(value) => onChange('industry', value)}
        />
        <TextField
          id="setup-company-service-area"
          label="Service area"
          value={draft.company.serviceArea}
          error={errors['company.serviceArea']}
          onChange={(value) => onChange('serviceArea', value)}
        />
        <TextField
          id="setup-company-phone"
          label="Phone"
          type="tel"
          value={draft.company.phone}
          error={errors['company.phone']}
          onChange={(value) => onChange('phone', value)}
        />
        <TextField
          id="setup-company-email"
          label="Email"
          type="email"
          value={draft.company.email}
          error={errors['company.email']}
          onChange={(value) => onChange('email', value)}
        />
        <SelectField
          id="setup-company-timezone"
          label="Timezone"
          value={draft.company.operatingTimezone}
          options={TIMEZONES}
          getOptionLabel={(timezone) => timezone.replaceAll('_', ' ')}
          placeholder="Select a timezone"
          error={errors['company.operatingTimezone']}
          onChange={(value) => onChange('operatingTimezone', value)}
        />
      </div>
    </fieldset>
  );
}

interface RoleStepProps {
  readonly draft: SetupDraft;
  readonly errors: SetupValidationErrors;
  readonly onChange: <K extends keyof SetupDraft['role']>(
    field: K,
    value: SetupDraft['role'][K],
  ) => void;
}

function RoleStep({ draft, errors, onChange }: RoleStepProps) {
  return (
    <fieldset className="setup-step">
      <legend>Operational role</legend>
      <p>RelayOS supports one role. Set it to active only when this definition is ready to use.</p>
      <div className="setup-form-grid">
        <TextField
          id="setup-role-title"
          label="Role title"
          value={draft.role.title}
          error={errors['role.title']}
          onChange={(value) => onChange('title', value)}
        />
        <TextField
          id="setup-role-mission"
          label="Role mission"
          value={draft.role.mission}
          multiline
          hint="State the outcome this role owns for customers and the business."
          error={errors['role.mission']}
          onChange={(value) => onChange('mission', value)}
        />
        <SelectField
          id="setup-role-status"
          label="Role status"
          value={draft.role.status}
          options={ROLE_STATUSES}
          getOptionLabel={(status) => STATUS_LABELS[status]}
          error={errors['role.status']}
          onChange={(value) => onChange('status', value)}
        />
      </div>
    </fieldset>
  );
}

interface ResponsibilitiesStepProps {
  readonly draft: SetupDraft;
  readonly errors: SetupValidationErrors;
  readonly onUpdate: (draftId: string, changes: Partial<ResponsibilitySetupDraft>) => void;
  readonly onRemove: (draftId: string) => void;
  readonly onAdd: () => void;
}

function ResponsibilitiesStep({
  draft,
  errors,
  onUpdate,
  onRemove,
  onAdd,
}: ResponsibilitiesStepProps) {
  return (
    <section className="setup-step" aria-labelledby="setup-responsibilities-title">
      <h2 id="setup-responsibilities-title">Responsibilities</h2>
      <p>Define accountable outcomes. At least one complete, active responsibility is required.</p>
      <CollectionError>{errors.responsibilities}</CollectionError>
      <div className="setup-card-list">
        {draft.responsibilities.map((responsibility, index) => {
          const key = `responsibilities.${responsibility.draftId}`;
          const fieldId = `setup-responsibility-${responsibility.draftId}`;
          return (
            <fieldset className="setup-card" key={responsibility.draftId}>
              <legend>Responsibility {index + 1}</legend>
              <div className="setup-form-grid">
                <TextField
                  id={`${fieldId}-title`}
                  label="Responsibility title"
                  value={responsibility.title}
                  error={errors[`${key}.title`]}
                  onChange={(value) => onUpdate(responsibility.draftId, { title: value })}
                />
                <TextField
                  id={`${fieldId}-outcome`}
                  label="Expected outcome"
                  value={responsibility.expectedOutcome}
                  multiline
                  error={errors[`${key}.expectedOutcome`]}
                  onChange={(value) => onUpdate(responsibility.draftId, { expectedOutcome: value })}
                />
                <TextField
                  id={`${fieldId}-frequency`}
                  label="Frequency"
                  value={responsibility.frequency}
                  error={errors[`${key}.frequency`]}
                  onChange={(value) => onUpdate(responsibility.draftId, { frequency: value })}
                />
                <TextField
                  id={`${fieldId}-evidence`}
                  label="Completion evidence"
                  value={responsibility.completionEvidence}
                  multiline
                  error={errors[`${key}.completionEvidence`]}
                  onChange={(value) =>
                    onUpdate(responsibility.draftId, { completionEvidence: value })
                  }
                />
              </div>
              <label className="setup-checkbox">
                <input
                  type="checkbox"
                  checked={responsibility.status === 'active'}
                  onChange={(event) =>
                    onUpdate(responsibility.draftId, {
                      status: event.target.checked ? 'active' : 'inactive',
                    })
                  }
                />
                Active responsibility
              </label>
              <button
                className="setup-danger-button"
                type="button"
                onClick={() => onRemove(responsibility.draftId)}
              >
                Remove responsibility {index + 1}
              </button>
            </fieldset>
          );
        })}
      </div>
      <button className="setup-secondary-button" type="button" onClick={onAdd}>
        Add responsibility
      </button>
    </section>
  );
}

interface AuthorityAndEscalationStepProps {
  readonly draft: SetupDraft;
  readonly errors: SetupValidationErrors;
  readonly onUpdateBoundary: (
    draftId: string,
    changes: Partial<AuthorityBoundarySetupDraft>,
  ) => void;
  readonly onRemoveBoundary: (draftId: string) => void;
  readonly onAddBoundary: () => void;
  readonly onUpdateRule: (draftId: string, changes: Partial<EscalationRuleSetupDraft>) => void;
  readonly onRemoveRule: (draftId: string) => void;
  readonly onAddRule: () => void;
}

function AuthorityAndEscalationStep({
  draft,
  errors,
  onUpdateBoundary,
  onRemoveBoundary,
  onAddBoundary,
  onUpdateRule,
  onRemoveRule,
  onAddRule,
}: AuthorityAndEscalationStepProps) {
  return (
    <div className="setup-step setup-role-system-step">
      <section aria-labelledby="setup-authority-title">
        <h2 id="setup-authority-title">Authority boundaries</h2>
        <p>Define what the employee may decide and where owner involvement begins.</p>
        <CollectionError>{errors.authorityBoundaries}</CollectionError>
        <div className="setup-card-list">
          {draft.authorityBoundaries.map((boundary, index) => {
            const key = `authorityBoundaries.${boundary.draftId}`;
            const fieldId = `setup-boundary-${boundary.draftId}`;
            return (
              <fieldset className="setup-card" key={boundary.draftId}>
                <legend>Authority boundary {index + 1}</legend>
                <div className="setup-form-grid">
                  <TextField
                    id={`${fieldId}-subject`}
                    label="Authority subject"
                    value={boundary.subject}
                    error={errors[`${key}.subject`]}
                    onChange={(value) => onUpdateBoundary(boundary.draftId, { subject: value })}
                  />
                  <SelectField
                    id={`${fieldId}-permission`}
                    label="Permission level"
                    value={boundary.permissionLevel}
                    options={PERMISSION_LEVELS}
                    getOptionLabel={(permission) => PERMISSION_LABELS[permission]}
                    onChange={(value) =>
                      onUpdateBoundary(boundary.draftId, { permissionLevel: value })
                    }
                  />
                  <TextField
                    id={`${fieldId}-limit`}
                    label="Limit or constraint"
                    value={boundary.limitOrConstraint}
                    multiline
                    error={errors[`${key}.limitOrConstraint`]}
                    onChange={(value) =>
                      onUpdateBoundary(boundary.draftId, { limitOrConstraint: value })
                    }
                  />
                  <TextField
                    id={`${fieldId}-destination`}
                    label="Escalation destination"
                    value={boundary.escalationDestination}
                    error={errors[`${key}.escalationDestination`]}
                    onChange={(value) =>
                      onUpdateBoundary(boundary.draftId, { escalationDestination: value })
                    }
                  />
                  <TextField
                    id={`${fieldId}-notes`}
                    label="Notes (optional)"
                    value={boundary.notes}
                    multiline
                    onChange={(value) => onUpdateBoundary(boundary.draftId, { notes: value })}
                  />
                </div>
                <button
                  className="setup-danger-button"
                  type="button"
                  onClick={() => onRemoveBoundary(boundary.draftId)}
                >
                  Remove authority boundary {index + 1}
                </button>
              </fieldset>
            );
          })}
        </div>
        <button className="setup-secondary-button" type="button" onClick={onAddBoundary}>
          Add authority boundary
        </button>
      </section>

      <section aria-labelledby="setup-escalation-title">
        <h2 id="setup-escalation-title">Escalation rules</h2>
        <p>Record the trigger, recipient, urgency, context, and response the owner expects.</p>
        <CollectionError>{errors.escalationRules}</CollectionError>
        <div className="setup-card-list">
          {draft.escalationRules.map((rule, index) => {
            const key = `escalationRules.${rule.draftId}`;
            const fieldId = `setup-escalation-${rule.draftId}`;
            return (
              <fieldset className="setup-card" key={rule.draftId}>
                <legend>Escalation rule {index + 1}</legend>
                <div className="setup-form-grid">
                  <TextField
                    id={`${fieldId}-trigger`}
                    label="Escalation trigger"
                    value={rule.trigger}
                    multiline
                    error={errors[`${key}.trigger`]}
                    onChange={(value) => onUpdateRule(rule.draftId, { trigger: value })}
                  />
                  <TextField
                    id={`${fieldId}-destination`}
                    label="Rule destination"
                    value={rule.destination}
                    error={errors[`${key}.destination`]}
                    onChange={(value) => onUpdateRule(rule.draftId, { destination: value })}
                  />
                  <SelectField
                    id={`${fieldId}-urgency`}
                    label="Urgency"
                    value={rule.urgency}
                    options={ESCALATION_URGENCIES}
                    getOptionLabel={(urgency) => URGENCY_LABELS[urgency]}
                    onChange={(value) => onUpdateRule(rule.draftId, { urgency: value })}
                  />
                  <TextField
                    id={`${fieldId}-context`}
                    label="Required context"
                    value={rule.requiredContext}
                    multiline
                    error={errors[`${key}.requiredContext`]}
                    onChange={(value) => onUpdateRule(rule.draftId, { requiredContext: value })}
                  />
                  <TextField
                    id={`${fieldId}-response`}
                    label="Expected response"
                    value={rule.expectedResponse}
                    multiline
                    error={errors[`${key}.expectedResponse`]}
                    onChange={(value) => onUpdateRule(rule.draftId, { expectedResponse: value })}
                  />
                </div>
                <button
                  className="setup-danger-button"
                  type="button"
                  onClick={() => onRemoveRule(rule.draftId)}
                >
                  Remove escalation rule {index + 1}
                </button>
              </fieldset>
            );
          })}
        </div>
        <button className="setup-secondary-button" type="button" onClick={onAddRule}>
          Add escalation rule
        </button>
      </section>
    </div>
  );
}

function ReviewStep({ draft }: { readonly draft: SetupDraft }) {
  return (
    <section className="setup-step setup-review" aria-labelledby="setup-review-title">
      <h2 id="setup-review-title">Review and activate</h2>
      <p>
        Confirm the company, role, responsibilities, authority, and escalation rules. Activation is
        rejected unless the role status is active and every domain requirement is satisfied.
      </p>

      <section className="setup-review-section" aria-labelledby="review-company-title">
        <h3 id="review-company-title">Company</h3>
        <dl>
          <ReviewItem label="Business name" value={draft.company.name} />
          <ReviewItem label="Industry" value={draft.company.industry} />
          <ReviewItem label="Service area" value={draft.company.serviceArea} />
          <ReviewItem label="Phone" value={draft.company.phone} />
          <ReviewItem label="Email" value={draft.company.email} />
          <ReviewItem label="Timezone" value={draft.company.operatingTimezone} />
        </dl>
      </section>

      <section className="setup-review-section" aria-labelledby="review-role-title">
        <h3 id="review-role-title">Role</h3>
        <dl>
          <ReviewItem label="Title" value={draft.role.title} />
          <ReviewItem label="Mission" value={draft.role.mission} />
          <ReviewItem label="Status" value={STATUS_LABELS[draft.role.status]} />
        </dl>
      </section>

      <ReviewCollection title="Responsibilities" emptyText="No responsibilities added.">
        {draft.responsibilities.map((responsibility) => (
          <article className="setup-review-card" key={responsibility.draftId}>
            <h4>{responsibility.title}</h4>
            <p>{responsibility.expectedOutcome}</p>
            <dl>
              <ReviewItem label="Frequency" value={responsibility.frequency} />
              <ReviewItem label="Completion evidence" value={responsibility.completionEvidence} />
              <ReviewItem
                label="Status"
                value={responsibility.status === 'active' ? 'Active' : 'Inactive'}
              />
            </dl>
          </article>
        ))}
      </ReviewCollection>

      <ReviewCollection title="Authority boundaries" emptyText="No authority boundaries added.">
        {draft.authorityBoundaries.map((boundary) => (
          <article className="setup-review-card" key={boundary.draftId}>
            <h4>{boundary.subject}</h4>
            <dl>
              <ReviewItem label="Permission" value={PERMISSION_LABELS[boundary.permissionLevel]} />
              <ReviewItem label="Limit" value={boundary.limitOrConstraint} />
              <ReviewItem label="Escalates to" value={boundary.escalationDestination} />
              {boundary.notes.trim() ? <ReviewItem label="Notes" value={boundary.notes} /> : null}
            </dl>
          </article>
        ))}
      </ReviewCollection>

      <ReviewCollection title="Escalation rules" emptyText="No escalation rules added.">
        {draft.escalationRules.map((rule) => (
          <article className="setup-review-card" key={rule.draftId}>
            <h4>{rule.trigger}</h4>
            <dl>
              <ReviewItem label="Destination" value={rule.destination} />
              <ReviewItem label="Urgency" value={URGENCY_LABELS[rule.urgency]} />
              <ReviewItem label="Required context" value={rule.requiredContext} />
              <ReviewItem label="Expected response" value={rule.expectedResponse} />
            </dl>
          </article>
        ))}
      </ReviewCollection>
    </section>
  );
}

function ReviewCollection({
  title,
  emptyText,
  children,
}: {
  readonly title: string;
  readonly emptyText: string;
  readonly children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : children !== null;
  return (
    <section className="setup-review-section">
      <h3>{title}</h3>
      <div className="setup-review-list">{hasChildren ? children : <p>{emptyText}</p>}</div>
    </section>
  );
}

function ReviewItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="setup-review-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function submitLabel(step: SetupStep): string {
  switch (step) {
    case 0:
      return 'Continue to role';
    case 1:
      return 'Continue to responsibilities';
    case 2:
      return 'Continue to authority and escalation';
    case 3:
      return 'Review setup';
    case 4:
      return 'Activate role';
  }
}
