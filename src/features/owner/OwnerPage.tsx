import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type { KnowledgeClaim, KnowledgeGap, TopicCoverageState } from '../../domain';
import { useRelaySession } from '../../app/useRelaySession';
import { PilotExportPanel } from '../delivery';

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

type CoverageFilter = 'all' | 'critical' | Exclude<TopicCoverageState, 'dismissed'>;

function GapDismissal({ gap }: { readonly gap: KnowledgeGap }) {
  const { dismissKnowledgeGap } = useRelaySession();
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  function dismiss(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = dismissKnowledgeGap(gap.id, reason);
    setFeedback(result.ok ? 'Gap dismissed with the recorded reason.' : result.error.message);
  }

  return (
    <details className="gap-dismissal">
      <summary>Dismiss as not applicable</summary>
      <form className="stacked-form" onSubmit={dismiss}>
        <label>
          Owner reason
          <textarea rows={2} value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <button className="secondary-button" type="submit">
          Dismiss with reason
        </button>
      </form>
      {feedback ? <p role="status">{feedback}</p> : null}
    </details>
  );
}

export function OwnerPage() {
  const { snapshot, isFictionalDemo, coverageResult } = useRelaySession();
  const { company, role, knowledgeClaims } = snapshot;
  const [coverageFilter, setCoverageFilter] = useState<CoverageFilter>('all');

  if (company === null || role === null) {
    return (
      <section className="workspace-page" aria-labelledby="owner-title">
        <p className="phase-label">Phase 3 · Owner workspace</p>
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
        <p className="phase-label">Phase 3 · Owner workspace</p>
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
          <span>{snapshot.sourceDocuments.length} source versions</span>
          <span>{knowledgeClaims.length} knowledge claims</span>
          <span>
            {
              snapshot.escalations.filter(({ status }) => ['open', 'assigned'].includes(status))
                .length
            }{' '}
            active escalations
          </span>
          <span>
            {snapshot.knowledgeGaps.filter(({ status }) => status !== 'resolved').length} open or
            historical gaps
          </span>
        </div>
      </section>

      <section
        className="workspace-section pilot-delivery-tools"
        aria-labelledby="delivery-tools-title"
      >
        <p className="eyebrow">Phase 4 pilot delivery</p>
        <h2 id="delivery-tools-title">Prepare the current role handoff</h2>
        <p>
          Print actual session records, verify the delivery workflow, or export a minimized JSON
          package. These tools do not add persistence or access control.
        </p>
        <div className="button-row">
          <Link className="primary-link" to="/report">
            Open Role Transfer Report
          </Link>
          <Link className="secondary-link" to="/manual">
            Open Operating Manual summary
          </Link>
          <Link className="secondary-link" to="/pilot/intake">
            Pilot intake
          </Link>
          <Link className="secondary-link" to="/pilot/delivery">
            Delivery checklist
          </Link>
        </div>
      </section>

      <PilotExportPanel />

      <section className="workspace-section coverage-section" aria-labelledby="coverage-title">
        <div className="section-heading-row">
          <div>
            <h2 id="coverage-title">Operational knowledge coverage</h2>
            <p>
              Coverage means evidence is explicitly assigned and reviewed within RoleKeep. It is not
              legal compliance, a safety certification, or a guarantee of operational quality.
            </p>
          </div>
          <label className="coverage-filter">
            Filter coverage
            <select
              value={coverageFilter}
              onChange={(event) => setCoverageFilter(event.target.value as CoverageFilter)}
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="missing">Missing</option>
              <option value="candidate">Candidate</option>
              <option value="conflicting">Conflicting</option>
              <option value="approved">Approved</option>
            </select>
          </label>
        </div>
        <div className="button-row">
          <Link className="secondary-link" to="/escalations">
            Open escalation queue
          </Link>
          <Link className="secondary-link" to="/sources">
            Open Source Library
          </Link>
          <Link className="primary-link" to="/interview">
            Start gap interview
          </Link>
        </div>

        {!coverageResult.ok ? (
          <p className="form-feedback error" role="alert">
            Coverage failed closed: {coverageResult.error.message}
          </p>
        ) : (
          <div className="coverage-grid">
            {coverageResult.value
              .filter(({ topic, state }) =>
                coverageFilter === 'all'
                  ? true
                  : coverageFilter === 'critical'
                    ? topic.riskTier === 'critical'
                    : state === coverageFilter,
              )
              .map((entry) => (
                <article
                  className="coverage-card"
                  id={entry.gap ? `gap-${entry.gap.id}` : undefined}
                  key={entry.topic.key}
                >
                  <div className="record-card-heading">
                    <span className={`coverage-state coverage-${entry.state}`}>{entry.state}</span>
                    <span className={`risk-badge risk-${entry.topic.riskTier}`}>
                      {entry.topic.riskTier} risk
                    </span>
                  </div>
                  <h3>{entry.topic.label}</h3>
                  <p>{entry.topic.description}</p>
                  {entry.approvedClaim ? (
                    <div className="coverage-evidence">
                      <h4>Current approved claim</h4>
                      <p>{entry.approvedClaim.statement}</p>
                    </div>
                  ) : null}
                  {entry.candidateClaims.length > 0 ? (
                    <div className="coverage-evidence">
                      <h4>Candidate claims</h4>
                      <ul>
                        {entry.candidateClaims.map((claim) => (
                          <li key={claim.id}>{claim.statement}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {entry.conflictingClaims.length > 0 ? (
                    <div className="coverage-conflict">
                      <h4>Explicit conflict</h4>
                      {entry.conflictingClaims.map((claim) => (
                        <p key={claim.id}>{claim.statement}</p>
                      ))}
                    </div>
                  ) : null}
                  {entry.gap ? (
                    <div className="coverage-gap">
                      <h4>
                        {entry.gap.status === 'dismissed' ? 'Dismissed gap' : 'Knowledge gap'}
                      </h4>
                      <p>{entry.gap.description}</p>
                      {entry.gap.dismissedReason ? (
                        <p>
                          <strong>Owner reason:</strong> {entry.gap.dismissedReason}
                        </p>
                      ) : null}
                      {!['resolved', 'dismissed'].includes(entry.gap.status) ? (
                        <GapDismissal gap={entry.gap} />
                      ) : null}
                    </div>
                  ) : null}
                  <p className="coverage-action">
                    <strong>Next action:</strong>{' '}
                    {entry.state === 'approved' ? (
                      <Link to="/employee">Confirm employee visibility</Link>
                    ) : entry.state === 'candidate' || entry.state === 'conflicting' ? (
                      <Link to="/review">Review explicit evidence</Link>
                    ) : entry.state === 'dismissed' ? (
                      'No knowledge was approved by dismissal.'
                    ) : (
                      <Link to="/interview">Answer the deterministic gap question</Link>
                    )}
                  </p>
                </article>
              ))}
          </div>
        )}
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
