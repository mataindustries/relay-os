codex# RoleKeep Final Sales Launch Polish

Implement a tightly scoped final sales-launch polish for the existing RelayOS repository, now publicly branded as **RoleKeep**.

This task is customer-facing presentation only. Preserve all Phase 1–4 domain behavior, deterministic safeguards, routes, demo data, reports, exports, and tests.

Do not build new product features, authentication, persistence, AI/model calls, integrations, analytics, or Phase 5 work.

## Read first

Read:

- AGENTS.md
- src/app/App.tsx
- src/app/HomePage.tsx
- src/features/pilot/PilotPage.tsx
- src/features/demo/DemoPage.tsx
- index.html
- the current app styles
- existing tests covering routing, pilot, demo, report, and manual

Inspect the current working tree before editing.

## Objective

Make `rolekeep.pages.dev` look like a premium service a home-service owner can understand and act on immediately.

The public visitor should understand in under 30 seconds:

1. RoleKeep helps transfer an Office Manager / Dispatcher role.
2. It turns owner-approved knowledge into usable guidance, decision limits, and escalation rules.
3. It reduces repeated owner interruptions without letting software invent company policy.
4. A sample HVAC workspace can be explored.
5. A paid founding pilot starts at $750.
6. There is one clear way to contact or book.

## Protected areas and files

Do not modify these except where this task explicitly requires a customer-facing
label or route wiring change:

- `src/domain/**`
- `src/infrastructure/**`
- `src/demo/**`
- source/provenance, approval, visibility, escalation, gap, report-filtering,
  export-safety, and demo-isolation logic
- Cloudflare deployment configuration
- build output settings
- package manager or dependency versions
- existing environment-variable names
- secret handling
- GitHub Actions
- generated build output in `dist/`

Do not rename the repository, source directories, internal domain types,
services, repository interfaces, or historical ADR/execution-plan files.

Permitted edits should be concentrated in:

- public routing and shell presentation;
- `src/app/App.tsx`;
- `src/app/HomePage.tsx` only if still needed;
- `src/features/pilot/**`;
- small customer-facing empty-state callouts in the listed workspace routes;
- shared styles;
- `index.html`;
- `public/favicon.svg`;
- focused tests.

## Scope

### 1. Customer-facing rebrand

Change all customer-visible branding from `RelayOS` to `RoleKeep`.

Use:

- Brand: `RoleKeep`
- Tagline: `Transfer the role. Keep the judgment.`
- Category: `The role-transfer system for owner-led service businesses.`

Do not rename repository folders, domain types, internal service classes, test helper names, or architecture identifiers merely for branding. Internal technical names may remain RelayOS when changing them would create risk.

Keep existing `VITE_RELAYOS_BOOKING_URL` and `VITE_RELAYOS_CONTACT_EMAIL` support for backward compatibility. Optionally also support `VITE_ROLEKEEP_BOOKING_URL` and `VITE_ROLEKEEP_CONTACT_EMAIL`, with RoleKeep variables taking precedence.

### 2. Make the root route the sales page

The root `/` must become the premium public sales landing experience.

Render the existing `PilotPage` directly at both `/` and `/pilot`.

Do not use a redirect and do not maintain two competing marketing pages.
The root route must be the canonical public sales experience, while `/pilot`
remains a working alias for existing links.

Do not leave the current development-status homepage as the public entry point.
The old development-status homepage may be removed from routing or retained only
as an internal component if tests or imports require it, but it must not be
publicly reachable.

The public hero should say:

**RoleKeep**

**Transfer the role. Keep the judgment.**

`Turn the knowledge in your head into approved guidance, decision limits, and escalation rules your next office manager or dispatcher can actually use.`

Include:

- Primary CTA: `Explore the sample HVAC workspace`
- Secondary CTA: `Discuss a founding pilot`
- Small qualifier: `Founding pilots from $750 · One role · Guided implementation`

