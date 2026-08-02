# RelayOS

RelayOS helps a business owner transfer one operational role to an employee by
turning source-backed knowledge into a reviewed operating system. Its promise is:
**Transfer the role, not just the instructions.** The first supported role is
Home-Service Office Manager / Dispatcher.

Phase 4 packages the completed deterministic Phase 1–3 engine as a founding-client
sales and manual-delivery tool. It adds a public fictional pilot and guided demo,
actual-session reports, an approved-only manual summary, a minimized JSON handoff,
and pilot intake and delivery checklists. It does not add production SaaS
infrastructure.

## Phase 4 routes

- `/pilot` — public product explanation, founding offers, limitations, and contact
  action
- `/demo` — six-step guided Summit Comfort Heating & Air fictional demonstration
- `/report` — print-ready Role Transfer Report from actual current-session records
- `/manual` — print-ready approved-only Operating Manual summary
- `/pilot/intake` — session-only pilot intake checklist
- `/pilot/delivery` — session-only pilot delivery checklist
- `/owner`, `/employee`, and `/escalations` — the completed Phase 1–3 operating
  workspaces

The demo loads only the fixed fictional Summit Comfort fixture. If another company
is already active in the session, `/demo` fails closed and does not render or replace
that company. Report, manual, and owner routes reflect the current browser session;
because there is no authentication, a public deployment must use only fictional or
non-sensitive data.

## Public CTA configuration

The pilot page accepts either public Vite build variable:

```text
VITE_RELAYOS_BOOKING_URL=https://example.com/book
VITE_RELAYOS_CONTACT_EMAIL=owner@example.com
```

A valid HTTP(S) booking URL takes precedence, then a configured email address. If
neither is valid, the page honestly asks the visitor to reply to the person who
shared the demo. Vite-exposed values are public browser configuration and must never
contain secrets.

## Local development

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run dev
```

Run the complete noninteractive quality gate and production build:

```sh
npm run check
npm run build
```

Other commands are documented in [AGENTS.md](./AGENTS.md). Before changing the
application, read the [execution-plan guide](./docs/exec-plans/README.md) and the
plan relevant to the change.

## Current limitations

All company, source, approval, question, answer, escalation, report, and checklist
state lives only in browser memory and disappears on reload. The JSON handoff is a
download, not persistence, and Phase 4 provides no import. Source text is excluded
by default and can be added only through a separately confirmed export option.

RelayOS currently provides no authentication, authorization, protected client
accounts, durable or browser persistence, file upload, model call, billing,
messaging, analytics, or production integration. Real client work belongs in a
controlled private environment until production security and persistence are
separately planned and implemented.

## Project documentation

- [Product definition](./docs/product/PRODUCT.md)
- [V1 scope](./docs/product/V1_SCOPE.md)
- [Architecture](./ARCHITECTURE.md)
- [Completed Phase 4 execution plan](./docs/exec-plans/phase-4-pilot-launch-package.md)
- [Completed Phase 3 execution plan](./docs/exec-plans/phase-3-question-to-system.md)
- [Phase 4 architecture decision](./docs/decisions/0005-pilot-before-production-infrastructure.md)
- [Founding-pilot playbook](./docs/FOUNDING_PILOT_PLAYBOOK.md)
- [Seven-minute sales demo](./docs/SALES_DEMO_SCRIPT.md)

The site builds to `dist/` as a static Vite application. `public/_redirects`
provides the SPA fallback required for direct route navigation on Cloudflare Pages.
