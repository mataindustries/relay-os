# RelayOS user journeys

These are target V1 journeys unless explicitly labeled Phase 1. They define outcomes and safety gates, not permission to implement later-phase features.

## Phase 1: owner establishes the role system

1. The owner is told that Phase 1 records last only for the current page session.
2. The owner defines the company and its single Home-Service Office Manager / Dispatcher role.
3. The owner adds responsibilities, authority boundaries, and escalation rules, correcting inline validation errors as needed.
4. The owner reviews the complete role definition before activating it.
5. RelayOS rejects completion when company/role ownership or required role-system information is invalid.

The owner may instead load the fixed fictional Summit Comfort Heating & Air record. Loading it repeatedly in one session produces the same single record set rather than duplicates.

## Phase 1: owner reviews manually entered knowledge

1. The owner manually records source title, type, locator, optional excerpt, and capture time; no content is uploaded.
2. The owner creates a scoped knowledge claim with explicit provenance and lifecycle state.
3. The owner inspects the source metadata and records an approval or rejection reason.
4. Approval succeeds only for a source-backed claim with an explicit decision and appends that immutable decision to history.
5. Revising approved knowledge creates a new claim version; only successful approval of that revision supersedes the previous approved version.

**Safety gate:** no claim can become employee-visible without a valid source, an explicit approval decision, and a current nonsuperseded approved version.

## Phase 1: employee inspects eligible knowledge

1. The employee route shows the active role identity.
2. It requests knowledge through the approved employee-visible selector.
3. The selector returns only approved, current, nonsuperseded claims in the active company and role scope.
4. If none qualify, the route explains that no approved knowledge is available.

There is no question box, chat, generated answer, training, or score in this phase. Proposed, extracted, rejected, missing-information, conflicting-information, and superseded claims never enter this view.

## Future: source-assisted role-system development

1. The owner defines the company and the Home-Service Office Manager / Dispatcher role.
2. The owner records responsibilities, authority boundaries, escalation rules, and source material.
3. RelayOS extracts claims and drafts procedures or decision rules as unapproved candidates with source references.
4. The owner inspects evidence and approves, rejects, or requests changes.
5. Approval appends a decision and publishes a traceable approved revision; rejection remains visible in history but unavailable to employee retrieval.

**Safety gate:** no item can become employee-visible without source references and an owner approval decision.

## Future: employee asks an operational question

1. The employee submits a question within the supported role.
2. RelayOS retrieves only approved knowledge scoped to the company and role.
3. Deterministic checks evaluate evidence coverage, conflicts, sensitivity, confidence, authority, and escalation rules.
4. If eligible, RelayOS returns a grounded answer with citations and a clear generated/non-policy label.
5. Otherwise, it creates an escalation and a knowledge gap instead of guessing.

**Safety gate:** unapproved or rejected knowledge cannot support an employee-visible answer, even when it appears relevant.

## Future: work improves the system

```text
employee question
-> retrieve approved company knowledge
-> answer or escalate
-> identify a knowledge gap
-> draft a proposed system improvement
-> owner reviews it
-> approved knowledge becomes available in the future
```

The gap keeps its triggering question, escalation, and evidence condition. A proposal keeps its sources and generated origin. Owner approval creates or supersedes a knowledge revision; it does not mutate the proposal into a different provenance category.

## Future: owner resolves missing or conflicting information

1. The owner opens an escalation with its question, attempted evidence, and authority context.
2. RelayOS labels the condition as missing, conflicting, sensitive, low-confidence, or out-of-authority.
3. The owner supplies or identifies source material and chooses the operational resolution.
4. RelayOS drafts a linked improvement proposal.
5. The normal review path applies; closing the escalation alone does not approve knowledge.

## Future: employee practices and independence is reviewed

1. The employee receives a scenario backed only by approved role knowledge.
2. A scenario attempt records decisions, escalation choices, and evidence used.
3. Evaluation uses inspectable rules and owner-approved expectations.
4. An independence metric is calculated from named components such as responsibility coverage, demonstrated correct handling, appropriate escalation, and recency.
5. The employee and owner can see the inputs and formula; a language model neither chooses nor emits the score.

See the [domain model](../architecture/DOMAIN_MODEL.md), [data flow](../architecture/DATA_FLOW.md), and [AI boundaries](../architecture/AI_BOUNDARIES.md).
