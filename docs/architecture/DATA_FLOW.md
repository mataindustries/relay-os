# RelayOS data flow

This document separates the Phase 4 implementation from later V1 flows. Entity definitions live in the [domain model](DOMAIN_MODEL.md); there is still no persistence, file-ingestion, model, semantic-retrieval, identity, or messaging pipeline.

## Phase 4 session boundary

```text
browser request -> Cloudflare Pages static asset / SPA fallback
                -> React Router -> Phase 4 route

one React context
  -> one in-memory repository for the page session
  -> existing domain service validates every Phase 0-4 scoped write and lifecycle operation
  -> defensive repository reads
```

In-app navigation retains the same repository instance. Reloading or closing the page discards every source, question, answer, escalation, gap, decision, and activity event. There is no browser storage, external request, API, server, identity, model call, source upload, messaging, or durable event stream.

## Phase 1 company-and-role flow

```text
setup draft
  -> validate company fields and create the only Company
  -> validate Role.companyId against that Company
  -> validate Responsibility / AuthorityBoundary / EscalationRule role IDs
  -> review complete role system
  -> activate the one Role
```

The application UI calls domain/repository operations instead of publishing raw array mutations. Invalid ownership, missing required content, or invalid constrained values produce typed domain errors and cannot yield setup completion.

## Phase 1 manual knowledge flow

```text
manual SourceReference metadata
  -> scoped KnowledgeClaim in an unapproved lifecycle state
  -> owner review
  -> append explicit ApprovalDecision
  -> approved immutable version OR retained rejected version
  -> approved revision atomically supersedes its prior approved version
  -> employee selector returns approved + current + nonsuperseded only
```

The selector also verifies active company/role scope, resolvable sources, and decision provenance. Missing, conflicting, extracted, proposed, rejected, and superseded records remain owner-visible where useful but employee-invisible. Phase 3 reuses this unchanged selector as the first retrieval boundary.

The fixed Summit Comfort Heating & Air fixture passes through the same repository and domain policies. Its stable IDs make repeated loading in one session idempotent.

## Phase 2 manual source flow

```text
owner pastes plain text in browser memory
  -> SourceDocument draft
  -> activate immutable numbered version
  -> owner selects exact inclusive lines
  -> derived immutable SourceReference excerpt
  -> owner assigns a canonical topic and writes an extracted KnowledgeClaim
  -> extracted/proposed and employee-invisible
  -> existing owner ApprovalDecision operation
  -> approved current claim OR retained rejection
  -> employee selector eligibility only after approval
```

There is no automatic extraction or interpretation. An available document cannot be edited; a correction creates a new draft version, and activation supersedes without deleting the predecessor or rewriting its references. Existing Phase 1 metadata-only references remain valid.

## Phase 2 coverage and interview flow

```text
canonical topic catalog + explicit claim.topicKey
  -> pure coverage projection: approved | candidate | conflicting | missing | dismissed
  -> idempotent scoped KnowledgeGap reconciliation
  -> deterministic risk/topic/template question queue
  -> one active InterviewQuestion
  -> exact immutable InterviewAnswer
  -> owner-interview SourceReference
  -> same-topic proposed KnowledgeClaim (unapproved)
  -> existing owner decision
  -> correct approval resolves gap and becomes selector-eligible
     rejection retains answer/claim/decision and leaves gap unresolved
```

Coverage does not compare free text. A conflict must already be explicit through claim lifecycle data. Question follow-ups depend only on typed values and checked-in rules. Gap status never controls employee visibility; the Phase 1 claim selector remains the read boundary.

## Phase 3 employee question and policy-firewall flow

```text
explicit topic + request type + sensitivity + typed context + question text
  -> validate active scope and discriminated context
  -> append immutable EmployeeQuestion and question-received event
  -> retrieve current employee-visible approved claims by explicit topic
  -> validate exact sources and exact-version approval decisions
  -> scan explicit same-topic conflict records
  -> evaluate selected sensitivity
  -> match explicit structured authority boundaries
  -> match explicit structured escalation rules
  -> verify supported answer mode
  -> append immutable AnswerEligibilityEvaluation
  -> append fixed-template cited Answer OR prohibited / withheld / escalated Answer
  -> create or reuse one open Escalation when human action is required
  -> create or reuse and link a KnowledgeGap only for a genuine deficiency
  -> append safe correlated ActivityEvents
```

