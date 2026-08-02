import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import type {
  ApprovalDecision,
  DomainResult,
  InterviewAnswer,
  InterviewQuestion,
  KnowledgeCategory,
  KnowledgeClaim,
  KnowledgeGap,
  KnowledgeProvenance,
  OperationalTopicKey,
  SourceReference,
  SourceType,
} from '../../domain';
import { OPERATIONAL_TOPICS, getOperationalTopic } from '../../domain';
import { useRelaySession } from '../../app/useRelaySession';

const SOURCE_TYPES: readonly SourceType[] = [
  'owner-note',
  'policy',
  'service-manual',
  'interview',
  'other',
];
const CATEGORIES: readonly KnowledgeCategory[] = [
  'procedure',
  'decision-rule',
  'authority-boundary',
  'escalation-rule',
  'responsibility',
  'general',
];
const PROVENANCE_OPTIONS: readonly KnowledgeProvenance[] = [
  'owner-authored',
  'source-extracted',
  'generated-like',
];

interface Feedback {
  readonly ok: boolean;
  readonly message: string;
}

function feedbackFrom<T>(result: DomainResult<T>, successMessage: string): Feedback {
  return result.ok
    ? { ok: true, message: successMessage }
    : { ok: false, message: result.error.message };
}

function SourcesForClaim({
  claim,
  sources,
}: {
  readonly claim: KnowledgeClaim;
  readonly sources: readonly SourceReference[];
}) {
  const matched = claim.sourceReferenceIds.flatMap((sourceId) => {
    const source = sources.find(({ id }) => id === sourceId);
    return source === undefined ? [] : [source];
  });
  return (
    <div className="claim-sources">
      <h4>Source evidence</h4>
      {matched.length === 0 ? (
        <p className="empty-state">No source reference is attached. Approval will fail closed.</p>
      ) : (
        <ul>
          {matched.map((source) => (
            <li key={source.id}>
              <strong>{source.sourceTitle}</strong>
              <span>{source.sourceLocator}</span>
              {source.sourceDocumentId ? (
                <span>
                  Version {source.sourceDocumentVersion}, lines {source.startLine}-{source.endLine}
                </span>
              ) : null}
              {source.sourceType === 'owner-interview' ? (
                <span>Immutable owner interview question and answer record</span>
              ) : null}
              {source.excerpt ? <q>{source.excerpt}</q> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ClaimReviewCardProps {
  readonly claim: KnowledgeClaim;
  readonly sources: readonly SourceReference[];
  readonly decisions: readonly ApprovalDecision[];
  readonly allClaims: readonly KnowledgeClaim[];
  readonly gaps: readonly KnowledgeGap[];
  readonly interviewAnswers: readonly InterviewAnswer[];
  readonly interviewQuestions: readonly InterviewQuestion[];
  readonly onApprove: (
    claimId: string,
    actorLabel: string,
    reason: string,
  ) => DomainResult<KnowledgeClaim>;
  readonly onReject: (
    claimId: string,
    actorLabel: string,
    reason: string,
  ) => DomainResult<KnowledgeClaim>;
  readonly onRevise: (claimId: string, statement: string) => DomainResult<KnowledgeClaim>;
  readonly onEdit: (claimId: string, statement: string) => DomainResult<KnowledgeClaim>;
  readonly onMoveToProposal: (claimId: string) => DomainResult<KnowledgeClaim>;
}

function ClaimReviewCard({
  claim,
  sources,
  decisions,
  allClaims,
  gaps,
  interviewAnswers,
  interviewQuestions,
  onApprove,
  onReject,
  onRevise,
  onEdit,
  onMoveToProposal,
}: ClaimReviewCardProps) {
  const [actorLabel, setActorLabel] = useState('Owner');
  const [reason, setReason] = useState('');
  const [revisionStatement, setRevisionStatement] = useState(claim.statement);
  const [editableStatement, setEditableStatement] = useState(claim.statement);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const decisionHistory = decisions.filter(
    ({ claimId, claimVersion }) => claimId === claim.id && claimVersion === claim.version,
  );
  const canReject = [
    'extracted',
    'proposed',
    'missing-information',
    'conflicting-information',
  ].includes(claim.lifecycleStatus);
  const relatedGap =
    claim.topicKey === undefined
      ? undefined
      : gaps.find(
          (gap) =>
            gap.topicKey === claim.topicKey &&
            (gap.relatedClaimIds.includes(claim.id) ||
              !['resolved', 'dismissed'].includes(gap.status)),
        );
  const currentApprovedForTopic =
    claim.topicKey === undefined
      ? undefined
      : allClaims.find(
          (candidate) =>
            candidate.id !== claim.id &&
            candidate.topicKey === claim.topicKey &&
            candidate.lifecycleStatus === 'approved',
        );
  const originLabel =
    claim.provenance === 'owner-interview-derived'
      ? 'Owner interview answer'
      : claim.provenance === 'source-extracted'
        ? 'Manual source extraction'
        : claim.provenance === 'generated-like'
          ? 'Fictional deterministic demo proposal'
          : 'Existing manual owner entry';
  const interviewAnswer = interviewAnswers.find(
    ({ generatedClaimId }) => generatedClaimId === claim.id,
  );
  const interviewQuestion =
    interviewAnswer === undefined
      ? undefined
      : interviewQuestions.find(({ id }) => id === interviewAnswer.questionId);

  function decide(kind: 'approve' | 'reject'): void {
    const result =
      kind === 'approve'
        ? onApprove(claim.id, actorLabel, reason)
        : onReject(claim.id, actorLabel, reason);
    setFeedback(
      feedbackFrom(
        result,
        kind === 'approve'
          ? `Version ${claim.version} was explicitly approved.`
          : `Version ${claim.version} was explicitly rejected.`,
      ),
    );
    if (result.ok) setReason('');
  }

  function revise(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = onRevise(claim.id, revisionStatement);
    setFeedback(
      feedbackFrom(
        result,
        `A proposed revision was created. Version ${claim.version} remains approved until the revision is approved.`,
      ),
    );
  }

  function editCandidate(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = onEdit(claim.id, editableStatement);
    setFeedback(
      feedbackFrom(
        result,
        'Candidate wording updated. Its original source or interview answer remains unchanged.',
      ),
    );
  }

  return (
    <article className="review-card" aria-labelledby={`claim-${claim.id}`}>
      <div className="record-card-heading">
        <span className={`status-badge status-${claim.lifecycleStatus}`}>
          {claim.lifecycleStatus.replaceAll('-', ' ')}
        </span>
        <span>Version {claim.version}</span>
      </div>
      <h3 id={`claim-${claim.id}`}>{claim.statement}</h3>
      <p className="record-meta">
        {claim.category.replaceAll('-', ' ')} · {claim.provenance.replaceAll('-', ' ')}
      </p>
      <p className="record-meta">
        <strong>Origin:</strong> {originLabel}
        {claim.topicKey
          ? ` · Topic: ${getOperationalTopic(claim.topicKey).label}`
          : ' · No coverage topic assigned'}
      </p>
      {claim.provenance === 'generated-like' ? (
        <p className="unapproved-notice">
          AI-like proposal, entered manually for this deterministic phase. No AI was used, and this
          content is not company policy unless explicitly approved.
        </p>
      ) : null}
      {claim.supersedesClaimId ? (
        <p className="record-meta">Proposed revision of claim {claim.supersedesClaimId}</p>
      ) : null}

      <SourcesForClaim claim={claim} sources={sources} />

      {interviewQuestion ? (
        <div className="evidence-block">
          <h4>Interview question</h4>
          <p>{interviewQuestion.prompt}</p>
          <p className="record-meta">
            The exact answer remains in the immutable source excerpt above.
          </p>
        </div>
      ) : null}

      {relatedGap ? (
        <div className="related-gap-block">
          <h4>Related knowledge gap</h4>
          <p>
            {relatedGap.description} <strong>Status:</strong>{' '}
            {relatedGap.status.replaceAll('-', ' ')}
          </p>
        </div>
      ) : null}
      {currentApprovedForTopic ? (
        <div className="evidence-block">
          <h4>Current approved claim for this topic</h4>
          <p>{currentApprovedForTopic.statement}</p>
        </div>
      ) : null}

      {claim.lifecycleStatus === 'extracted' || claim.lifecycleStatus === 'proposed' ? (
        <form className="revision-form" onSubmit={editCandidate}>
          <label htmlFor={`candidate-edit-${claim.id}`}>Editable proposed statement</label>
          <textarea
            id={`candidate-edit-${claim.id}`}
            rows={3}
            value={editableStatement}
            onChange={(event) => setEditableStatement(event.target.value)}
          />
          <p>The evidence and any immutable interview answer are not rewritten.</p>
          <button className="secondary-button" type="submit">
            Save candidate wording
          </button>
        </form>
      ) : null}

      {claim.lifecycleStatus === 'extracted' ? (
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            const result = onMoveToProposal(claim.id);
            setFeedback(feedbackFrom(result, 'Extracted claim moved to proposed review state.'));
          }}
        >
          Move extracted claim to review
        </button>
      ) : null}

      {claim.lifecycleStatus === 'proposed' || canReject ? (
        <div className="decision-controls">
          <div className="form-grid">
            <label>
              Decision actor
              <input value={actorLabel} onChange={(event) => setActorLabel(event.target.value)} />
            </label>
            <label>
              Decision reason
              <textarea
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
          </div>
          <div className="button-row">
            {claim.lifecycleStatus === 'proposed' ? (
              <button
                className="primary-button"
                type="button"
                aria-label={`Approve claim: ${claim.statement}`}
                onClick={() => decide('approve')}
              >
                Approve with reason
              </button>
            ) : null}
            {canReject ? (
              <button
                className="danger-button"
                type="button"
                aria-label={`Reject claim: ${claim.statement}`}
                onClick={() => decide('reject')}
              >
                Reject with reason
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {claim.lifecycleStatus === 'approved' ? (
        <form className="revision-form" onSubmit={revise}>
          <label htmlFor={`revision-${claim.id}`}>Proposed revision statement</label>
          <textarea
            id={`revision-${claim.id}`}
            rows={3}
            value={revisionStatement}
            onChange={(event) => setRevisionStatement(event.target.value)}
          />
          <p>
            Creating a revision does not edit or supersede this approved version. The new version
            enters review first.
          </p>
          <button className="secondary-button" type="submit">
            Create proposed revision
          </button>
        </form>
      ) : null}

      {feedback ? (
        <p className={feedback.ok ? 'form-feedback success' : 'form-feedback error'} role="status">
          {feedback.message}
        </p>
      ) : null}

      <details className="decision-history">
        <summary>Decision history ({decisionHistory.length})</summary>
        {decisionHistory.length === 0 ? (
          <p>No decision has been appended for this exact version.</p>
        ) : (
          <ol>
            {decisionHistory.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.decision}</strong> by {decision.actorLabel}: {decision.reason}{' '}
                <time dateTime={decision.decidedAt}>{decision.decidedAt}</time>
              </li>
            ))}
          </ol>
        )}
      </details>
    </article>
  );
}

export function ReviewPage() {
  const session = useRelaySession();
  const { company, role, sourceReferences, knowledgeClaims, approvalDecisions } = session.snapshot;
  const [sourceDraft, setSourceDraft] = useState({
    sourceTitle: '',
    sourceType: 'owner-note' as SourceType,
    sourceLocator: '',
    excerpt: '',
  });
  const [claimDraft, setClaimDraft] = useState({
    statement: '',
    category: 'procedure' as KnowledgeCategory,
    provenance: 'owner-authored' as KnowledgeProvenance,
    sourceReferenceIds: [] as string[],
    topicKey: '' as OperationalTopicKey | '',
  });
  const [sourceFeedback, setSourceFeedback] = useState<Feedback | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<Feedback | null>(null);

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="review-title">
        <p className="phase-label">Phase 2 · Knowledge review</p>
        <h1 id="review-title">No active role to review</h1>
        <p>Complete setup or load the fictional demo before adding source-backed knowledge.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  function createSource(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.createSourceReference(sourceDraft);
    setSourceFeedback(feedbackFrom(result, 'Source reference recorded for this session.'));
    if (result.ok) {
      setSourceDraft({ sourceTitle: '', sourceType: 'owner-note', sourceLocator: '', excerpt: '' });
    }
  }

  function createClaim(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.createKnowledgeClaim({
      statement: claimDraft.statement,
      category: claimDraft.category,
      provenance: claimDraft.provenance,
      sourceReferenceIds: claimDraft.sourceReferenceIds,
      lifecycleStatus: 'proposed',
      ...(claimDraft.topicKey === '' ? {} : { topicKey: claimDraft.topicKey }),
    });
    setClaimFeedback(feedbackFrom(result, 'Proposed knowledge recorded as visibly unapproved.'));
    if (result.ok) {
      setClaimDraft({
        statement: '',
        category: 'procedure',
        provenance: 'owner-authored',
        sourceReferenceIds: [],
        topicKey: '',
      });
    }
  }

  function toggleSource(sourceId: string): void {
    setClaimDraft((current) => ({
      ...current,
      sourceReferenceIds: current.sourceReferenceIds.includes(sourceId)
        ? current.sourceReferenceIds.filter((id) => id !== sourceId)
        : [...current.sourceReferenceIds, sourceId],
    }));
  }

  return (
    <div className="workspace-page review-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 2 · Owner knowledge review</p>
        <h1>Review source-backed knowledge</h1>
        <p className="workspace-lede">
          Manual proposals remain unapproved until a domain operation appends an explicit owner
          decision. Source extraction and the interviewer are deterministic; no AI or upload is
          active.
        </p>
      </header>

      <div className="two-column-section review-create-grid">
        <section className="workspace-section" aria-labelledby="source-form-title">
          <h2 id="source-form-title">1. Record a source reference</h2>
          <p>Enter metadata only. Phase 1 does not upload or fetch source content.</p>
          <form className="stacked-form" noValidate onSubmit={createSource}>
            <label>
              Source title
              <input
                value={sourceDraft.sourceTitle}
                onChange={(event) =>
                  setSourceDraft({ ...sourceDraft, sourceTitle: event.target.value })
                }
              />
            </label>
            <label>
              Source type
              <select
                value={sourceDraft.sourceType}
                onChange={(event) =>
                  setSourceDraft({ ...sourceDraft, sourceType: event.target.value as SourceType })
                }
              >
                {SOURCE_TYPES.map((sourceType) => (
                  <option key={sourceType} value={sourceType}>
                    {sourceType.replaceAll('-', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Source locator
              <input
                value={sourceDraft.sourceLocator}
                placeholder="For example: owner note, section 2"
                onChange={(event) =>
                  setSourceDraft({ ...sourceDraft, sourceLocator: event.target.value })
                }
              />
            </label>
            <label>
              Optional excerpt
              <textarea
                rows={3}
                value={sourceDraft.excerpt}
                onChange={(event) =>
                  setSourceDraft({ ...sourceDraft, excerpt: event.target.value })
                }
              />
            </label>
            <button className="primary-button" type="submit">
              Record source reference
            </button>
          </form>
          {sourceFeedback ? (
            <p
              className={sourceFeedback.ok ? 'form-feedback success' : 'form-feedback error'}
              role="status"
            >
              {sourceFeedback.message}
            </p>
          ) : null}
        </section>

        <section className="workspace-section" aria-labelledby="claim-form-title">
          <h2 id="claim-form-title">2. Create an unapproved proposal</h2>
          <form className="stacked-form" noValidate onSubmit={createClaim}>
            <label>
              Claim statement
              <textarea
                rows={4}
                value={claimDraft.statement}
                onChange={(event) =>
                  setClaimDraft({ ...claimDraft, statement: event.target.value })
                }
              />
            </label>
            <label>
              Category
              <select
                value={claimDraft.category}
                onChange={(event) =>
                  setClaimDraft({
                    ...claimDraft,
                    category: event.target.value as KnowledgeCategory,
                  })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.replaceAll('-', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Provenance
              <select
                value={claimDraft.provenance}
                onChange={(event) =>
                  setClaimDraft({
                    ...claimDraft,
                    provenance: event.target.value as KnowledgeProvenance,
                  })
                }
              >
                {PROVENANCE_OPTIONS.map((provenance) => (
                  <option key={provenance} value={provenance}>
                    {provenance.replaceAll('-', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Operational topic (optional for legacy manual entry)
              <select
                value={claimDraft.topicKey}
                onChange={(event) =>
                  setClaimDraft({
                    ...claimDraft,
                    topicKey: event.target.value as OperationalTopicKey | '',
                  })
                }
              >
                <option value="">No coverage topic</option>
                {OPERATIONAL_TOPICS.map((topic) => (
                  <option key={topic.key} value={topic.key}>
                    {topic.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="source-choice-list">
              <legend>Source references</legend>
              {sourceReferences.length === 0 ? (
                <p>No sources recorded. You may save a proposal, but approval will fail closed.</p>
              ) : (
                sourceReferences.map((source) => (
                  <label key={source.id}>
                    <input
                      type="checkbox"
                      checked={claimDraft.sourceReferenceIds.includes(source.id)}
                      onChange={() => toggleSource(source.id)}
                    />
                    <span>
                      {source.sourceTitle} — {source.sourceLocator}
                    </span>
                  </label>
                ))
              )}
            </fieldset>
            <button className="primary-button" type="submit">
              Create proposed claim
            </button>
          </form>
          {claimFeedback ? (
            <p
              className={claimFeedback.ok ? 'form-feedback success' : 'form-feedback error'}
              role="status"
            >
              {claimFeedback.message}
            </p>
          ) : null}
        </section>
      </div>

      <section className="workspace-section" aria-labelledby="source-register-title">
        <h2 id="source-register-title">Source register ({sourceReferences.length})</h2>
        {sourceReferences.length === 0 ? (
          <p className="empty-state">No manual source metadata is recorded.</p>
        ) : (
          <ul className="record-list source-register">
            {sourceReferences.map((source) => (
              <li className="record-card" key={source.id}>
                <h3>{source.sourceTitle}</h3>
                <p>{source.sourceLocator}</p>
                <p className="record-meta">{source.sourceType.replaceAll('-', ' ')}</p>
                {source.excerpt ? <q>{source.excerpt}</q> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="workspace-section" aria-labelledby="claims-review-title">
        <h2 id="claims-review-title">Knowledge records ({knowledgeClaims.length})</h2>
        {knowledgeClaims.length === 0 ? (
          <p className="empty-state">No claims exist yet.</p>
        ) : (
          <div className="review-card-list">
            {knowledgeClaims.map((claim) => (
              <ClaimReviewCard
                key={claim.id}
                claim={claim}
                sources={sourceReferences}
                decisions={approvalDecisions}
                allClaims={knowledgeClaims}
                gaps={session.snapshot.knowledgeGaps}
                interviewAnswers={session.snapshot.interviewAnswers}
                interviewQuestions={session.snapshot.interviewQuestions}
                onApprove={(claimId, actorLabel, reason) =>
                  session.approveKnowledgeClaim({ claimId, actorLabel, reason })
                }
                onReject={(claimId, actorLabel, reason) =>
                  session.rejectKnowledgeClaim({ claimId, actorLabel, reason })
                }
                onRevise={(claimId, statement) =>
                  session.createApprovedClaimRevision({ claimId, statement })
                }
                onEdit={(claimId, statement) =>
                  session.updateKnowledgeClaim(claimId, { statement })
                }
                onMoveToProposal={(claimId) =>
                  session.transitionKnowledgeClaim(claimId, 'proposed')
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="workspace-section" aria-labelledby="history-title">
        <h2 id="history-title">Complete decision history ({approvalDecisions.length})</h2>
        {approvalDecisions.length === 0 ? (
          <p className="empty-state">No approval or rejection decision has been appended.</p>
        ) : (
          <ol className="history-list">
            {approvalDecisions.map((decision) => (
              <li key={decision.id}>
                <strong>{decision.decision}</strong> claim {decision.claimId}, version{' '}
                {decision.claimVersion}, by {decision.actorLabel}: {decision.reason}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
