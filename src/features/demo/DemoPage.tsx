import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import {
  derivePilotDemoCounts,
  getOperationalTopic,
  type EmployeeQuestion,
  type PhaseOneSnapshot,
} from '../../domain';

function readable(value: string): string {
  return value.replaceAll('-', ' ');
}

function questionRecords(snapshot: PhaseOneSnapshot, question: EmployeeQuestion) {
  const evaluation = snapshot.answerEligibilityEvaluations.find(
    ({ questionId }) => questionId === question.id,
  );
  const answer = snapshot.answers.find(({ questionId }) => questionId === question.id);
  const escalation = snapshot.escalations.find(({ questionId }) => questionId === question.id);
  const claimIds = new Set([
    ...(evaluation?.eligibleClaimIds ?? []),
    ...(answer?.citedClaimIds ?? []),
  ]);
  const claims = snapshot.knowledgeClaims.filter(({ id }) => claimIds.has(id));
  const sourceIds = new Set(claims.flatMap(({ sourceReferenceIds }) => sourceReferenceIds));
  const sources = snapshot.sourceReferences.filter(({ id }) => sourceIds.has(id));
  const decisions = snapshot.approvalDecisions.filter(({ claimId, decision, claimVersion }) =>
    claims.some(
      (claim) => claim.id === claimId && claim.version === claimVersion && decision === 'approve',
    ),
  );
  const boundaryIds = new Set(evaluation?.matchingAuthorityBoundaryIds ?? []);
  const boundaries =
    snapshot.role?.authorityBoundaries.filter(({ id }) => boundaryIds.has(id)) ?? [];
  const gap = snapshot.knowledgeGaps.find(
    (candidate) =>
      candidate.id === escalation?.relatedGapId ||
      candidate.triggeringQuestionIds?.includes(question.id),
  );
  return { evaluation, answer, escalation, claims, sources, decisions, boundaries, gap };
}