All ten gate records are persisted in fixed order even when an earlier safety condition controls the result. Outcome precedence is invalid scope/topic/context; employee-selected sensitivity; explicit prohibition; mandatory escalation/approval; missing/conflicting/invalid knowledge; unclear structured authority; then eligible answer. Question and source wording is never searched, compared, or parsed for topic, sensitivity, policy, conflicts, limits, authority, or routing. Numeric limits and currencies are typed values.

Retrieval is fail-closed and happens before composition. Only an eligible result enters fixed templates, every substantive statement cites the admitted claims/sources/decisions, and informational guidance explicitly grants no action authority. A matching prohibited boundary grounds a prohibited result. Known approval, escalation, emergency, or sensitivity-handling rules open or reuse an escalation without a fake gap. Missing/conflicting/invalid knowledge, unsupported absent policy/procedure, or absent structured authority can create/reuse and link a genuine topic gap.

Re-entering evaluation for the same evaluated question returns the existing immutable records and appends nothing. Corrections create a new linked question.

## Phase 3 owner escalation flow

```text
open Escalation
  -> optional assignment label + escalation-assigned event
  -> resolution summary + resolved actor + escalation-resolved event
  -> close only after resolution + escalation-closed event
```

Destination comes only from a matching structured boundary/rule or an explicitly configured owner fallback. Required context comes from typed fields and is minimized; raw sensitive question text is not copied into events or routing metadata. Resolution does not create or approve a claim, mutate approval history, edit the question/answer, or resolve/dismiss a related gap. Approved-knowledge reconciliation resolves a question-linked gap only after the gates relevant to its original deficiency pass; another same-topic claim cannot erase a continuing conflict, provenance, unsupported-mode, or authority problem. If a resolution should become reusable guidance, the owner starts the existing source/interview/review flow.

## Phase 4 pilot, report, manual, and handoff flow

```text
public /pilot
  -> static offer + limitations + validated public booking/email action
  -> /demo
  -> load fixed fictional Summit Comfort seed only when session is empty
  -> reuse the exact fixture when already active
  -> fail closed without rendering when a non-demo company is active

current defensive snapshot
  -> pure actual-count / approved-guidance / priority projections
  -> six-step fictional demo summary OR print report OR approved-only manual
  -> allowlisted handoff JSON
     -> source metadata only by default
     -> source text only after option + separate confirmation
     -> browser download; no repository write and no import
```

The fictional reset operation validates both current and replacement scope against the fixed Summit Comfort IDs before atomically replacing the in-memory snapshot. It cannot reset or overwrite another company. Report and manual dates receive the application clock; business recommendations are restricted to open critical/high gaps and actual unresolved records. Manual substantive guidance is selected through the existing employee-visible approved-knowledge boundary, while structured authority/escalation definitions and owner-facing gaps are presented separately.

The export is an explicit allowlist, not a redacted serialization of repository internals. Default output omits source content and line text, reference excerpts, raw question text, free-text question context, employee labels, raw escalation resolution text, environment values, and browser implementation state. Selecting source-text inclusion adds only the documented source fields and never adds raw question values. The download does not change application state or provide durability inside RelayOS.

## Future employee-signal gap-to-improvement flow (not Phase 3)

```text
Question / Escalation / ScenarioAttempt
  -> KnowledgeGap with evidence condition
  -> ImprovementProposal with sources and generated origin
  -> owner review
  -> append-only ApprovalDecision
  -> new approved revision or retained rejection
  -> later questions can retrieve only the approved revision
```

Resolving or closing an escalation does not approve knowledge. Approving a proposal does not mutate its provenance; publication produces or activates a distinct knowledge revision after all source and approval requirements pass.

## Future training and measurement flow (not Phase 3)

Only approved knowledge can support an employee-visible `TrainingScenario`. A `ScenarioAttempt` retains the exact scenario and rubric revision. Deterministic evaluation components may feed an `IndependenceMetric` together with approved responsibility coverage and appropriate-escalation events. Each metric snapshot stores its formula version and linked inputs; no model produces the score.

## Trust and audit boundaries

- Browser input, source content, and model output are untrusted.
- Domain policies decide visibility, escalation, and publication.
- A later server layer must authorize every read/write and mediate the future `ModelGateway`.
- Approval decisions and meaningful activity events append; corrections create new records or revisions.
- Phase 3 activity metadata is safe traceability data, not policy evidence or analytics, and excludes raw sensitive question/source content; Phase 4 exports only a safe allowlisted projection.
- Source documents may be superseded or withdrawn, but historical locators and decisions remain addressable according to retention policy.
- Demo adapters use fixed local data and the same domain gates, never production credentials; public demo rendering and reset reject non-demo scope.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [Security](SECURITY.md).
