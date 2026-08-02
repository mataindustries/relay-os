# RelayOS domain model

This is the canonical domain vocabulary. It is not a database schema and does not authorize implementation beyond the active [execution plan](../exec-plans/README.md). Phase 3 implements the entities explicitly labeled below while preserving the completed Phase 1 and Phase 2 entities; the remaining entities describe later V1 boundaries. Exact types may evolve, but approval, provenance, versioning, deterministic eligibility, and visibility semantics are architectural constraints.

## Shared concepts

Every record has an immutable identifier and the company/role scope, timestamps, and version fields relevant to that record. Phase 3 continues to operate with exactly one company and one Home-Service Office Manager / Dispatcher role, but it validates explicit IDs to prevent cross-scope relationships.

`KnowledgeClaim.lifecycleStatus` remains one of `extracted`, `proposed`, `approved`, `rejected`, `missing-information`, `conflicting-information`, or `superseded`. Phase 2 added an optional explicit operational-topic key and `owner-interview-derived` provenance without changing what approval means. Phase 3 retrieves by that explicit topic and does not inspect claim or question wording. `provenance` records how the statement arose and never implies approval. Only the domain service may make lifecycle transitions; invalid transitions return a typed domain error. Approval requires source references plus a separately appended `ApprovalDecision`.

The permitted lifecycle graph is deliberately small:

- direct resolution may move `extracted`, `missing-information`, or `conflicting-information` to `proposed`;
- evidence review may move `proposed` to `missing-information` or `conflicting-information`;
- an explicit rejection decision may move `extracted`, `proposed`, `missing-information`, or `conflicting-information` to `rejected`;
- an explicit source-backed approval decision may move only `proposed` to `approved`; and
- `superseded` is reachable only when approval of a revision succeeds.

There are no generic transitions out of `approved`, `rejected`, or `superseded`. A rejected revision leaves the prior approved version current.

Approved claims are immutable versions. A revision creates a new claim with an incremented `version` and `supersedesClaimId` pointing to the prior approved claim. The prior claim remains approved and current until the revision is successfully approved; that workflow then marks the prior version `superseded`. Rejection preserves the candidate, evidence, and decision but excludes it from employee visibility.

The required distinctions are structural:

- **Source material:** Phase 2 stores owner-pasted plain text in immutable available `SourceDocument` versions for the current session. `SourceReference` remains compatible with Phase 1 metadata and may anchor exact versioned lines.
- **Extracted claims:** `KnowledgeClaim` with extracted origin and an unapproved initial state.
- **Generated proposals:** `ImprovementProposal` with generation metadata and evidence links.
- **Owner-approved knowledge:** an approved revision plus its sources and approval decisions.
- **Rejected knowledge:** a retained rejected revision plus its rejection decision.
- **Missing information:** `KnowledgeGap.reason = missing-evidence`.
- **Conflicting information:** linked claims/references plus `KnowledgeGap.reason = conflicting-evidence`.
- **Employee input:** an immutable `EmployeeQuestion`; it is operational context, not evidence or policy.
- **Eligibility result:** an immutable `AnswerEligibilityEvaluation` containing explicit gate records, never hidden model reasoning.
- **Answer:** an immutable deterministic outcome that cites eligible knowledge or safely records why delivery was withheld; it is not policy.
- **Escalation resolution:** an operational lifecycle record; it neither creates nor approves knowledge.

Employee-selected sensitivity, a known mandatory rule, missing or invalid evidence, and action outside structured authority can require escalation. No confidence score participates in Phase 3 eligibility, and question text is not parsed to infer any of these conditions.

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

### SourceDocument (Phase 2)

- **Purpose:** Represents owner-pasted plain-text operational material such as a job description, SOP, policy, checklist, customer script, dispatch note, or owner note.
- **Important fields:** `id`, company/role scope, `title`, constrained `sourceType`, `supplierLabel`, `captureMethod = manual-paste`, normalized `content`, numbered `lines`, `version`, `status`, timestamps, and optional `supersedesDocumentId`.
- **Relationships:** Exact-version line anchors support claims. A draft may become available; correcting an available version creates a new draft version whose activation marks its predecessor superseded. Available and historical versions are immutable.
- **Provenance:** Line endings are normalized and lines are one-based. No checksum, authentication, source verification, upload, or durable content store is claimed. Supersession or withdrawal never deletes historical evidence.

