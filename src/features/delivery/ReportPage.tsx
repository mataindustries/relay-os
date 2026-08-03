import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import {
  deriveRoleTransferPriorities,
  getOperationalTopic,
  groupApprovedGuidance,
} from '../../domain';

const ACTIVE_GAP_STATUSES = new Set(['open', 'question-ready', 'answered', 'proposal-created']);

function readable(value: string): string {
  return value.replaceAll('-', ' ');
}

function generationDate(timestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(timestamp));
}

export function ReportPage() {
  const session = useRelaySession();
  const { snapshot, isFictionalDemo, coverageResult, currentTime } = session;
  const [generatedAt] = useState(currentTime);
  const { company, role } = snapshot;

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="report-empty-title">
        <p className="phase-label">Phase 4 · Role Transfer Report</p>
        <h1 id="report-empty-title">No active role report</h1>
        <p>Load the fictional demo or complete setup before generating an actual-record report.</p>
        <aside className="sample-workspace-callout" role="note">
          <Link to="/demo">Start the sample HVAC workspace to explore this screen.</Link>
        </aside>
        <div className="button-row">
          <Link className="primary-link" to="/demo">
            Load the fictional demo
          </Link>
          <Link className="secondary-link" to="/setup">
            Go to setup
          </Link>
        </div>
      </section>
    );
  }

  const approvedGroups = groupApprovedGuidance(snapshot);
  const openGaps = snapshot.knowledgeGaps.filter(({ status }) => ACTIVE_GAP_STATUSES.has(status));
  const priorities = deriveRoleTransferPriorities(snapshot);
  const activeEscalations = snapshot.escalations.filter(({ status }) =>
    ['open', 'assigned'].includes(status),
  );
  const coverageCounts = coverageResult.ok
    ? Object.fromEntries(
        ['approved', 'candidate', 'conflicting', 'missing', 'dismissed'].map((state) => [
          state,
          coverageResult.value.filter((entry) => entry.state === state).length,
        ]),
      )
    : null;

  return (
    <article className="print-document report-document">
      <header className="print-document-header">
        <p className="phase-label">RoleKeep · Role Transfer Report</p>
        <h1>{company.name}</h1>
        <p className="print-document-subtitle">{role.title}</p>
        <p>
          Generated from actual current-session records on{' '}
          <time dateTime={generatedAt}>{generationDate(generatedAt)}</time>.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration report — not a real company, client engagement, or operating
            policy.
          </p>
        ) : null}
        <div className="print-controls button-row no-print">
          <button className="primary-button" type="button" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
          <Link className="secondary-link" to="/owner">
            Return to owner workspace
          </Link>
        </div>
      </header>

      <section className="report-section" aria-labelledby="report-company-role">
        <h2 id="report-company-role">1. Company and role</h2>
        <dl className="report-detail-grid">
          <div>
            <dt>Company</dt>
            <dd>{company.name}</dd>
          </div>
          <div>
            <dt>Industry</dt>
            <dd>{company.industry}</dd>
          </div>
          <div>
            <dt>Service area</dt>
            <dd>{company.serviceArea}</dd>
          </div>
          <div>
            <dt>Operating timezone</dt>
            <dd>{company.operatingTimezone}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{role.title}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{role.status}</dd>
          </div>
        </dl>
      </section>

      <section className="report-section" aria-labelledby="report-mission">
        <h2 id="report-mission">2. Role mission</h2>
        <p>{role.mission}</p>
      </section>

      <section className="report-section" aria-labelledby="report-responsibilities">
        <h2 id="report-responsibilities">3. Responsibilities</h2>
        <ul className="print-record-list">
          {role.responsibilities.map((responsibility) => (
            <li key={responsibility.id}>
              <h3>{responsibility.title}</h3>
              <p>{responsibility.expectedOutcome}</p>
              <p className="record-meta">
                {responsibility.frequency} · Evidence: {responsibility.completionEvidence}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-section" aria-labelledby="report-authority">
        <h2 id="report-authority">4. Authority boundaries</h2>
        <ul className="print-record-list">
          {role.authorityBoundaries.map((boundary) => (
            <li key={boundary.id}>
              <h3>{boundary.subject}</h3>
              <p>
                <strong>{readable(boundary.permissionLevel)}:</strong> {boundary.limitOrConstraint}
              </p>
              <p className="record-meta">
                Escalation destination: {boundary.escalationDestination}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-section" aria-labelledby="report-escalation-rules">
        <h2 id="report-escalation-rules">5. Escalation rules</h2>
        <ul className="print-record-list">
          {role.escalationRules.map((rule) => (
            <li key={rule.id}>
              <h3>{rule.trigger}</h3>
              <p>
                Route to {rule.destination} with {readable(rule.urgency)} urgency.
              </p>
              <p className="record-meta">Required context fields: {rule.requiredContext}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-section print-page-break-before" aria-labelledby="report-approved">
        <h2 id="report-approved">6. Approved knowledge by topic</h2>
        {approvedGroups.length === 0 ? (
          <p className="empty-state">No current claim passes the employee-visible selector.</p>
        ) : (
          approvedGroups.map((group) => (
            <div className="approved-topic-group" key={group.topic?.key ?? 'uncategorized'}>
              <h3>{group.topic?.label ?? 'Approved knowledge without a coverage topic'}</h3>
              <ul>
                {group.items.map(({ claim }) => (
                  <li key={claim.id}>{claim.statement}</li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="report-section" aria-labelledby="report-coverage">
        <h2 id="report-coverage">7. Coverage summary</h2>
        <p>
          Coverage reflects explicit topic assignments and current records. It is not a score,
          certification, compliance finding, or guarantee.
        </p>
        {coverageCounts === null ? (
          <p className="empty-state">Coverage failed closed and is not reported.</p>
        ) : (
          <dl className="report-count-grid">
            {Object.entries(coverageCounts).map(([state, count]) => (
              <div key={state}>
                <dt>{readable(state)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="report-section" aria-labelledby="report-gaps">
        <h2 id="report-gaps">8. Open knowledge gaps</h2>
        {openGaps.length === 0 ? (
          <p className="empty-state">No open gap record exists in this session.</p>
        ) : (
          <ul className="print-record-list">
            {openGaps.map((gap) => (
              <li key={gap.id}>
                <h3>{getOperationalTopic(gap.topicKey).label}</h3>
                <p>{gap.description}</p>
                <p className="record-meta">
                  {gap.riskTier} risk · {readable(gap.reason)} · {readable(gap.status)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="report-section print-page-break-before"
        aria-labelledby="report-questions"
      >
        <h2 id="report-questions">9. Question-to-System examples</h2>
        <p className="record-meta">
          Raw employee question text and free-text context are intentionally omitted.
        </p>
        {snapshot.employeeQuestions.length === 0 ? (
          <p className="empty-state">No structured question exists in this session.</p>
        ) : (
          <ul className="print-record-list compact-print-records">
            {snapshot.employeeQuestions.map((question) => {
              const answer = snapshot.answers.find(({ questionId }) => questionId === question.id);
              return (
                <li key={question.id}>
                  <h3>{getOperationalTopic(question.topicKey).label}</h3>
                  <p>
                    {readable(question.requestType)} → {readable(answer?.status ?? question.status)}
                  </p>
                  <p className="record-meta">
                    {answer?.citedClaimIds.length ?? 0} cited claims ·{' '}
                    {answer?.citedSourceReferenceIds.length ?? 0} cited sources
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="report-section" aria-labelledby="report-escalations">
        <h2 id="report-escalations">10. Escalation examples</h2>
        {snapshot.escalations.length === 0 ? (
          <p className="empty-state">No escalation exists in this session.</p>
        ) : (
          <ul className="print-record-list compact-print-records">
            {snapshot.escalations.map((escalation) => (
              <li key={escalation.id}>
                <h3>{readable(escalation.reason)}</h3>
                <p>
                  {escalation.destination} · {readable(escalation.urgency)} ·{' '}
                  {readable(escalation.status)}
                </p>
                <p className="record-meta">Record: {escalation.id}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="report-section" aria-labelledby="report-dependencies">
        <h2 id="report-dependencies">11. Remaining owner dependencies</h2>
        {priorities.length === 0 ? (
          <p className="empty-state">
            No open critical/high gap or active escalation record currently identifies an owner
            dependency. This is not a completeness claim.
          </p>
        ) : (
          <ul>
            {priorities.map((priority) => (
              <li key={`${priority.source}-${priority.id}`}>{priority.title}</li>
            ))}
          </ul>
        )}
        <p className="record-meta">{activeEscalations.length} open or assigned escalations.</p>
      </section>

      <section className="report-section" aria-labelledby="report-priorities">
        <h2 id="report-priorities">12. Recommended next system-building priorities</h2>
        <p>
          These fixed labels are derived only from open critical/high gaps and actual open or
          assigned escalation records.
        </p>
        {priorities.length === 0 ? (
          <p className="empty-state">No record-derived priority is available.</p>
        ) : (
          <ol className="priority-list">
            {priorities.map((priority) => (
              <li key={`${priority.source}-${priority.id}`}>
                <strong>{priority.title}</strong>
                <span>
                  {priority.riskTier} · {priority.source.replaceAll('-', ' ')} · {priority.detail}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className="report-section print-page-break-before"
        aria-labelledby="report-provenance"
      >
        <h2 id="report-provenance">13. Provenance and approval appendix</h2>
        <p className="record-meta">
          Source metadata is shown without raw document content or source excerpts.
        </p>
        {approvedGroups
          .flatMap(({ items }) => items)
          .map(({ claim, sourceReferences, approvalDecisions }) => (
            <article className="provenance-entry" key={claim.id}>
              <h3>{claim.statement}</h3>
              <p>
                Claim {claim.id}, version {claim.version}
              </p>
              <ul>
                {sourceReferences.map((source) => (
                  <li key={source.id}>
                    Source: {source.sourceTitle} · {source.sourceLocator}
                  </li>
                ))}
                {approvalDecisions.map((decision) => (
                  <li key={decision.id}>
                    Approval: {decision.id} · {decision.actorLabel} ·{' '}
                    <time dateTime={decision.decidedAt}>{decision.decidedAt}</time>
                  </li>
                ))}
              </ul>
            </article>
          ))}
      </section>

      <section className="report-section" aria-labelledby="report-limitations">
        <h2 id="report-limitations">14. Current limitations</h2>
        <ul>
          <li>Records live only in current browser memory and disappear on reload.</li>
          <li>Owner and employee routes are perspectives, not authenticated access controls.</li>
          <li>Sources are owner supplied and are not independently verified.</li>
          <li>
            No model, semantic retrieval, upload, messaging, billing, or production integration
            exists.
          </li>
          <li>This report is not a compliance, legal, safety, or performance certification.</li>
        </ul>
      </section>
    </article>
  );
}
