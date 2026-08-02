import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import { getOperationalTopic, type InterviewAnswer, type InterviewQuestion } from '../../domain';

interface QuestionFormProps {
  readonly question: InterviewQuestion;
  readonly onAnswered: (answer: InterviewAnswer) => void;
}

function QuestionForm({ question, onAnswered }: QuestionFormProps) {
  const { submitInterviewAnswer, skipInterviewQuestion } = useRelaySession();
  const [actorLabel, setActorLabel] = useState('Owner');
  const [answer, setAnswer] = useState('');
  const [skipReason, setSkipReason] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const structuredValue =
      question.answerType === 'yes-no'
        ? answer === 'Yes'
          ? true
          : answer === 'No'
            ? false
            : undefined
        : question.answerType === 'numeric-limit'
          ? answer.trim().length === 0
            ? undefined
            : Number(answer)
          : question.answerType === 'single-choice'
            ? answer
            : undefined;
    const result = submitInterviewAnswer({
      questionId: question.id,
      actorLabel,
      answer,
      ...(structuredValue === undefined ? {} : { structuredValue }),
    });
    if (!result.ok) {
      setFeedback({ ok: false, message: result.error.message });
      return;
    }
    setFeedback({
      ok: true,
      message: 'Answer retained with immutable provenance; an unapproved proposal was created.',
    });
    onAnswered(result.value);
  }

  function skip(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = skipInterviewQuestion(question.id, skipReason);
    setFeedback(
      result.ok
        ? { ok: true, message: 'Question skipped with its reason. The gap remains unresolved.' }
        : { ok: false, message: result.error.message },
    );
  }

  return (
    <div className="interview-answer-area">
      <form className="stacked-form" onSubmit={submit}>
        <label>
          Answered by
          <input value={actorLabel} onChange={(event) => setActorLabel(event.target.value)} />
        </label>
        <AnswerControl question={question} answer={answer} onChange={setAnswer} />
        <button className="primary-button" type="submit">
          Retain answer and create proposal
        </button>
      </form>

      <details className="skip-question-controls">
        <summary>Skip this question</summary>
        <form className="stacked-form" onSubmit={skip}>
          <label>
            Reason for skipping
            <textarea
              rows={2}
              value={skipReason}
              onChange={(event) => setSkipReason(event.target.value)}
            />
          </label>
          <button className="secondary-button" type="submit">
            Skip with reason
          </button>
        </form>
      </details>
      {feedback ? (
        <p className={feedback.ok ? 'form-feedback success' : 'form-feedback error'} role="status">
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

function AnswerControl({
  question,
  answer,
  onChange,
}: {
  readonly question: InterviewQuestion;
  readonly answer: string;
  readonly onChange: (answer: string) => void;
}) {
  if (question.answerType === 'yes-no') {
    return (
      <fieldset className="interview-choice-control">
        <legend>Your answer</legend>
        {['Yes', 'No'].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={`answer-${question.id}`}
              value={option}
              checked={answer === option}
              onChange={(event) => onChange(event.target.value)}
            />
            {option}
          </label>
        ))}
      </fieldset>
    );
  }
  if (question.answerType === 'single-choice') {
    return (
      <label>
        Your answer
        <select value={answer} onChange={(event) => onChange(event.target.value)}>
          <option value="">Choose one</option>
          {question.answerOptions?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (question.answerType === 'numeric-limit') {
    return (
      <label>
        Numeric limit
        <input
          type="number"
          min={0}
          step="any"
          value={answer}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }
  if (question.answerType === 'short-text' || question.answerType === 'person-or-destination') {
    return (
      <label>
        Your answer
        <input value={answer} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }
  return (
    <label>
      Your answer
      <textarea rows={5} value={answer} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function InterviewPage() {
  const session = useRelaySession();
  const { company, role, knowledgeGaps, interviewAnswers, knowledgeClaims } = session.snapshot;
  const [queueFeedback, setQueueFeedback] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<InterviewAnswer | null>(null);

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="interview-title">
        <p className="phase-label">Phase 2 · Knowledge Gap Interviewer</p>
        <h1 id="interview-title">No active role to interview</h1>
        <p>Complete setup or load the fictional demonstration before building a question queue.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  const activeQuestion = session.interviewQueue[0];
  const unresolved = knowledgeGaps.filter(({ status }) =>
    ['open', 'question-ready', 'answered', 'proposal-created'].includes(status),
  );
  const criticalRemaining = unresolved.filter(({ riskTier }) => riskTier === 'critical').length;
  const proposalsAwaitingReview = knowledgeClaims.filter(
    ({ lifecycleStatus, provenance }) =>
      provenance === 'owner-interview-derived' && lifecycleStatus === 'proposed',
  ).length;
  const coverage = session.coverageResult.ok
    ? session.coverageResult.value.find(({ topic }) => topic.key === activeQuestion?.topicKey)
    : undefined;

  function buildQueue(): void {
    const result = session.generateInterviewQuestions();
    setQueueFeedback(
      result.ok
        ? `${result.value.length} unresolved questions are currently active or queued.`
        : result.error.message,
    );
  }

  return (
    <div className="workspace-page interview-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 2 · Knowledge Gap Interviewer</p>
        <h1>Knowledge Gap Interviewer</h1>
        <p className="workspace-lede">
          One deterministic question at a time, selected from explicit coverage rules—not AI or
          document interpretation.
        </p>
      </header>

      <aside className="setup-session-notice">
        Answers remain in this browser memory session only. Each answer becomes a source-backed
        proposal, never approved policy.
      </aside>

      <div className="interview-progress" aria-label="Interview progress">
        <span>{criticalRemaining} critical gaps remaining</span>
        <span>{interviewAnswers.length} questions answered</span>
        <span>{proposalsAwaitingReview} proposals awaiting review</span>
      </div>

      <div className="button-row">
        <button className="secondary-button" type="button" onClick={buildQueue}>
          Build deterministic question queue
        </button>
        <Link className="text-link" to="/owner">
          View all coverage
        </Link>
      </div>
      {queueFeedback ? <p className="form-feedback success">{queueFeedback}</p> : null}
      {lastAnswer ? (
        <p className="proposal-created-notice" role="status">
          Proposal created from the retained answer.{' '}
          <Link to={`/review#claim-${lastAnswer.generatedClaimId}`}>Review the new proposal</Link>
        </p>
      ) : null}

      {activeQuestion === undefined ? (
        <section className="workspace-section honest-queue-state">
          <h2>No active question</h2>
          <p>
            The deterministic queue is empty. This does not mean the company is compliant, safe, or
            fully documented. Build the queue after coverage changes, or review current proposals
            and dismissed gaps.
          </p>
          <Link className="primary-link" to="/review">
            Open knowledge review
          </Link>
        </section>
      ) : (
        <article className="interview-question-card" aria-labelledby="active-question-title">
          <div className="record-card-heading">
            <span
              className={`risk-badge risk-${getOperationalTopic(activeQuestion.topicKey).riskTier}`}
            >
              {getOperationalTopic(activeQuestion.topicKey).riskTier} risk
            </span>
            <span>{getOperationalTopic(activeQuestion.topicKey).label}</span>
          </div>
          <p className="eyebrow">Current question</p>
          <h2 id="active-question-title">{activeQuestion.prompt}</h2>
          <dl className="interview-rationale">
            <div>
              <dt>Why RelayOS is asking</dt>
              <dd>{activeQuestion.rationale}</dd>
            </div>
            <div>
              <dt>What this answer unlocks</dt>
              <dd>{activeQuestion.whatItUnlocks}</dd>
            </div>
          </dl>

          <section className="interview-evidence" aria-labelledby="interview-evidence-title">
            <h3 id="interview-evidence-title">Relevant existing evidence</h3>
            {coverage === undefined ||
            (coverage.supportingSourceReferences.length === 0 &&
              coverage.candidateClaims.length === 0 &&
              coverage.conflictingClaims.length === 0) ? (
              <p className="empty-state">
                No explicit source-backed evidence is assigned to this topic.
              </p>
            ) : (
              <>
                {coverage.supportingSourceReferences.map((source) => (
                  <blockquote key={source.id}>
                    <strong>{source.sourceTitle}</strong>
                    <p>{source.excerpt ?? source.sourceLocator}</p>
                  </blockquote>
                ))}
                {[...coverage.candidateClaims, ...coverage.conflictingClaims].map((claim) => (
                  <p key={claim.id}>
                    <span className={`status-badge status-${claim.lifecycleStatus}`}>
                      {claim.lifecycleStatus.replaceAll('-', ' ')}
                    </span>{' '}
                    {claim.statement}
                  </p>
                ))}
              </>
            )}
          </section>

          <QuestionForm
            key={activeQuestion.id}
            question={activeQuestion}
            onAnswered={setLastAnswer}
          />
        </article>
      )}
    </div>
  );
}
