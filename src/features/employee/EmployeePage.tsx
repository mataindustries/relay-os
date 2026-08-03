import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import {
  OPERATIONAL_TOPICS,
  getOperationalTopic,
  type Answer,
  type AnswerEligibilityEvaluation,
  type CurrencyCode,
  type CustomerCommitmentType,
  type EmployeeQuestion,
  type EmployeeQuestionRequestType,
  type EmployeeSensitivitySelection,
  type EmployeeVisibleKnowledge,
  type EmergencyCategory,
  type Escalation,
  type FinancialActionType,
  type KnowledgeGap,
  type OperationalTopicKey,
  type PhaseOneSnapshot,
  type StructuredQuestionContext,
} from '../../domain';

interface QuestionDraft {
  readonly employeeLabel: string;
  readonly questionText: string;
  readonly topicKey: OperationalTopicKey;
  readonly requestType: EmployeeQuestionRequestType;
  readonly sensitivitySelection: EmployeeSensitivitySelection;
  readonly currentStepLabel: string;
  readonly proposedAction: string;
  readonly subject: string;
  readonly requestedException: string;
  readonly exceptionReason: string;
  readonly financialActionType: FinancialActionType;
  readonly financialAmount: string;
  readonly financialCurrency: CurrencyCode;
  readonly emergencyUrgency: 'same-day' | 'immediate';
  readonly emergencyCategory: EmergencyCategory;
  readonly commitmentType: CustomerCommitmentType;
  readonly commitmentAmount: string;
  readonly commitmentCurrency: CurrencyCode;
  readonly commitmentDate: string;
}

const REQUEST_TYPES: readonly {
  readonly value: EmployeeQuestionRequestType;
  readonly label: string;
}[] = [
  { value: 'policy-lookup', label: 'Look up company policy' },
  { value: 'procedure-lookup', label: 'Look up a procedure' },
  { value: 'decision-request', label: 'Request a decision' },
  { value: 'exception-request', label: 'Request an exception' },
  { value: 'financial-action', label: 'Take a financial action' },
  { value: 'emergency-action', label: 'Handle an urgent or emergency action' },
  { value: 'customer-commitment', label: 'Make a customer commitment' },
];

const SENSITIVITY_OPTIONS: readonly {
  readonly value: EmployeeSensitivitySelection;
  readonly label: string;
}[] = [
  { value: 'none', label: 'None of these' },
  { value: 'customer-personal-data', label: 'Customer personal data' },
  { value: 'credentials-or-access', label: 'Credentials or access' },
  { value: 'payment-data', label: 'Payment data' },
  { value: 'health-or-safety', label: 'Health or safety information' },
  { value: 'legal-or-regulatory', label: 'Legal or regulatory information' },
  { value: 'other-sensitive', label: 'Other sensitive context' },
];

const FINANCIAL_ACTION_TYPES: readonly FinancialActionType[] = [
  'discount',
  'refund',
  'charge',
  'waive-fee',
  'other',
];

const EMERGENCY_CATEGORIES: readonly EmergencyCategory[] = [
  'gas-odor',
  'carbon-monoxide',
  'smoke-or-fire',
  'electrical-hazard',
  'water-leak',
  'no-heating-or-cooling',
  'other',
];

const COMMITMENT_TYPES: readonly CustomerCommitmentType[] = [
  'arrival-window',
  'price-or-estimate',
  'service-availability',
  'completion-date',
  'other',
];

function createQuestionDraft(employeeLabel = 'Employee'): QuestionDraft {
  return {
    employeeLabel,
    questionText: '',
    topicKey: OPERATIONAL_TOPICS[0]?.key ?? 'lead-intake',
    requestType: 'policy-lookup',
    sensitivitySelection: 'none',
    currentStepLabel: '',
    proposedAction: '',
    subject: '',
    requestedException: '',
    exceptionReason: '',
    financialActionType: 'discount',
    financialAmount: '',
    financialCurrency: 'USD',
    emergencyUrgency: 'immediate',
    emergencyCategory: 'gas-odor',
    commitmentType: 'arrival-window',
    commitmentAmount: '',
    commitmentCurrency: 'USD',
    commitmentDate: '',
  };
}

