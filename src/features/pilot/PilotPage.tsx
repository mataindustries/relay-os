import { Link } from 'react-router-dom';

import { resolvePilotContactAction } from './pilotContact';

const relayLoop = [
  'Source material',
  'Reviewed knowledge',
  'Employee question',
  'Cited answer or escalation',
  'Knowledge gap',
  'Owner-approved improvement',
] as const;

const sprintIncludes = [
  'One operational role',
  'Owner knowledge-capture session',
  'Source organization',
  'Up to 12 core procedures or decision areas',
  'Authority and escalation map',
  'Employee question workspace',
  'First 30-day onboarding structure',
  'Gap report',
  'Final Role Transfer Report',
  'Four weeks of guided refinement',
] as const;

const pilotIncludes = [
  'One operational role',
  'Up to 8 core procedures or decision areas',
  'Authority and escalation map',
  'Deterministic question workspace',
  'Two weeks of guided refinement',
  'Final gap report',
] as const;

export interface PilotPageProps {
  readonly bookingUrl?: string;
  readonly contactEmail?: string;
}

export function PilotPage({
  bookingUrl = import.meta.env.VITE_RELAYOS_BOOKING_URL,
  contactEmail = import.meta.env.VITE_RELAYOS_CONTACT_EMAIL,
}: PilotPageProps) {
  const contactAction = resolvePilotContactAction({ bookingUrl, contactEmail });

  return (
    <div className="pilot-page">
      <section className="pilot-hero" aria-labelledby="pilot-title">
        <p className="phase-label">Phase 4 · Founding-client pilot</p>
        <h1 id="pilot-title">RelayOS</h1>
        <p className="positioning">Transfer the role, not just the instructions.</p>
        <p className="hero-summary">
          RelayOS helps a home-service owner turn reviewed source material and owner decisions into
          a source-backed operating system for one Office Manager / Dispatcher role.
        </p>
        <div className="button-row pilot-hero-actions">
          <Link className="primary-link" to="/demo">
            Start the fictional demo
          </Link>
          <a className="secondary-link" href="#founding-offer">
            See the founding-client offer
          </a>
        </div>
      </section>

      <section className="pilot-problem" aria-labelledby="owner-problem-title">
        <p className="eyebrow">The owner problem</p>
        <h2 id="owner-problem-title">The role still depends on answers trapped with the owner.</h2>
        <p>
          Repeated questions, undocumented decisions, slow onboarding, owner interruption, and lost
          knowledge make delegation fragile. A folder of instructions does not say which guidance is
          current, who approved it, or when the employee must stop and escalate.
        </p>
      </section>

      <section className="pilot-loop-section" aria-labelledby="pilot-loop-title">
        <p className="eyebrow">The RelayOS loop</p>
        <h2 id="pilot-loop-title">Owner knowledge becomes a reviewed role operating system.</h2>
        <ol className="pilot-loop" aria-label="RelayOS operating loop">
          {relayLoop.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="pilot-principles" aria-label="Product safety principles">
        <article className="pilot-principle-card">
          <p className="eyebrow">Approved knowledge</p>
          <h2>Review is the employee boundary.</h2>
          <p>
            Employee-visible guidance comes only from current owner-approved knowledge with exact
            source and approval provenance. Proposed, rejected, conflicting, and superseded claims
            stay out.
          </p>
        </article>
        <article className="pilot-principle-card">
          <p className="eyebrow">Deterministic policy firewall</p>
          <h2>Unsafe conditions fail closed.</h2>
          <p>
            Explicit gates check scope, topic, context, provenance, conflict, sensitivity,
            authority, escalation rules, and answer mode. RelayOS cites an eligible answer or
            records why owner action is required; it does not invent policy.
          </p>
        </article>
      </section>

      <section id="founding-offer" className="pilot-offers" aria-labelledby="offers-title">
        <p className="eyebrow">Current founding-client service</p>
        <h2 id="offers-title">A guided role-transfer engagement, delivered with you.</h2>
        <p>
          RelayOS is currently offered as a hands-on service for one operational role—not as an
          unattended production SaaS account.
        </p>
        <div className="offer-grid">
          <article className="offer-card offer-card-primary">
            <p className="offer-kicker">Full founding-client sprint</p>
            <h3>RelayOS Role Transfer Sprint — $1,250</h3>
            <ul>
              {sprintIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="offer-card">
            <p className="offer-kicker">Smaller pilot scope</p>
            <h3>Founding Pilot — $750</h3>
            <ul>
              {pilotIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="pilot-cta" aria-labelledby="pilot-cta-title">
        <p className="eyebrow">Discuss one role</p>
        <h2 id="pilot-cta-title">Start with the role that interrupts the owner most often.</h2>
        {contactAction.kind === 'fallback' ? (
          <p className="honest-contact-fallback">{contactAction.message}</p>
        ) : (
          <a className="primary-link" href={contactAction.href}>
            {contactAction.label}
          </a>
        )}
        <div className="pilot-supporting-links">
          <Link to="/pilot/intake">Review the pilot intake checklist</Link>
          <Link to="/pilot/delivery">Review the delivery checklist</Link>
        </div>
      </section>

      <section className="pilot-limitations" aria-labelledby="pilot-limitations-title">
        <p className="eyebrow">Honest limitations</p>
        <h2 id="pilot-limitations-title">
          A delivery tool and deterministic demonstration—not production SaaS.
        </h2>
        <ul>
          <li>
            No authentication, authorization, real client accounts, or access-control boundary.
          </li>
          <li>No durable or browser persistence; session data disappears on reload.</li>
          <li>
            No model calls, semantic search, automatic source interpretation, or generated policy.
          </li>
          <li>No billing, messaging, calendar, file-upload, or production integration.</li>
          <li>
            No guaranteed savings, productivity, compliance, revenue, or employee performance.
          </li>
        </ul>
        <p className="public-data-warning">
          Use only fictional or non-sensitive data in the public deployment. Real client work should
          be performed in a controlled private environment until production security and persistence
          are implemented.
        </p>
      </section>
    </div>
  );
}
