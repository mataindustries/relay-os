import { Link } from 'react-router-dom';

const operatingLoop = [
  'An employee asks an operational question.',
  'RelayOS retrieves approved company knowledge.',
  'The system answers from that knowledge or escalates.',
  'Missing or conflicting required knowledge becomes a knowledge gap.',
  'A retained owner interview answer can become a visibly unapproved proposal.',
  'The owner reviews, approves, or rejects the proposal.',
  'Only approved knowledge is available for future answers.',
] as const;

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero" aria-labelledby="home-title">
        <p className="phase-label">Phase 4 · Pilot Launch Package</p>
        <h1 id="home-title">RelayOS</h1>
        <p className="positioning">Transfer the role, not just the instructions.</p>
        <p className="hero-summary">
          RelayOS packages its deterministic, source-backed role-transfer loop for a clear fictional
          demonstration and hands-on founding-client delivery.
        </p>
        <div className="button-row">
          <Link className="primary-link" to="/pilot">
            View the founding pilot
          </Link>
          <Link className="secondary-link" to="/demo">
            Start the fictional demo
          </Link>
          <a className="text-link" href="#operating-loop">
            See the reviewed operating loop
          </a>
        </div>
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

      <section id="operating-loop" className="architecture" aria-labelledby="loop-title">
        <p className="eyebrow">Current operating architecture</p>
        <h2 id="loop-title">A reviewed learning loop</h2>
        <p className="section-intro">
          The completed Phase 3 engine connects structured employee questions to approved knowledge,
          explicit authority and escalation records, genuine knowledge gaps, and the
          owner-controlled review cycle. Phase 4 adds only the pilot presentation and manual
          delivery package. No model decides whether an answer is eligible.
        </p>
        <ol className="loop-list">
          {operatingLoop.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="phase-note" aria-labelledby="phase-title">
        <h2 id="phase-title">What exists today</h2>
        <p>
          Phase 4 supports a public fictional pilot demonstration plus session-only role setup,
          source-backed approval, deterministic gap interviews, structured employee questions, cited
          outcomes, report/manual printing, and a minimized JSON handoff. Reloading clears all data.
        </p>
        <p>
          Models, semantic search, uploads, authentication, persistence, automated messaging,
          training, and scoring remain intentionally unavailable.
        </p>
      </section>
    </div>
  );
}
