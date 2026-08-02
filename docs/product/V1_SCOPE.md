# RelayOS V1 scope

## Scope statement

The planned V1 transfers one operational role for one company: **Home-Service Office Manager / Dispatcher**. It builds a reviewed body of role knowledge, uses that knowledge to support an employee, and returns unresolved work to the owner as explicit escalations and improvement proposals.

“Planned V1” describes the product boundary, not the current implementation. Phase 0 provides only a static application shell, an initial domain invariant, tests, CI, and documentation.

## Planned V1 capabilities

- Establish one company, one role, users, responsibilities, authority boundaries, and escalation rules.
- Capture source material and immutable references to the exact evidence used.
- Extract candidate claims and draft procedures or decision rules while keeping them visibly unapproved.
- Let an owner approve, reject, or request changes with append-only decision history.
- Retrieve only approved knowledge for an employee question, then provide a cited grounded answer or escalate.
- Record missing, conflicting, sensitive, and low-confidence cases as knowledge gaps.
- Turn selected gaps into source-backed improvement proposals for owner review.
- Use approved training scenarios and record attempts without treating model output as policy.
- Derive responsibility-level and role-level independence metrics from visible, deterministic components.
- Provide a deterministic no-API demonstration path for the complete supported loop.

The exact sequencing and storage or identity technology require later execution plans. Nothing in this list authorizes implementation during Phase 0.

## Explicitly outside V1

- Generalized multi-company or multi-role tenancy and tenant administration
- Roles beyond Home-Service Office Manager / Dispatcher
- Autonomous approval, silent policy creation, or answers grounded in unapproved material
- Actions that exceed an employee’s recorded authority boundary
- A general-purpose document management, learning management, CRM, dispatch, payroll, or analytics platform
- Opaque AI-generated independence scores or employee surveillance metrics
- Provider-specific browser integrations or browser-held API secrets

## Phase 0 boundary

Phase 0 includes the routes `/`, `/setup`, `/owner`, `/employee`, `/review`, `/training`, and `/settings` only as deliberate informational placeholders. It excludes generation, AI chat, document uploads, authentication, persistence, employee training behavior, dashboards, scoring, production model calls, and Cloudflare Workers, D1, R2, or KV.

See [Product](PRODUCT.md), [User journeys](USER_JOURNEYS.md), [Architecture](../../ARCHITECTURE.md), and the [active plan](../exec-plans/phase-0-foundation.md).
