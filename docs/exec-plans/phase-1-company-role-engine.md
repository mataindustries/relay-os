# Phase 1: Company and Role Engine

Status: In progress

## Goal

Deliver the first functional, deterministic RelayOS vertical slice: establish one company and its single Home-Service Office Manager / Dispatcher role, define the role system, review source-backed knowledge through an explicit lifecycle, and expose only approved current knowledge to the employee route.

## Non-goals

Phase 1 does not implement AI/model calls or routing, chat, Question-to-System, question answering, uploads or ingestion, authentication, browser or durable persistence, Cloudflare services, multi-company or multi-role behavior, users/invitations, training, scoring, analytics, billing, messaging, dashboards, workflow builders, or production infrastructure. It does not begin Phase 2.

## Work breakdown

- [x] Implement strongly typed Phase 1 entities and typed domain errors without React or browser dependencies.
- [x] Enforce company/role ownership, role-composition validation, and the complete deterministic claim lifecycle.
- [x] Define small repository interfaces and a session-only in-memory implementation.
- [x] Add a fixed, idempotent fictional HVAC demonstration record.
- [x] Replace `/setup`, `/owner`, `/review`, and `/employee` placeholders with the authorized workflows while preserving the Phase 0 shell.
- [x] Add comprehensive domain tests and focused critical-path UI integration tests.
- [x] Update only the documentation whose current implementation description changed.
- [x] Run and record formatting, the complete quality gate, build, direct-route checks, and final scope inspection.

## Acceptance criteria

### Domain and repository

- [x] Company, Role, Responsibility, AuthorityBoundary, EscalationRule, SourceReference, KnowledgeClaim, and ApprovalDecision contain every required Phase 1 concept.
- [x] Permission levels and claim lifecycle states use constrained explicit vocabularies.
- [x] All 12 requested domain invariants are executable and invalid operations return typed errors.
- [x] Approval requires a source-backed claim and an explicit append-only decision; approved knowledge cannot be edited in place.
- [x] Revision preserves the approved version, and supersession occurs only through successful approval of its revision.
- [x] The employee selector returns only approved, current, nonsuperseded claims with source and approval provenance.
- [x] Repository interfaces are small; the app and tests use only an in-memory implementation with defensive copies and no browser persistence.
- [x] Repeated demo loading is deterministic and idempotent.

### User experience

- [x] `/setup` provides five mobile-first steps, useful inline validation, editable responsibilities, review-before-activation, and an explicit session-only notice.
- [x] Setup cannot activate an invalid or incomplete company/role system and preserves state during in-app navigation.
- [x] `/owner` shows only current records and derived counts; `/review` creates sources/claims, records approval or rejection reasons, creates revisions, and shows decision history.
- [x] `/employee` shows the active role and only the domain selector's approved knowledge, with an explanatory empty state and no chat.
- [x] The fixed Summit Comfort Heating & Air demo is visibly fictional and contains the required role, responsibilities, boundaries, rules, sources, and claim-state examples without duplication.
- [x] `/training` and `/settings` remain honest later-phase placeholders; no out-of-scope action or fake statistic appears.
- [x] The application remains usable at 360px with no evident horizontal overflow or console error in available tooling.

### Quality and documentation

- [x] Tests cover every requested relationship, validation, lifecycle, provenance, revision, repository, demo, setup, owner-review, and employee-boundary case without large snapshots.
- [x] Relevant product, architecture, repository-map, and execution-plan documentation describes the Phase 1 implementation without claiming persistence, identity, AI, question answering, or production readiness.
- [x] `npm run format`, `npm run check`, and `npm run build` pass; direct navigation to `/setup`, `/owner`, and `/employee` succeeds.
- [x] Static inspection finds no browser secrets, external requests, browser persistence, later-phase features, fake actions, or raw UI mutations that bypass domain/repository rules.

## Validation results

- Focused integration repair: Phase 1 source lint and `npm run typecheck` passed; the application/routing/journey run passed 3 files and 12 tests.
- `npm run format` passed and formatted the completed implementation.
- `npm run check` passed on its first complete run: Prettier, ESLint, strict TypeScript, 7 test files with 98 tests, and the production build all succeeded.
- The separately requested `npm run build` passed: Vite transformed 67 modules and emitted the static application bundle.
- Local preview direct requests to `/setup`, `/owner`, and `/employee` each returned HTTP 200. The sandbox initially denied the preview socket with `listen EPERM`; the approved local-only retry succeeded.
- Static inspection found no external request APIs, browser persistence, browser secrets, console error/warning calls, later-phase implementation, or obvious 360px overflow risk. No browser executable was installed for pixel-level capture; responsive CSS and focused component journeys were inspected instead.
- A final documentation/scope audit found and corrected repository-versus-domain-service enforcement wording; no remaining product-scope contradiction or Phase 2 behavior was found.

## Decisions made

- Keep the Phase 1 domain framework-free and make one application service the write boundary for relationship, lifecycle, approval, and revision rules.
- Use an injected clock and ID factory so demo data and tests are deterministic without adding dependencies.
- Hold exactly one application repository instance in React context for the current tab's memory lifetime; navigation does not reconstruct it.
- Store approved claims as immutable versions and append decisions; approval of a revision explicitly supersedes its prior approved version.
- Keep source references as manually entered immutable metadata rather than documents or uploads.

## Remaining known limitations

- All data disappears on a full browser reload; there is no recovery, synchronization, authorization, or multi-user concurrency.
- The employee surface demonstrates retrieval eligibility only; it does not answer questions.
- Source authenticity is owner-entered metadata and is not independently verified.
- Pixel-level browser layout and browser-console inspection were unavailable because the environment has no installed browser executable; automated component tests and static responsive-CSS inspection passed.

## Phase completion status

Complete as of 2026-08-02. Every Phase 1 acceptance criterion above passed. Phase 2 was not started.
