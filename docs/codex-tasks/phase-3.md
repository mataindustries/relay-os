# RelayOS Phase 3 Task

Implement Phase 3 of RelayOS: Deterministic Question-to-System.

Work from the current repository and preserve the completed Phase 0, Phase 1,
and Phase 2 architecture.

Use the existing approved-knowledge lifecycle, source provenance, immutable
document versions, topic catalog, coverage engine, KnowledgeGap records,
interview provenance, and employee visibility predicate. Do not replace or
bypass them.

## READ BEFORE PLANNING OR EDITING

Read these files in full:

- AGENTS.md
- ARCHITECTURE.md
- README.md
- docs/product/PRODUCT.md
- docs/product/V1_SCOPE.md
- docs/product/USER_JOURNEYS.md
- docs/architecture/DOMAIN_MODEL.md
- docs/architecture/AI_BOUNDARIES.md
- docs/architecture/DATA_FLOW.md
- docs/architecture/SECURITY.md
- docs/decisions/0001-foundation.md
- docs/decisions/0002-company-role-engine.md
- docs/decisions/0003-deterministic-source-and-gap-engine.md
- docs/exec-plans/README.md
- docs/exec-plans/phase-0-foundation.md
- docs/exec-plans/phase-1-company-role-engine.md
- docs/exec-plans/phase-2-source-intake-interviewer.md

Inspect the current domain entities and typed errors, Phase 1 service write
boundary, source-document and anchored-reference implementation, topic catalog,
coverage engine, gap reconciliation, interviewer lifecycle, repositories,
session provider, demo loader, routes, employee selector, and test organization.

Do not begin implementation until this inspection is complete.

## CURRENT BASELINE

Phase 2 is complete and currently provides:

- one session-only company;
- one Home-Service Office Manager / Dispatcher role;
- responsibilities, authority boundaries, and escalation rules;
- immutable source documents and revisions;
- anchored line-level source references;
- manual source-backed claim extraction;
- explicit operational-topic assignment;
- deterministic coverage states;
- idempotent KnowledgeGap reconciliation;
- a deterministic one-question-at-a-time owner interviewer;
- immutable interview answers;
- interview answers converted into source-backed unapproved claims;
- approval and rejection through the existing Phase 1 boundary;
- employee visibility restricted to current approved source-backed knowledge;
- deterministic fictional HVAC demo data;
- 139 passing tests across 9 test files;
- no AI, authentication, persistence, uploads, or external services.

## PHASE KICKOFF HOUSEKEEPING

Before implementing Phase 3:

1. Confirm the Phase 2 execution plan is marked Complete.
2. Update AGENTS.md so Phase 3 is the active scope and Phase 2 is described as
   completed.
3. Do not otherwise rewrite completed documentation for style.
4. Preserve the committed Phase 2 task file unchanged.

## CREATE THE EXECUTION PLAN FIRST

Create:

`docs/exec-plans/phase-3-question-to-system.md`

Before changing application code, write:

- goal;
- non-goals;
- current baseline;
- proposed domain additions;
- answer-eligibility gate design;
- escalation and gap rules;
- work breakdown;
- acceptance criteria;
- validation plan;
- risks;
- stop conditions.

Maintain the plan while working and record actual validation results. Do not
mark it complete until every Phase 3 acceptance criterion passes.

==================================================
OBJECTIVE
==================================================

Build the first employee Question-to-System vertical slice.

An employee must be able to submit a structured operational question. RelayOS
must evaluate that question against approved company knowledge, exact source and
approval provenance, explicit conflicts, sensitivity, authority boundaries, and
escalation rules.

RelayOS may deliver a deterministic cited answer only when every required gate
passes.

When a safe answer cannot be delivered, RelayOS must fail closed by:

- withholding the answer;
- explaining the reason without inventing policy;
- opening an explicit escalation when human action is needed;
- creating or linking a categorized KnowledgeGap only when the system actually
  lacks, conflicts on, or cannot safely apply required knowledge;