function readable(value: string): string {
  return value.replaceAll('-', ' ');
}

function structuredContextFor(draft: QuestionDraft): StructuredQuestionContext {
  switch (draft.requestType) {
    case 'policy-lookup':
      return { requestType: 'policy-lookup' };
    case 'procedure-lookup':
      return {
        requestType: 'procedure-lookup',
        ...(draft.currentStepLabel.trim()
          ? { currentStepLabel: draft.currentStepLabel.trim() }
          : {}),
      };
    case 'decision-request':
      return {
        requestType: 'decision-request',
        proposedAction: draft.proposedAction,
        ...(draft.subject.trim() ? { subject: draft.subject.trim() } : {}),
      };
    case 'exception-request':
      return {
        requestType: 'exception-request',
        requestedException: draft.requestedException,
        reason: draft.exceptionReason,
      };
    case 'financial-action':
      return {
        requestType: 'financial-action',
        actionType: draft.financialActionType,
        amount:
          draft.financialAmount.trim().length === 0 ? Number.NaN : Number(draft.financialAmount),
        currency: draft.financialCurrency,
      };
    case 'emergency-action':
      return {
        requestType: 'emergency-action',
        urgency: draft.emergencyUrgency,
        emergencyCategory: draft.emergencyCategory,
      };
    case 'customer-commitment': {
      const hasAmount = draft.commitmentAmount.trim().length > 0;
      return {
        requestType: 'customer-commitment',
        commitmentType: draft.commitmentType,
        ...(hasAmount
          ? {
              amount: Number(draft.commitmentAmount),
              currency: draft.commitmentCurrency,
            }
          : {}),
        ...(draft.commitmentDate ? { commitmentDate: draft.commitmentDate } : {}),
      };
    }
  }
}

