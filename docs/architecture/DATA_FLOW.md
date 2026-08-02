# RelayOS data flow

This document separates the Phase 2 implementation from planned V1 flows. Entity definitions live in the [domain model](DOMAIN_MODEL.md); there is still no persistence, file-ingestion, employee-question, or model pipeline.

## Phase 2 session boundary

```text
browser request -> Cloudflare Pages static asset / SPA fallback
                -> React Router -> Phase 2 route

one React context
  -> one in-memory repository for the page session
  -> existing domain service validates every scoped write and lifecycle operation
  -> defensive repository reads
```

In-app navigation retains the same repository instance. Reloading or closing the page discards every record. There is no browser storage, external request, API, server, identity, model call, source upload, or durable event stream.

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

The selector also verifies active company/role scope, resolvable sources, and decision provenance. Missing, conflicting, extracted, proposed, rejected, and superseded records remain owner-visible where useful but employee-invisible. Phase 1 stops at eligible knowledge display; it does not accept a question or create an answer.

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

## Future employee question flow (not Phase 2)

1. Store the `EmployeeQuestion` in company and role scope.
2. Retrieve candidate knowledge with a hard approved/current/scope filter.
3. Evaluate provenance completeness, evidence conflicts, sensitivity, configured confidence threshold, authority boundaries, and escalation rules.
4. If every check passes, create an `Answer` grounded only in the eligible approved revisions, with citations and a generated/non-policy label where applicable.
5. If any check fails, withhold the answer and create an `Escalation` plus a categorized `KnowledgeGap`.
6. Append `ActivityEvent` records that connect the question, evidence set, decision path, and outcome without leaking sensitive content into logs.

Retrieval is fail-closed: filtering after generation is insufficient because unapproved material must not enter the answer context.

## Future employee-signal gap-to-improvement flow (not Phase 2)

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

## Future training and measurement flow (not Phase 2)

Only approved knowledge can support an employee-visible `TrainingScenario`. A `ScenarioAttempt` retains the exact scenario and rubric revision. Deterministic evaluation components may feed an `IndependenceMetric` together with approved responsibility coverage and appropriate-escalation events. Each metric snapshot stores its formula version and linked inputs; no model produces the score.

## Trust and audit boundaries

- Browser input, source content, and model output are untrusted.
- Domain policies decide visibility, escalation, and publication.
- A later server layer must authorize every read/write and mediate the future `ModelGateway`.
- Approval decisions and meaningful activity events append; corrections create new records or revisions.
- Source documents may be superseded or withdrawn, but historical locators and decisions remain addressable according to retention policy.
- Demo adapters use fixed local data and the same domain gates, never production credentials.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [Security](SECURITY.md).
