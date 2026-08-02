# Phase 2: Source Intake and Knowledge Gap Interviewer

Status: Complete

## Goal

Deliver the second deterministic RelayOS vertical slice: let the owner paste and version plain-text operational sources, anchor exact evidence, manually extract topic-assigned claims, inspect explicit role coverage, and answer a prioritized one-question-at-a-time gap interview whose immutable answers create source-backed unapproved claims. Those claims must continue through the Phase 1 approval boundary before they can resolve coverage or appear to an employee.

## Non-goals

Phase 2 does not implement model calls, automatic interpretation or extraction, semantic search, embeddings, retrieval-augmented generation, employee questions or answers, uploads or non-text parsing, URL fetching, integrations, authentication, browser or durable persistence, Cloudflare data services, multi-company or multi-role behavior, training, independence scoring, analytics, billing, messaging, background work, production secrets, general workflow building, or any Phase 3 capability.

## Current baseline

- Phase 0 and Phase 1 are complete: 98 tests pass against one session-only company and role, role setup, manual source-reference metadata, deterministic claim lifecycle operations, append-only decisions, immutable approved revisions, explicit supersession, and the approved-only employee selector.
- One defensive-copy in-memory repository instance is held by the React session provider. The framework-free `PhaseOneService` is the write boundary, and fixed Summit Comfort data enters through that same boundary.
- There is no network, backend, identity, browser storage, upload, model, or autonomous document behavior.

## Proposed domain additions

- Extend the existing session snapshot and repository boundary with `SourceDocument`, `KnowledgeGap`, `InterviewQuestion`, and immutable `InterviewAnswer` records. Keep the existing service and repository architecture rather than introducing a parallel lifecycle.
- Model source documents as scoped draft, available, superseded, or withdrawn immutable versions. Normalize line endings with a pure utility and retain one-based numbered lines. Activating a revision atomically supersedes, but never deletes, its available predecessor.
- Extend `SourceReference` with an optional complete document anchor (`sourceDocumentId`, exact version, start line, end line) while retaining valid Phase 1 metadata-only references. Anchored excerpts are derived from stored lines and references have no update operation.
- Add a typed canonical catalog for the 16 required Home-Service Office Manager / Dispatcher topics. Claims used by coverage carry an explicit topic key; no free-text inference participates in coverage or conflict detection.
- Implement a pure, fail-closed coverage projection with `approved`, `candidate`, `conflicting`, `missing`, and `dismissed` states. Supporting claims, references, decisions, and gaps remain inspectable and ordered by catalog/risk rules.
- Reconcile at most one active unresolved `KnowledgeGap` per company, role, and topic. Missing, incomplete, conflict, and unclear-authority reasons are explicit; dismissal requires a reason; only approval of a current same-topic claim resolves a gap.
- Generate deterministic, idempotent interview questions from unresolved gaps. A stable risk/topic/rule order controls the queue, only one question is active, and exact structured answers trigger only reviewed explicit follow-up rules.
- Store every interview answer immutably. Submission creates an `owner-interview` reference whose excerpt is the exact answer and a same-topic unapproved claim whose provenance remains interview-derived. Corrections append a new answer, source, and candidate instead of rewriting history.
- Preserve `approveKnowledgeClaim` and its explicit `ApprovalDecision` as the only publication operation. Gap reconciliation is integrated with successful approval/rejection without changing the employee selector predicate.

## Work breakdown

- [x] Read the required repository documents and task marker, inspect the Phase 1 service/repository/session/demo/workflows, correct the Phase 1 header, and activate this plan in contributor guidance.
- [x] Extend framework-free entities, validation, snapshot/repository storage, topic catalog, document lifecycle, coverage projection, gap reconciliation, and interview operations.
- [x] Add focused unit tests for document/reference invariants, extraction, coverage, gaps, interview branching/corrections, approval integration, defensive copies, and employee visibility.
- [x] Extend the deterministic Summit Comfort fixture with documents, anchored evidence, explicit topics, coverage states, gaps, questions, and an answered proposal while retaining idempotence.
- [x] Add `/sources` and `/interview`, add coverage to the owner workspace, enrich review/employee provenance displays, update navigation, and add focused critical-journey tests.
- [x] Update only Phase 2-affected product, architecture, security, data-flow, AI-boundary, journey, README, and decision documentation.
- [x] Run formatting, the complete quality gate, the independent production build, direct-route preview checks, static security/scope/responsive inspection, and record exact results.