### SourceReference (Phase 1 and Phase 2)

- **Purpose:** Records owner-entered metadata locating the evidence for a claim without uploading or storing source content.
- **Important fields:** `id`, `sourceTitle`, constrained `sourceType`, `sourceLocator`, optional `excerpt`, `recordedAt`, and optional complete document anchor (`sourceDocumentId`, exact `sourceDocumentVersion`, inclusive `startLine`, `endLine`). New document/interview references also retain company/role scope.
- **Relationships:** Claim source-reference IDs must resolve. A document anchor must resolve the exact historical version and valid lines; its excerpt and locator are derived rather than separately supplied. `owner-interview` references link exact answer provenance without being employee-visible by themselves.
- **Lifecycle:** Immutable after creation. Correcting metadata or evidence requires a new reference; revising a document never rewrites prior anchors. Phase 1 metadata-only references remain valid.
- **Provenance:** Locators and excerpts are retained with claim versions. RelayOS does not fetch, authenticate, hash, semantically interpret, or independently verify a source.

### KnowledgeClaim (Phase 1 and Phase 2)

- **Purpose:** Captures one scoped operational assertion for deterministic owner review.
- **Important fields:** `id`, `companyId`, `roleId`, `statement`, `category`, `provenance`, `lifecycleStatus`, `sourceReferenceIds`, optional explicit `topicKey`, timestamps, `version`, and optional `supersedesClaimId`.
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

### AuthorityBoundary (Phase 1 role definition, Phase 3 structured binding)

- **Purpose:** States what the employee may decide or do and where owner involvement begins.
- **Important fields:** `id`, `roleId`, `subject`, constrained `permissionLevel`, `limitOrConstraint`, `escalationDestination`, optional `notes`, and optional Phase 3 bindings: explicit topic keys, applicable request types, numeric limit, currency, and structured constraint type. Permission is `may-decide`, `may-act-within-limit`, `must-request-approval`, `must-escalate`, or `prohibited`.
- **Relationships:** Must belong to the active role. Phase 3 action evaluation considers only boundaries explicitly bound to the selected topic and request type. `may-decide` cannot authorize financial or emergency requests or an amount-bearing commitment. `may-act-within-limit` requires compatible structured amount/currency data, and the smallest of several compatible limits governs; limits are never parsed from `limitOrConstraint`.
- **Lifecycle:** Existing unbound Phase 1 records remain valid. They may be retained and displayed as owner context but cannot deterministically authorize a Phase 3 action request. Publishing versioned boundaries is future work.
- **Provenance:** A matching structured boundary can constrain authority or ground an escalation/prohibition, but it does not supply substantive answer guidance and does not bypass approved-claim retrieval.

### EscalationRule (Phase 1 role definition, Phase 3 structured binding)

- **Purpose:** Defines when, why, and to whom work must be escalated.
- **Important fields:** `id`, `roleId`, `trigger`, `destination`, constrained `urgency`, `requiredContext`, `expectedResponse`, and optional Phase 3 topic keys, applicable request types, urgency match, and sensitivity categories.
- **Relationships:** Must belong to the active role. Phase 3 matches only explicit structured bindings, orders matches deterministically, and uses the recorded destination and required context. It never infers a recipient from trigger text.
- **Lifecycle:** Existing unbound Phase 1 records remain valid but cannot deterministically route a Phase 3 question. Published rule revisions are future work.
- **Provenance:** A matching rule can ground a known escalation outcome but cannot supply answer guidance, create approved knowledge, or manufacture a gap merely because it routes work correctly.

## Operational loop

### EmployeeQuestion (Phase 3)

- **Purpose:** Retains an employee’s structured request for operational guidance without treating free text as policy or a retrieval query.
- **Important fields:** `id`, company/role scope, `employeeLabel`, original `questionText`, explicit `topicKey`, `requestType`, `sensitivitySelection`, discriminated `structuredContext`, `status`, submission/closure times, correlation ID, and an optional correction link. Request type is `policy-lookup`, `procedure-lookup`, `decision-request`, `exception-request`, `financial-action`, `emergency-action`, or `customer-commitment`. Sensitivity is explicitly selected from `none`, customer personal data, credentials/access, payment data, health/safety, legal/regulatory, or other sensitive.
- **Relationships:** Belongs to the active company and role and may produce one eligibility evaluation, answer, escalation, gap link, and correlated activity events. Context is discriminated by request type: for example, financial actions carry structural action type, amount, and currency; emergency actions carry urgency and category.
- **Lifecycle:** `received -> evaluating -> answered|withheld|escalated -> closed` through typed transitions. Evaluation makes the question immutable. A correction appends a new linked question rather than rewriting history.
- **Provenance:** Original employee input and explicit selections are retained as context, not approved knowledge. Structured fields are validated directly; RelayOS never derives them from `questionText`.

