# RelayOS user journeys

These are target V1 journeys unless explicitly labeled Phase 1 or Phase 2. They define outcomes and safety gates, not permission to implement later-phase features.

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

There is no employee question box, chat, generated answer, training, or score in Phase 2. Proposed, extracted, rejected, missing-information, conflicting-information, and superseded claims never enter this view; source documents, gaps, interview questions, and raw answers are also withheld.

## Phase 2: owner builds exact source-backed candidates

1. The owner defines the company and role or loads the fixed fictional Summit Comfort record.
2. In the Source Library, the owner selects a constrained type, enters source metadata, pastes plain text, and saves a draft in current-session memory.
3. A nonblank draft becomes an immutable available version with stable one-based lines. A correction creates and later activates a new version without deleting the predecessor.
4. The owner selects a valid inclusive line range. RelayOS derives the exact immutable reference excerpt from that historical version.
5. The owner writes one claim, assigns its operational topic explicitly, and creates it as extracted and unapproved. RelayOS performs no semantic interpretation or automatic extraction.
6. The owner moves extracted knowledge to proposed review state, may edit candidate wording without rewriting evidence, and uses the existing approve/reject operation.
7. Approval appends a decision and may make current same-topic knowledge employee-eligible; rejection retains the claim, evidence, and decision.

**Safety gate:** no item can become employee-visible without source references and an owner approval decision.

## Phase 2: owner maps coverage and answers gaps

1. A pure projection evaluates the 16 canonical role topics using only explicit topic keys, claim lifecycles, resolvable sources, decisions, and gap records.
2. The owner sees approved, candidate, explicitly conflicting, missing, or dismissed coverage with supporting records. Coverage is not a compliance, readiness, safety, or quality score.
3. Idempotent reconciliation retains at most one active unresolved gap per scoped topic and orders questions by risk, catalog position, and checked-in template sequence.
4. The interviewer shows one deterministic question, its rationale, what it unlocks, and available explicit evidence or its absence.
5. The owner answers through the required typed control or skips with a reason. Typed values may trigger only checked-in follow-ups for discounts, after-hours, emergency, refunds, or permits.
6. Submission retains the exact immutable answer, creates an `owner-interview` source reference, and creates a same-topic proposed claim. It does not approve or silently resolve anything.
7. The owner reviews that claim through the Phase 1 decision workflow. Correct approval resolves the related gap and permits the existing selector to show the claim; rejection leaves answer and gap history intact.

**Safety gate:** a gap state, answer, dismissal, or proposed claim never affects employee visibility directly. Only the approved-knowledge selector does.

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
