import { Link } from 'react-router-dom';

import type { KnowledgeClaim } from '../../domain';
import { useRelaySession } from '../../app/useRelaySession';

const REVIEW_STATUSES = new Set(['extracted', 'proposed']);
const UNRESOLVED_STATUSES = new Set([
  'rejected',
  'missing-information',
  'conflicting-information',
  'superseded',
]);

function ClaimSummary({ claim }: { readonly claim: KnowledgeClaim }) {
  return (
    <li className="record-card">
      <div className="record-card-heading">
        <span className={`status-badge status-${claim.lifecycleStatus}`}>
          {claim.lifecycleStatus.replaceAll('-', ' ')}
        </span>
        <span>Version {claim.version}</span>
      </div>
      <p>{claim.statement}</p>
      <p className="record-meta">
        {claim.category.replaceAll('-', ' ')} · {claim.provenance.replaceAll('-', ' ')}
      </p>
    </li>
  );
}

function KnowledgeSection({
  title,
  claims,
  emptyMessage,
}: {
  readonly title: string;
  readonly claims: readonly KnowledgeClaim[];
  readonly emptyMessage: string;
}) {
  return (
    <section className="workspace-section" aria-labelledby={`owner-${title.replaceAll(' ', '-')}`}>
      <h2 id={`owner-${title.replaceAll(' ', '-')}`}>{title}</h2>
      {claims.length === 0 ? (
        <p className="empty-state">{emptyMessage}</p>
      ) : (
        <ul className="record-list">
          {claims.map((claim) => (
            <ClaimSummary key={claim.id} claim={claim} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function OwnerPage() {
  const { snapshot, isFictionalDemo } = useRelaySession();
  const { company, role, knowledgeClaims } = snapshot;

  if (company === null || role === null) {
    return (
      <section className="workspace-page" aria-labelledby="owner-title">
        <p className="phase-label">Phase 1 · Owner workspace</p>
        <h1 id="owner-title">No role is active yet</h1>
        <p>Complete the session-only setup or load the fictional HVAC demonstration first.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  const reviewQueue = knowledgeClaims.filter(({ lifecycleStatus }) =>
    REVIEW_STATUSES.has(lifecycleStatus),
  );
  const approved = knowledgeClaims.filter(({ lifecycleStatus }) => lifecycleStatus === 'approved');
  const unresolved = knowledgeClaims.filter(({ lifecycleStatus }) =>
    UNRESOLVED_STATUSES.has(lifecycleStatus),
  );

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 1 · Owner workspace</p>
        <h1>{company.name}</h1>
        <p className="workspace-lede">
          Current session records for the one supported company and operational role.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration data — not a real company or operating policy.
          </p>
        ) : null}
      </header>

      <section className="workspace-section" aria-labelledby="company-summary-title">
        <div className="section-heading-row">
          <h2 id="company-summary-title">Company and active role</h2>
          <span className="status-badge status-approved">{role.status}</span>
        </div>
        <dl className="summary-grid">
          <div>
            <dt>Industry</dt>
            <dd>{company.industry}</dd>
          </div>
          <div>
            <dt>Service area</dt>
            <dd>{company.serviceArea}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>
              {company.contactInformation.phone}
              <br />
              {company.contactInformation.email}
            </dd>
          </div>
          <div>
            <dt>Timezone</dt>
            <dd>{company.operatingTimezone}</dd>
          </div>
        </dl>
        <h3>{role.title}</h3>
        <p>{role.mission}</p>
        <div className="derived-counts" aria-label="Current record counts">
          <span>{role.responsibilities.length} responsibilities</span>
          <span>{role.authorityBoundaries.length} authority boundaries</span>
          <span>{role.escalationRules.length} escalation rules</span>
          <span>{knowledgeClaims.length} knowledge claims</span>
        </div>
      </section>

      <section className="workspace-section" aria-labelledby="responsibilities-title">
        <h2 id="responsibilities-title">Responsibilities</h2>
        <ul className="record-list">
          {role.responsibilities.map((responsibility) => (
            <li className="record-card" key={responsibility.id}>
              <div className="record-card-heading">
                <h3>{responsibility.title}</h3>
                <span className="status-badge">{responsibility.status}</span>
              </div>
              <p>{responsibility.expectedOutcome}</p>
              <dl className="inline-details">
                <div>
                  <dt>Frequency</dt>
                  <dd>{responsibility.frequency}</dd>
                </div>
                <div>
                  <dt>Completion evidence</dt>
                  <dd>{responsibility.completionEvidence}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="workspace-section two-column-section"
        aria-label="Authority and escalation"
      >
        <div>
          <h2>Authority boundaries</h2>
          <ul className="record-list">
            {role.authorityBoundaries.map((boundary) => (
              <li className="record-card" key={boundary.id}>
                <h3>{boundary.subject}</h3>
                <p className="record-meta">{boundary.permissionLevel.replaceAll('-', ' ')}</p>
                <p>{boundary.limitOrConstraint}</p>
                <p>
                  <strong>Escalate to:</strong> {boundary.escalationDestination}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Escalation rules</h2>
          <ul className="record-list">
            {role.escalationRules.map((rule) => (
              <li className="record-card" key={rule.id}>
                <div className="record-card-heading">
                  <h3>{rule.trigger}</h3>
                  <span className="status-badge">{rule.urgency.replaceAll('-', ' ')}</span>
                </div>
                <p>
                  <strong>Destination:</strong> {rule.destination}
                </p>
                <p>
                  <strong>Required context:</strong> {rule.requiredContext}
                </p>
                <p>
                  <strong>Expected response:</strong> {rule.expectedResponse}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="section-heading-row review-link-row">
        <p>Approval and rejection controls live in the knowledge review workspace.</p>
        <Link className="primary-link" to="/review">
          Open knowledge review
        </Link>
      </div>

      <KnowledgeSection
        title="Knowledge review queue"
        claims={reviewQueue}
        emptyMessage="No extracted or proposed knowledge is waiting for review."
      />
      <KnowledgeSection
        title="Approved knowledge"
        claims={approved}
        emptyMessage="No knowledge has been explicitly approved yet."
      />
      <KnowledgeSection
        title="Rejected or unresolved knowledge"
        claims={unresolved}
        emptyMessage="No rejected, missing, conflicting, or superseded knowledge is recorded."
      />
    </div>
  );
}
