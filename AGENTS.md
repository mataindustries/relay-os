# RelayOS contributor map

## Purpose

RelayOS helps a business owner transfer one operational role to an employee as a reviewed, source-backed operating system. The first role is Home-Service Office Manager / Dispatcher. The product promise is: **Transfer the role, not just the instructions.**

## Current scope

Phase 2 is the current completed scope: session-only source intake and a deterministic Knowledge Gap Interviewer for the one company and its single Home-Service Office Manager / Dispatcher role. It adds immutable manual-paste source versions, exact line anchors, explicit operational-topic coverage, reconciled knowledge gaps, deterministic interview questions, and interview-derived unapproved claims while preserving the Phase 1 approval and employee-visibility boundaries. Data lives only in memory for the current page session.

Before changing code, read [the execution-plan guide](docs/exec-plans/README.md) and the plan relevant to the change. The completed [Phase 2: Source Intake and Knowledge Gap Interviewer](docs/exec-plans/phase-2-source-intake-interviewer.md), [Phase 1 company and role engine](docs/exec-plans/phase-1-company-role-engine.md), and [Phase 0 foundation](docs/exec-plans/phase-0-foundation.md) record the current baseline. No later phase is active; do not implement one early even if a future entity or flow is documented.

## Enforceable invariants

1. Employee-visible answers use only approved knowledge.
2. Generated or inferred content remains visibly unapproved.
3. Approved knowledge retains its sources and append-only approval history.
4. Missing, conflicting, sensitive, or low-confidence evidence causes escalation, never invention.
5. Approval history is append-only.
6. Independence scores come from visible components, never a language model.
7. Browser code contains no API secrets.
8. Future model access is server-side through `ModelGateway`.
9. A deterministic no-API demonstration mode remains supported.
10. V1 targets one company and one role before generalized multi-tenancy.

See [Architecture](ARCHITECTURE.md) for the normative rules and enforcement points.

## Repository map

- `src/app/` — application composition, routes, and shell
- `src/domain/` — framework-free domain rules and types
- `src/features/` — feature-owned setup, review, owner, and employee UI
- `src/infrastructure/` — Phase 2 session-only in-memory repository adapter; later external adapters require a plan
- `src/shared/` — small cross-feature UI and utilities
- `src/demo/` — deterministic, no-API demonstration data or adapters
- `src/test/` — shared test setup and helpers
- `docs/product/` — purpose, V1 boundary, and journeys
- `docs/architecture/` — domain, AI, data-flow, and security constraints
- `docs/decisions/` — durable architecture decisions
- `docs/exec-plans/` — active and completed implementation plans
- `public/` — static hosting assets, including SPA fallback behavior

## Standard commands

- `npm install` — install and update the lockfile intentionally
- `npm run dev` — start local development
- `npm run check` — complete noninteractive quality gate
- `npm run build` — produce the static deployment build
- `npm run lint`, `npm run typecheck` — focused static checks
- `npm test` / `npm run test:run` — interactive / noninteractive tests
- `npm run format` / `npm run format:check` — write/check formatting

Use npm and commit `package-lock.json`. Prefer the complete `npm run check` before handoff.

## Definition of done

- Work stays inside the active execution plan and does not expose future features.
- Domain behavior has tests, including invariant and failure cases.
- Documentation and the plan reflect decisions and limitations.
- `npm run check` and `npm run build` pass without browser secrets or console errors.
- Static routes work by direct navigation, including at 360px without horizontal overflow.
- No fake metrics, dashboards, data, or dead action controls are introduced.

## Deeper guidance

- [Product](docs/product/PRODUCT.md) and [V1 scope](docs/product/V1_SCOPE.md)
- [User journeys](docs/product/USER_JOURNEYS.md)
- [Domain model](docs/architecture/DOMAIN_MODEL.md)
- [AI boundaries](docs/architecture/AI_BOUNDARIES.md)
- [Data flow](docs/architecture/DATA_FLOW.md)
- [Security](docs/architecture/SECURITY.md)
- [Foundation decision](docs/decisions/0001-foundation.md)
- [Phase 1 engine decision](docs/decisions/0002-company-role-engine.md)
- [Phase 2 source and gap decision](docs/decisions/0003-deterministic-source-and-gap-engine.md)