- preserving a complete append-only trace.

No language model may decide eligibility, policy, authority, or escalation.

This phase must remain completely functional without model calls, API keys,
semantic search, embeddings, network requests, browser persistence,
authentication, external databases, file uploads, or production infrastructure.

==================================================
PRIMARY USER OUTCOME
==================================================

Using the fictional Summit Comfort Heating & Air demo, an employee should be
able to:

1. Open the employee workspace.
2. Submit a structured operational question.
3. Choose the relevant operational topic.
4. Choose the type of help being requested.
5. Provide only the structured context required by that request.
6. Receive one of these honest outcomes:
   - a cited answer grounded only in approved current knowledge;
   - a known escalation required by an approved boundary or rule;
   - an answer withheld because evidence is missing;
   - an answer withheld because evidence conflicts;
   - an answer withheld because authority is unclear;
   - an answer withheld because the question is sensitive;
   - an explicit prohibited-action outcome when approved policy clearly
     prohibits the requested action.
7. See the cited company guidance and source summary when an answer is delivered.
8. See exactly why RelayOS withheld or escalated when it cannot answer.
9. Confirm that the owner receives the escalation with the required context.
10. Confirm that a genuine system deficiency appears as a categorized knowledge
    gap.
11. Confirm that known escalation policy does not manufacture a fake knowledge
    gap.
12. Confirm that resolving the escalation does not automatically create or
    approve company knowledge.

==================================================
CORE PRODUCT PRINCIPLE
==================================================

Phase 3 implements a deterministic policy firewall:

question
→ explicit topic and request context
→ current approved-knowledge retrieval
→ provenance validation
→ conflict gate
→ sensitivity gate
→ authority gate
→ escalation-rule gate
→ deliver cited deterministic answer OR fail closed
→ preserve trace
→ open escalation when required
→ create/link a real gap only when appropriate

A future model may improve wording, classify questions, or summarize context,
but it must never bypass this deterministic eligibility result.

==================================================
IN SCOPE
==================================================

- Structured employee question capture
- Explicit topic selection
- Explicit request-type selection
- Small typed context fields
- Current approved knowledge retrieval by explicit topic
- Deterministic answer-eligibility gates
- Source and approval provenance validation
- Explicit conflict handling
- Explicit sensitivity handling
- Authority-boundary evaluation
- Escalation-rule evaluation
- Deterministic answer composition
- Cited answer records
- Withheld-answer records
- Escalation records and lifecycle
- Genuine knowledge-gap creation or linkage
- Question outcome trace
- Append-only activity events for meaningful Phase 3 actions
- Employee question history
- Owner escalation queue
- Escalation resolution without policy mutation
- Expanded deterministic HVAC demo
- Session-only in-memory repositories
- Focused UI integration
- Tests and documentation

==================================================
OUT OF SCOPE
==================================================

Do not implement:

- OpenAI or any other model call
- Luna, Terra, Sol, ModelGateway, model routing, token accounting, or spend
  controls
- Natural-language classification
- Semantic search
- Embeddings or vector databases
- Retrieval-augmented generation
- Free-form model answer generation
- Automatic policy extraction
- Automatic conflict detection from text similarity
- Automatic sensitivity detection from arbitrary text
- Automatic authority inference
- Automatic escalation-recipient inference
- Document uploads or parsing
- Authentication, invitations, or permissions
- Browser persistence
- localStorage, sessionStorage, IndexedDB, or service-worker data storage
- Cloudflare Workers, D1, R2, KV, Durable Objects, or external databases
- Email, SMS, Slack, or push notifications
- Background jobs or reminders
- Multi-company or multi-role support
- Training scenarios
- Independence scoring
- Billing
- Analytics
- General-purpose chat
- Voice input
- Phase 4 work

Do not begin Phase 4.

==================================================
DOMAIN ADDITIONS
==================================================

Preserve the framework-free domain and existing application-service write
boundary.

### EmployeeQuestion

