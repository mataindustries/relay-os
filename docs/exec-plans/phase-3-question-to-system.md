# Phase 3: Deterministic Question-to-System

Status: Complete

## Goal

Deliver the first employee Question-to-System vertical slice for the one session-only company and its Home-Service Office Manager / Dispatcher role. An employee submits an explicit topic, request type, sensitivity selection, and typed context. A framework-free deterministic policy firewall then either delivers fixed-template guidance grounded only in current approved knowledge with exact source and approval provenance, or fails closed with an inspectable withheld, prohibited, or escalation outcome. Genuine system deficiencies create or reuse a categorized knowledge gap; known escalation, approval, prohibition, sensitivity-handling, and emergency policy do not manufacture gaps.

## Non-goals

Phase 3 does not add a model or provider abstraction, natural-language classification, semantic search, embeddings, RAG, free-form answer generation, automatic topic/sensitivity/authority/conflict detection, uploads, network requests, authentication, browser or durable persistence, Cloudflare data services, messaging, background work, multi-company or multi-role behavior, training, scoring, analytics, billing, production infrastructure, or Phase 4 behavior. Question text is retained as employee input but is never parsed for policy, retrieval, sensitivity, limits, topic, or authority.

## Current baseline

- Phase 0, Phase 1, and Phase 2 are Complete. The pre-Phase-3 baseline passes 9 test files and 139 tests.
- One `PhaseOneService` remains the validated application/domain write boundary over one defensive-copy, in-memory whole-session snapshot. The historical name is retained for compatibility.
- Current approved employee knowledge already requires active scope, a current nonsuperseded approved claim, resolvable source references, and an exact-version approval decision.
- Phase 2 supplies immutable source versions, exact anchors, explicit topics, deterministic coverage and gap reconciliation, one-question interviewing, immutable owner answers, and proposed interview-derived claims.
- Authority boundaries and escalation rules are owner-entered role records with free-text Phase 1 fields. Optional structured bindings can extend them without invalidating existing records; unbound records cannot authorize a Phase 3 question.
- There is no server, identity, persistence, external request, model call, upload, telemetry, or protected-data claim.

## Proposed domain additions

- Extend the single snapshot with immutable `EmployeeQuestion`, `AnswerEligibilityEvaluation`, `Answer`, `Escalation`, and append-only `ActivityEvent` collections.
- Add explicit request-type and employee-selected sensitivity vocabularies plus a `StructuredQuestionContext` discriminated union. Preserve original employee input and use appended corrected questions instead of edits.
- Add optional explicit topic/request bindings and structural amount/currency/urgency/sensitivity constraints to existing authority boundaries and escalation rules. Preserve all Phase 1 inputs and fixtures.
- Extend `KnowledgeGap` only enough to retain question/evaluation links and the additional accurate deficiency reasons. Existing Phase 2 records remain valid.
- Add a pure framework-free eligibility evaluator and fixed-template answer composer. `PhaseOneService` orchestrates validated atomic writes, idempotency, events, gap linkage, and escalation lifecycle so UI code never mutates repository arrays.
- Keep injected clocks and ID factories. Add an explicitly configured owner fallback destination for deficiency escalations; absence of both a matching destination and configured fallback fails closed rather than inventing one.

## Answer-eligibility gate design

Every persisted evaluation records all ten gates in this fixed order with `pass`, `fail`, or `not-applicable`, a concise safe reason, and supporting record IDs:

1. `scope-valid`
2. `topic-valid`
3. `request-context-valid`
4. `current-approved-knowledge-present`
5. `provenance-valid`
6. `no-explicit-conflict`
7. `sensitivity-clear`
8. `authority-clear`
9. `escalation-rule-clear`
10. `answer-mode-supported`

The outcome precedence is fixed and fail-closed:

1. invalid scope, topic, or structured context;
2. employee-selected sensitivity;
3. an explicitly matching prohibited authority boundary;
4. an explicitly matching mandatory escalation rule or approval/escalation boundary;
5. missing, conflicting, or invalid approved knowledge/provenance;
6. missing or incompatible structured authority for an action request;
7. supported eligible answer.

A failure at an earlier precedence level cannot be overridden later. Retrieval begins with explicit topic and current approved claim records, then verifies every candidate against the unchanged employee-visibility predicate and exact source/decision provenance. Explicit same-topic conflict records are scanned independently. Informational policy/procedure lookups do not grant action authority and receive a fixed disclaimer, while an explicitly bound prohibition, approval, or escalation restriction still applies first. Action requests require an explicitly bound authority record. Numeric limits and currencies come only from structured fields; no free text is parsed, and the smallest of several compatible limits governs. Eligible claims, sources, decisions, boundaries, and rules use stable deterministic ordering. No confidence score participates.