### AnswerEligibilityEvaluation (Phase 3)

- **Purpose:** Records the deterministic, inspectable policy-firewall decision for one question.
- **Important fields:** `id`, `questionId`, evaluation time, `overallResult`, ordered `gateResults`, eligible claim/source-reference/approval-decision IDs, matching authority-boundary/escalation-rule IDs, optional withhold reason, and correlation ID. Overall result is answer eligible, escalation required, prohibited, or withheld for missing knowledge, conflicting knowledge, invalid provenance, sensitivity, unclear authority, or unsupported request.
- **Relationships:** Uses current employee-visible same-topic claims and explicit scope, conflict, sensitivity, authority, and escalation records. It is referenced by the immutable answer and owner gate trace.
- **Lifecycle:** Created once for a question and never edited. Re-evaluation of an already evaluated question returns the existing result and appends nothing.
- **Provenance:** The ten gate records are, in order, scope, topic, request context, current approved knowledge, provenance, explicit conflict, sensitivity, authority, escalation rule, and answer mode. Each records `pass`, `fail`, or `not-applicable`, a safe reason, and supporting record IDs. This is explicit rule/data trace, not model reasoning or a confidence score.

### Answer (Phase 3)

- **Purpose:** Records fixed-template cited guidance or the exact prohibited, withheld, or escalated outcome delivered for a question.
- **Important fields:** `id`, question/company/role scope, status, answer mode, response text, cited claim/source-reference/approval-decision/authority-boundary IDs, eligibility evaluation ID, creation/delivery times, optional withheld reason, and correlation ID. Status is `delivered`, `withheld`, `escalated`, or `prohibited`; mode is approved guidance, approved guidance with authority, known escalation, prohibited action, or withheld.
- **Relationships:** Belongs to one question/evaluation. Delivered guidance uses only claims admitted by the employee selector and eligibility gates. A prohibited or known-escalation result links the exact matching boundary/rule; a withheld result may link an escalation and genuine gap.
- **Lifecycle:** Immutable after creation. Stable claim ordering and fixed labels/templates compose sections such as approved company guidance, authority for this request, sources, and owner approval.
- **Provenance:** Every substantive delivered statement traces to cited current approved claims, exact source references, and exact-version approval decisions. Informational guidance explicitly does not authorize action. An answer is an outcome record and never becomes company policy.

### Escalation (Phase 3)

- **Purpose:** Routes a question to an explicit authorized destination when RelayOS cannot safely deliver or authorize an answer.
- **Important fields:** `id`, company/role/question scope, reason, urgency, destination, minimized required context, status, creation/assignment/resolution times, resolution summary and actor label, related gap ID, matching boundary/rule IDs, and correlation ID. Reasons include approval required, mandatory escalation, emergency, sensitive context, unclear authority, missing/conflicting knowledge, invalid provenance, and unsupported request.
- **Relationships:** Destination comes only from a matching structured rule/boundary or explicitly configured owner fallback. Required context comes from typed fields and omits unnecessary raw sensitive values. Re-evaluation reuses the same open escalation.
- **Lifecycle:** `open -> assigned -> resolved -> closed` through typed transitions; history is retained.
- **Provenance:** Resolution is operational history, not policy evidence. It does not create or approve a claim, edit a question/answer, alter approval history, or resolve/dismiss a gap. Later source/interview/review work remains a separate linked workflow.

### KnowledgeGap (Phase 2 topic coverage, Phase 3 question linkage)

