export type DomainErrorCode =
  | 'validation-error'
  | 'already-initialized'
  | 'company-not-found'
  | 'role-not-found'
  | 'relationship-mismatch'
  | 'not-found'
  | 'invalid-transition'
  | 'missing-source'
  | 'source-not-found'
  | 'document-not-found'
  | 'document-version-not-found'
  | 'immutable-source-document'
  | 'invalid-line-range'
  | 'invalid-topic'
  | 'invalid-request-type'
  | 'invalid-sensitivity-selection'
  | 'invalid-question-context'
  | 'gap-not-found'
  | 'question-not-found'
  | 'employee-question-not-found'
  | 'evaluation-not-found'
  | 'escalation-not-found'
  | 'answer-not-found'
  | 'immutable-question'
  | 'immutable-answer'
  | 'destination-not-configured'
  | 'approval-decision-required'
  | 'immutable-approved-claim'
  | 'revision-conflict'
  | 'duplicate-record';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly field?: string;

  constructor(code: DomainErrorCode, message: string, field?: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    if (field !== undefined) {
      this.field = field;
    }
  }
}

export type DomainResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DomainError };

export function domainSuccess<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}

export function domainFailure<T = never>(
  code: DomainErrorCode,
  message: string,
  field?: string,
): DomainResult<T> {
  return { ok: false, error: new DomainError(code, message, field) };
}