## Escalation and gap rules

- A matching prohibited boundary produces a cited prohibited result and no gap.
- A matching `must-request-approval`, `must-escalate`, emergency rule, or sensitivity-handling rule creates or reuses one open escalation with its explicit destination and no fake gap.
- Missing approved topic knowledge, explicit conflict, broken provenance, unsupported policy/procedure, or absent structured action authority creates or reuses a scoped topic gap and links the triggering question/evaluation.
- Deficiency escalations use only an explicit matching record destination or the explicitly configured owner fallback. Required context is assembled from typed fields, and sensitive raw values are not copied.
- Re-evaluation returns the existing immutable evaluation/answer/escalation/gap result and appends nothing.
- Assignment, resolution, and closure use typed transitions and append activity events. Resolution never creates or approves knowledge, edits a question or answer, changes approval history, or resolves/dismisses a gap.
- Later approval of current same-topic knowledge may resolve an eligible gap only through the existing Phase 2 reconciliation boundary and only after the gates relevant to every linked question's original deficiency pass. Historical question outcomes remain unchanged; corrections and retries create new linked questions.

## Work breakdown

- [x] Verify the authoritative task marker, read every required baseline document in full, confirm Phase 2 is Complete, inspect the implementation surfaces, and run the 139-test baseline.
- [x] Create this execution plan before changing application code and point contributor guidance at it.
- [x] Add Phase 3 types, structured bindings, validation, pure gates/composition, service orchestration, lifecycle operations, and whole-snapshot invariants.
- [x] Add focused domain tests covering structured questions, every gate and precedence branch, authority/rule matching, answers, escalation lifecycle, gap rules, activity safety, idempotency, and Phase 1/2 compatibility.
- [x] Extend the defensive-copy repository tests and deterministic Summit Comfort fixture with all required Phase 3 outcomes, stable IDs/times/order, and reload idempotency.
- [x] Extend `/employee` with the structured form, request-specific fields, warnings, result/citations/provenance, and actual session history while preserving approved-knowledge browsing.
- [x] Add `/escalations` with open-first queue, safe context, gate trace, assignment/resolution/closure, related-record navigation, and remediation links that do not mutate policy.
- [x] Add narrow routing and Phase 3 UI journey tests; preserve all Phase 1/2 journeys and direct routes.
- [x] Update only Phase 3-relevant product/architecture/security/data-flow/AI-boundary/journey/README material and add ADR 0004.
- [x] Run and record formatting, focused checks, the full quality gate, independent build, production preview routes, and static security/scope/responsive audits.

## Acceptance criteria

### Domain and policy firewall

- [x] Phase 1 and Phase 2 behavior and tests remain intact, and completed documentation remains intact except explicit Phase 3-current references.
- [x] Questions require valid active scope, explicit topic/request/sensitivity, required text, and a valid discriminated structured context; corrections append and evaluated questions are immutable.
- [x] Question text is retained but never inspected for retrieval, topic, sensitivity, policy, conflicts, authority, limits, or escalation recipients.
- [x] All ten ordered gate results and the exact overall result are immutable, deterministic, inspectable, stable, confidence-free, and independently tested.
- [x] Retrieval uses every current approved employee-eligible same-topic claim and excludes extracted, proposed, rejected, conflicting, superseded, out-of-scope, source-broken, and decision-broken records.
- [x] Every delivered statement cites existing eligible claim, source-reference, and exact approval-decision IDs in stable order; composition uses only fixed labels/templates.
- [x] Explicit conflict and employee-selected sensitivity fail closed. Informational answers state they do not authorize action.
- [x] Structured boundaries cover `may-decide`, exact/within/above numeric limit, currency mismatch, approval required, mandatory escalation, prohibition, and missing binding without parsing free text.
- [x] Explicit escalation rules match deterministically by topic/request and optional urgency/sensitivity constraints; priority is stable and no destination is invented.
- [x] Answers and evaluations are immutable; evaluated-question re-entry is idempotent.

### Escalations, gaps, events, and repository

