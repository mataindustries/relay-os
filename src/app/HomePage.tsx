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
        <p className="phase-label">Phase 2 · Source intake and gap interviewer</p>
        <h1 id="home-title">RelayOS</h1>
        <p className="positioning">Transfer the role, not just the instructions.</p>
        <p className="hero-summary">
          RelayOS now preserves manual plain-text sources and exact evidence, maps explicit role
          coverage, and asks deterministic owner questions—all in the current page session.
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
          Phase 2 implements source intake and the owner-side gap-to-proposal loop while preserving
          Phase 1 review and approved visibility. Later phases may connect employee questions to the
          rest of this owner-controlled improvement cycle.
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
          Phase 2 supports session-only role setup, manual plain-text source versions, exact line
          references, explicit topic coverage, deterministic gap interviews, explicit approval and
          rejection, and a narrow employee visibility view. Reloading clears all data.
        </p>
        <p>
          AI, uploads, authentication, persistence, employee question answering, training, and
          scoring remain intentionally unavailable.
        </p>
      </section>
    </div>
  );
}
