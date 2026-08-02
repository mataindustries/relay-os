# Phase 4: Pilot Launch Package

Status: Complete

## Goal

Package the completed session-only deterministic RelayOS engine as an honest founding-client sales and manual-delivery tool. A public visitor must be able to understand the product and enter a fixed fictional demonstration quickly; an owner must be able to inspect actual session records, print a Role Transfer Report and approved-only Operating Manual summary, export a minimized pilot handoff package, and follow explicit intake and delivery checklists without RelayOS claiming production SaaS capabilities.

## Non-goals

Phase 4 does not add authentication, authorization, real client accounts, durable or browser persistence, Cloudflare data services, uploads, crawling, external integrations, messaging, model calls or routing, semantic retrieval, billing, payments, analytics, telemetry, background work, notifications, multi-company or multi-role behavior, production infrastructure, or Phase 5 procedure generation. It does not turn role-definition prose, unapproved claims, interview answers, question text, or escalation resolutions into approved employee guidance.

## Current baseline

- Phase 0, Phase 1, Phase 2, and Phase 3 are Complete. The unchanged pre-Phase-4 baseline passes 11 test files and 214 tests.
- One `PhaseOneService` remains the validated write boundary over a defensive-copy, current-page-session in-memory snapshot. In-app navigation retains records and reload discards them.
- The fixed Summit Comfort Heating & Air fixture contains fictional company/role, source, approval, coverage, interview, structured-question, answer, escalation, gap, and activity records and loads deterministically and idempotently.
- Employee-visible knowledge already requires a current approved claim, resolvable source references, and an exact-version approval decision. The Phase 3 policy firewall already fails closed for missing, conflicting, sensitive, provenance-invalid, unsupported, and unclear-authority conditions.
- The application is a static Vite/React SPA with a Cloudflare Pages `_redirects` fallback. There is no print stylesheet, export/import workflow, public pilot page, guided demo route, report/manual route, or pilot checklist route.
- The working tree contained only the untracked authoritative `docs/codex-tasks/phase-4.md` task before this plan was created. That specification must remain unchanged.

## Planned boundaries

- Public `/pilot` content is static and uses only public build-time CTA configuration. `/demo` may expose only the fixed fictional fixture; if a non-demo session is active it must fail closed without rendering those records or overwriting them.
- Reset may replace only an active Summit Comfort fictional fixture with a fresh validated fixture. It must reject non-demo session data and clearly state that changes made to fictional records are discarded.
- Report, manual, demo summaries, priorities, and export projections derive from the current snapshot through deterministic pure helpers. No fake score, inferred outcome, generated procedure, or semantic interpretation is introduced.
- Manual guidance and report guidance sections reuse the existing employee-visible selector. Role boundaries and escalation rules remain separately labeled structured role-definition records; gaps remain owner-facing and never appear as policy.
- Default export omits document content, line text, source-reference excerpts, employee labels, raw question text, structured free-text question context, and free-text escalation resolution. Source text is added only after a separate explicit confirmation. Export receives an application timestamp, has stable ordering and keys apart from that timestamp, never mutates the snapshot, and has no import counterpart in this phase.
- Print delivery uses browser print and US Letter CSS rather than a PDF dependency. Navigation, controls, and public CTAs are hidden in print.

## Work breakdown

- [x] Verify the authoritative task marker, read every required baseline document in full, inspect all named implementation/deployment surfaces once, and run the 214-test baseline.
- [x] Create this Phase 4 execution plan before changing application code.
- [x] Add deterministic Phase 4 read projections for demo counts, approved-only manual/report content, record-derived priorities, safe handoff export, safe filenames, and public CTA resolution.
- [x] Add a validated Summit Comfort-only reset and extend the fictional fixture with discount-within-limit, discount-above-limit, technician-late guidance, and over-authority commitment examples while preserving every Phase 1-3 outcome and idempotence.
- [x] Add `/pilot` and `/demo` with the founding offers, limitations, configured CTA, one-click entry, six guided steps, actual counts, scenario evidence, local step controls, reset, and fictional/session warnings.
- [x] Add owner-facing `/report` and `/manual` using actual records, approved-only guidance, provenance, honest empty states, application-clock dates, browser print controls, and professional Letter print CSS.
- [x] Add a session-only handoff download with default-minimized JSON and an explicitly confirmed source-text option; link report, manual, export, intake, and delivery from the owner journey.
- [x] Add `/pilot/intake` and `/pilot/delivery` as interactive current-session-only checklists with every required item and no persistence claim.
- [x] Add focused domain, demo, route, component, visibility, export, print-control, CTA, and regression tests without large snapshots.
- [x] Create the case-study, sales-demo, founding-pilot, client-intake, and delivery documents with honest claims and no fabricated outcomes.
- [x] Update only Phase 4-affected contributor, product, journey, architecture/security, scope, README, execution-plan, and decision documentation; add ADR 0005 and keep Phase 3 consistently Complete.
- [x] Run formatting, one complete quality gate, the independent build, production-preview direct-route checks, and static security/export/responsive/print audits; make at most two focused repair passes and record exact results.

