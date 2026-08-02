# RelayOS domain model

This is the canonical domain vocabulary. It is not a database schema and does not authorize implementation beyond the active [execution plan](../exec-plans/README.md). Phase 1 implements the entities explicitly labeled below; the remaining entities describe later V1 boundaries. Exact types may evolve, but approval, provenance, versioning, and visibility semantics are architectural constraints.

## Shared concepts

Every record has an immutable identifier and the company/role scope, timestamps, and version fields relevant to that record. Phase 1 operates with exactly one company and one Home-Service Office Manager / Dispatcher role, but it validates explicit IDs to prevent cross-scope relationships.

Phase 1 `KnowledgeClaim.lifecycleStatus` is one of `extracted`, `proposed`, `approved`, `rejected`, `missing-information`, `conflicting-information`, or `superseded`. `provenance` records how the statement arose and never implies approval. Only the domain service may make lifecycle transitions; invalid transitions return a typed domain error. Approval requires source references plus a separately appended `ApprovalDecision`.

The permitted lifecycle graph is deliberately small:

- direct resolution may move `extracted`, `missing-information`, or `conflicting-information` to `proposed`;
- evidence review may move `proposed` to `missing-information` or `conflicting-information`;
- an explicit rejection decision may move `extracted`, `proposed`, `missing-information`, or `conflicting-information` to `rejected`;
- an explicit source-backed approval decision may move only `proposed` to `approved`; and
- `superseded` is reachable only when approval of a revision succeeds.

There are no generic transitions out of `approved`, `rejected`, or `superseded`. A rejected revision leaves the prior approved version current.

Approved claims are immutable versions. A revision creates a new claim with an incremented `version` and `supersedesClaimId` pointing to the prior approved claim. The prior claim remains approved and current until the revision is successfully approved; that workflow then marks the prior version `superseded`. Rejection preserves the candidate, evidence, and decision but excludes it from employee visibility.

The required distinctions are structural:

- **Source material:** Phase 1 uses manually entered immutable `SourceReference` metadata. `SourceDocument` content and ingestion remain future work.
- **Extracted claims:** `KnowledgeClaim` with extracted origin and an unapproved initial state.
- **Generated proposals:** `ImprovementProposal` with generation metadata and evidence links.
- **Owner-approved knowledge:** an approved revision plus its sources and approval decisions.
- **Rejected knowledge:** a retained rejected revision plus its rejection decision.
- **Missing information:** `KnowledgeGap.reason = missing_evidence`.
- **Conflicting information:** linked claims/references plus `KnowledgeGap.reason = conflicting_evidence`.

Other mandatory escalation reasons include sensitive evidence, evidence below a configured confidence threshold, and action outside authority. A confidence value never bypasses an approval requirement.

## Organization and identity

### Company (Phase 1)

- **Purpose:** Owns the operational knowledge and defines its business context.
- **Important fields:** `id`, `name`, `industry`, `serviceArea`, contact phone and email, `operatingTimezone`, `createdAt`, `updatedAt`.
- **Relationships:** Owns the single Phase 1 role and scopes knowledge claims. The repository accepts only one company.
- **Lifecycle:** Phase 1 creates or replaces the session draft through setup; durable archival is future work.
- **Provenance:** Owner-entered company metadata is operational context, not source evidence. Timestamps identify the in-session record but are not a durable audit log.

### Role (Phase 1)

- **Purpose:** Defines the operational job being transferred.
- **Important fields:** `id`, `companyId`, `title`, `mission`, status (`draft`, `active`, or `retired`), `responsibilities`, `authorityBoundaries`, `escalationRules`, `createdAt`, `updatedAt`.
- **Relationships:** Must belong to the active company. Its nested role-system records must all carry this role’s ID. Phase 1 supports only one role, canonically Home-Service Office Manager / Dispatcher.
- **Lifecycle:** Setup prepares a draft and activates it only after the complete role definition passes domain validation; later retirement is not implemented.
- **Provenance:** Owner-entered role metadata and composition are not automatically employee-visible policy. Any later use as published guidance must pass the source-backed knowledge approval boundary.

### User

- **Purpose:** Represents an owner or employee acting in RelayOS.
- **Important fields:** `id`, `companyId`, `roleType`, `displayName`, `status`; planned lifecycle is `invited -> active -> disabled`.
- **Relationships:** Owners author decisions; employees ask questions and make scenario attempts. Authentication is a later concern.
- **Provenance:** Identity metadata is not knowledge; authored actions retain `userId` and timestamp in append-only history.

## Evidence and approved knowledge

### SourceDocument (future)

- **Purpose:** Represents supplied source material, such as an owner-authored note, interview record, manual, or policy.
- **Important fields:** `id`, scope, `title`, `mediaType`, content locator/integrity hash, `status`; planned lifecycle is `registered -> available -> superseded|withdrawn`.
- **Relationships:** Contains source references and supports claims or knowledge revisions; content storage remains unchosen.
- **Provenance:** Records origin, supplier, capture time, integrity metadata, and supersession chain; withdrawal never deletes historical references.

### SourceReference (Phase 1 metadata only)