function StructuredContextFields({
  draft,
  onChange,
}: {
  readonly draft: QuestionDraft;
  readonly onChange: (updates: Partial<QuestionDraft>) => void;
}) {
  switch (draft.requestType) {
    case 'policy-lookup':
      return (
        <p className="empty-state">
          No additional context is required. RoleKeep retrieves by the topic selected above, not by
          interpreting the question text.
        </p>
      );
    case 'procedure-lookup':
      return (
        <label>
          Current step (optional)
          <input
            value={draft.currentStepLabel}
            onChange={(event) => onChange({ currentStepLabel: event.target.value })}
          />
        </label>
      );
    case 'decision-request':
      return (
        <>
          <label>
            Proposed action
            <input
              value={draft.proposedAction}
              onChange={(event) => onChange({ proposedAction: event.target.value })}
            />
          </label>
          <label>
            Subject (optional)
            <input
              value={draft.subject}
              onChange={(event) => onChange({ subject: event.target.value })}
            />
          </label>
        </>
      );
    case 'exception-request':
      return (
        <>
          <label>
            Requested exception
            <input
              value={draft.requestedException}
              onChange={(event) => onChange({ requestedException: event.target.value })}
            />
          </label>
          <label>
            Reason for the exception
            <textarea
              rows={2}
              value={draft.exceptionReason}
              onChange={(event) => onChange({ exceptionReason: event.target.value })}
            />
          </label>
        </>
      );
    case 'financial-action':
      return (
        <>
          <label>
            Financial action
            <select
              value={draft.financialActionType}
              onChange={(event) =>
                onChange({ financialActionType: event.target.value as FinancialActionType })
              }
            >
              {FINANCIAL_ACTION_TYPES.map((actionType) => (
                <option key={actionType} value={actionType}>
                  {readable(actionType)}
                </option>
              ))}
            </select>
          </label>
          <div className="question-amount-fields">
            <label>
              Amount
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={draft.financialAmount}
                onChange={(event) => onChange({ financialAmount: event.target.value })}
              />
            </label>
            <label>
              Currency
              <select
                value={draft.financialCurrency}
                onChange={(event) =>
                  onChange({ financialCurrency: event.target.value as CurrencyCode })
                }
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
              </select>
            </label>
          </div>
          <p className="record-meta">
            The amount and currency are evaluated structurally. RoleKeep never parses a limit from
            the question text.
          </p>
        </>
      );
    case 'emergency-action':
      return (
        <>
          <label>
            Urgency
            <select
              value={draft.emergencyUrgency}
              onChange={(event) =>
                onChange({ emergencyUrgency: event.target.value as 'same-day' | 'immediate' })
              }
            >
              <option value="same-day">Same day</option>
              <option value="immediate">Immediate</option>
            </select>
          </label>
          <label>
            Emergency category
            <select
              value={draft.emergencyCategory}
              onChange={(event) =>
                onChange({ emergencyCategory: event.target.value as EmergencyCategory })
              }
            >
              {EMERGENCY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {readable(category)}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    case 'customer-commitment':
      return (
        <>
          <label>
            Commitment type
            <select
              value={draft.commitmentType}
              onChange={(event) =>
                onChange({ commitmentType: event.target.value as CustomerCommitmentType })
              }
            >
              {COMMITMENT_TYPES.map((commitmentType) => (
                <option key={commitmentType} value={commitmentType}>
                  {readable(commitmentType)}
                </option>
              ))}
            </select>
          </label>
          <div className="question-amount-fields">
            <label>
              Amount (optional)
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={draft.commitmentAmount}
                onChange={(event) => onChange({ commitmentAmount: event.target.value })}
              />
            </label>
            <label>
              Currency
              <select
                value={draft.commitmentCurrency}
                onChange={(event) =>
                  onChange({ commitmentCurrency: event.target.value as CurrencyCode })
                }
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
              </select>
            </label>
          </div>
          <label>
            Commitment date (optional)
            <input
              type="date"
              value={draft.commitmentDate}
              onChange={(event) => onChange({ commitmentDate: event.target.value })}
            />
          </label>
        </>
      );
  }
}

function outcomeHeading(answer: Answer): string {
  switch (answer.status) {
    case 'delivered':
      return 'Approved guidance available';
    case 'escalated':
      return 'Owner action required';
    case 'prohibited':
      return 'Requested action is prohibited';
    case 'withheld':
      return 'Answer withheld';
  }
}

interface QuestionOutcomeProps {
  readonly question: EmployeeQuestion;
  readonly evaluation: AnswerEligibilityEvaluation | undefined;
  readonly answer: Answer | undefined;
  readonly escalation: Escalation | undefined;
  readonly gap: KnowledgeGap | undefined;
  readonly snapshot: PhaseOneSnapshot;
  readonly employeeVisibleKnowledge: readonly EmployeeVisibleKnowledge[];
}

function QuestionOutcome({
  question,
  evaluation,
  answer,
  escalation,
  gap,
  snapshot,
  employeeVisibleKnowledge,
}: QuestionOutcomeProps) {
  if (evaluation === undefined || answer === undefined) {
    return (
      <section className="workspace-section question-result" aria-live="polite">
        <p className="phase-label">Question received</p>
        <h2>Evaluation is not complete</h2>
        <p>
          No answer has been delivered. The system must finish every deterministic gate before it
          may show company guidance.
        </p>
      </section>
    );
  }

  const visibleKnowledgeByClaimId = new Map(
    employeeVisibleKnowledge.map((entry) => [entry.claim.id, entry]),
  );
  const citedKnowledge = answer.citedClaimIds.flatMap((claimId) => {
    const entry = visibleKnowledgeByClaimId.get(claimId);
    return entry === undefined ? [] : [entry];
  });
  const citedSources = answer.citedSourceReferenceIds.flatMap((sourceId) => {
    const source = snapshot.sourceReferences.find(({ id }) => id === sourceId);
    return source === undefined ? [] : [source];
  });
  const citedDecisions = answer.citedApprovalDecisionIds.flatMap((decisionId) => {
    const decision = snapshot.approvalDecisions.find(({ id }) => id === decisionId);
    return decision === undefined ? [] : [decision];
  });
  const citedBoundaries = answer.citedAuthorityBoundaryIds.flatMap((boundaryId) => {
    const boundary = snapshot.role?.authorityBoundaries.find(({ id }) => id === boundaryId);
    return boundary === undefined ? [] : [boundary];
  });
  const failedGates = evaluation.gateResults.filter(({ status }) => status === 'fail');

  return (
    <section
      className={`workspace-section question-result question-result-${answer.status}`}
      aria-live="polite"
      aria-labelledby="question-result-title"
    >
      <div className="record-card-heading">
        <p className="phase-label">Deterministic outcome</p>
        <span className={`status-badge status-${answer.status}`}>{readable(answer.status)}</span>
      </div>
      <h2 id="question-result-title">{outcomeHeading(answer)}</h2>
      <dl className="question-outcome-summary">
        <div>
          <dt>Topic</dt>
          <dd>{getOperationalTopic(question.topicKey).label}</dd>
        </div>
        <div>
          <dt>Request type</dt>
          <dd>{readable(question.requestType)}</dd>
        </div>
        <div>
          <dt>Eligibility result</dt>
          <dd>{readable(evaluation.overallResult)}</dd>
        </div>
        <div>
          <dt>Question record</dt>
          <dd>{question.id}</dd>
        </div>
      </dl>

      <section className="answer-guidance" aria-labelledby="approved-guidance-title">
        <h3 id="approved-guidance-title">
          {answer.status === 'delivered'
            ? 'Deterministic cited response'
            : 'Why RoleKeep did not deliver guidance'}
        </h3>
        <p>{answer.responseText}</p>
        {failedGates.length > 0 ? (
          <ul className="gate-reason-list">
            {failedGates.map((gate) => (
              <li key={gate.gateKey}>
                <strong>{readable(gate.gateKey)}:</strong> {gate.reason}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {answer.status === 'delivered' ? (
        <>
          <section className="answer-citations" aria-labelledby="cited-guidance-title">
            <h3 id="cited-guidance-title">Cited company guidance</h3>
            {citedKnowledge.length === 0 ? (
              <p className="empty-state">
                Cited guidance is no longer in the current employee-visible selector. Submit a new
                question for current guidance.
              </p>
            ) : (
              <ul>
                {citedKnowledge.map(({ claim }) => (
                  <li key={claim.id}>{claim.statement}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="answer-authority" aria-labelledby="answer-authority-title">
            <h3 id="answer-authority-title">Authority for this request</h3>
            {question.requestType === 'policy-lookup' ||
            question.requestType === 'procedure-lookup' ? (
              <p className="approved-boundary-note">
                This is informational guidance only. It does not authorize an action, exception,
                commitment, or financial decision.
              </p>
            ) : citedBoundaries.length > 0 ? (
              <ul>
                {citedBoundaries.map((boundary) => (
                  <li key={boundary.id}>
                    <strong>{boundary.subject}</strong> — {readable(boundary.permissionLevel)}
                    {boundary.numericLimit !== undefined
                      ? ` up to ${boundary.currency ?? ''} ${boundary.numericLimit}`
                      : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">No action authority was delivered.</p>
            )}
          </section>

          <section className="answer-provenance-grid" aria-label="Sources and owner approval">
            <div>
              <h3>Sources</h3>
              <ul>
                {citedSources.map((source) => (
                  <li key={source.id}>
                    <strong>{source.sourceTitle}</strong>
                    <span>
                      {source.sourceType === 'owner-interview'
                        ? 'Immutable owner interview evidence; raw question and answer withheld.'
                        : source.sourceLocator}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Owner approval</h3>
              <ul>
                {citedDecisions.map((decision) => (
                  <li key={decision.id}>
                    Approved by {decision.actorLabel}{' '}
                    <time dateTime={decision.decidedAt}>{decision.decidedAt}</time>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      ) : null}

      {answer.status === 'prohibited' && citedBoundaries.length > 0 ? (
        <section className="answer-authority" aria-labelledby="prohibited-boundary-title">
          <h3 id="prohibited-boundary-title">Grounded authority boundary</h3>
          <ul>
            {citedBoundaries.map((boundary) => (
              <li key={boundary.id}>
                {boundary.subject} — {readable(boundary.permissionLevel)}
              </li>
            ))}
          </ul>
          <p>
            <strong>Next action:</strong> Do not take the requested action.
          </p>
        </section>
      ) : null}

      {escalation ? (
        <section className="employee-escalation-summary" aria-labelledby="escalation-summary-title">
          <h3 id="escalation-summary-title">Owner escalation opened</h3>
          <p>
            RoleKeep opened escalation <strong>{escalation.id}</strong> for{' '}
            {readable(escalation.reason)} and routed it to {escalation.destination}.
          </p>
          <p>
            <strong>Next action:</strong> Wait for the recorded owner decision. Do not treat the
            escalation as permission or policy.
          </p>
          <Link className="text-link" to={`/escalations#escalation-${escalation.id}`}>
            Open escalation record
          </Link>
        </section>
      ) : null}

      {answer.status === 'withheld' && escalation === undefined ? (
        <p className="empty-state">
          <strong>Next action:</strong> Ask the owner to review the recorded system deficiency, then
          submit a new structured question after the operating system is updated. No permission has
          been granted.
        </p>
      ) : null}

      <div className="question-system-status">
        <p>
          <strong>Escalation:</strong>{' '}
          {escalation
            ? `${escalation.id} was opened for owner action.`
            : 'No escalation was opened for this outcome.'}
        </p>
        <p>
          <strong>Knowledge gap:</strong>{' '}
          {gap
            ? 'A genuine system deficiency was linked for owner follow-up.'
            : 'No gap was created for this outcome.'}
        </p>
      </div>
    </section>
  );
}

export function EmployeePage() {
  const session = useRelaySession();
  const { snapshot, employeeVisibleKnowledge, isFictionalDemo } = session;
  const { company, role } = snapshot;
  const initialEmployeeLabel = isFictionalDemo ? 'Fictional dispatcher' : 'Employee';
  const [draft, setDraft] = useState(() => createQuestionDraft(initialEmployeeLabel));
  const [historyEmployeeLabel, setHistoryEmployeeLabel] = useState(initialEmployeeLabel);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [correctsQuestionId, setCorrectsQuestionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="employee-title">
        <p className="phase-label">Phase 3 · Employee Question-to-System</p>
        <h1 id="employee-title">No active role knowledge</h1>
        <p>An owner must activate the one company and role before questions can be evaluated.</p>
        <aside className="sample-workspace-callout" role="note">
          <Link to="/demo">Start the sample HVAC workspace to explore this screen.</Link>
        </aside>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  const employeeQuestions = snapshot.employeeQuestions
    .filter(({ employeeLabel }) => employeeLabel === historyEmployeeLabel)
    .sort(
      (left, right) =>
        right.submittedAt.localeCompare(left.submittedAt) || right.id.localeCompare(left.id),
    );
  const selectedQuestion =
    snapshot.employeeQuestions.find(({ id }) => id === selectedQuestionId) ?? employeeQuestions[0];
  const selectedEvaluation = selectedQuestion
    ? snapshot.answerEligibilityEvaluations.find(
        ({ questionId }) => questionId === selectedQuestion.id,
      )
    : undefined;
  const selectedAnswer = selectedQuestion
    ? snapshot.answers.find(({ questionId }) => questionId === selectedQuestion.id)
    : undefined;
  const selectedEscalation = selectedQuestion
    ? snapshot.escalations.find(({ questionId }) => questionId === selectedQuestion.id)
    : undefined;
  const selectedGap = selectedQuestion
    ? snapshot.knowledgeGaps.find(
        (gap) =>
          gap.id === selectedEscalation?.relatedGapId ||
          gap.triggeringQuestionIds?.includes(selectedQuestion.id),
      )
    : undefined;

  function updateDraft(updates: Partial<QuestionDraft>): void {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function submitQuestion(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFeedback(null);
    const submitted = session.submitEmployeeQuestion({
      employeeLabel: draft.employeeLabel,
      questionText: draft.questionText,
      topicKey: draft.topicKey,
      requestType: draft.requestType,
      sensitivitySelection: draft.sensitivitySelection,
      structuredContext: structuredContextFor(draft),
      ...(correctsQuestionId ? { correctsQuestionId } : {}),
    });
    if (!submitted.ok) {
      setFeedback({ ok: false, message: submitted.error.message });
      return;
    }

    setHistoryEmployeeLabel(submitted.value.employeeLabel);
    setSelectedQuestionId(submitted.value.id);
    const evaluated = session.evaluateEmployeeQuestion(submitted.value.id);
    if (!evaluated.ok) {
      setFeedback({
        ok: false,
        message: `Question ${submitted.value.id} was retained, but evaluation failed closed: ${evaluated.error.message}`,
      });
      return;
    }

    setCorrectsQuestionId(null);
    setDraft((current) => ({ ...current, questionText: '' }));
    setFeedback({
      ok: true,
      message: `Question evaluated: ${readable(evaluated.value.evaluation.overallResult)}.`,
    });
  }

  function beginCorrection(question: EmployeeQuestion): void {
    setCorrectsQuestionId(question.id);
    setDraft({
      ...createQuestionDraft(question.employeeLabel),
      topicKey: question.topicKey,
      requestType: question.requestType,
      sensitivitySelection: question.sensitivitySelection,
    });
    setFeedback({
      ok: true,
      message:
        'A new correction is ready. Re-enter the question and structured context; the original record will not be edited.',
    });
  }

  return (
    <div className="workspace-page employee-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 3 · Employee Question-to-System</p>
        <h1>{role.title}</h1>
        <p className="workspace-lede">
          Ask a structured operational question. RoleKeep applies a deterministic policy firewall
          and either returns cited approved guidance or fails closed.
        </p>
        <p>
          <strong>Role mission:</strong> {role.mission}
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration data — not real company policy or customer information.
          </p>
        ) : null}
      </header>

      <div className="employee-warning-stack">
        <aside className="setup-session-notice">
          <strong>Current browser memory session only.</strong> Questions, outcomes, and escalations
          disappear when this page reloads. Nothing is sent to an external service.
        </aside>
        <aside className="sensitive-data-warning" id="sensitive-data-warning">
          <strong>Do not paste sensitive values.</strong> Do not enter passwords, access codes,
          payment card or bank details, health details, or unnecessary personal information. Select
          a sensitivity category so RoleKeep can fail closed.
        </aside>
        <aside className="professional-advice-warning">
          RoleKeep provides only reviewed company operating guidance. It is not legal, medical,
          financial, safety, or emergency professional advice and does not replace emergency
          services or an authorized professional.
        </aside>
      </div>

      <section
        className="workspace-section employee-question-workspace"
        aria-labelledby="ask-title"
      >
        <h2 id="ask-title">Submit a structured question</h2>
        <p>
          Question text is retained as employee input. It is not used for semantic retrieval, topic
          selection, sensitivity detection, authority inference, or limit parsing.
        </p>
        {correctsQuestionId ? (
          <div className="correction-notice" role="status">
            Creating a new correction to question {correctsQuestionId}. The original remains
            immutable.
            <button
              className="secondary-button"
              type="button"
              onClick={() => setCorrectsQuestionId(null)}
            >
              Cancel correction
            </button>
          </div>
        ) : null}
        <form
          className="stacked-form employee-question-form"
          noValidate
          aria-describedby="sensitive-data-warning"
          onSubmit={submitQuestion}
        >
          <div>
            <p>
              <strong>Session employee label:</strong> {draft.employeeLabel}
            </p>
            <p className="record-meta">
              This demonstration persona is fixed for the page session. It is a history filter, not
              authenticated identity or access control.
            </p>
          </div>
          <label>
            Operational topic
            <select
              value={draft.topicKey}
              onChange={(event) =>
                updateDraft({ topicKey: event.target.value as OperationalTopicKey })
              }
            >
              {OPERATIONAL_TOPICS.map((topic) => (
                <option key={topic.key} value={topic.key}>
                  {topic.label} · {topic.riskTier} risk
                </option>
              ))}
            </select>
          </label>
          <label>
            Type of help
            <select
              value={draft.requestType}
              onChange={(event) =>
                updateDraft({ requestType: event.target.value as EmployeeQuestionRequestType })
              }
            >
              {REQUEST_TYPES.map((requestType) => (
                <option key={requestType.value} value={requestType.value}>
                  {requestType.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sensitivity category
            <select
              value={draft.sensitivitySelection}
              onChange={(event) =>
                updateDraft({
                  sensitivitySelection: event.target.value as EmployeeSensitivitySelection,
                })
              }
            >
              {SENSITIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="structured-context-fields">
            <legend>Structured request context</legend>
            <StructuredContextFields draft={draft} onChange={updateDraft} />
          </fieldset>

          <label>
            Operational question
            <textarea
              rows={4}
              value={draft.questionText}
              onChange={(event) => updateDraft({ questionText: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">
            Submit and evaluate question
          </button>
        </form>
        {feedback ? (
          <p
            className={feedback.ok ? 'form-feedback success' : 'form-feedback error'}
            role="status"
          >
            {feedback.message}
          </p>
        ) : null}
      </section>

      {selectedQuestion ? (
        <QuestionOutcome
          question={selectedQuestion}
          evaluation={selectedEvaluation}
          answer={selectedAnswer}
          escalation={selectedEscalation}
          gap={selectedGap}
          snapshot={snapshot}
          employeeVisibleKnowledge={employeeVisibleKnowledge}
        />
      ) : null}

      <section className="workspace-section" aria-labelledby="question-history-title">
        <div className="section-heading-row">
          <div>
            <h2 id="question-history-title">Your question history</h2>
            <p>Actual session records for employee label: {historyEmployeeLabel}</p>
          </div>
          <span>{employeeQuestions.length} questions</span>
        </div>
        {employeeQuestions.length === 0 ? (
          <p className="empty-state">
            No question has been submitted with this employee label in the current page session.
          </p>
        ) : (
          <ol className="question-history-list">
            {employeeQuestions.map((question) => {
              const answer = snapshot.answers.find(({ questionId }) => questionId === question.id);
              return (
                <li className="question-history-card" key={question.id}>
                  <div className="record-card-heading">
                    <span className={`status-badge status-${answer?.status ?? question.status}`}>
                      {readable(answer?.status ?? question.status)}
                    </span>
                    <time dateTime={question.submittedAt}>{question.submittedAt}</time>
                  </div>
                  <h3>{getOperationalTopic(question.topicKey).label}</h3>
                  <p className="record-meta">
                    {readable(question.requestType)} · sensitivity selected:{' '}
                    {readable(question.sensitivitySelection)}
                  </p>
                  <p>
                    Raw question text is not repeated in history. Open the outcome to review the
                    deterministic result.
                  </p>
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setSelectedQuestionId(question.id)}
                    >
                      View outcome
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => beginCorrection(question)}
                    >
                      Create corrected question
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="workspace-section" aria-labelledby="employee-knowledge-title">
        <h2 id="employee-knowledge-title">Browse approved company knowledge</h2>
        <p className="approved-boundary-note">
          This section uses only the deterministic employee-visible selector. Proposed, extracted,
          rejected, missing, conflicting, and superseded claims are withheld.
        </p>
        {employeeVisibleKnowledge.length === 0 ? (
          <div className="empty-state">
            <p>No current knowledge has passed the approval and provenance boundary.</p>
            <p>An owner must approve a source-backed claim before it can appear here.</p>
          </div>
        ) : (
          <ul className="record-list approved-knowledge-list">
            {employeeVisibleKnowledge.map(({ claim, sourceReferences, approvalDecisions }) => (
              <li className="record-card approved-record" key={claim.id}>
                <div className="record-card-heading">
                  <span className="status-badge status-approved">Approved</span>
                  <span>Version {claim.version}</span>
                </div>
                <h3>{claim.statement}</h3>
                <p className="record-meta">{claim.category.replaceAll('-', ' ')}</p>
                {claim.topicKey ? (
                  <p className="record-meta">Topic: {getOperationalTopic(claim.topicKey).label}</p>
                ) : null}
                <div className="evidence-block">
                  <h4>Sources</h4>
                  <ul>
                    {sourceReferences.map((source) => (
                      <li key={source.id}>
                        {source.sourceType === 'owner-interview'
                          ? `${source.sourceTitle} — immutable interview evidence retained; raw question and answer withheld here`
                          : `${source.sourceTitle} — ${source.sourceLocator}`}
                      </li>
                    ))}
                  </ul>
                  <p>
                    Approved by {approvalDecisions.at(-1)?.actorLabel ?? 'recorded owner'} with an
                    append-only decision on{' '}
                    <time dateTime={approvalDecisions.at(-1)?.decidedAt}>
                      {approvalDecisions.at(-1)?.decidedAt ?? 'the recorded decision date'}
                    </time>
                    .
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
