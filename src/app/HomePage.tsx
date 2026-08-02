const futureLoop = [
  'An employee asks an operational question.',
  'RelayOS retrieves approved company knowledge.',
  'The system answers from that knowledge or escalates.',
  'A missing or conflicting answer becomes a knowledge gap.',
  'RelayOS drafts a visibly unapproved improvement proposal.',
  'The owner reviews, approves, or rejects the proposal.',
  'Only approved knowledge is available for future answers.',
] as const;

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="home-title">
        <p className="phase-label">Phase 1 · Company and role engine</p>
        <h1 id="home-title">RelayOS</h1>
        <p className="positioning">Transfer the role, not just the instructions.</p>
        <p className="hero-summary">
          RelayOS now establishes one company, one operational role, and a deterministic review
          boundary for source-backed company knowledge—all in the current page session.
        </p>
        <a className="text-link" href="#future-loop">
          See the future knowledge loop
        </a>
      </section>

      <section className="principle" aria-labelledby="approved-title">
        <p className="eyebrow">Approved-knowledge principle</p>
        <h2 id="approved-title">Generated output is never company policy.</h2>
        <p>
          Employee-visible answers may use only owner-approved knowledge. When evidence is absent,
          conflicting, sensitive, or uncertain, RelayOS must escalate instead of inventing an
          answer.
        </p>
      </section>

      <section id="future-loop" className="architecture" aria-labelledby="loop-title">
        <p className="eyebrow">Future architecture</p>
        <h2 id="loop-title">A reviewed learning loop</h2>
        <p className="section-intro">
          Phase 1 implements the setup, review, revision, and approved-visibility boundaries. Later
          phases may connect employee questions to the rest of this owner-controlled improvement
          cycle.
        </p>
        <ol className="loop-list">
          {futureLoop.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="phase-note" aria-labelledby="phase-title">
        <h2 id="phase-title">What exists today</h2>
        <p>
          Phase 1 supports session-only company and role setup, manual source metadata, explicit
          approval and rejection, immutable claim revisions, a fictional HVAC demonstration, and a
          narrow employee visibility view. Reloading clears all data.
        </p>
        <p>
          AI, uploads, authentication, persistence, employee question answering, training, and
          scoring remain intentionally unavailable.
        </p>
      </section>
    </div>
  );
}