Do not lead with “Phase 4,” “deterministic,” “fictional,” “session-only,” or architecture terminology.

The demo disclosure should remain clear but secondary:

`Uses a fictional HVAC company and sample data.`

### 3. Simplify public navigation

For public routes such as `/`, `/pilot`, and `/demo`, show only a restrained public navigation:

- RoleKeep wordmark
- How it works
- Sample demo
- Pricing
- Contact

Use anchors where appropriate.

Do not show Setup, Owner, Escalations, Sources, Interview, Employee, Review, Training, or Settings in the public header.

For internal workspace routes, keep access to the functional navigation but make it mobile-usable. A compact workspace menu, wrapped secondary navigation, or horizontally scrollable accessible nav is acceptable.

Do not add a heavy menu library.

### 3A. Direct-entry behavior for workspace routes

Do not redirect `/employee`, `/escalations`, `/report`, or `/manual` to the demo.

When one of those routes is opened without an active company/demo session:

- preserve the route;
- show the existing honest empty state;
- add one concise, nonblocking banner or callout:
  `Start the sample HVAC workspace to explore this screen.`
- link that callout to `/demo`;
- do not auto-load demo data;
- do not create fake records;
- do not hide the route behind authentication;
- do not change behavior when a valid active session already exists.

This keeps shared direct links understandable without inventing production
account behavior.

### 4. Replace engineering language with buyer language

On public pages:

Replace phrases such as:

- `Phase 4 · Pilot Launch Package`
- `current operating architecture`
- `deterministic policy firewall`
- `session-only role setup`
- `generated output`
- `fictional demo` as the main CTA

Use clear buyer language:

- `Built for the role that interrupts the owner most`
- `Only owner-approved guidance reaches the employee`
- `RoleKeep answers from approved company knowledge—or tells the employee exactly when to stop and ask`
- `Every unclear decision becomes something the owner can review once instead of answering repeatedly`
- `Explore a sample HVAC workspace`

The term `deterministic` may appear once in a deeper technical or safety explanation, but not as headline copy.

Keep honest limitations, but move the long technical limitations away from the main sales flow into a concise `Current pilot boundaries` section or FAQ near the bottom.

### 5. Strong landing-page structure

Use this public page order:

1. Hero
2. Immediate outcome / who it is for
3. Owner problem
4. How RoleKeep works
5. Real product proof links
6. Founding pilot offer
7. Current pilot boundaries
8. Contact CTA

Add a concise “Who it is for” section:

`Best for home-service businesses hiring or onboarding an office manager, dispatcher, service coordinator, or first operations hire.`

Add a concise “What changes” comparison:

**Without RoleKeep**
- The owner answers the same questions repeatedly.
- Authority limits live in someone’s head.
- New hires guess or wait.
- Employee turnover erases working knowledge.

**With RoleKeep**
- Approved guidance is organized by real operating topic.
- Decision limits and escalation paths are explicit.
- Employees receive cited guidance or a clear stop-and-ask outcome.
- Questions expose gaps that can be fixed once and reused.

Do not claim guaranteed savings or outcomes.

### 6. Product proof

Add a compact proof section linking to actual existing routes:

- `Explore the guided sample` → `/demo`
- `See the employee question flow` → `/employee`
- `See the owner escalation queue` → `/escalations`
- `Preview the Role Transfer Report` → `/report`
- `Preview the Operating Manual` → `/manual`

Each item should include one short plain-language explanation.

Do not invent screenshots, testimonials, usage counts, or customer results.

### 7. Offer and CTA

Keep both offers but brand them:

- `RoleKeep Founding Pilot — $750`
- `RoleKeep Role Transfer Sprint — $1,250`

These prices are current and intentional. Do not change, merge, discount, or
reinterpret them.

Make the $750 pilot the visually primary offer for tomorrow’s outreach.

Pilot copy:

