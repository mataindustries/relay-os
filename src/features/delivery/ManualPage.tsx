import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import { getOperationalTopic, groupApprovedGuidance } from '../../domain';

const ACTIVE_GAP_STATUSES = new Set(['open', 'question-ready', 'answered', 'proposal-created']);

function readable(value: string): string {
  return value.replaceAll('-', ' ');
}

export function ManualPage() {
  const { snapshot, isFictionalDemo, currentTime } = useRelaySession();
  const [generatedAt] = useState(currentTime);
  const { company, role } = snapshot;

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="manual-empty-title">
        <p className="phase-label">Phase 4 · Operating Manual summary</p>
        <h1 id="manual-empty-title">No active role manual</h1>
        <p>Load the fictional demo or complete setup before organizing approved records.</p>
        <aside className="sample-workspace-callout" role="note">
          <Link to="/demo">Start the sample HVAC workspace to explore this screen.</Link>
        </aside>
        <Link className="primary-link" to="/demo">
          Load the fictional demo
        </Link>
      </section>
    );
  }

  const approvedGroups = groupApprovedGuidance(snapshot);
  const openGaps = snapshot.knowledgeGaps.filter(({ status }) => ACTIVE_GAP_STATUSES.has(status));

  return (
    <article className="print-document manual-document">
      <header className="print-document-header">
        <p className="phase-label">RoleKeep · Operating Manual summary</p>
        <h1>{role.title}</h1>
        <p className="print-document-subtitle">{company.name}</p>
        <p>
          Organized from approved current-session records. Generated{' '}
          <time dateTime={generatedAt}>{generatedAt.slice(0, 10)}</time>.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration manual — not real company policy.
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

      <section className="manual-section" aria-labelledby="manual-identity">
        <h2 id="manual-identity">Role identity</h2>
        <p>
          <strong>Company:</strong> {company.name}
        </p>
        <p>
          <strong>Role mission:</strong> {role.mission}
        </p>
      </section>

      <section className="manual-section" aria-labelledby="manual-responsibilities">
        <h2 id="manual-responsibilities">Daily responsibility overview</h2>
        <p className="record-meta">
          These are role-definition outcomes. Approved operational guidance appears only in the next
          section.
        </p>
        <ul className="print-record-list">
          {role.responsibilities.map((responsibility) => (
            <li key={responsibility.id}>
              <h3>{responsibility.title}</h3>
              <p>{responsibility.expectedOutcome}</p>
              <p className="record-meta">{responsibility.frequency}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="manual-section print-page-break-before" aria-labelledby="manual-guidance">
        <h2 id="manual-guidance">Approved guidance by operational topic</h2>
        <p className="approved-boundary-note">
          This is the only guidance section. It uses the existing employee-visible selector;
          proposed, rejected, conflicting, missing, and superseded claims are excluded.
        </p>
        {approvedGroups.length === 0 ? (
          <p className="empty-state">No current knowledge passes the approval boundary.</p>
        ) : (
          approvedGroups.map((group) => (
            <article className="manual-topic" key={group.topic?.key ?? 'uncategorized'}>
              <h3>{group.topic?.label ?? 'Approved guidance without a coverage topic'}</h3>
              <ul>
                {group.items.map(({ claim }) => (
                  <li key={claim.id}>{claim.statement}</li>
                ))}
              </ul>
            </article>
          ))
        )}
      </section>

      <section className="manual-section" aria-labelledby="manual-authority">
        <h2 id="manual-authority">Authority map</h2>
        <p className="record-meta">
          Structured role boundaries used by the deterministic policy firewall; they do not supply
          substantive guidance or bypass the approved-knowledge section.
        </p>
        <ul className="print-record-list">
          {role.authorityBoundaries.map((boundary) => (
            <li key={boundary.id}>
              <h3>{boundary.subject}</h3>
              <p>
                {readable(boundary.permissionLevel)} · {boundary.limitOrConstraint}
              </p>
              <p className="record-meta">Escalate to {boundary.escalationDestination}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="manual-section" aria-labelledby="manual-escalation">
        <h2 id="manual-escalation">Escalation map</h2>
        <ul className="print-record-list">
          {role.escalationRules.map((rule) => (
            <li key={rule.id}>
              <h3>{rule.trigger}</h3>
              <p>
                {readable(rule.urgency)} · {rule.destination}
              </p>
              <p className="record-meta">Expected response: {rule.expectedResponse}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="manual-section print-page-break-before" aria-labelledby="manual-appendix">
        <h2 id="manual-appendix">Source and approval appendix</h2>
        <p className="record-meta">Metadata only; raw source content and excerpts are omitted.</p>
        {approvedGroups
          .flatMap(({ items }) => items)
          .map(({ claim, sourceReferences, approvalDecisions }) => (
            <article className="provenance-entry" key={claim.id}>
              <h3>{claim.statement}</h3>
              <ul>
                {sourceReferences.map((source) => (
                  <li key={source.id}>
                    {source.sourceTitle} · {source.sourceLocator}
                  </li>
                ))}
                {approvalDecisions.map((decision) => (
                  <li key={decision.id}>
                    Approved by {decision.actorLabel} on {decision.decidedAt} · {decision.id}
                  </li>
                ))}
              </ul>
            </article>
          ))}
      </section>

      <section className="manual-section known-gaps-section" aria-labelledby="manual-gaps">
        <h2 id="manual-gaps">Known gaps and “Do not guess” areas</h2>
        <p>
          Owner-facing gap register only. These records are not instructions, approved policy, or
          permission to act.
        </p>
        {openGaps.length === 0 ? (
          <p className="empty-state">
            No open gap is recorded. That is not proof that the role is complete or risk-free.
          </p>
        ) : (
          <ul className="print-record-list">
            {openGaps.map((gap) => (
              <li key={gap.id}>
                <h3>{getOperationalTopic(gap.topicKey).label}</h3>
                <p>{gap.description}</p>
                <p className="record-meta">
                  Do not guess · {gap.riskTier} risk · {readable(gap.reason)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="manual-section" aria-labelledby="manual-limitations">
        <h2 id="manual-limitations">Current limitations</h2>
        <p>
          This is a concise organization of existing records, not a full generated procedure manual.
          It invents no procedure steps. The session is unauthenticated, not persisted, and
          disappears on reload.
        </p>
      </section>
    </article>
  );
}