- **Purpose:** Records owner-entered metadata locating the evidence for a claim without uploading or storing source content.
- **Important fields:** `id`, `sourceTitle`, constrained `sourceType`, `sourceLocator`, optional `excerpt`, `recordedAt`.
- **Relationships:** Claim source-reference IDs must resolve to repository records. Later entities may cite the same atomic evidence record.
- **Lifecycle:** Immutable after creation in Phase 1; correcting metadata requires a new reference.
- **Provenance:** The locator and optional excerpt are retained with approved claim versions. RelayOS does not fetch, authenticate, hash, or independently verify the referenced source in this phase.

### KnowledgeClaim (Phase 1)

- **Purpose:** Captures one scoped operational assertion for deterministic owner review.
- **Important fields:** `id`, `companyId`, `roleId`, `statement`, `category`, `provenance`, `lifecycleStatus`, `sourceReferenceIds`, `createdAt`, `updatedAt`, `version`, and optional `supersedesClaimId`.
- **Relationships:** Must match the active company and role, and every cited source-reference ID must resolve. A revision points to the approved version it revises.
- **Lifecycle:** Uses the seven explicit statuses listed under shared concepts. Only an explicit domain operation may approve, reject, revise, or supersede; approved content cannot be edited in place.
- **Provenance:** Approval requires at least one valid source reference and an explicit `approve` decision for the exact claim version. Missing/conflicting classifications remain visible to the owner but never to the employee selector.

### Procedure

- **Purpose:** Defines an ordered operational outcome and when the employee should perform it.
- **Important fields:** `title`, `purpose`, trigger, expected outcome, revision, review state; lifecycle follows knowledge revision states.
- **Relationships:** Contains ordered procedure steps; may fulfill responsibilities and invoke decision or escalation rules.
- **Provenance:** Every approved revision cites supporting claims/references and its complete approval history.

### ProcedureStep

- **Purpose:** Defines one observable action or decision within a procedure.
- **Important fields:** `procedureId`, order, instruction, expected result, linked rule/boundary; immutable within a procedure revision.
- **Relationships:** Belongs to one procedure revision and may reference decision rules, authority boundaries, or escalation rules.
- **Provenance:** Each substantive instruction cites evidence; employee visibility also requires the parent procedure revision to be approved.

### DecisionRule

- **Purpose:** Maps explicit conditions to an operational outcome.
- **Important fields:** conditions, outcome, exceptions, priority, revision, review state; lifecycle follows knowledge revision states.
- **Relationships:** Used by procedures, answers, scenarios, and escalations; may be constrained by authority boundaries.
- **Provenance:** Approved rules require source references, supporting claims, and approval decisions; inferred conditions remain unapproved.

### AuthorityBoundary (Phase 1 role definition)

- **Purpose:** States what the employee may decide or do and where owner involvement begins.
- **Important fields:** `id`, `roleId`, `subject`, constrained `permissionLevel`, `limitOrConstraint`, `escalationDestination`, and optional `notes`. Permission is `may-decide`, `may-act-within-limit`, `must-request-approval`, `must-escalate`, or `prohibited`.
- **Relationships:** Must belong to the active role; later procedures, answers, responsibilities, and training scenarios may be constrained by it.
- **Lifecycle:** Created and edited during the Phase 1 role setup session; publishing versioned boundaries is future work.
- **Provenance:** Phase 1 treats it as explicitly owner-entered role context, not approved employee-visible knowledge. Ambiguous guidance still cannot bypass claim review or escalation rules.

### EscalationRule (Phase 1 role definition)

- **Purpose:** Defines when, why, and to whom work must be escalated.
- **Important fields:** `id`, `roleId`, `trigger`, `destination`, constrained `urgency`, `requiredContext`, `expectedResponse`.
- **Relationships:** Must belong to the active role. Future questions, procedure steps, authority boundaries, and scenarios may evaluate it; Phase 1 does not create an `Escalation`.
- **Lifecycle:** Created and edited during the Phase 1 role setup session; published rule revisions are future work.
- **Provenance:** Phase 1 records an explicit owner-authored rule definition, not source-backed employee-visible knowledge. A later published rule must retain sources and approval decisions.

## Operational loop

### EmployeeQuestion

- **Purpose:** Records an employee’s request for operational guidance.
- **Important fields:** text, employee, role scope, submitted time, sensitivity flags, status; lifecycle is `received -> answered|escalated -> closed`.
- **Relationships:** May produce an answer, escalation, knowledge gap, and activity events.
- **Provenance:** The original question and later edits are retained as user input; it is context, not approved knowledge.

### Answer

- **Purpose:** Records a response grounded in approved company knowledge or records that an answer was withheld.
- **Important fields:** response text, cited knowledge revisions, generation/origin label, eligibility result, status; lifecycle is `draft -> delivered|withheld|escalated`.
- **Relationships:** Belongs to a question and may trigger an escalation or gap.
- **Provenance:** Every substantive delivered statement traces to approved revisions and their source references; generated wording remains labeled generated and never becomes policy.

### Escalation

