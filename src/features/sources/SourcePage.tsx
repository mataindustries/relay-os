import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useRelaySession } from '../../app/useRelaySession';
import {
  OPERATIONAL_TOPICS,
  SOURCE_DOCUMENT_TYPES,
  excerptSourceLines,
  type DomainResult,
  type KnowledgeCategory,
  type SourceDocument,
  type SourceDocumentType,
  type SourceReference,
} from '../../domain';

interface Feedback {
  readonly ok: boolean;
  readonly message: string;
}

function feedbackFrom<T>(result: DomainResult<T>, successMessage: string): Feedback {
  return result.ok
    ? { ok: true, message: successMessage }
    : { ok: false, message: result.error.message };
}

const CLAIM_CATEGORIES: readonly KnowledgeCategory[] = [
  'procedure',
  'decision-rule',
  'authority-boundary',
  'escalation-rule',
  'responsibility',
  'general',
];

function LineList({ document }: { readonly document: SourceDocument }) {
  return (
    <ol className="source-lines" aria-label={`${document.title} numbered lines`}>
      {document.lines.map((line) => (
        <li key={line.lineNumber} value={line.lineNumber}>
          <span>{line.text.length === 0 ? '\u00a0' : line.text}</span>
        </li>
      ))}
    </ol>
  );
}

function DraftControls({ document }: { readonly document: SourceDocument }) {
  const session = useRelaySession();
  const [title, setTitle] = useState(document.title);
  const [supplierLabel, setSupplierLabel] = useState(document.supplierLabel);
  const [sourceType, setSourceType] = useState<SourceDocumentType>(document.sourceType);
  const [content, setContent] = useState(document.content);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.updateSourceDocumentDraft(document.id, {
      title,
      supplierLabel,
      sourceType,
      content,
    });
    setFeedback(feedbackFrom(result, 'Draft changes saved in this page session.'));
  }

  function activate(): void {
    const result = session.activateSourceDocument(document.id);
    setFeedback(
      feedbackFrom(
        result,
        `Version ${document.version} is available and immutable. Corrections now require a revision.`,
      ),
    );
  }

  return (
    <div className="source-card-controls">
      <form className="stacked-form" onSubmit={save}>
        <label>
          Draft title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Draft source type
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as SourceDocumentType)}
          >
            {SOURCE_DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll('-', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Draft supplier label
          <input value={supplierLabel} onChange={(event) => setSupplierLabel(event.target.value)} />
        </label>
        <label>
          Draft plain text
          <textarea rows={8} value={content} onChange={(event) => setContent(event.target.value)} />
        </label>
        <button className="secondary-button" type="submit">
          Save draft changes
        </button>
      </form>
      <p>Make sure draft changes are saved before activation.</p>
      <button className="primary-button" type="button" onClick={activate}>
        Make version {document.version} available
      </button>
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
    </div>
  );
}

function ExtractionForm({ reference }: { readonly reference: SourceReference }) {
  const session = useRelaySession();
  const [topicKey, setTopicKey] = useState(OPERATIONAL_TOPICS[0]?.key ?? 'lead-intake');
  const [category, setCategory] = useState<KnowledgeCategory>('procedure');
  const [statement, setStatement] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.createManualExtractedClaim({
      sourceReferenceId: reference.id,
      topicKey,
      statement,
      category,
    });
    setFeedback(
      feedbackFrom(result, 'Extracted claim created as unapproved knowledge for owner review.'),
    );
    if (result.ok) setStatement('');
  }

  return (
    <form className="stacked-form extraction-form" onSubmit={submit}>
      <p className="unapproved-notice">
        You are selecting the evidence and wording. RoleKeep has not interpreted this source.
      </p>
      <label>
        Operational topic
        <select
          value={topicKey}
          onChange={(event) =>
            setTopicKey(event.target.value as (typeof OPERATIONAL_TOPICS)[number]['key'])
          }
        >
          {OPERATIONAL_TOPICS.map((topic) => (
            <option key={topic.key} value={topic.key}>
              {topic.label} · {topic.riskTier}
            </option>
          ))}
        </select>
      </label>
      <label>
        Claim category
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as KnowledgeCategory)}
        >
          {CLAIM_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value.replaceAll('-', ' ')}
            </option>
          ))}
        </select>
      </label>
      <label>
        Proposed statement
        <textarea
          rows={3}
          value={statement}
          onChange={(event) => setStatement(event.target.value)}
        />
      </label>
      <button className="primary-button" type="submit">
        Create extracted claim
      </button>
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
    </form>
  );
}