- [x] Escalations have deterministic reasons, destinations, minimized typed context, matching records, correlation, and valid open/assigned/resolved/closed transitions.
- [x] The same evaluated question cannot duplicate an open escalation.
- [x] Missing knowledge, conflict, invalid provenance, unsupported absent policy/procedure, and unclear authority create or reuse an accurately categorized scoped topic gap with question/evaluation links.
- [x] Known approval/escalation/prohibition/emergency/sensitivity routing creates no fake gap.
- [x] Escalation resolution creates or approves no knowledge, changes no approval history, and resolves/dismisses no gap.
- [x] Existing approved-knowledge reconciliation can later resolve an eligible same-topic gap without rewriting historical question outcomes.
- [x] Activity events are append-only, deterministic, correlated, ordered, and contain no raw sensitive question text or policy evidence.
- [x] The single in-memory repository continues defensive copying all nested Phase 0-3 records; no direct UI mutation or additional storage boundary is introduced.

### Employee, owner, demo, and scope

- [x] `/employee` captures every explicit field, validates request-specific context, shows sensitive-data/professional-advice/session warnings, and renders honest cited, prohibited, withheld, or escalated results.
- [x] Employee result/history derives from actual session records and exposes no unapproved knowledge, owner-only notes, full source text, other employee questions, or approval controls.
- [x] `/escalations` shows an open-first queue, safe question/context summary, reason/destination, matching records, related gap, activity trace, full gate trace, and created/status details.
- [x] Owner can assign, resolve, and close with valid transitions and navigate to related remediation workflows without policy mutation.
- [x] The fictional Summit Comfort demo covers all 12 required Phase 3 examples, including a resolved escalation that created no policy, and repeated load duplicates no record.
- [x] Direct routes `/employee`, `/escalations`, `/owner`, `/review`, `/interview`, and `/sources` work through the static SPA fallback.
- [x] The application remains usable at 360px with no evident horizontal overflow, unsafe HTML, console errors, or dead controls.
- [x] No model/provider, semantic retrieval, network request, upload, authentication, messaging, browser/durable persistence, telemetry, secret, production infrastructure, or Phase 4 feature is introduced.
- [x] Phase 3 documentation and ADR 0004 match the implementation without production, protected-data, semantic-understanding, professional-advice, or automated-messaging claims.
- [x] `npm run format`, `npm run check`, and `npm run build` pass, preview route checks succeed, static audits pass, and every task-file acceptance criterion is satisfied.

## Validation plan

1. Run focused Phase 3 domain and repository tests plus `npm run typecheck` after each coherent domain slice.
2. Run focused demo and UI journey tests after fixture and route integration.
3. Run `npm run format`, then the first complete `npm run check`. Make at most two focused repair passes for that full gate, without rerunning unchanged failures.
4. Run `npm run build` independently; start the production preview and request `/employee`, `/escalations`, `/owner`, `/review`, `/interview`, and `/sources` directly.
5. Inspect source, generated bundle/config, and CSS for secrets, external requests, browser storage, unsafe HTML, content in URLs/logs, raw sensitive event metadata, fake AI language, semantic inference, free-text numeric limits, duplicate records, UI write bypasses, Phase 4 work, and 360px overflow hazards.
6. Recheck the authoritative Phase 3 task marker and `git diff --check`. Record exact results and limitations below before changing status.

## Risks

- Extending the whole snapshot can accidentally weaken Phase 1/2 graph validation or break older literals. New collections must be present in the empty/demo/test snapshots, while authority/rule binding fields remain optional for compatibility.
- Invalid provenance is normally rejected by aggregate validation. The pure evaluator must expose a test seam for deliberately malformed evidence while the persisted service continues rejecting invalid snapshots.
- Existing coverage reconciliation may overwrite the original reason of a question-created gap. Phase 3 linkage and reconciliation must preserve accurate deficiency origin and avoid creating gaps for known safe escalation outcomes.
- Multiple matching boundaries/rules can yield ambiguity. Explicit deterministic severity/urgency/ID ordering and fail-closed compatibility checks must be documented and tested.
- Employee input may contain sensitive values despite warnings. Events, escalation summaries, URLs, and logs must never copy raw sensitive question text; structured context must be minimized.
- The broader employee page and owner trace can create mobile overflow or accidental record exposure. Use existing mobile-first components, wrap IDs/text, and prefer stacked trace cards over wide tables.

## Stop conditions