Activate EmployeeQuestion with:

- id
- companyId
- roleId
- employeeLabel
- questionText
- topicKey
- requestType
- sensitivitySelection
- structuredContext
- status
- submittedAt
- closedAt when applicable
- correlationId

Use request types:

- policy-lookup
- procedure-lookup
- decision-request
- exception-request
- financial-action
- emergency-action
- customer-commitment

Use employee-selected sensitivity values:

- none
- customer-personal-data
- credentials-or-access
- payment-data
- health-or-safety
- legal-or-regulatory
- other-sensitive

Do not pretend Phase 3 can infer sensitivity from arbitrary text. Require the
employee to select it and warn against pasting sensitive values.

Use lifecycle:

- received
- evaluating
- answered
- withheld
- escalated
- closed

Required behavior:

1. Question belongs to active company and role.
2. Topic and request type are valid and explicit.
3. Question text is required but not used for semantic retrieval.
4. Structured context is validated by request type.
5. Questions are immutable after evaluation begins.
6. Corrections create a new linked question rather than rewriting history.
7. Status transitions are explicit and typed.
8. Original employee input is retained.
9. A question is context, not approved knowledge.

### StructuredQuestionContext

Use a discriminated union keyed by requestType.

Examples:

- policy-lookup: no additional required values;
- procedure-lookup: optional current-step label;
- decision-request: proposed action and optional subject;
- exception-request: requested exception and reason;
- financial-action: action type, amount, and currency;
- emergency-action: urgency and emergency category;
- customer-commitment: commitment type and optional amount/date.

Do not parse values from questionText when a structured field exists.

Validate numeric values, nonnegative amounts, choices, allowed enums, missing
context, and impossible combinations.

### AnswerEligibilityEvaluation

Add an immutable evaluation record with:

- id
- questionId
- evaluatedAt
- overallResult
- gateResults
- eligibleClaimIds
- eligibleSourceReferenceIds
- approvalDecisionIds
- matchingAuthorityBoundaryIds
- matchingEscalationRuleIds
- withholdReason when applicable
- correlationId

Use results:

- answer-eligible
- escalation-required
- prohibited
- withheld-missing-knowledge
- withheld-conflicting-knowledge
- withheld-invalid-provenance
- withheld-sensitive
- withheld-authority-unclear
- withheld-unsupported-request

Each gate result includes:

- gate key
- pass, fail, or not-applicable
- concise reason
- supporting record IDs

Required gates:

1. scope-valid
2. topic-valid
3. request-context-valid
4. current-approved-knowledge-present
5. provenance-valid
6. no-explicit-conflict
7. sensitivity-clear
8. authority-clear
9. escalation-rule-clear
10. answer-mode-supported

The evaluation must be deterministic, inspectable, and independently tested.
No gate may use a confidence score.

### Authority and escalation bindings

Extend existing AuthorityBoundary and EscalationRule only as required while
preserving existing Phase 1 data compatibility.

AuthorityBoundary may add:

- topicKeys
- applicableRequestTypes
- optional numericLimit
- optional currency
- optional structuredConstraintType

EscalationRule may add:

- topicKeys
- applicableRequestTypes
- optional urgency match
- optional sensitivity categories

Existing unbound records remain valid but cannot deterministically authorize a
question.

Authority behavior:

- `may-decide` may permit matching supported decision requests.
- `may-act-within-limit` permits only with a structured compatible limit and a
  submitted value within it.
- `must-request-approval` requires escalation.
- `must-escalate` requires escalation.
- `prohibited` produces a grounded prohibited outcome.
- no matching structured boundary for an action request fails closed.
- informational lookups may be answered without granting action authority when
  every other gate passes.
- informational answers must state they do not authorize action.

Do not infer numeric limits from free text.

### Answer

Activate Answer with:

- id
- questionId
- companyId
- roleId
- status
- answerMode
- responseText
- citedClaimIds
- citedSourceReferenceIds
- citedApprovalDecisionIds
- citedAuthorityBoundaryIds
- eligibilityEvaluationId
- createdAt
- deliveredAt when applicable
- withheldReason when applicable
- correlationId

