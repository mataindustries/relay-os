# RelayOS domain model

This is the canonical future domain vocabulary. It is not a database schema and does not authorize implementation beyond the active [execution plan](../exec-plans/README.md). Exact types may evolve, but the approval, provenance, and visibility semantics are architectural constraints.

## Shared concepts

Every record has an immutable identifier and relevant `companyId`, `roleId`, creation time, and revision identifier. The first version operates with one company and one Home-Service Office Manager / Dispatcher role, but explicit scope prevents accidental cross-role retrieval later.

Knowledge revisions use `pending_review`, `approved`, `rejected`, or `superseded` where applicable. State is derived from immutable revisions and append-only `ApprovalDecision` records; an origin such as `source_extracted`, `owner_authored`, or `generated` never changes. Publishing requires a source-provenance chain and owner approval. Rejection preserves the revision and evidence but excludes it from employee retrieval.

The required distinctions are structural:

- **Source material:** `SourceDocument` plus immutable `SourceReference` locators.
- **Extracted claims:** `KnowledgeClaim` with extracted origin and an unapproved initial state.
- **Generated proposals:** `ImprovementProposal` with generation metadata and evidence links.
- **Owner-approved knowledge:** an approved revision plus its sources and approval decisions.
- **Rejected knowledge:** a retained rejected revision plus its rejection decision.
- **Missing information:** `KnowledgeGap.reason = missing_evidence`.
- **Conflicting information:** linked claims/references plus `KnowledgeGap.reason = conflicting_evidence`.

Other mandatory escalation reasons include sensitive evidence, evidence below a configured confidence threshold, and action outside authority. A confidence value never bypasses an approval requirement.

## Organization and identity

### Company

- **Purpose:** Owns the operational knowledge and defines its business context.
- **Important fields:** `id`, `name`, `status`; lifecycle is `active -> archived`.
- **Relationships:** Has roles, users, sources, and activity events; V1 has exactly one active company.
- **Provenance:** Company metadata is not policy evidence; changes require actor/time audit events.

### Role

- **Purpose:** Defines the operational job being transferred.
- **Important fields:** `id`, `companyId`, `name`, `description`, `status`; lifecycle is `draft -> active -> retired`.
- **Relationships:** Owns responsibilities, knowledge, questions, training, and metrics; V1 has one Home-Service Office Manager / Dispatcher role.
- **Provenance:** Role policy fields require source references and approval; display metadata requires an audit trail.

### User

- **Purpose:** Represents an owner or employee acting in RelayOS.
- **Important fields:** `id`, `companyId`, `roleType`, `displayName`, `status`; planned lifecycle is `invited -> active -> disabled`.
- **Relationships:** Owners author decisions; employees ask questions and make scenario attempts. Authentication is a later concern.
- **Provenance:** Identity metadata is not knowledge; authored actions retain `userId` and timestamp in append-only history.

## Evidence and approved knowledge

### SourceDocument

- **Purpose:** Represents supplied source material, such as an owner-authored note, interview record, manual, or policy.
- **Important fields:** `id`, scope, `title`, `mediaType`, content locator/integrity hash, `status`; lifecycle is `registered -> available -> superseded|withdrawn`.
- **Relationships:** Contains source references and supports claims or knowledge revisions; content storage is not chosen in Phase 0.
- **Provenance:** Records origin, supplier, capture time, integrity metadata, and supersession chain; withdrawal never deletes historical references.

### SourceReference

- **Purpose:** Locates the exact passage, page, timestamp, or structured fragment used as evidence.
- **Important fields:** `id`, `sourceDocumentId`, stable locator, excerpt/hash, captured revision; it is immutable.
- **Relationships:** Supports claims, procedures, rules, boundaries, proposals, answers, and scenarios.
- **Provenance:** Is the atomic provenance record; it must remain resolvable to the cited document revision even after supersession.

### KnowledgeClaim

- **Purpose:** Captures one testable operational assertion extracted or authored from source material.
- **Important fields:** `statement`, `origin`, `confidence`, `evidenceCondition`, revision, review state; lifecycle is `pending_review -> approved|rejected -> superseded`.
- **Relationships:** Cites source references; can support procedures, rules, boundaries, gaps, and proposals.
- **Provenance:** Requires at least one source reference to be approved; conflicts link all competing claims/references and open a gap.

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

### AuthorityBoundary

- **Purpose:** States what the employee may decide or do without owner authorization.
- **Important fields:** action category, allowed/forbidden scope, monetary or risk limits, exceptions, revision, review state.
- **Relationships:** Constrains procedures, decision rules, answers, responsibilities, and training scenarios.
- **Provenance:** Approved boundaries require explicit source evidence and owner approval; ambiguity always escalates.

### EscalationRule

- **Purpose:** Defines when, why, and to whom work must be escalated.
- **Important fields:** trigger, urgency, destination, required context, revision, review state.
- **Relationships:** Evaluated for questions, procedure steps, authority boundaries, and scenarios; creates escalations.
- **Provenance:** Approved rules cite source evidence and approval decisions; defaults may be safety fallbacks but cannot claim to be company policy.

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

### ApprovalDecision

- **Purpose:** Records an owner’s decision about a specific immutable revision or proposal.
- **Important fields:** target ID/revision, decision (`approve`, `reject`, `request_changes`), rationale, owner user, timestamp; immutable after append.
- **Relationships:** Belongs to the target’s approval history; later corrections append a new decision and normally a new target revision.
- **Provenance:** Is itself the approval provenance; it links the evidence snapshot reviewed and cannot be edited or deleted.

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

### Responsibility

- **Purpose:** Defines one accountable outcome within the transferred role.
- **Important fields:** name, outcome, frequency/trigger, acceptance criteria, revision, review state; lifecycle is `draft -> approved|rejected -> retired`.
- **Relationships:** Groups procedures, rules, boundaries, scenarios, events, and independence components.
- **Provenance:** Approved responsibilities cite source references and approval history; inferred responsibilities remain candidates.

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

An item may support an employee-visible answer only when its exact revision is approved, its source references and approval history are present, it matches company and role scope, it is not superseded or rejected, and no evidence, sensitivity, confidence, authority, or escalation rule requires escalation. All conditions are required; failure is closed, not permissive.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [data flow](DATA_FLOW.md).