function ScenarioOutcome({
  snapshot,
  question,
  label,
}: {
  readonly snapshot: PhaseOneSnapshot;
  readonly question: EmployeeQuestion;
  readonly label: string;
}) {
  const records = questionRecords(snapshot, question);
  const context = question.structuredContext;
  return (
    <article className="scenario-outcome">
      <div className="record-card-heading">
        <span className={`status-badge status-${records.answer?.status ?? question.status}`}>
          {readable(records.answer?.status ?? question.status)}
        </span>
        <span>{label}</span>
      </div>
      <h4>{question.questionText}</h4>
      <dl className="scenario-structure">
        <div>
          <dt>Matching topic</dt>
          <dd>{getOperationalTopic(question.topicKey).label}</dd>
        </div>
        <div>
          <dt>Request type</dt>
          <dd>{readable(question.requestType)}</dd>
        </div>
        {context.requestType === 'financial-action' ? (
          <div>
            <dt>Structured request</dt>
            <dd>
              {readable(context.actionType)} · {context.currency} {context.amount}
            </dd>
          </div>
        ) : null}
        {context.requestType === 'customer-commitment' ? (
          <div>
            <dt>Structured commitment</dt>
            <dd>{readable(context.commitmentType)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Eligibility result</dt>
          <dd>{readable(records.evaluation?.overallResult ?? 'not evaluated')}</dd>
        </div>
      </dl>
      {records.claims.length > 0 ? (
        <div className="scenario-evidence">
          <h5>Approved company guidance</h5>
          {records.claims.map((claim) => (
            <p key={claim.id}>{claim.statement}</p>
          ))}
        </div>
      ) : null}
      {records.boundaries.length > 0 ? (
        <div className="scenario-evidence">
          <h5>Structured authority boundary</h5>
          {records.boundaries.map((boundary) => (
            <p key={boundary.id}>
              {boundary.subject}: {readable(boundary.permissionLevel)}
              {boundary.numericLimit === undefined
                ? ''
                : ` up to ${boundary.currency ?? ''} ${boundary.numericLimit}`}
            </p>
          ))}
        </div>
      ) : null}
      {records.sources.length > 0 ? (
        <div className="scenario-evidence scenario-provenance">
          <div>
            <h5>Cited source</h5>
            {records.sources.map((source) => (
              <p key={source.id}>{source.sourceTitle}</p>
            ))}
          </div>
          <div>
            <h5>Owner approval record</h5>
            {records.decisions.map((decision) => (
              <p key={decision.id}>
                {decision.id} · {decision.actorLabel}
              </p>
            ))}
          </div>
        </div>
      ) : null}
      <p className="scenario-result-copy">{records.answer?.responseText}</p>
      {records.escalation ? (
        <p>
          <strong>Escalation:</strong>{' '}
          <Link to={`/escalations#escalation-${records.escalation.id}`}>
            {records.escalation.id} routed to {records.escalation.destination}
          </Link>
        </p>
      ) : null}
      <p className="record-meta">
        {records.gap
          ? `Related genuine gap: ${records.gap.id}.`
          : 'No knowledge gap was created for this known answer or authority outcome.'}
      </p>
    </article>
  );
}

export function DemoPage() {
  const session = useRelaySession();
  const { snapshot, isFictionalDemo } = session;
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (snapshot.company !== null) return;
    const result = session.loadDemo();
    setFeedback(result.message);
  }, [session, snapshot.company]);

  const countsResult = useMemo(() => derivePilotDemoCounts(snapshot), [snapshot]);

  if (snapshot.company !== null && !isFictionalDemo) {
    return (
      <section className="workspace-page demo-blocked" aria-labelledby="demo-blocked-title">
        <p className="phase-label">Sample HVAC workspace</p>
        <h1 id="demo-blocked-title">The public demo is isolated from this session.</h1>
        <p>
          This browser session already contains a non-demo workspace. RoleKeep will not display or
          overwrite those records on a public demo route. Reload in a separate public-demo session
          to use Summit Comfort.
        </p>
        <Link className="primary-link" to="/pilot">
          Return to the RoleKeep overview
        </Link>
      </section>
    );
  }

  if (!isFictionalDemo || !countsResult.ok) {
    return (
      <section className="workspace-page" aria-labelledby="demo-loading-title">
        <p className="phase-label">Sample HVAC workspace</p>
        <h1 id="demo-loading-title">Loading the Summit Comfort demonstration…</h1>
        <p>No client record is shown on this public route.</p>
      </section>
    );
  }

  const counts = countsResult.value;
  const steps = [
    {
      title: 'Company and role',
      value:
        'Start with one explicit role mission, its accountable outcomes, and the boundaries that keep delegation inside owner-approved limits.',
      href: '/owner',
      link: 'Open the owner workspace',
      count: `${counts.responsibilities} responsibilities · ${counts.authorityBoundaries} authority boundaries · ${counts.escalationRules} escalation rules`,
      notice:
        'The role is defined as outcomes, authority, and escalation—not a loose job description.',
      time: 'The owner can review one coherent role system instead of re-explaining it in pieces.',
    },
    {
      title: 'Source-backed knowledge',
      value:
        'Source versions, exact references, claims, and owner decisions stay linked so an employee answer can show where approved guidance came from.',
      href: '/sources',
      link: 'Open the Source Library',
      count: `${counts.sourceDocuments} source versions · ${counts.sourceReferences} references · ${counts.approvedKnowledge} employee-visible approved claims`,
      notice:
        'Source capture and approval are separate records; pasted text is never policy by itself.',
      time: 'A reviewer can verify evidence without reconstructing the owner’s reasoning from memory.',
    },
    {
      title: 'Coverage and gaps',
      value:
        'RoleKeep maps explicit evidence across the role’s checked-in operating topics and records incomplete work as a gap without claiming a readiness score.',
      href: '/owner#coverage-title',
      link: 'Inspect coverage',
      count: `${counts.coverageTopics} tracked topics · ${counts.openGaps} open gaps`,
      notice:
        'Coverage is derived from explicit records, not text similarity or a fake percentage.',
      time: 'The next owner conversation starts with a concrete missing decision instead of a blank page.',
    },
    {
      title: 'Employee question',
      value:
        'The employee submits an explicit topic, request type, sensitivity selection, and typed context before RoleKeep evaluates the request.',
      href: '/employee',
      link: 'Open the employee workspace',
      count: `${counts.employeeQuestions} structured questions · ${counts.answers} recorded outcomes`,
      notice:
        'Question wording is retained but never parsed to infer policy, limits, or authority.',
      time: 'The employee gets one consistent intake path instead of interrupting the owner with an unstructured message.',
    },
    {
      title: 'Safe answer or escalation',
      value:
        'Ten explicit safety gates either admit current approved guidance with citations or produce a prohibited, withheld, or clearly routed escalation outcome.',
      href: '/escalations',
      link: 'Open the escalation queue',
      count: `${counts.deliveredAnswers} delivered answers · ${counts.escalations} escalations · ${counts.activeEscalations} active`,
      notice:
        'A fluent answer can never override missing evidence, sensitivity, conflict, or authority.',
      time: 'Known decisions are answered consistently while the owner sees only work that requires human judgment.',
    },
    {
      title: 'System improvement loop',
      value:
        'A genuine question-linked deficiency returns to source work and owner review; operational resolution alone never becomes reusable policy.',
      href: '/review',
      link: 'Open source-backed review',
      count: `${counts.questionLinkedGaps} question-linked open gaps · ${counts.approvalDecisions} approval decisions · ${counts.activityEvents} safe activity events`,
      notice:
        'Known escalations create no fake gap, and a gap closes only through the approved knowledge path.',
      time: 'Real questions focus the next system-building session on the decisions that actually block the role.',
    },
  ] as const;

  const discountQuestions = snapshot.employeeQuestions
    .filter(
      (question) =>
        question.topicKey === 'discounts' &&
        question.structuredContext.requestType === 'financial-action' &&
        question.structuredContext.actionType === 'discount',
    )
    .sort((left, right) => {
      const leftAmount =
        left.structuredContext.requestType === 'financial-action'
          ? left.structuredContext.amount
          : 0;
      const rightAmount =
        right.structuredContext.requestType === 'financial-action'
          ? right.structuredContext.amount
          : 0;
      return leftAmount - rightAmount;
    });
  const lateQuestions = snapshot.employeeQuestions.filter(
    ({ topicKey }) => topicKey === 'technician-late-or-absent',
  );

  function resetDemo(): void {
    const result = session.resetDemo();
    setCurrentStep(0);
    setFeedback(result.message);
  }

  return (
    <div className="workspace-page guided-demo-page">
      <header className="workspace-header demo-header">
        <p className="phase-label">Guided sample workspace</p>
        <h1>Summit Comfort Heating &amp; Air</h1>
        <p className="workspace-lede">
          Follow one fixed Home-Service Office Manager / Dispatcher workspace from source material
          through a safe employee answer and owner-controlled improvement loop.
        </p>
        <p className="fictional-notice" role="note">
          Fictional demonstration data only — no real company, employee, customer, or operating
          policy is represented.
        </p>
        <div className="button-row no-print">
          <button className="primary-button" type="button" onClick={() => setCurrentStep(0)}>
            Start demo
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => setCurrentStep((step) => step + 1)}
            >
              Continue demo
            </button>
          ) : null}
          <button className="secondary-button" type="button" onClick={resetDemo}>
            Reset fictional demo
          </button>
          <Link className="text-link" to="/pilot">
            Return to the RoleKeep overview
          </Link>
        </div>
        {feedback ? <p className="form-feedback success">{feedback}</p> : null}
      </header>

      <aside className="public-data-warning">
        <strong>Current session only.</strong> Demo records disappear on reload. Reset replaces only
        the fixed fictional fixture and discards changes made to those fictional records; it never
        claims to preserve user-created data. Use only fictional or non-sensitive data in a public
        deployment.
      </aside>

      <section className="demo-summary" aria-labelledby="demo-summary-title">
        <h2 id="demo-summary-title">Read-only demo summary</h2>
        <p>Every number below is derived from the active fictional snapshot.</p>
        <div className="derived-counts">
          <span>{counts.approvedKnowledge} approved knowledge items</span>
          <span>{counts.employeeQuestions} employee questions</span>
          <span>{counts.deliveredAnswers} delivered answers</span>
          <span>{counts.escalations} escalations</span>
          <span>{counts.openGaps} open gaps</span>
        </div>
      </section>

      <section className="demo-steps" aria-labelledby="demo-steps-title">
        <h2 id="demo-steps-title">Six explicit steps</h2>
        <ol>
          {steps.map((step, index) => (
            <li
              className={index === currentStep ? 'demo-step demo-step-current' : 'demo-step'}
              aria-current={index === currentStep ? 'step' : undefined}
              key={step.title}
            >
              <p className="eyebrow">Step {index + 1}</p>
              <h3>{step.title}</h3>
              <p>{step.value}</p>
              <p className="demo-count">Actual records: {step.count}</p>
              <div className="demo-callouts">
                <p>
                  <strong>What to notice:</strong> {step.notice}
                </p>
                <p>
                  <strong>Why this saves time:</strong> {step.time}
                </p>
              </div>
              <Link className="primary-link" to={step.href}>
                {step.link}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="demo-scenarios" aria-labelledby="discount-scenario-title">
        <p className="eyebrow">Primary demonstration scenario</p>
        <h2 id="discount-scenario-title">May the employee approve a customer discount?</h2>
        <p>
          Compare the same approved guidance and USD 100 structured authority boundary against a
          within-limit request and an above-limit request. The latter routes to the fictional owner
          without inventing permission or a knowledge gap.
        </p>
        <div className="scenario-grid">
          {discountQuestions.map((question, index) => (
            <ScenarioOutcome
              snapshot={snapshot}
              question={question}
              label={index === 0 ? 'Within limit' : 'Above limit'}
              key={question.id}
            />
          ))}
        </div>
        <Link className="primary-link" to="/employee">
          Present the discount outcomes in the employee workspace
        </Link>
      </section>

      <section className="demo-scenarios" aria-labelledby="late-scenario-title">
        <p className="eyebrow">Second demonstration scenario</p>
        <h2 id="late-scenario-title">A technician is late and the customer is upset.</h2>
        <p>
          Approved guidance supports a revised-window update. A request to promise an exact arrival
          time exceeds the recorded boundary and escalates to the service manager; RoleKeep makes no
          unsupported promise.
        </p>
        <div className="scenario-grid">
          {lateQuestions.map((question) => (
            <ScenarioOutcome
              snapshot={snapshot}
              question={question}
              label={
                question.requestType === 'policy-lookup'
                  ? 'Approved handling guidance'
                  : 'Commitment exceeds authority'
              }
              key={question.id}
            />
          ))}
        </div>
        <Link className="primary-link" to="/escalations">
          Present the resulting escalation record
        </Link>
      </section>
    </div>
  );
}