## Acceptance criteria

### Public pilot and guided fictional demo

- [x] `/pilot` explains RelayOS, the owner problem, approved-knowledge principle, deterministic firewall, complete operating loop, $1,250 Role Transfer Sprint, $750 Founding Pilot, included scope, and honest limitations without a fake form, testimonial, metric, or guarantee.
- [x] A valid booking URL takes CTA precedence, a configured email produces a mail action, and absent/invalid configuration produces the exact honest fallback. Vite-exposed values are documented as public configuration, never secrets.
- [x] `/demo` loads the Summit Comfort fixture on a fresh session without duplication, never renders non-demo session records, visibly identifies all records as fictional, and provides Start, Continue, reset, and pilot-return controls.
- [x] The demo shows six explicit value steps, links each to the real workflow, and displays only actual derived counts with “What to notice” and “Why this saves time” callouts.
- [x] The discount scenario shows an actual structured within-limit delivered answer and above-limit escalation with matching approved guidance, structured authority, exact source, exact approval, escalation record, and no fake gap. The technician-late scenario shows approved handling guidance plus a known over-authority commitment escalation without an invented promise or gap.
- [x] Demo load and reset are deterministic and idempotent; reset is unavailable for and cannot change a non-demo session.

### Report, manual, print, and handoff export

- [x] `/report` renders all 14 required sections from actual current records, marks fictional data, includes an application-clock generation date, contains no fake score, and derives priorities only from open critical/high gaps and actual unresolved records.
- [x] `/manual` includes role identity, responsibilities, approved guidance by topic, authority and escalation maps, provenance, and a separately labeled owner-facing gap section. Proposed, rejected, conflicting, missing, superseded, and unapproved interview material never appears as guidance.
- [x] Report/manual pages contain print controls, return navigation, no owner-only raw source or question content, and restrained US Letter CSS with navigation/controls hidden and useful break control.
- [x] The JSON package contains the required schema/timestamp/company/role/role-system/source-metadata/approved-knowledge/decision/coverage/gap/question/answer/escalation/activity sections in stable order.
- [x] Default JSON excludes document content and lines, reference excerpts, raw question text and free-text context, raw sensitive values, escalation-resolution free text, environment values, and browser implementation detail. Explicit source-text confirmation adds only the documented source fields.
- [x] Export does not mutate state, uses a safe company-derived filename, and states that Phase 4 has no import.

### Pilot workflow, documentation, regression, and scope

- [x] `/pilot/intake` and `/pilot/delivery` contain every required item, work interactively in local component state, and prominently disclose that completion is not persisted.
- [x] `docs/CASE_STUDY_TEMPLATE.md`, `docs/SALES_DEMO_SCRIPT.md`, `docs/FOUNDING_PILOT_PLAYBOOK.md`, `docs/CLIENT_INTAKE_QUESTIONS.md`, and `docs/DELIVERY_CHECKLIST.md` exist with the requested honest content and no fabricated outcomes or quotes.
- [x] ADR 0005 records the pilot-before-infrastructure decision, fictional-only public demo rule, print/export delivery role, paid-pilot-driven production boundary, and absence of new model calls.
- [x] Phase 3 remains consistently Complete; Phase 4 documentation describes a static session-only pilot package without claiming production readiness, confidentiality, durability, access control, import, or automatic procedure generation.
- [x] Every Phase 1-3 test and invariant remains intact. Employee visibility, provenance, append-only approval, deterministic gate precedence, escalation, genuine-gap, safe-event, and demo-idempotence regressions pass.
- [x] Direct navigation works for `/pilot`, `/demo`, `/report`, `/manual`, `/pilot/intake`, `/pilot/delivery`, `/employee`, `/escalations`, and `/owner`; static inspection and focused tests find no evident 360px overflow or broken print structure.
- [x] No authentication, persistence, model/provider, billing, production Cloudflare service, integration, new dependency, Phase 5 procedure generator, or unrelated redesign is introduced.
- [x] `npm run format`, `npm run check`, and `npm run build` pass, preview route requests return the SPA, static audits pass, and every authoritative Phase 4 acceptance criterion is satisfied.