Statuses:

- delivered
- withheld
- escalated
- prohibited

Modes:

- approved-guidance
- approved-guidance-with-authority
- known-escalation
- prohibited-action
- withheld

Required behavior:

1. Delivered guidance cites only existing employee-visible approved claims.
2. Every substantive statement traces to approved claims.
3. Every cited claim retains valid source and approval provenance.
4. Composer uses fixed labels and sentence templates.
5. Never invent steps, limits, exceptions, or rationale.
6. Multiple approved claims use stable order.
7. Informational answers do not imply permission.
8. Prohibited results cite the structured boundary.
9. Known escalations cite the matching boundary or rule.
10. Withheld answers explain the gate failure safely.
11. Answers are immutable.
12. Answers never become company policy.

Use deterministic sections such as:

- Approved company guidance
- Authority for this request
- Sources
- Owner approval

Do not paraphrase beyond fixed templates.

### Escalation

Activate Escalation with:

- id
- companyId
- roleId
- questionId
- reason
- urgency
- destination
- requiredContext
- status
- createdAt
- assignedAt
- resolvedAt
- resolutionSummary
- resolvedByLabel
- relatedGapId
- matchingBoundaryIds
- matchingEscalationRuleIds
- correlationId

Reasons include:

- approval-required
- mandatory-escalation
- emergency
- sensitive-context
- authority-unclear
- missing-knowledge
- conflicting-knowledge
- invalid-provenance
- unsupported-request

Lifecycle:

- open
- assigned
- resolved
- closed

Required behavior:

1. Escalation creation is deterministic.
2. Destination comes only from explicit rule/boundary or configured owner
   fallback.
3. Never invent a destination.
4. Required context comes from structured fields and rule requirements.
5. Do not copy sensitive raw values unnecessarily.
6. Resolution does not create or approve knowledge.
7. Resolution may link to later source/interview/claim work.
8. Re-evaluation does not duplicate the same open escalation.
9. Known escalation policy does not automatically create a KnowledgeGap.
10. History is retained.

### KnowledgeGap integration

Create or link a gap only when the question exposes a real system deficiency.

Create or link gaps for:

- missing approved knowledge;
- conflicting knowledge;
- invalid or broken provenance;
- authority unclear because no structured boundary exists;
- unsupported request because policy or procedure is absent.

Do not create a gap merely because:

- an approved rule correctly requires escalation;
- an approved boundary requires owner approval;
- an approved boundary prohibits action;
- a sensitive question has an existing handling/escalation rule;
- an emergency rule correctly routes the issue.

Requirements:

1. Question-linked gap creation is idempotent.
2. Reuse active gap for same company, role, and topic where appropriate.
3. Link triggering question and evaluation.
4. Preserve accurate original reason.
5. Escalation resolution does not resolve a gap.
6. Gap resolves only through approved-knowledge reconciliation or explicit
   dismissal.
7. Employee answer eligibility remains based on approved selector plus Phase 3
   gates.

### ActivityEvent

Activate append-only ActivityEvent for:

- question-received
- question-evaluated
- answer-delivered
- answer-withheld
- escalation-opened
- escalation-assigned
- escalation-resolved
- escalation-closed
- gap-linked-to-question

Fields:

- id
- companyId
- roleId
- eventType
- entityType
- entityId
- actorLabel
- occurredAt
- correlationId
- safe metadata

Requirements:

- append-only;
- no update/delete;
- no raw sensitive text in metadata;
- deterministic demo IDs/times;
- not policy evidence;
- used for traceability, not fake analytics.

==================================================
DETERMINISTIC ANSWER ENGINE
==================================================

Create a framework-free service that evaluates one question in this sequence:

1. Validate scope and context.
2. Retrieve current employee-eligible approved claims by explicit topic.
3. Validate all source and approval provenance.
4. Check explicit conflict state.
5. Check employee-selected sensitivity.
6. Determine informational versus action-authorizing request.
7. Evaluate matching structured authority boundaries.
8. Evaluate matching escalation rules.
9. Decide exact outcome.
10. Persist immutable evaluation.
11. Persist Answer.
12. Create/reuse Escalation when required.
13. Create/link a real KnowledgeGap only when appropriate.
14. Append safe ActivityEvents.

The engine must be deterministic, idempotent for an evaluated question, fail
closed, framework-free, browser-independent, network-free, model-free, and
typed-error driven.

Do not inspect arbitrary text to infer policy, sensitivity, authority, or topic.

Choose and document gate precedence. A reasonable precedence is:

1. invalid scope/context
2. sensitive
3. explicit prohibited authority
4. mandatory escalation rule
5. missing/conflicting/invalid knowledge
6. authority unclear for action request
7. eligible answer

A later gate may not override an earlier safety failure.

==================================================
EMPLOYEE EXPERIENCE
==================================================

Extend `/employee` into a structured Question-to-System workspace while
preserving approved-knowledge browsing.

Add:

- question form;
- topic selector;
- request-type selector;
- sensitivity selector;
- request-specific structured fields;
- warning against pasting passwords, payment card data, health details, or
  unnecessary personal information;
- submit action;
- result panel;
- question history;
- cited source summary;
- clear withheld/escalation state;
- escalation identifier or link.

Do not use generic chat bubbles or call the feature AI-powered.

Delivered results distinguish:

- approved guidance;
- authority information;
- source citations;
- approval provenance;
- informational guidance versus permission.

Withheld results show:

- outcome;
- gate reason;
- whether escalation opened;
- whether a gap linked;
- next action.

Do not expose owner-only notes, full sources, other employee questions, or
approval controls.

==================================================
OWNER ESCALATION EXPERIENCE
==================================================

Add route:

- `/escalations`

Show open escalations first with:

- urgency
- topic
- request type
- safe question summary
- reason
- destination
- required structured context
- matching boundary/rule
- related gap
- activity trace
- created time
- status

Allow owner to:

- assign to a label;
- record resolution;
- resolve;
- close after resolution;
- open related gap;
- open related question;
- start source/interview workflow to improve the OS.

Resolution must not approve claims, create employee-visible knowledge, edit the
question, erase the gap, or alter approval history.

Direct owners to source-backed review if a resolution should become policy.

==================================================
OWNER TRACEABILITY
==================================================

Show deterministic gate trace:

- scope
- context
- approved knowledge
- provenance
- conflict
- sensitivity
- authority
- escalation rule
- answer mode

For each gate show pass/fail/not-applicable, concise reason, and linked records.

This is not hidden reasoning. It is an explicit audit trace of rules and data.

==================================================
REVIEW AND COVERAGE INTEGRATION
==================================================

Preserve source, interview, review, and coverage flows.

Link question-created gaps to coverage, interviewer, source intake, and review.

Later claim approval may resolve a gap through existing reconciliation.

Do not replace historical question outcomes after the OS changes. Allow a new
question instead.

==================================================
DEMO MODE
==================================================

Extend Summit Comfort Heating & Air with deterministic examples:

1. Informational question receiving cited approved answer.
2. Action request permitted by `may-decide`.
3. Financial action within structured limit.
4. Financial action above limit that escalates.
5. `must-request-approval`.
6. `must-escalate`.
7. Prohibited action.
8. Missing-knowledge question creating/linking gap and escalation.
9. Explicit conflict withholding and escalating.
10. Sensitive question following explicit handling rule without fake gap.
11. Unclear authority creating/linking authority gap.
12. Resolved escalation proving resolution did not create policy.

Repeated demo loading must not duplicate any Phase 0-3 record.

No randomized IDs, dates, ordering, or content.

==================================================
APPLICATION STATE, SECURITY, AND PRIVACY
==================================================

Continue one in-memory repository instance.