## Acceptance criteria

### Domain and lifecycle

- [x] Phase 1 tests and lifecycle behavior remain intact; metadata-only references and existing approved claims still work.
- [x] Scoped manual-paste documents support draft activation, immutable available versions, revision/supersession, withdrawal, numbered lines, and historical anchors without deletion.
- [x] Anchored references validate exact document/version and inclusive line range, derive their excerpts, and remain stable across revisions.
- [x] Manual extraction requires valid evidence and an explicit valid topic and creates only an unapproved claim.
- [x] The complete typed topic catalog and pure coverage projection use only explicit assignments/relations, expose supporting records, order deterministically, and fail closed on invalid links.
- [x] Gap reconciliation is idempotent, permits one active unresolved gap per topic, prioritizes critical/authority-sensitive topics, requires dismissal reasons, resolves only for a current approved same-topic claim, and stays unresolved after rejection or unrelated approval.
- [x] Interview generation is idempotent and deterministic, activates only one question, requires skip reasons and valid answers, uses explicit conditional branches, and never creates a question for a covered topic.
- [x] Answers and corrections are immutable; each creates exact interview provenance and a source-backed same-topic unapproved claim without automatic policy wording or approval.
- [x] Existing approval/revision/decision operations remain the publication boundary; employee eligibility remains current, source-backed, explicitly approved, and nonsuperseded only.

### User experience and demo

- [x] `/sources` supports draft/activation, numbered-line inspection, anchored references, topic-assigned extraction, available-document revision, version history, and cited-claim inspection with honest session/manual-selection notices.
- [x] Owner coverage shows topic, risk, state, supporting claims/conflict/gap, and next action with all/critical/missing/candidate/conflicting/approved filters and no score or compliance claim.
- [x] `/interview` presents one prioritized question with rationale, outcome, evidence, appropriate answer control, reasoned skip, concrete counts, deterministic follow-ups, and a review link.
- [x] `/review` identifies legacy, source-extracted, interview-derived, and demo provenance with topic, exact evidence/anchor, related gap/current approved claim, editing through a provenance-preserving operation, and decision history.
- [x] `/employee` remains narrow and excludes documents, interview material, gaps, and every unapproved/historical status while optionally showing approved topic/provenance/date.
- [x] The visibly fictional Summit Comfort fixture includes the required source types, document revision chain, anchors, topic states, prioritized queue, and one answered unapproved proposal; repeat loading duplicates nothing.
- [x] Critical UI journeys pass, direct routes work, and the layout has no evident 360px horizontal overflow.

### Scope, documentation, and quality

- [x] No model, fake AI analysis, network request, upload, browser persistence, authentication, secret, telemetry, unsafe HTML, URL-carried source content, console content logging, or Phase 3 feature is introduced.
- [x] Phase 2-affected documentation and ADR 0003 describe the implementation honestly without claims of durability, verification, compliance, semantic understanding, or production readiness.
- [x] `npm run format`, `npm run check`, and `npm run build` pass; production preview returns the SPA for `/sources`, `/interview`, `/owner`, `/review`, and `/employee`.
- [x] Every task-file acceptance criterion is satisfied and actual validation results are recorded before this plan is marked complete.

## Validation plan

1. Run focused Vitest files and `npm run typecheck` while implementing each domain/UI slice.
2. Exercise the full source-to-anchor-to-extracted-claim and interview-answer-to-review-to-approval-to-employee journeys with Testing Library, avoiding broad snapshots.
3. Run `npm run format`, then one complete `npm run check`. If necessary, make no more than two focused repair passes before stopping and recording an environmental blocker.
4. Run `npm run build` independently, start the local production preview, and request `/sources`, `/interview`, `/owner`, `/review`, and `/employee` directly.
5. Inspect source/CSS for external-request APIs, browser storage, secrets, unsafe HTML, content in URLs/logging, fake AI/process language, raw UI state mutations, duplicate demo behavior, later-phase code, and obvious 360px overflow.

## Risks