- Stop rather than weaken approval, provenance, scope, immutability, append-only history, employee visibility, gate precedence, or sensitive-data minimization.
- Stop before adding a model/provider, semantic or free-text inference, network, upload/parser, browser/durable persistence, authentication, messaging, production service, Phase 4 behavior, or an unplanned dependency.
- Stop and record the exact command/error/cause/next action if an environmental validation failure remains after the allowed focused repair attempts.
- Do not mark this plan Complete until every acceptance criterion above and every authoritative task criterion passes. Do not commit or push.

## Validation results

- Pre-implementation baseline: `npm run test:run -- --reporter=verbose` passed with 9 files and 139 tests.
- `npm run format` completed successfully; the final `npm run check` confirmed every matched file uses Prettier formatting.
- Focused Phase 3 validation after the final audit repairs passed: typecheck; 66 domain tests; and 78 combined domain, demo, repository, and UI tests.
- Focused Phase 1/2 regression validation passed with 4 files and 124 tests.
- Final `npm run check` passed on 2026-08-02: formatting, zero-warning ESLint, TypeScript, 11 test files with 214 tests, and the production build all passed.
- Independent `npm run build` passed: TypeScript plus Vite transformed 78 modules and emitted the static bundle successfully.
- Production preview returned HTTP 200 for direct requests to `/employee`, `/escalations`, `/owner`, `/review`, `/interview`, and `/sources`; `public/_redirects` retains the SPA fallback.
- The first sandboxed preview start failed with `listen EPERM: operation not permitted 127.0.0.1:4173` because the managed sandbox blocks listening sockets. Re-running the same local preview with approved sandbox escalation succeeded; direct route requests were then run in the same network context. No product defect or remaining environmental blocker exists.
- No browser executable was available (`chromium`, `chromium-browser`, `google-chrome`, and `firefox` were absent). The 360px check therefore used the required focused component journeys plus static responsive-CSS inspection: mobile-first single-column layouts, `min-width: 0`, wrapping, bounded controls, and wider grids only above 48rem showed no evident horizontal-overflow hazard.
- Static source/bundle/config audits found no application network call, external service, browser storage, unsafe HTML, console logging, secret, source/question content in URLs, raw sensitive event metadata, semantic retrieval, free-text limit parsing, extra production repository, UI write bypass, Phase 4 behavior, or unplanned dependency. The generated Vite module-preload polyfill performs only same-origin asset loading.
- Final marker audit returned `MARKER_OK`; `git diff --check` passed. No commit or push was performed.

## Decisions made while executing

- Preserve `PhaseOneService` and `PhaseOneSnapshot` names for compatibility while extending their current aggregate responsibility through Phase 3.
- Keep pure eligibility/composition logic framework-free and make the existing service the only persistence/write orchestrator.
- Treat Phase 1 authority/rule text as retained owner context; only new explicit structured bindings participate in deterministic authorization or routing.
- Configure an owner fallback explicitly at service composition rather than deriving a recipient from unrelated free text.
- Apply explicit restrictive boundaries before informational handling. `may-decide` cannot authorize financial, emergency, or amount-bearing requests, and the smallest of multiple compatible amount limits governs.
- Reconciliation rechecks the gates relevant to each linked question's original deficiency before resolving a question-created gap; same-topic approval alone cannot erase a continuing conflict, provenance, unsupported-mode, or authority problem.
- Validate recorded eligibility evidence and answer status/mode/citations as an internally consistent immutable historical trace. Later OS changes do not recompute or rewrite historical outcomes.
- Use the existing defensive-copy in-memory repository to construct the demo instead of adding a demo-only storage boundary.
- Keep one fixed employee session-persona label in the UI so a user cannot switch label-filtered histories. The label is explicitly not authentication or authorization.

## Remaining known limitations

- The slice is an unauthenticated public static demonstration whose entire record set disappears on reload and is unsuitable for confidential or durable company operations. Owner and employee routes are perspectives, not access-control boundaries.
- The preserved Phase 1 setup form creates legacy unbound authority/rule records. Structured bindings are supported by the domain and deterministic demo, while an unbound non-demo role correctly fails closed for action authorization; a future plan must own any post-activation boundary-authoring workflow.
- Source authenticity remains owner supplied and unverified; deterministic citations provide traceability within the current session, not cryptographic integrity or professional advice.
- No browser executable was available for pixel-level 360px verification; component tests and static responsive-CSS inspection are the recorded substitute.

## Phase completion status

Complete. Every Phase 3 acceptance criterion and the authoritative task checklist passed. Phase 3 remains session-only and deterministic; this completion does not authorize or implement Phase 4.