Requirements:

- defensive copies;
- no direct UI array mutation;
- no React in domain;
- no browser storage;
- no external requests;
- injected clocks and IDs;
- typed errors;
- idempotency;
- no speculative persistence abstractions;
- no telemetry;
- no secrets;
- no question/source content in URLs;
- no raw sensitive question text in events or logs;
- safe text rendering;
- no unsafe HTML;
- visible session-only warning;
- visible sensitive-data warning;
- no claims of legal, medical, financial, or emergency professional advice.

Demo data must contain no real personal data, credentials, customer records, or
payment information.

==================================================
TEST REQUIREMENTS
==================================================

Add comprehensive tests.

EmployeeQuestion:

- valid/invalid scope;
- valid/invalid topic;
- required question;
- valid/invalid request type;
- context validation;
- sensitivity requirement;
- immutability;
- correction creates new question;
- lifecycle transitions.

Authority:

- Phase 1 compatibility;
- topic/request binding;
- may-decide;
- may-act-within-limit;
- exact limit;
- above limit;
- currency mismatch;
- must-request-approval;
- must-escalate;
- prohibited;
- missing structured binding;
- no free-text limit parsing.

Escalation rules:

- topic/request/urgency/sensitivity matching;
- stable priority;
- no invented destination;
- explicit owner fallback only.

Eligibility gates:

- every pass/fail case;
- precedence;
- approved-current retrieval only;
- exclusion of proposed/rejected/conflicting/superseded;
- invalid provenance;
- missing approval decision;
- broken source;
- explicit conflict;
- sensitivity;
- informational versus action;
- unsupported mode;
- deterministic results;
- no confidence score;
- no semantic inference.

Answers:

- citations only to eligible claims;
- stable ordering;
- source/approval provenance;
- informational disclaimer;
- authority summary;
- prohibited;
- escalation;
- withheld;
- immutability;
- no invented steps/limits;
- idempotent evaluation.

Escalations:

- reason/destination/context;
- sensitive minimization;
- idempotent open escalation;
- assignment/resolution/closure;
- invalid transitions;
- resolution does not create knowledge or resolve gap.

Gap integration:

- missing/conflict/provenance/authority gap creation or reuse;
- known escalation/approval/prohibition/sensitivity do not create fake gap;
- resolution does not resolve gap;
- later approval may resolve via existing reconciliation.

ActivityEvent:

- append-only;
- expected sequence;
- correlation;
- no raw sensitive text;
- deterministic demo.

Repository/demo:

- defensive copies;
- Phase 3 behavior;
- evaluation idempotency;
- complete demo idempotency;
- stable ordering/IDs.

UI journeys:

- informational cited answer;
- permitted action;
- within-limit financial action;
- above-limit escalation;
- missing-knowledge escalation/gap;
- owner sees and resolves escalation;
- resolution does not create knowledge;
- related-gap navigation;
- employee cannot see unapproved/owner-only records;
- real question history;
- warnings visible;
- direct routes `/employee` and `/escalations`.

Avoid large brittle snapshots. Prefer domain tests and narrow journey tests.

==================================================
DOCUMENTATION
==================================================

Update only Phase 3-relevant documentation.

Required:

- mark Phase 2 Complete consistently;
- create/complete Phase 3 plan;
- update AGENTS.md;
- update ARCHITECTURE.md with policy firewall and precedence;
- update DOMAIN_MODEL.md;
- update DATA_FLOW.md;
- update AI_BOUNDARIES.md: no model participates in eligibility or answers;
- update SECURITY.md;
- update USER_JOURNEYS.md;
- create `docs/decisions/0004-deterministic-question-policy-firewall.md`.

ADR records:

- explicit topic/request type;
- no semantic retrieval;
- employee-selected sensitivity;
- gate precedence;
- deterministic eligibility;
- informational guidance versus authority;
- structured boundary binding;
- when escalation creates a gap and when it must not;
- resolution cannot become policy;
- future model wording remains subordinate to firewall.

