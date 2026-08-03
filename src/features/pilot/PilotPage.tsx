import { Link } from 'react-router-dom';

import { resolvePilotContactAction } from './pilotContact';

const roleTransferSteps = [
  {
    title: 'Capture the role as it really operates',
    description:
      'Organize the source material, recurring decisions, responsibilities, authority limits, and escalation paths for one role.',
  },
  {
    title: 'Review what the employee may rely on',
    description:
      'The owner approves guidance explicitly. Drafts, conflicts, and unsupported statements stay outside the employee experience.',
  },
  {
    title: 'Give the employee a safe question path',
    description:
      'The employee receives cited guidance when approved knowledge applies, or a clear stop-and-ask outcome when owner judgment is required.',
  },
  {
    title: 'Turn interruptions into reusable clarity',
    description:
      'Questions reveal missing decisions and unclear boundaries so the owner can review them once and strengthen the role over time.',
  },
] as const;

const withoutRoleKeep = [
  'The owner answers the same questions repeatedly.',
  'Authority limits live in someone’s head.',
  'New hires guess or wait.',
  'Employee turnover erases working knowledge.',
] as const;

const withRoleKeep = [
  'Approved guidance is organized by real operating topic.',
  'Decision limits and escalation paths are explicit.',
  'Employees receive cited guidance or a clear stop-and-ask outcome.',
  'Questions expose gaps that can be fixed once and reused.',
] as const;

const proofLinks = [
  {
    to: '/demo',
    label: 'Explore the guided sample',
    description: 'Walk through the fixed Summit Comfort HVAC workspace and its reviewed role loop.',
  },
  {
    to: '/employee',
    label: 'See the employee question flow',
    description: 'See how approved guidance, citations, limits, and stop-and-ask outcomes appear.',
  },
  {
    to: '/escalations',
    label: 'See the owner escalation queue',
    description: 'Review the real handoff screen for decisions that still require owner judgment.',
  },
  {
    to: '/report',
    label: 'Preview the Role Transfer Report',
    description:
      'Open the actual-record summary of the role, approved knowledge, gaps, and priorities.',
  },
  {
    to: '/manual',
    label: 'Preview the Operating Manual',
    description: 'See the approved-only guidance summary with its source and approval trail.',
  },
] as const;

const pilotIncludes = [
  'One operational role',
  'Up to eight priority decision areas',
  'Authority and escalation map',
  'Approved-guidance workspace',
  'Two weeks of guided refinement',
  'Final gap report and role-transfer summary',
] as const;

const sprintIncludes = [
  'One operational role',
  'Owner knowledge-capture session',
  'Source organization',
  'Up to 12 core procedures or decision areas',
  'Authority and escalation map',
  'Employee question workspace',
  'First 30-day onboarding structure',
  'Final gap report and Role Transfer Report',
  'Four weeks of guided refinement',
] as const;

export interface PilotPageProps {
  readonly bookingUrl?: string;
  readonly contactEmail?: string;
}