- **Purpose:** Routes a question or action to an authorized person when RelayOS cannot safely answer.
- **Important fields:** reason, urgency, context, assignee, status, resolution; lifecycle is `open -> assigned -> resolved -> closed`.
- **Relationships:** Links the triggering question, rules/boundaries checked, evidence inspected, gap, and any later proposal.
- **Provenance:** Retains the exact evidence condition and source/knowledge references checked; a resolution is not knowledge approval.

### KnowledgeGap

- **Purpose:** Makes absent, conflicting, sensitive, low-confidence, or out-of-authority information actionable.
- **Important fields:** reason, description, scope, impact, status; lifecycle is `open -> proposed -> resolved|dismissed`.
- **Relationships:** Originates from questions, escalations, attempts, or source review and may lead to improvement proposals.
- **Provenance:** Links triggering records and all available evidence; missing evidence is stated explicitly rather than backfilled with inference.

### ImprovementProposal

- **Purpose:** Suggests a traceable change to role knowledge without changing policy by itself.
- **Important fields:** target type/revision, proposed change, rationale, origin, generation metadata, review state; lifecycle is `draft -> pending_review -> approved|rejected|needs_changes -> superseded`.
- **Relationships:** May address gaps and create a new knowledge revision after an approval decision.
- **Provenance:** Requires linked source references or an explicit missing-evidence flag; preserves generated/inferred origin after review. Approval does not mutate it into an employee-visible item.

### ApprovalDecision (Phase 1)

- **Purpose:** Records an owner-labeled decision about one exact immutable claim version.
- **Important fields:** `id`, `claimId`, decision (`approve` or `reject`), `actorLabel`, `reason`, `decidedAt`, `claimVersion`.
- **Relationships:** Belongs to the target claim’s complete decision history and records the version reviewed.
- **Lifecycle:** Append-only. Phase 1 exposes no update or delete operation; a later correction requires another decision against an eligible target/version or a new claim revision.
- **Provenance:** Is itself approval provenance. Approval is invalid without this separate record and at least one source reference.

## Role transfer and measurement

### TrainingScenario

- **Purpose:** Lets an employee practice a realistic role situation against approved expectations.
- **Important fields:** prompt, expected decisions, scoring rubric, difficulty, revision, review state; lifecycle is `draft -> approved|rejected -> retired`.
- **Relationships:** Covers responsibilities, rules, procedures, and boundaries and has scenario attempts.
- **Provenance:** Employee-visible scenarios and rubrics cite approved knowledge revisions; generated drafts stay unapproved until owner review.

### ScenarioAttempt

- **Purpose:** Records how an employee handled one training scenario.
- **Important fields:** scenario revision, employee, response/actions, escalation choice, timestamps, evaluation components; lifecycle is `in_progress -> submitted -> evaluated|voided`.
- **Relationships:** Belongs to a scenario and user; may reveal a gap and contribute a visible metric component.
- **Provenance:** Retains the exact scenario/rubric revision and deterministic evaluation inputs; model commentary cannot set a score.

### Responsibility (Phase 1 role definition)

- **Purpose:** Defines one accountable outcome within the transferred role.
- **Important fields:** `id`, `roleId`, `title`, `expectedOutcome`, `frequency`, `completionEvidence`, and active status.
- **Relationships:** Must belong to the active role; later it may group procedures, rules, scenarios, events, and metric components.
- **Lifecycle:** Created, edited, or removed before Phase 1 setup completion; active status distinguishes current role responsibilities. Versioned publication/retirement is future work.
- **Provenance:** Phase 1 records explicit owner input as role-definition context. It is not eligible as employee knowledge unless represented by a separately source-backed approved knowledge item.

### IndependenceMetric

- **Purpose:** Provides an inspectable snapshot of how independently the employee can carry a role or responsibility.
- **Important fields:** scope, `asOf`, formula version, named component values, weights, result; immutable snapshots may be superseded by later calculations.
- **Relationships:** Derives from approved responsibility coverage, scenario attempts, operational events, and appropriate escalations.
- **Provenance:** Links every input record and formula version. It is deterministically calculated and never generated, adjusted, or guessed by a language model.

### ActivityEvent

- **Purpose:** Provides an append-only audit record of meaningful domain activity.
- **Important fields:** event type, actor, occurred time, entity ID/revision, correlation ID, safe metadata; it is append-only.
- **Relationships:** Can reference any entity and connect a question-to-approval trace.
- **Provenance:** It records who/what/when but is not policy evidence by itself; events about evidence or publication link the applicable sources and decisions.

## Required visibility predicate

In Phase 1, a claim may appear on the employee route only when its exact version is `approved`, it matches the active company and role, every cited source reference resolves, its explicit approval decision is present, and no successfully approved revision has superseded it. `extracted`, `proposed`, `rejected`, `missing-information`, `conflicting-information`, and `superseded` claims are always excluded.

A future answer may use only claims that pass this selector plus the not-yet-implemented sensitivity, confidence, authority, and escalation gates. All conditions fail closed. Phase 1 demonstrates retrieval eligibility only; it does not accept questions or generate answers.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [data flow](DATA_FLOW.md).
