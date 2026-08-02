# RelayOS user journeys

These are target V1 journeys unless explicitly labeled Phase 1, Phase 2, or Phase 3. They define outcomes and safety gates, not permission to implement later-phase features.

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

At the completed Phase 1–2 boundary there was no employee question box, chat, generated answer, training, or score. Proposed, extracted, rejected, missing-information, conflicting-information, and superseded claims never entered this view; source documents, gaps, interview questions, and raw answers were also withheld. Phase 3 preserves those exclusions while adding structured questions and policy-firewall outcomes.

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

## Phase 3: employee asks a structured operational question

1. The employee chooses one canonical operational topic, one request type, and one sensitivity value, then completes only the typed fields required for that request and enters the original question text.
2. The page warns against pasting passwords, payment-card values, health details, or unnecessary personal information. RelayOS retains the text but never parses it to infer topic, policy, sensitivity, conflict, authority, limits, or destination.
3. RelayOS retrieves every current approved employee-eligible claim for the explicit topic and validates exact source and approval provenance. It separately checks explicit conflicts.
4. Ten deterministic gates evaluate scope, topic, context, approved knowledge, provenance, conflict, selected sensitivity, structured authority, structured escalation rules, and supported answer mode in a fixed fail-closed precedence.
5. An informational policy/procedure lookup that passes every gate receives fixed-template approved guidance, exact citations, approval provenance, and a statement that information does not authorize action.
6. An action request receives guidance with authority only when an explicitly bound boundary permits it. Numeric limits and currencies come from typed fields, never free text.
7. A matching prohibition produces a grounded prohibited outcome. A matching approval, mandatory escalation, emergency, or sensitivity-handling rule opens or reuses an escalation with no fake gap.
8. Missing/conflicting/invalid knowledge, unsupported absent policy/procedure, or missing structured authority withholds the answer, opens an appropriate escalation, and creates or reuses an accurately categorized topic gap.
9. The result and actual question history show the safe reason, citations when applicable, escalation ID, linked gap when applicable, and next action without exposing owner-only notes, full source text, or other employees’ questions.

**Safety gate:** unapproved, rejected, conflicting, superseded, out-of-scope, source-broken, or decision-broken material cannot support an answer. Employee-selected sensitivity fails closed, and no later gate can override an earlier safety outcome.

## Phase 3: owner handles an escalation

1. The owner opens `/escalations` and sees open items first with urgency, topic, request type, safe question summary, reason, explicit destination, minimized structured context, matching rule/boundary, related gap, activity trace, and gate trace.
2. The owner may assign the escalation to a label, record a resolution summary, resolve it, and close it only through typed lifecycle transitions.
3. The owner may navigate to the related question or gap and start source/interview/review work if the operating system needs improvement.
4. Re-evaluating an already evaluated question does not duplicate its immutable evaluation, answer, open escalation, gap link, or activity sequence.
5. Resolution does not edit the question or answer, approve or create a claim, change approval history, or resolve/dismiss a gap.

**Safety gate:** an operational resolution becomes reusable company guidance only through later source-backed claim review and an explicit approval decision.

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

## Future: a deficiency becomes approved system improvement

1. The owner follows a genuine gap from its question and eligibility evaluation into source intake or the deterministic interviewer.
2. The owner supplies or identifies evidence and creates or edits an unapproved claim without rewriting the historical question outcome.
3. The normal review path applies and appends an explicit decision for the exact claim version.
4. Correct same-topic approval may resolve the gap through existing reconciliation and may support a later new question.
5. Closing the escalation alone never approves knowledge, resolves the gap, or changes the historical answer.

## Future: employee practices and independence is reviewed

1. The employee receives a scenario backed only by approved role knowledge.
2. A scenario attempt records decisions, escalation choices, and evidence used.
3. Evaluation uses inspectable rules and owner-approved expectations.
4. An independence metric is calculated from named components such as responsibility coverage, demonstrated correct handling, appropriate escalation, and recency.
5. The employee and owner can see the inputs and formula; a language model neither chooses nor emits the score.

See the [domain model](../architecture/DOMAIN_MODEL.md), [data flow](../architecture/DATA_FLOW.md), and [AI boundaries](../architecture/AI_BOUNDARIES.md).
