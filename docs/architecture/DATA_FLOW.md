# RelayOS data flow

This document separates the Phase 1 implementation from planned V1 flows. Entity definitions live in the [domain model](DOMAIN_MODEL.md); no persistence, ingestion, employee-question, or model pipeline exists yet.

## Phase 1 session boundary

```text
browser request -> Cloudflare Pages static asset / SPA fallback
                -> React Router -> Phase 1 route

one React context
  -> one in-memory repository for the page session
  -> domain service validates every scoped write and lifecycle operation
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

## Future source-ingestion flow

```text
SourceDocument
  -> immutable SourceReferences
  -> extracted KnowledgeClaims (unapproved)
  -> candidate Procedure / DecisionRule / Boundary / Responsibility
  -> owner ApprovalDecision
  -> approved immutable revision
  -> employee retrieval eligibility
```

Extraction and generation never skip review. Each transition preserves scope, origin, source references, revision IDs, and activity events. Rejected revisions remain traceable and unavailable to employee retrieval. Missing evidence creates a gap; competing evidence retains both claims/references and creates a conflict gap.

## Future employee question flow (not Phase 1)

1. Store the `EmployeeQuestion` in company and role scope.
2. Retrieve candidate knowledge with a hard approved/current/scope filter.
3. Evaluate provenance completeness, evidence conflicts, sensitivity, configured confidence threshold, authority boundaries, and escalation rules.
4. If every check passes, create an `Answer` grounded only in the eligible approved revisions, with citations and a generated/non-policy label where applicable.
5. If any check fails, withhold the answer and create an `Escalation` plus a categorized `KnowledgeGap`.
6. Append `ActivityEvent` records that connect the question, evidence set, decision path, and outcome without leaking sensitive content into logs.

Retrieval is fail-closed: filtering after generation is insufficient because unapproved material must not enter the answer context.

## Future gap-to-improvement flow (not Phase 1)

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

## Future training and measurement flow (not Phase 1)

Only approved knowledge can support an employee-visible `TrainingScenario`. A `ScenarioAttempt` retains the exact scenario and rubric revision. Deterministic evaluation components may feed an `IndependenceMetric` together with approved responsibility coverage and appropriate-escalation events. Each metric snapshot stores its formula version and linked inputs; no model produces the score.

## Trust and audit boundaries

- Browser input, source content, and model output are untrusted.
- Domain policies decide visibility, escalation, and publication.
- A later server layer must authorize every read/write and mediate the future `ModelGateway`.
- Approval decisions and meaningful activity events append; corrections create new records or revisions.
- Source documents may be superseded or withdrawn, but historical locators and decisions remain addressable according to retention policy.
- Demo adapters use fixed local data and the same domain gates, never production credentials.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [Security](SECURITY.md).