function AnchorControls({ document }: { readonly document: SourceDocument }) {
  const session = useRelaySession();
  const references = session.snapshot.sourceReferences.filter(
    ({ sourceDocumentId }) => sourceDocumentId === document.id,
  );
  const [startLine, setStartLine] = useState(1);
  const [endLine, setEndLine] = useState(1);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const validRange =
    Number.isInteger(startLine) &&
    Number.isInteger(endLine) &&
    startLine >= 1 &&
    endLine >= startLine &&
    endLine <= document.lines.length;
  const preview = validRange ? excerptSourceLines(document.lines, startLine, endLine) : '';

  function createReference(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.createAnchoredSourceReference({
      sourceDocumentId: document.id,
      sourceDocumentVersion: document.version,
      startLine,
      endLine,
    });
    setFeedback(feedbackFrom(result, 'Exact line reference recorded for this historical version.'));
  }

  return (
    <div className="anchor-controls">
      <h4>Create an exact line reference</h4>
      <form className="line-range-form" onSubmit={createReference}>
        <label>
          Start line
          <input
            type="number"
            min={1}
            max={document.lines.length}
            value={startLine}
            onChange={(event) => setStartLine(event.target.valueAsNumber)}
          />
        </label>
        <label>
          End line
          <input
            type="number"
            min={1}
            max={document.lines.length}
            value={endLine}
            onChange={(event) => setEndLine(event.target.valueAsNumber)}
          />
        </label>
        <button className="secondary-button" type="submit">
          Create exact line reference
        </button>
      </form>
      <div className="evidence-block">
        <h4>Derived excerpt preview</h4>
        <pre>{validRange ? preview : 'Choose a valid inclusive line range.'}</pre>
      </div>
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}

      {references.length > 0 ? (
        <div className="anchored-reference-list">
          <h4>References to this version</h4>
          {references.map((reference) => (
            <article className="nested-source-card" key={reference.id}>
              <p>
                <strong>{reference.sourceLocator}</strong>
              </p>
              <pre>{reference.excerpt}</pre>
              <ExtractionForm reference={reference} />
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">No exact references cite this version yet.</p>
      )}
    </div>
  );
}

function RevisionControls({ document }: { readonly document: SourceDocument }) {
  const session = useRelaySession();
  const [content, setContent] = useState(document.content);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function createRevision(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = session.createSourceDocumentRevision({ documentId: document.id, content });
    setFeedback(
      feedbackFrom(
        result,
        `Draft version ${document.version + 1} created. Version ${document.version} remains available until the revision is activated.`,
      ),
    );
  }

  return (
    <details className="revision-controls">
      <summary>Revise this available document</summary>
      <form className="stacked-form" onSubmit={createRevision}>
        <label>
          Revised plain text
          <textarea rows={8} value={content} onChange={(event) => setContent(event.target.value)} />
        </label>
        <button className="secondary-button" type="submit">
          Create revision draft
        </button>
      </form>
      {feedback ? <FeedbackMessage feedback={feedback} /> : null}
    </details>
  );
}

function FeedbackMessage({ feedback }: { readonly feedback: Feedback }) {
  return (
    <p className={feedback.ok ? 'form-feedback success' : 'form-feedback error'} role="status">
      {feedback.message}
    </p>
  );
}

function DocumentCard({ document }: { readonly document: SourceDocument }) {
  const { snapshot } = useRelaySession();
  const citedReferences = snapshot.sourceReferences.filter(
    ({ sourceDocumentId }) => sourceDocumentId === document.id,
  );
  const referenceIds = new Set(citedReferences.map(({ id }) => id));
  const citingClaims = snapshot.knowledgeClaims.filter((claim) =>
    claim.sourceReferenceIds.some((sourceId) => referenceIds.has(sourceId)),
  );

  return (
    <article className="source-document-card" aria-labelledby={`document-${document.id}`}>
      <div className="record-card-heading">
        <span className={`status-badge status-${document.status}`}>{document.status}</span>
        <span>Version {document.version}</span>
      </div>
      <h3 id={`document-${document.id}`}>{document.title}</h3>
      <p className="record-meta">
        {document.sourceType.replaceAll('-', ' ')} · supplied by {document.supplierLabel} · manual
        paste
      </p>
      {document.supersedesDocumentId ? (
        <p className="record-meta">Revision of {document.supersedesDocumentId}</p>
      ) : null}

      {document.status === 'draft' ? (
        <DraftControls document={document} />
      ) : (
        <LineList document={document} />
      )}
      {document.status === 'available' || document.status === 'superseded' ? (
        <AnchorControls document={document} />
      ) : null}
      {document.status === 'available' ? <RevisionControls document={document} /> : null}

      <div className="citing-claims">
        <h4>Claims citing this source ({citingClaims.length})</h4>
        {citingClaims.length === 0 ? (
          <p className="empty-state">No claim cites an anchored reference from this version.</p>
        ) : (
          <ul>
            {citingClaims.map((claim) => (
              <li key={claim.id}>
                <span className={`status-badge status-${claim.lifecycleStatus}`}>
                  {claim.lifecycleStatus.replaceAll('-', ' ')}
                </span>{' '}
                {claim.statement}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function SourcePage() {
  const { snapshot, isFictionalDemo, createSourceDocument } = useRelaySession();
  const { company, role, sourceDocuments } = snapshot;
  const [draft, setDraft] = useState({
    title: '',
    sourceType: 'existing-sop' as SourceDocumentType,
    supplierLabel: '',
    content: '',
  });
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  if (company === null || role === null || role.status !== 'active') {
    return (
      <section className="workspace-page" aria-labelledby="sources-title">
        <p className="phase-label">Phase 2 · Source Library</p>
        <h1 id="sources-title">No active role for source intake</h1>
        <p>Complete setup or load the fictional demonstration before adding operational sources.</p>
        <Link className="text-link" to="/setup">
          Go to setup
        </Link>
      </section>
    );
  }

  function saveDraft(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const result = createSourceDocument(draft);
    setFeedback(feedbackFrom(result, 'Source document saved as a draft in this page session.'));
    if (result.ok) {
      setDraft({ title: '', sourceType: 'existing-sop', supplierLabel: '', content: '' });
    }
  }

  return (
    <div className="workspace-page source-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 2 · Source Library</p>
        <h1>Source Library</h1>
        <p className="workspace-lede">
          Paste plain text, preserve exact versions and lines, then manually select evidence and
          proposed claim wording.
        </p>
        {isFictionalDemo ? (
          <p className="fictional-notice" role="note">
            Fictional demonstration sources — not real company policy.
          </p>
        ) : null}
      </header>

      <aside className="setup-session-notice" aria-label="Source storage notice">
        <strong>Current browser memory session only.</strong> Pasted material disappears on reload.
        It is not uploaded, transmitted, saved to browser storage, or independently verified.
      </aside>
      <p className="unapproved-notice">
        RoleKeep does not automatically interpret pasted documents. You assign the evidence and
        topic; every extracted claim remains unapproved until owner review.
      </p>

      <section className="workspace-section" aria-labelledby="create-source-title">
        <h2 id="create-source-title">Paste a plain-text source</h2>
        <form className="stacked-form source-create-form" noValidate onSubmit={saveDraft}>
          <label>
            Source title
            <input
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </label>
          <label>
            Source type
            <select
              value={draft.sourceType}
              onChange={(event) =>
                setDraft({ ...draft, sourceType: event.target.value as SourceDocumentType })
              }
            >
              {SOURCE_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Supplier label
            <input
              value={draft.supplierLabel}
              onChange={(event) => setDraft({ ...draft, supplierLabel: event.target.value })}
            />
          </label>
          <label>
            Plain text
            <textarea
              rows={10}
              value={draft.content}
              onChange={(event) => setDraft({ ...draft, content: event.target.value })}
            />
          </label>
          <button className="primary-button" type="submit">
            Save source draft
          </button>
        </form>
        {feedback ? <FeedbackMessage feedback={feedback} /> : null}
      </section>

      <section className="workspace-section" aria-labelledby="source-documents-title">
        <div className="section-heading-row">
          <h2 id="source-documents-title">Documents and version history</h2>
          <span>{sourceDocuments.length} versions</span>
        </div>
        {sourceDocuments.length === 0 ? (
          <p className="empty-state">No source document is recorded in this session.</p>
        ) : (
          <div className="source-document-list">
            {sourceDocuments.map((document) => (
              <DocumentCard document={document} key={document.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