## Validation plan

1. Add focused pure-helper and fixture tests while implementing; run those files plus `npm run typecheck` after coherent domain/demo slices.
2. Run focused Phase 4 component and route journeys for pilot CTA variants, fictional demo safety/reset, report/manual visibility, export confirmation, print controls, and checklist disclosures.
3. Run focused Phase 1-3 regression files after fixture and selector changes.
4. Run `npm run format`, then the first complete `npm run check`. Make at most two focused repair passes and do not rerun an unchanged failure.
5. Run `npm run build` independently. Start a local production preview and directly request `/pilot`, `/demo`, `/report`, `/manual`, `/pilot/intake`, `/pilot/delivery`, `/employee`, `/escalations`, and `/owner`.
6. Inspect source, config, built output, and CSS for external requests, browser storage, secrets, unsafe HTML, real records on public demo routes, unapproved manual guidance, raw default-export source/question/sensitive fields, environment leakage, fake metrics/testimonials, source or question content in URLs/logs, later-phase infrastructure, print hazards, and 360px overflow.
7. Recheck the authoritative terminal marker and `git diff --check`. Record commands, counts, environmental limitations, and exact outcomes here before marking the plan Complete.

## Risks

- Automatically loading `/demo` could overwrite or reveal a non-demo session. The route must distinguish empty, Summit Comfort, and non-demo states before rendering any record-derived content.
- Reset requires a narrow destructive boundary. Both current and replacement company IDs must match the fixed fixture and the replacement snapshot must pass aggregate validation before one repository replacement.
- Adding required scenarios can accidentally change old fixture outcome order or manufacture gaps. Preserve all existing examples, append new ones deterministically, and assert gap absence for known authority/escalation outcomes.
- Report/manual convenience can bypass employee eligibility by filtering statuses in UI. Central projections must call the existing selector and tests must inject mixed approved, proposed, rejected, conflicting, and superseded records.
- Source references and question contexts contain raw text even when document `content` is absent. The default export allowlist must omit every raw-text field rather than redact a broad serialized snapshot after the fact.
- Browser download/print APIs are hard to exercise in jsdom. Keep serialization and filename generation pure, make controls thin, and test invocation separately.
- New navigation, offer cards, long IDs, JSON controls, and print layouts can overflow on a phone or Letter page. Retain mobile-first grids, `min-width: 0`, wrapping, and dedicated print break rules.
- Build-time contact variables are public and may be malformed. Validate supported URL schemes, treat values as public CTA configuration, and fall back honestly instead of rendering unsafe or dead actions.

## Stop conditions

- Stop rather than weaken approval, provenance, exact-version decisions, employee visibility, fail-closed gates, append-only history, scope validation, immutable question outcomes, or sensitive-data minimization.
- Stop if a public route would need to reveal non-fictional records or if demo reset cannot be constrained to the fixed Summit Comfort dataset.
- Stop before adding authentication, authorization, persistence, browser storage, server/Cloudflare data services, a model/provider, upload/parser, external messaging/integration, billing, telemetry, multi-tenancy, a new component/PDF/tour dependency, Phase 5 procedure generation, or production-readiness claims.
- Stop and record the exact command, error, likely cause, attempted repair, and next action if an environmental validation failure remains after the allowed focused repair passes.
- Do not mark this plan Complete until every criterion above and every authoritative task criterion passes. Do not commit or push.

## Validation results

