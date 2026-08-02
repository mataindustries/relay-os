import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import { getOperationalTopic } from '../../domain';

export function EmployeePage() {
  const { snapshot, employeeVisibleKnowledge, isFictionalDemo } = useRelaySession();
  const { company, role } = snapshot;

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="employee-title">
        <p className="phase-label">Phase 2 · Employee boundary</p>
        <h1 id="employee-title">No active role knowledge</h1>
        <p>An owner must activate the one company and role before knowledge can appear here.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  return (
    <div className="workspace-page employee-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 2 · Employee boundary</p>
        <h1>{role.title}</h1>
        <p className="workspace-lede">{role.mission}</p>
        <p className="approved-boundary-note">
          This page reads only from the deterministic employee-visible selector. Proposed,
          extracted, rejected, missing, conflicting, and superseded claims are withheld.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration data — not real company policy.
          </p>
        ) : null}
      </header>

      <section className="workspace-section" aria-labelledby="employee-knowledge-title">
        <h2 id="employee-knowledge-title">Approved company knowledge</h2>
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

      <aside className="narrow-boundary-note">
        Phase 2 demonstrates approved visibility only. It does not provide chat or answer employee
        questions.
      </aside>
    </div>
  );
}