Do not claim AI understanding, semantic retrieval, durable storage,
authentication, production readiness, professional advice, collaboration, or
automated messaging.

==================================================
ACCEPTANCE CRITERIA
==================================================

Phase 3 is complete only when:

1. Phase 1 and Phase 2 behavior/tests remain intact.
2. Phase 2 documentation is Complete.
3. AGENTS.md points to Phase 3 plan during implementation.
4. Employees submit structured questions.
5. Topic, request type, sensitivity, and context are explicit.
6. Question text is not used for semantic retrieval.
7. Only current approved employee-eligible claims are retrieved.
8. Every delivered answer has valid source and approval provenance.
9. Explicit conflicts withhold.
10. Sensitive questions fail closed.
11. Informational requests do not imply authority.
12. Structured boundaries determine action eligibility.
13. Numeric limits are structural, not parsed.
14. Mandatory approval/escalation opens escalation.
15. Prohibited actions produce grounded outcomes.
16. Missing/invalid knowledge creates or links a real gap.
17. Known escalation policy creates no fake gap.
18. Gate results and order are inspectable.
19. Answers are deterministic and immutable.
20. Escalations are deterministic, idempotent, and traceable.
21. Resolution creates/approves no knowledge.
22. Resolution resolves no gap.
23. Activity events are append-only and safe.
24. Employee history uses actual session data.
25. Owner escalation queue works.
26. Employee visibility restrictions remain intact.
27. Demo covers all required outcomes.
28. Demo reload is idempotent.
29. No model, network, persistence, upload, authentication, messaging, or Phase
    4 work is introduced.
30. Documentation matches implementation.
31. App remains usable at 360px without evident overflow.
32. Direct navigation to `/employee`, `/escalations`, `/owner`, `/review`, and
    `/interview` works.
33. Complete quality gate and build pass.

==================================================
VALIDATION
==================================================

During implementation, use focused tests and typechecking.

After implementation run:

- npm run format
- npm run check
- npm run build

Run production preview and verify:

- /employee
- /escalations
- /owner
- /review
- /interview
- /sources

Inspect for secrets, external requests, browser persistence, unsafe HTML,
content in URLs/logs, raw sensitive event metadata, fake AI language, semantic
retrieval, inferred limits, duplicates, UI bypasses, Phase 4 work, and 360px
overflow.

If no browser executable exists, document the limitation and use focused
component tests plus static responsive-CSS inspection.

==================================================
LOOP AND TOKEN CONTROL
==================================================

- Inspect once before planning.
- Write Phase 3 execution plan before implementation.
- Preserve Phase 1 and Phase 2 architecture and tests.
- Work only from Phase 3 criteria.
- Do not implement or simulate a model.
- Do not add speculative provider abstractions.
- Add dependencies only when necessary.
- Do not redesign completed screens beyond integration needs.
- No unrelated cleanup or tone rewrites.
- Do not rerun unchanged failures.
- No broad search-and-replace across lifecycle code.
- Run full quality gate after implementation.
- Make at most two focused repair passes after first full gate.
- If environmental failure remains, record exact command, error, cause, and next
  action, then stop.
- Stop immediately when all criteria pass.
- No extra polish pass.
- Do not start Phase 4.
- Do not commit or push unless explicitly asked.

==================================================
FINAL RESPONSE
==================================================

Report only:

1. Phase 3 entities and invariants implemented
2. Deterministic answer-eligibility gates implemented
3. Employee Question-to-System workflow implemented
4. Owner escalation workflow implemented
5. Gap and approval-boundary integration
6. Activity trace implemented
7. Files and documentation changed
8. Tests added and total passing count
9. Validation commands/results
10. Honest limitations
11. Whether all Phase 3 acceptance criteria passed
12. Confirmation that no model calls, persistence, authentication, messaging,
    or Phase 4 work were introduced
13. Exact recommended Phase 4 objective without implementing it

END OF PHASE 3 TASK