- one operational role;
- up to eight priority decision areas;
- authority and escalation map;
- approved-guidance workspace;
- two weeks of guided refinement;
- final gap report and role-transfer summary.

Use one strong final CTA:

`Discuss your highest-interruption role`

The CTA must:

- use configured booking URL when valid;
- otherwise use configured contact email;
- otherwise retain an honest reply-to-the-person-who-shared-this fallback;
- never show fake success.

### 8. Metadata and sharing

Update `index.html`:

- `<title>RoleKeep — Transfer the role. Keep the judgment.</title>`
- description focused on Office Manager / Dispatcher role transfer
- Open Graph title
- Open Graph description
- `og:type=website`
- Twitter card metadata
- theme color matching the existing visual system

Do not add a fake social image URL. Use no `og:image` unless a real checked-in asset exists.

Create a simple checked-in RoleKeep favicon at:

- `public/favicon.svg`

Use a restrained monogram or mark based on `RK`, using the existing visual
system. It must work at small browser-tab sizes, contain no external font or
image dependency, and include no RelayOS branding.

Update `index.html` to reference `/favicon.svg`.

Update accessible labels, wordmark, footer, and visible page titles.

Footer copy:

`RoleKeep · Founding pilot · Sample data only on the public demo`

Keep session-only and security warnings where they are operationally relevant.

### 9. Mobile polish

At 360px:

- Public nav must not become a tiny 12-item row.
- Hero buttons must stack cleanly.
- Pricing cards must be readable.
- No horizontal overflow.
- Tap targets must remain usable.
- Primary CTA should be visible without excessive scrolling.
- Long internal technical labels must wrap.

Do not redesign the entire visual system.

### 10. Preserve safeguards

Do not weaken:

- approved-only employee visibility;
- source provenance;
- fail-closed outcomes;
- escalation logic;
- fictional-demo isolation;
- export safety;
- report/manual filtering;
- current session-only warnings.

Public pages must not expose real or user-entered session records as marketing content.

## Tests

Update or add focused tests for:

- RoleKeep wordmark and tagline
- no customer-visible RelayOS branding on public pages
- root route shows the sales landing page
- public navigation excludes internal workspace links
- workspace routes retain functional navigation
- primary $750 offer
- CTA precedence and fallback
- sample-data disclosure
- product proof links
- metadata title and description where testable
- favicon reference and checked-in favicon asset
- direct entry to `/employee`, `/escalations`, `/report`, and `/manual` without
  session data shows a sample-workspace callout instead of redirecting
- no regression to demo, employee, escalation, report, manual, or export behavior
- mobile navigation class/structure

Avoid large snapshots.

## Validation

Run:

- npm run format
- npm run check
- npm run build

Verify direct navigation to:

- /
- /pilot
- /demo
- /employee
- /escalations
- /report
- /manual

Inspect for:

- customer-visible `RelayOS` on public routes;
- `Phase 4` or development-status language in public hero copy;
- missing or broken `/favicon.svg`;
- internal routes in public navigation;
- redirects away from direct workspace routes;
- fake success states;
- broken CTAs;
- horizontal overflow at 360px;
- altered domain safeguards;
- new network requests;
- new persistence;
- new model calls.

## Token and loop control

- Inspect once, then make the smallest coherent patch.
- Do not write a new architecture.
- Do not create an execution-plan phase.
- Do not implement Phase 5.
- Do not perform unrelated refactors.
- Do not add dependencies unless unavoidable.
- Run the complete gate once.
- Make at most one focused repair pass.
- When validation passes, stop.
- Do not commit or push.

## Final response

Report only:

1. Customer-facing brand changes
2. Public navigation and landing-page changes
3. CTA and metadata changes
4. Tests and final passing count
5. Validation results
6. Honest limitations
7. Confirmation that no product logic, persistence, model calls, or Phase 5 work was added

END OF ROLEKEEP SALES POLISH TASK