- Pre-implementation baseline on 2026-08-02: `npm run test:run -- --reporter=dot` passed with 11 files and 214 tests.
- `npm run format` passed and formatted the Phase 4 implementation and documentation.
- The first `npm run check` stopped at lint because `currentTime` was missing from the session value memo dependency list. The dependency was added; focused ESLint, `npm run typecheck`, and the 11-test Phase 4 journey file then passed.
- The repaired complete gate reached the test suite and exposed one stale Phase 1 fixture-count expectation (`9 knowledge claims` after the fixture intentionally grew to 10). The assertion was updated; the focused Phase 1 journey file passed 5/5. These were the only two focused repair passes.
- Final `npm run check` passed: formatting, zero-warning lint, typecheck, 13 test files with 241/241 tests, and production build. Vite emitted a non-failing advisory for the 522.34 kB minified application chunk.
- Independent `npm run build` passed with 89 modules transformed; CSS was 25.22 kB (5.77 kB gzip) and JavaScript was 522.34 kB (140.28 kB gzip), with the same advisory.
- The repository has no `preview` npm script, so `npm run preview` correctly reported a missing script. `npx vite preview --host 127.0.0.1 --port 4173` was then used; the sandbox denied its first listen attempt with `EPERM`, and the approved local preview started successfully outside that restriction.
- Direct preview requests to `/pilot`, `/demo`, `/report`, `/manual`, `/pilot/intake`, `/pilot/delivery`, `/employee`, `/escalations`, and `/owner` each returned `200` with `text/html`.
- Static audit found no `fetch`, `XMLHttpRequest`, WebSocket, Axios, browser-storage, `dangerouslySetInnerHTML`, or direct `innerHTML` use in `src`; no new dependency was added. The only Vite variables are the documented public CTA values.
- Cloudflare `_redirects` retains `/* /index.html 200`. Static CSS inspection confirmed mobile-first wrapping/min-width guards, `@page` Letter rules, print navigation/control hiding, and page-break rules. Focused route/component tests covered all new surfaces.
- No Chromium, Chrome, or Firefox executable was available, so interactive 360 px and browser print-preview inspection could not be performed. The task-authorized fallback of focused component tests plus static responsive/print CSS inspection was used.
- Final `git diff --check` passed, and the authoritative task still ends exactly with `END OF PHASE 4 TASK`.

## Decisions made while executing

- Append the four Phase 4 sales-demo questions to the existing 12 fixed outcomes and approve only the minimum discount/late-customer guidance needed for those examples. The old rejected generated-like discount claim remains rejected, and known limit/commitment escalations create no gap.
- Auto-load the fictional fixture only into an empty `/demo` session. A non-demo session receives a record-free fail-closed page; reset validates the exact fixed company and role IDs before replacement.
- Reuse `selectEmployeeVisibleKnowledge` for all manual/report guidance rather than filtering lifecycle labels in UI code. Keep responsibilities, structured authority/escalation maps, and owner-facing gaps visibly separate from guidance.
- Build the handoff from an explicit allowlist and expose source text only behind an option plus separate confirmation. Omit raw question/context values and resolution text in every export mode; provide no import.
- Use the injected/application clock for report and export timestamps, browser print with Letter CSS for delivery, and public build-time CTA configuration with booking-then-email precedence.
- Extend the existing visual system and dependency set; no tour, PDF, model, storage, integration, or component library was needed.

## Remaining known limitations

- RelayOS remains a public, unauthenticated, session-only static application with no protected route or safe durable store for confidential client work. Real pilot work requires a controlled private environment and separately agreed delivery channel.
- Reload discards records and checklist checks. JSON export has no import and is not backup; printed and downloaded artifacts leave RelayOS controls. Explicit source-text inclusion can create a sensitive artifact even though raw question/context values remain excluded.
- The public CTA values are visible in the browser bundle. They must remain public contact configuration, never secrets.
- Source authenticity, policy correctness, and owner identity are not independently verified. Coverage is not readiness or compliance, and no outcome is guaranteed.
- The production bundle passes the required build but carries Vite's advisory for a 522.34 kB minified JavaScript chunk.
- No browser executable was available for an interactive phone-width or print-preview review; component tests and static CSS inspection found no evident issue.

## Phase completion status

Complete on 2026-08-02. Every authoritative Phase 4 acceptance criterion passed. Phase 5 has not started, and no commit or push was performed.
