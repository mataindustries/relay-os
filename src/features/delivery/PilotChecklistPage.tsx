import { useState } from 'react';
import { Link } from 'react-router-dom';

const INTAKE_ITEMS = [
  'Target role',
  'Job description',
  'Business overview',
  'Recurring responsibilities',
  'Current SOPs',
  'Customer scripts',
  'Authority limits',
  'Escalation contacts',
  'Common exceptions',
  'Sensitive information boundaries',
  'Current tools',
  'Desired outcomes',
  'Available owner interview time',
] as const;

const DELIVERY_ITEMS = [
  'Company and role verified',
  'Sources organized',
  'Critical topics reviewed',
  'Authority map approved',
  'Escalation map approved',
  'Employee guidance reviewed',
  'Demo scenarios tested',
  'Gaps documented',
  'Report generated',
  'Manual generated',
  'Employee walkthrough completed',
  'Owner walkthrough completed',
  'Next review date recorded outside RoleKeep',
] as const;

export function PilotChecklistPage({ kind }: { readonly kind: 'intake' | 'delivery' }) {
  const items = kind === 'intake' ? INTAKE_ITEMS : DELIVERY_ITEMS;
  const [checked, setChecked] = useState<ReadonlySet<number>>(() => new Set());
  const title = kind === 'intake' ? 'Pilot intake checklist' : 'Pilot delivery checklist';

  function toggle(index: number): void {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  return (
    <div className="workspace-page pilot-checklist-page">
      <header className="workspace-header">
        <p className="phase-label">Phase 4 · Owner-facing pilot workflow</p>
        <h1>{title}</h1>
        <p className="workspace-lede">
          {kind === 'intake'
            ? 'Confirm the minimum role context and source boundaries before beginning a Role Transfer Sprint.'
            : 'Verify the manual delivery package and walkthrough before closing the founding pilot.'}
        </p>
      </header>

      <aside className="setup-session-notice" role="note">
        <strong>Completion is not persisted.</strong> Checks live only in local component state and
        disappear on reload. This is not CRM, project-management, audit, or durable client history.
      </aside>

      <section className="workspace-section" aria-labelledby={`${kind}-checklist-title`}>
        <div className="section-heading-row">
          <h2 id={`${kind}-checklist-title`}>Current-session working list</h2>
          <span>
            {checked.size} of {items.length} checked
          </span>
        </div>
        <ul className="interactive-checklist">
          {items.map((item, index) => (
            <li key={item}>
              <label>
                <input
                  type="checkbox"
                  checked={checked.has(index)}
                  onChange={() => toggle(index)}
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => setChecked(new Set())}>
            Clear current checks
          </button>
          <Link className="primary-link" to={kind === 'intake' ? '/demo' : '/owner'}>
            {kind === 'intake' ? 'Open the fictional demo' : 'Return to owner workspace'}
          </Link>
        </div>
      </section>

      <nav className="pilot-checklist-nav" aria-label="Pilot checklist routes">
        <Link to="/pilot">Pilot overview</Link>
        <Link to="/pilot/intake">Intake checklist</Link>
        <Link to="/pilot/delivery">Delivery checklist</Link>
      </nav>
    </div>
  );
}