- Extending the shared snapshot can accidentally weaken Phase 1 validation or employee eligibility; existing tests and new mixed-state selector tests must guard the boundary.
- Document revision and gap reconciliation touch multiple records atomically; validation must occur before a single repository replacement so a failed transition cannot leave partial history.
- Question idempotence can conflict with corrections and follow-ups; stable template/rule identity and explicit correction links must distinguish legitimate new records from duplicates.
- A candidate may look authoritative in UI; source extraction, interview answers, and edited proposals require prominent unapproved language until an explicit decision succeeds.
- Pasted source text may be sensitive or hostile; it remains plain escaped React text in memory only and must never enter URLs, logs, HTML injection points, or network calls.

## Stop conditions

- Stop rather than weaken approval, provenance, immutability, scope, or employee-visibility invariants to make a workflow pass.
- Stop before adding any model/provider, autonomous extraction, upload/parser, network, browser persistence, authentication, durable storage, employee Q&A, training, scoring, or Phase 3 behavior.
- Stop and record the exact issue if a required validation command remains environmentally blocked after two focused attempts, or if completing a criterion would require a new dependency or architecture outside this plan.
- Mark this plan complete only after every acceptance criterion passes; otherwise retain `In progress` and record the unmet criterion honestly.

## Validation results

- `npm run format` — passed; Prettier formatted the Phase 2 implementation and ignored the untracked authoritative `docs/codex-tasks/` specification so it remained unchanged.
- Focused Phase 2 validation — passed: strict typecheck plus 2 files / 39 focused domain and UI-journey tests after the final aggregate-history hardening.
- First `npm run check` — passed without a repair: formatting, lint, strict typecheck, 9 files / 138 tests, and production build.
- Final `npm run check` — passed after one proactive focused invariant-hardening pass: formatting, lint, strict typecheck, 9 files / 139 tests, and the production build all succeeded.
- Independent `npm run build` — passed against the final code; Vite transformed 75 modules and produced the static bundle.
- Local production preview — the sandbox initially denied the preview socket with `listen EPERM`; the approved local-only retry succeeded. Direct requests to `/sources`, `/interview`, `/owner`, `/review`, and `/employee` each returned HTTP 200 against the final bundle.
- Static security/scope audit — found no request APIs or external URLs, browser storage, unsafe HTML rendering, content logging, secret patterns, source content in URLs, browser APIs in the domain, UI repository bypass, new dependency, or Phase 3 implementation. `git diff --check` passed, `public/_redirects` retains the SPA fallback, and the task marker remains exact.
- Responsive inspection — component journeys and min-width/overflow CSS inspection found no evident 360px horizontal-overflow hazard. No browser executable is installed, so no pixel-level screenshot or browser-console claim is made; Vitest emitted no console warnings.

## Decisions made

- Preserve the existing `PhaseOneService`/repository/selector boundary and extend its session snapshot rather than replace it. The Phase 1 name remains for compatibility even though the record gains Phase 2 collections.
- Treat normalized line numbering as provenance addressing, not cryptographic integrity. No checksum is required for this in-memory phase.
- Use explicit topic keys and explicit conflict statuses only. Content text is never compared to infer coverage or disagreement.
- Use stored reconciled gaps plus a pure coverage projection: reconciliation creates workflow records, while the projection independently reports current evidence state without mutating storage.

## Remaining known limitations

- The application is an unauthenticated public static client. Pasted material, decisions, gaps, and answers disappear on reload and are not appropriate durable or protected company storage.
- Source identity and content are owner supplied and not authenticated, semantically interpreted, automatically extracted, or independently verified. Line anchors provide stable addressing only, not cryptographic integrity.
- The canonical catalog covers only the first Home-Service Office Manager / Dispatcher role. Deterministic templates cannot discover novel topics or interpret free-text meaning.
- There is no employee question answering, server, persistence, multi-user concurrency, file upload/parsing, model, training, scoring, or production integration.
- Pixel-level browser layout and browser-console inspection were unavailable because the environment has no installed browser executable; focused component tests and static responsive-CSS inspection passed.

## Phase completion status

Complete as of 2026-08-02. Every Phase 2 acceptance criterion passed. No Phase 3 work is authorized by this plan.