- **Purpose:** Makes a genuine topic-scoped operating-system deficiency actionable. Phase 3 adds question/evaluation linkage without treating every escalation as missing knowledge.
- **Important fields:** `id`, company/role scope, `topicKey`, constrained `reason`, description, impact, risk tier, status, supporting source-reference IDs, related claim IDs, triggering question IDs, evaluation IDs, timestamps, and optional resolution/dismissal details. Reasons cover missing/incomplete/conflicting evidence, invalid provenance, unclear authority, and unsupported request. Lifecycle remains `open -> question-ready -> answered -> proposal-created -> resolved`, with permitted reasoned dismissal paths.
- **Relationships:** At most one active unresolved gap exists per scoped topic. A Phase 3 question reuses the active scoped-topic gap where appropriate and links its immutable question/evaluation. Existing reconciliation resolves a question-linked gap only when current approved evidence also passes the gates relevant to its original missing, conflict, provenance, unsupported-mode, or authority deficiency; an unrelated same-topic approval is insufficient. Escalation resolution does not resolve it.
- **Provenance:** The original deficiency reason remains accurate and links explicit sources, claims, questions, and evaluations. A known approval, mandatory escalation, emergency, sensitivity-handling, or prohibition rule creates no gap merely because it correctly routes or restricts work. Absence of an active gap is not a compliance or quality claim.

### InterviewQuestion (Phase 2)

- **Purpose:** Presents one reviewed deterministic question template for an unresolved topic gap.
- **Important fields:** `id`, scope, `gapId`, `topicKey`, stable template key, prompt, rationale, what it unlocks, constrained answer type/options, numeric priority, status, and timestamps. Lifecycle is `queued -> active -> answered|skipped`, with withdrawal when its gap becomes terminal.
- **Relationships:** Generated only for active unresolved gaps. Risk tier, catalog order, and template sequence determine stable priority; only one question is active. Explicit structured-value rules create reviewed follow-ups for discounts, after-hours, emergencies, refunds, and permits.
- **Provenance:** Prompt text comes from the checked-in catalog, not a model or source interpretation. A skip retains a reason and does not resolve its gap.

### InterviewAnswer (Phase 2)

- **Purpose:** Retains the exact owner response and turns it into reviewable evidence without declaring policy.
- **Important fields:** `id`, `questionId`, `gapId`, scope, actor label, exact answer, optional structured value, answer time, `sourceReferenceId`, `generatedClaimId`, and optional `correctsAnswerId`.
- **Relationships:** Submission atomically appends an `owner-interview` reference and an `owner-interview-derived` same-topic proposed claim. A correction appends a new answer, source, and claim against the same question.
- **Provenance:** The answer is immutable. Candidate wording may be edited through the claim operation, but the underlying answer and source excerpt remain unchanged. Only the normal `ApprovalDecision` operation can make the claim approved.

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

### ActivityEvent (Phase 3)

- **Purpose:** Provides an append-only trace of meaningful Question-to-System and escalation activity in the current session.
- **Important fields:** `id`, company/role scope, event type, entity type/ID, actor label, occurrence time, correlation ID, and safe metadata. Phase 3 event types cover question receipt/evaluation, answer delivery/withholding, escalation open/assign/resolve/close, and gap linkage.
- **Relationships:** Correlation connects a question, evaluation, answer, escalation, and gap without copying full entity payloads. Demo IDs, times, content, and ordering are deterministic.
- **Lifecycle:** Append-only; no update or delete operation exists.
- **Provenance:** It records who/what/when but is not policy evidence or analytics. Metadata contains no raw question text, source content, sensitive values, or invented explanation.

## Required visibility and answer-eligibility predicate

The Phase 1 employee selector remains the first boundary: a claim may appear on the employee route or enter a Phase 3 answer only when its exact version is `approved`, it matches the active company and role, every cited source reference resolves, its exact-version approval decision is present, and no successfully approved revision has superseded it. `extracted`, `proposed`, `rejected`, `missing-information`, `conflicting-information`, and `superseded` claims are always excluded. Documents, gaps, interview records, other employees’ questions, owner-only context, and full source text are not employee answer context.

Phase 3 then restricts retrieval to the employee-selected explicit topic and applies the ten deterministic gates. It independently rejects explicit same-topic conflict, employee-selected sensitivity, invalid provenance, unsupported answer mode, and action requests without compatible structured authority. Matching prohibition or escalation records determine their grounded outcomes; no confidence score or semantic inference participates. Only `answer-eligible` may deliver approved guidance, and informational guidance always states that it does not grant action authority. All conditions fail closed.

See [Architecture](../../ARCHITECTURE.md), [AI boundaries](AI_BOUNDARIES.md), and [data flow](DATA_FLOW.md).
