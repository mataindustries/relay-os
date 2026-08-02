import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import {
  getOperationalTopic,
  type ActivityEvent,
  type AnswerEligibilityEvaluation,
  type EmployeeQuestion,
  type Escalation,
} from '../../domain';

const ESCALATION_STATUS_ORDER = {
  open: 0,
  assigned: 1,
  resolved: 2,
  closed: 3,
} as const;

function readable(value: string): string {
  return value.replaceAll('-', ' ');
}

function EscalationActions({ escalation }: { readonly escalation: Escalation }) {
  const { assignEscalation, resolveEscalation, closeEscalation } = useRelaySession();
  const [assigneeLabel, setAssigneeLabel] = useState('Owner');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolvedByLabel, setResolvedByLabel] = useState('Owner');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function assign(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = assignEscalation(escalation.id, assigneeLabel);
    setFeedback(
      result.ok
        ? { ok: true, message: 'Escalation assigned. The activity trace was appended.' }
        : { ok: false, message: result.error.message },
    );
  }

  function resolve(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = resolveEscalation(escalation.id, resolutionSummary, resolvedByLabel);
    setFeedback(
      result.ok
        ? {
            ok: true,
            message:
              'Resolution recorded. It did not create or approve knowledge and did not resolve a gap.',
          }
        : { ok: false, message: result.error.message },
    );
  }

  function close(): void {
    const result = closeEscalation(escalation.id);
    setFeedback(
      result.ok
        ? { ok: true, message: 'Resolved escalation closed with its history retained.' }
        : { ok: false, message: result.error.message },
    );
  }

  return (
    <section className="escalation-actions" aria-label="Escalation actions">
      <h3>Owner action</h3>
      {escalation.status === 'open' ? (
        <form className="stacked-form" onSubmit={assign}>
          <label>
            Assign to label
            <input
              value={assigneeLabel}
              onChange={(event) => setAssigneeLabel(event.target.value)}
            />
          </label>
          <button className="primary-button" type="submit">
            Assign escalation
          </button>
        </form>
      ) : null}

      {escalation.status === 'open' || escalation.status === 'assigned' ? (
        <form className="stacked-form" onSubmit={resolve}>
          <label>
            Resolved by
            <input
              value={resolvedByLabel}
              onChange={(event) => setResolvedByLabel(event.target.value)}
            />
          </label>
          <label>
            Resolution summary
            <textarea
              rows={3}
              value={resolutionSummary}
              onChange={(event) => setResolutionSummary(event.target.value)}
            />
          </label>
          <p className="record-meta">
            A resolution is operational history, not company policy. If it should become reusable
            guidance, start the source-backed review workflow.
          </p>
          <button className="primary-button" type="submit">
            Record resolution
          </button>
        </form>
      ) : null}

      {escalation.status === 'resolved' ? (
        <button className="secondary-button" type="button" onClick={close}>
          Close resolved escalation
        </button>
      ) : null}

      {escalation.status === 'closed' ? (
        <p className="empty-state">This escalation is closed. Its trace remains append-only.</p>
      ) : null}

      {feedback ? (
        <p className={feedback.ok ? 'form-feedback success' : 'form-feedback error'} role="status">
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}

function GateTrace({
  evaluation,
}: {
  readonly evaluation: AnswerEligibilityEvaluation | undefined;
}) {
  return (
    <section className="escalation-trace-section" aria-label="Deterministic gate trace">
      <h3>Deterministic gate trace</h3>
      <p className="record-meta">
        This is an explicit audit of rules and records, not hidden model reasoning.
      </p>
      {evaluation === undefined ? (
        <p className="empty-state">No eligibility evaluation is linked to this question.</p>
      ) : (
        <ol className="gate-trace-list">
          {evaluation.gateResults.map((gate) => (
            <li className="gate-trace-item" key={gate.gateKey}>
              <div className="record-card-heading">
                <strong>{readable(gate.gateKey)}</strong>
                <span className={`trace-status trace-${gate.status}`}>{readable(gate.status)}</span>
              </div>
              <p>{gate.reason}</p>
              {gate.supportingRecordIds.length > 0 ? (
                <p className="record-meta">
                  Supporting records: {gate.supportingRecordIds.join(', ')}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ActivityTrace({ events }: { readonly events: readonly ActivityEvent[] }) {
  return (
    <section className="escalation-trace-section" aria-label="Activity trace">
      <h3>Activity trace</h3>
      {events.length === 0 ? (
        <p className="empty-state">No activity event is linked to this escalation.</p>
      ) : (
        <ol className="activity-trace-list">
          {events.map((event) => (
            <li key={event.id}>
              <strong>{readable(event.eventType)}</strong>
              <span>
                {event.actorLabel} · <time dateTime={event.occurredAt}>{event.occurredAt}</time>
              </span>
              <span className="record-meta">
                {readable(event.entityType)} · {event.entityId}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function RelatedQuestion({ question }: { readonly question: EmployeeQuestion }) {
  return (
    <details className="related-question-record">
      <summary>Open related question record</summary>
      <p>
        An employee submitted a {readable(question.requestType)} about{' '}
        {getOperationalTopic(question.topicKey).label}.
      </p>
      <dl className="question-record-grid">
        <div>
          <dt>Question record</dt>
          <dd>{question.id}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>
            <time dateTime={question.submittedAt}>{question.submittedAt}</time>
          </dd>
        </div>
        <div>
          <dt>Sensitivity selection</dt>
          <dd>{readable(question.sensitivitySelection)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{readable(question.status)}</dd>
        </div>
      </dl>
      <p className="record-meta">
        The employee’s raw question is retained in the domain record but is not repeated in this
        queue. The structured escalation context below is the safe handoff.
      </p>
    </details>
  );
}

function EscalationCard({ escalation }: { readonly escalation: Escalation }) {
  const { snapshot } = useRelaySession();
  const question = snapshot.employeeQuestions.find(({ id }) => id === escalation.questionId);
  const evaluation = snapshot.answerEligibilityEvaluations.find(
    ({ questionId }) => questionId === escalation.questionId,
  );
  const gap = escalation.relatedGapId
    ? snapshot.knowledgeGaps.find(({ id }) => id === escalation.relatedGapId)
    : undefined;
  const boundaries = snapshot.role?.authorityBoundaries.filter(({ id }) =>
    escalation.matchingBoundaryIds.includes(id),
  );
  const rules = snapshot.role?.escalationRules.filter(({ id }) =>
    escalation.matchingEscalationRuleIds.includes(id),
  );
  const events = snapshot.activityEvents
    .filter(({ correlationId }) => correlationId === escalation.correlationId)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  return (
    <article
      className={`escalation-card escalation-card-${escalation.status}`}
      id={`escalation-${escalation.id}`}
      aria-labelledby={`escalation-title-${escalation.id}`}
    >
      <div className="record-card-heading">
        <span className={`status-badge status-${escalation.status}`}>
          {readable(escalation.status)}
        </span>
        <span
          className={`risk-badge risk-${
            escalation.urgency === 'immediate'
              ? 'critical'
              : escalation.urgency === 'same-day'
                ? 'high'
                : 'normal'
          }`}
        >
          {readable(escalation.urgency)}
        </span>
      </div>
      <h2 id={`escalation-title-${escalation.id}`}>
        {question ? getOperationalTopic(question.topicKey).label : 'Scoped employee question'}
      </h2>
      <p className="workspace-lede">
        {question
          ? `An employee submitted a ${readable(question.requestType)}. RelayOS routed it without inventing policy.`
          : 'The related question record is unavailable, so this escalation remains visible for owner review.'}
      </p>

      <dl className="escalation-summary-grid">
        <div>
          <dt>Reason</dt>
          <dd>{readable(escalation.reason)}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{escalation.destination}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>
            <time dateTime={escalation.createdAt}>{escalation.createdAt}</time>
          </dd>
        </div>
        <div>
          <dt>Escalation ID</dt>
          <dd>{escalation.id}</dd>
        </div>
        {escalation.assignedToLabel ? (
          <div>
            <dt>Assigned to</dt>
            <dd>{escalation.assignedToLabel}</dd>
          </div>
        ) : null}
        {escalation.assignedAt ? (
          <div>
            <dt>Assigned</dt>
            <dd>
              <time dateTime={escalation.assignedAt}>{escalation.assignedAt}</time>
            </dd>
          </div>
        ) : null}
        {escalation.resolvedAt ? (
          <div>
            <dt>Resolved</dt>
            <dd>
              <time dateTime={escalation.resolvedAt}>{escalation.resolvedAt}</time>
            </dd>
          </div>
        ) : null}
      </dl>

      {question ? <RelatedQuestion question={question} /> : null}

      <section className="escalation-context" aria-label="Required structured context">
        <h3>Required structured context</h3>
        {escalation.requiredContext.length === 0 ? (
          <p className="empty-state">No additional structured context was required.</p>
        ) : (
          <dl className="context-item-list">
            {escalation.requiredContext.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p className="record-meta">
          Context is assembled from typed fields. Raw sensitive values are intentionally omitted.
        </p>
      </section>

      <section className="matching-records" aria-label="Matching authority and escalation records">
        <h3>Matching boundary or rule</h3>
        {boundaries && boundaries.length > 0 ? (
          <ul>
            {boundaries.map((boundary) => (
              <li key={boundary.id}>
                <strong>{boundary.subject}</strong> — {readable(boundary.permissionLevel)}
                {boundary.numericLimit !== undefined
                  ? ` up to ${boundary.currency ?? ''} ${boundary.numericLimit}`
                  : ''}
              </li>
            ))}
          </ul>
        ) : null}
        {rules && rules.length > 0 ? (
          <ul>
            {rules.map((rule) => (
              <li key={rule.id}>
                <strong>{rule.trigger}</strong> — route to {rule.destination}
              </li>
            ))}
          </ul>
        ) : null}
        {(boundaries?.length ?? 0) === 0 && (rules?.length ?? 0) === 0 ? (
          <p className="empty-state">
            No structured boundary or rule matched. The configured owner fallback supplied the
            destination for this system deficiency.
          </p>
        ) : null}
      </section>

      <section className="related-gap-summary" aria-label="Related knowledge gap">
        <h3>Related knowledge gap</h3>
        {gap ? (
          <>
            <p>
              {gap.description} <strong>Status:</strong> {readable(gap.status)}
            </p>
            <Link className="text-link" to={`/owner#gap-${gap.id}`}>
              Open related gap in coverage
            </Link>
          </>
        ) : (
          <p className="empty-state">
            No knowledge gap is linked. A known approval, escalation, prohibition, emergency, or
            sensitivity rule does not manufacture a gap.
          </p>
        )}
      </section>

      {escalation.resolutionSummary ? (
        <section className="resolution-record" aria-label="Recorded resolution">
          <h3>Recorded resolution</h3>
          <p>{escalation.resolutionSummary}</p>
          <p className="record-meta">Resolved by {escalation.resolvedByLabel}</p>
        </section>
      ) : null}

      <GateTrace evaluation={evaluation} />
      <ActivityTrace events={events} />
      <EscalationActions escalation={escalation} />

      <nav className="remediation-links" aria-label="Operating system improvement workflows">
        <Link className="secondary-link" to="/sources">
          Start source work
        </Link>
        <Link className="secondary-link" to="/interview">
          Start gap interview
        </Link>
        <Link className="primary-link" to="/review">
          Open source-backed review
        </Link>
      </nav>
    </article>
  );
}

export function EscalationsPage() {
  const { snapshot, isFictionalDemo } = useRelaySession();
  const { company, role, escalations } = snapshot;

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="escalations-title">
        <p className="phase-label">Phase 3 · Owner escalation queue</p>
        <h1 id="escalations-title">No active role escalation queue</h1>
        <p>Complete setup or load the fictional demonstration before reviewing escalations.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  const orderedEscalations = [...escalations].sort(
    (left, right) =>
      ESCALATION_STATUS_ORDER[left.status] - ESCALATION_STATUS_ORDER[right.status] ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
  const activeCount = escalations.filter(({ status }) =>
    ['open', 'assigned'].includes(status),
  ).length;

  return (
    <div className="workspace-page escalations-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 3 · Owner escalation queue</p>
        <h1>Escalations</h1>
        <p className="workspace-lede">
          Review deterministic handoffs, their explicit gate trace, and the minimized structured
          context needed for a human decision.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration records — not real customer requests or company policy.
          </p>
        ) : null}
      </header>

      <aside className="setup-session-notice">
        <strong>Current browser memory session only.</strong> Assignments and resolutions disappear
        on reload. No email, text message, or external notification is sent.
      </aside>
      <p className="approved-boundary-note">
        Resolving an escalation never creates or approves company knowledge, changes approval
        history, or resolves a knowledge gap.
      </p>

      <div className="interview-progress" aria-label="Escalation queue summary">
        <span>{activeCount} open or assigned</span>
        <span>{escalations.length} total session escalations</span>
      </div>

      {orderedEscalations.length === 0 ? (
        <section className="workspace-section">
          <h2>No escalations in this session</h2>
          <p className="empty-state">
            This queue reflects actual structured employee questions. An empty queue is not proof
            that the operating system is complete or risk-free.
          </p>
          <Link className="primary-link" to="/employee">
            Open employee question workspace
          </Link>
        </section>
      ) : (
        <div className="escalation-queue">
          {orderedEscalations.map((escalation) => (
            <EscalationCard escalation={escalation} key={escalation.id} />
          ))}
        </div>
      )}
    </div>
  );
}