export function PilotPage({
  bookingUrl = import.meta.env.VITE_ROLEKEEP_BOOKING_URL ??
    import.meta.env.VITE_RELAYOS_BOOKING_URL,
  contactEmail = import.meta.env.VITE_ROLEKEEP_CONTACT_EMAIL ??
    import.meta.env.VITE_RELAYOS_CONTACT_EMAIL,
}: PilotPageProps) {
  const contactAction = resolvePilotContactAction({ bookingUrl, contactEmail });

  return (
    <div className="pilot-page sales-page">
      <section className="pilot-hero sales-hero" aria-labelledby="pilot-title">
        <div className="sales-hero-copy">
          <p className="sales-category">
            The role-transfer system for owner-led service businesses.
          </p>
          <h1 id="pilot-title">RoleKeep</h1>
          <p className="positioning">Transfer the role. Keep the judgment.</p>
          <p className="hero-summary">
            Turn the knowledge in your head into approved guidance, decision limits, and escalation
            rules your next office manager or dispatcher can actually use.
          </p>
          <p className="sales-qualifier">
            Founding pilots from $750 · One role · Guided implementation
          </p>
          <div className="button-row pilot-hero-actions sales-hero-actions">
            <Link className="primary-link" to="/demo">
              Explore the sample HVAC workspace
            </Link>
            {contactAction.kind === 'fallback' ? (
              <a className="secondary-link" href="#contact">
                Discuss a founding pilot
              </a>
            ) : (
              <a className="secondary-link" href={contactAction.href}>
                Discuss a founding pilot
              </a>
            )}
          </div>
          <p className="demo-disclosure">Uses a fictional HVAC company and sample data.</p>
        </div>
        <aside className="sales-hero-proof" aria-label="RoleKeep safety promise">
          <p className="eyebrow">Owner-approved by design</p>
          <h2>Useful guidance without invented company policy.</h2>
          <p>
            RoleKeep connects employee questions to reviewed company knowledge, explicit decision
            limits, and named escalation paths.
          </p>
          <ul>
            <li>Approved guidance stays linked to its source and approval.</li>
            <li>Unclear authority produces a stop-and-ask outcome.</li>
            <li>Unapproved material never becomes employee guidance.</li>
          </ul>
        </aside>
      </section>

      <section className="buyer-fit" aria-labelledby="buyer-fit-title">
        <p className="eyebrow">Built for the role that interrupts the owner most</p>
        <h2 id="buyer-fit-title">Transfer operating judgment, not a folder of instructions.</h2>
        <p className="section-intro">
          Best for home-service businesses hiring or onboarding an office manager, dispatcher,
          service coordinator, or first operations hire.
        </p>
        <div className="outcome-grid">
          <article>
            <h3>Guidance employees can use</h3>
            <p>Organize current, owner-approved answers by the operating topics the role faces.</p>
          </article>
          <article>
            <h3>Decision limits they can see</h3>
            <p>Make authority boundaries and required escalation destinations explicit.</p>
          </article>
          <article>
            <h3>Owner review that compounds</h3>
            <p>Turn repeated questions into a focused list of decisions to clarify once.</p>
          </article>
        </div>
      </section>

      <section className="pilot-problem owner-problem" aria-labelledby="owner-problem-title">
        <p className="eyebrow">The owner problem</p>
        <h2 id="owner-problem-title">The role is delegated, but the judgment still is not.</h2>
        <p className="section-intro">
          A job description can list responsibilities. It rarely captures which answer is current,
          what the employee may decide, or exactly when the owner still needs to step in.
        </p>
        <div className="comparison-grid" aria-label="What changes with RoleKeep">
          <article className="comparison-card comparison-without">
            <h3>Without RoleKeep</h3>
            <ul>
              {withoutRoleKeep.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="comparison-card comparison-with">
            <h3>With RoleKeep</h3>
            <ul>
              {withRoleKeep.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section
        id="how-it-works"
        className="pilot-loop-section how-it-works-section"
        aria-labelledby="how-it-works-title"
      >
        <p className="eyebrow">How RoleKeep works</p>
        <h2 id="how-it-works-title">A reviewed path from owner knowledge to daily decisions.</h2>
        <div className="role-transfer-steps">
          {roleTransferSteps.map((step, index) => (
            <article key={step.title}>
              <span aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
        <div className="sales-principles" aria-label="RoleKeep guidance boundaries">
          <article>
            <h3>Only owner-approved guidance reaches the employee</h3>
            <p>
              Proposed, rejected, conflicting, superseded, or source-invalid material stays out of
              the employee answer path.
            </p>
          </article>
          <article>
            <h3>Approved knowledge—or a clear stop</h3>
            <p>
              RoleKeep answers from approved company knowledge—or tells the employee exactly when to
              stop and ask.
            </p>
          </article>
          <article>
            <h3>Review unclear decisions once</h3>
            <p>
              Every unclear decision becomes something the owner can review once instead of
              answering repeatedly.
            </p>
          </article>
        </div>
      </section>

      <section className="product-proof" aria-labelledby="product-proof-title">
        <p className="eyebrow">Real product proof</p>
        <h2 id="product-proof-title">Explore the working screens, not a slide deck.</h2>
        <p className="section-intro">
          These links open the existing sample and workspace routes. No screenshots, customer
          results, or usage claims have been invented.
        </p>
        <div className="proof-grid">
          {proofLinks.map((item) => (
            <Link className="proof-link" key={item.to} to={item.to}>
              <strong>{item.label}</strong>
              <span>{item.description}</span>
              <span className="proof-link-action" aria-hidden="true">
                Open screen →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="pricing" className="pilot-offers" aria-labelledby="offers-title">
        <p className="eyebrow">Founding pilot offer</p>
        <h2 id="offers-title">Start with one role and the decisions that matter most.</h2>
        <p className="section-intro">
          RoleKeep is currently delivered as a hands-on service, with the owner reviewing what may
          become usable company guidance.
        </p>
        <div className="offer-grid">
          <article className="offer-card offer-card-primary">
            <p className="offer-kicker">Recommended starting scope</p>
            <h3>RoleKeep Founding Pilot — $750</h3>
            <ul>
              {pilotIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="offer-card">
            <p className="offer-kicker">Expanded guided engagement</p>
            <h3>RoleKeep Role Transfer Sprint — $1,250</h3>
            <ul>
              {sprintIncludes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="pilot-limitations current-boundaries" aria-labelledby="boundaries-title">
        <p className="eyebrow">Current pilot boundaries</p>
        <h2 id="boundaries-title">A guided delivery service with its limits stated plainly.</h2>
        <div className="boundary-grid">
          <article>
            <h3>Guided, not unattended</h3>
            <p>
              The current pilot is a hands-on engagement for one company and one role, not a
              self-serve production account.
            </p>
          </article>
          <article>
            <h3>Public sample only</h3>
            <p>
              The public workspace is fictional and session-only. Reloading clears its records; do
              not enter confidential or real client information.
            </p>
          </article>
          <article>
            <h3>No invented policy</h3>
            <p>
              A deterministic safety check admits only eligible approved guidance and fails closed
              when evidence, authority, or provenance is not sufficient.
            </p>
          </article>
          <article>
            <h3>No production claims</h3>
            <p>
              There is no authentication, durable persistence, automated messaging, billing,
              integration, or guaranteed business outcome in the current pilot.
            </p>
          </article>
        </div>
      </section>

      <section id="contact" className="pilot-cta sales-contact" aria-labelledby="pilot-cta-title">
        <p className="eyebrow">One role. One clear starting point.</p>
        <h2 id="pilot-cta-title">Discuss your highest-interruption role</h2>
        <p>
          Bring the role, the questions that keep coming back to you, and the decisions a new hire
          cannot safely guess. We’ll determine whether the founding pilot is a fit.
        </p>
        {contactAction.kind === 'fallback' ? (
          <p className="honest-contact-fallback">{contactAction.message}</p>
        ) : (
          <a className="primary-link" href={contactAction.href}>
            {contactAction.label}
          </a>
        )}
      </section>
    </div>
  );
}
