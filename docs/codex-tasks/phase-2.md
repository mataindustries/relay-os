# RelayOS Phase 2 Task

Implement Phase 2 of RelayOS: Source Intake and the Knowledge Gap Interviewer.

Work from the current repository and preserve the completed Phase 0 and Phase 1 architecture.

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
- docs/exec-plans/README.md
- docs/exec-plans/phase-0-foundation.md
- docs/exec-plans/phase-1-company-role-engine.md

Inspect the existing domain service, repository interfaces, in-memory repository,
session provider, deterministic demo loader, setup workflow, owner workspace,
review workflow, and employee-visible selector before designing additions.

Do not replace or bypass the passing Phase 1 domain lifecycle.

## CURRENT BASELINE

Phase 1 is complete and currently provides:

- one session-only company;
- one Home-Service Office Manager / Dispatcher role;
- responsibilities;
- authority boundaries;
- escalation rules;
- manually entered source-reference metadata;
- deterministic knowledge-claim lifecycle;
- append-only approval decisions;
- immutable approved claim revisions;
- explicit supersession;
- employee visibility restricted to current approved source-backed knowledge;
- deterministic fictional HVAC demo data;
- 98 passing tests;
- no AI, authentication, persistence, uploads, or external services.

## PHASE KICKOFF HOUSEKEEPING

Before implementing Phase 2:

1. Correct the Phase 1 execution-plan header from “In progress” to “Complete”
   if that inconsistency still exists.
2. Update AGENTS.md so Phase 2 is the active scope and the Phase 1 plan is
   described as completed.
3. Do not otherwise rewrite completed Phase 0 or Phase 1 documentation for style.

## CREATE THE EXECUTION PLAN FIRST

Create:

`docs/exec-plans/phase-2-source-intake-interviewer.md`

Before changing application code, write:

- goal;
- non-goals;
- current baseline;
- proposed domain additions;
- work breakdown;
- acceptance criteria;
- validation plan;
- risks;
- stop conditions.

Maintain the plan during implementation and record actual validation results.
Do not mark it complete until every Phase 2 acceptance criterion passes.

==================================================
OBJECTIVE
==================================================

Build the second functional RelayOS vertical slice:

1. Let an owner manually paste and organize real operational source material.
2. Preserve exact provenance through immutable source documents and anchored source references.
3. Let the owner manually extract source-backed operational claims for review.
4. Deterministically identify important role knowledge that is still missing,
   incomplete, or explicitly conflicting.
5. Turn those gaps into a prioritized, one-question-at-a-time owner interview.
6. Convert interview answers into source-backed but unapproved knowledge claims.
7. Route those claims through the existing Phase 1 approval workflow.
8. Show that approving a gap-derived claim resolves the gap and makes the
   current approved knowledge eligible for the employee view.

This phase must remain completely functional without a model, API key, network
request, browser persistence, database, file upload, or autonomous extraction.

The product must be honest:

- RelayOS does not understand pasted documents semantically in Phase 2.
- The owner explicitly assigns topics and extracts claims.
- Interview questions come from deterministic templates and coverage rules.
- Interview answers become proposals, not policy.
- Nothing becomes employee-visible without the existing explicit approval workflow.

==================================================
PRIMARY USER OUTCOME
==================================================

An owner should be able to:

1. Load the fictional Summit Comfort Heating & Air demo or complete Phase 1 setup.
2. Open a Source Library.
3. Paste a job description, policy, checklist, script, or owner note.
4. View the source as stable numbered lines.
5. Create a source reference pointing to an exact line range.
6. Create an extracted operational claim from that reference.
7. See a role coverage map showing what is approved, proposed, conflicting, or missing.
8. Start the Knowledge Gap Interviewer.
9. Answer the highest-priority missing question.
10. See the answer retained as immutable interview provenance.
11. See an unapproved claim created from that answer.
12. Review and approve or reject it through the existing review workflow.
13. Confirm that approval updates the coverage state.
14. Confirm that only the approved claim appears on the employee route.

==================================================
IN SCOPE
==================================================

- Manual plain-text source intake
- Source-document metadata
- Immutable source-document versions
- Stable line numbering
- Exact source-reference anchors
- Manual source-backed claim extraction
- Canonical operational-topic catalog
- Deterministic role-coverage evaluation
- Persistent-in-session KnowledgeGap records or a reconciled deterministic projection
- Deterministic interview-question templates
- Prioritized question queue
- Conditional deterministic follow-up questions
- Immutable owner interview answers
- Conversion of answers into source-backed unapproved claims
- Integration with existing approval, rejection, revision, and employee visibility rules
- Session-only in-memory repositories
- Extended fictional HVAC demonstration
- Mobile-first Source Library and Interviewer
- Focused updates to owner and review workspaces
- Tests and documentation

==================================================
OUT OF SCOPE
==================================================

Do not implement:

- OpenAI or any other model calls
- Luna, Terra, Sol, ModelGateway, model routing, or token accounting
- Automatic document interpretation
- Automatic claim extraction
- Semantic search
- Embeddings
- Vector databases
- Retrieval-augmented generation
- Employee question answering
- Question-to-System
- AI chat
- File uploads
- PDF, DOCX, image, audio, or video parsing
- OCR or transcription
- Website crawling or URL fetching
- Google Drive, Notion, Gmail, or calendar integrations
- Authentication or invitations
- Browser persistence
- localStorage, sessionStorage, IndexedDB, service-worker data storage
- Cloudflare Workers, D1, R2, KV, Durable Objects, or external databases
- Multiple companies
- Multiple roles
- Training scenarios
- Independence scoring
- Analytics
- Billing
- Email or SMS
- Background jobs
- Automatic reminders
- Production secrets
- General-purpose workflow builders
- Phase 3 work

Do not begin Phase 3.

==================================================
DOMAIN ADDITIONS
==================================================

Preserve the framework-free Phase 1 domain and existing service boundary.

Implement the smallest coherent additions required for Phase 2.

------------------------------
SourceDocument
------------------------------

Activate SourceDocument as a Phase 2 entity.

Required concepts:

- id
- companyId
- roleId
- title
- sourceType
- supplierLabel
- captureMethod
- content
- normalized line representation
- version
- status
- createdAt
- updatedAt
- optional supersedesDocumentId

Use constrained source types suitable for the first supported role, including:

- job-description
- existing-sop
- policy
- checklist
- customer-script
- dispatch-note
- owner-note
- interview-record
- other

For Phase 2, captureMethod is always:

- manual-paste

Use an explicit lifecycle such as:

- draft
- available
- superseded
- withdrawn

Required behavior:

1. A document belongs to the active company and role.
2. Blank documents cannot become available.
3. Available documents are immutable.
4. Correcting an available document creates a new version.
5. Existing source references continue pointing to the exact historical version they originally cited.
6. A successfully activated revision may supersede the prior available version.
7. Withdrawal or supersession never deletes historical evidence.
8. Document content remains local to the current in-memory session.
9. Do not call a lightweight checksum a cryptographic guarantee.
10. Do not use browser-only APIs inside the domain layer.

If a stable content fingerprint is useful, implement it as a clearly labeled
non-security deterministic fingerprint behind a pure utility with tests. Do not
misrepresent it as authentication or tamper-proof storage.

------------------------------
SourceReference extension
------------------------------

Preserve compatibility with existing manually entered Phase 1 references.

Allow a SourceReference to optionally point to:

- sourceDocumentId
- sourceDocumentVersion
- startLine
- endLine

Required behavior:

1. Line ranges are one-based and inclusive.
2. The referenced document and exact version must exist.
3. Start and end lines must be valid.
4. startLine cannot exceed endLine.
5. The excerpt must be derived from the anchored lines rather than independently typed when a document anchor is used.
6. Anchored references are immutable.
7. Manual metadata-only Phase 1 references remain valid.
8. Existing approved Phase 1 claims must continue working.

Do not silently rewrite historical references when a document is revised.

------------------------------
OperationalTopic
------------------------------

Create a deterministic canonical topic catalog for the first supported role.

This may be a typed configuration rather than a persisted entity.

Include topics covering at least:

- lead-intake
- service-area
- scheduling
- rescheduling-and-cancellation
- urgency-and-emergency
- after-hours
- technician-late-or-absent
- pricing-and-estimates
- discounts
- payments
- refunds
- customer-complaints
- permits-and-approvals
- job-completion-proof
- customer-data-and-privacy
- authority-and-escalation

Each topic definition should include:

- stable key
- label
- description
- risk tier
- why it matters
- expected evidence categories
- one primary interview question template
- optional deterministic follow-up rules
- related responsibility, boundary, or escalation concepts where useful

Use a constrained risk tier such as:

- critical
- high
- normal

Critical and authority-sensitive gaps must be prioritized ahead of routine workflow gaps.

Do not infer topic coverage by free-text similarity.

Every source, extracted claim, or interview proposal used for coverage must be explicitly assigned a topic key.

------------------------------
KnowledgeGap
------------------------------

Activate KnowledgeGap for Phase 2.

Required concepts:

- id
- companyId
- roleId
- topicKey
- reason
- description
- impact
- riskTier
- status
- supportingSourceReferenceIds
- relatedClaimIds
- createdAt
- updatedAt
- optional resolvedByClaimId
- optional dismissedReason

Use explicit reasons including at least:

- missing-evidence
- incomplete-evidence
- conflicting-evidence
- authority-unclear

Use a constrained lifecycle such as:

- open
- question-ready
- answered
- proposal-created
- resolved
- dismissed

Define permitted transitions explicitly and return typed errors for invalid transitions.

Required behavior:

1. Gap detection is deterministic.
2. Re-running detection does not duplicate equivalent open gaps.
3. One active unresolved gap exists per company, role, and topic.
4. A topic with current approved knowledge is considered covered.
5. A topic with only extracted or proposed knowledge remains unresolved.
6. A topic with an explicit conflicting-information claim remains conflicting.
7. A rejected proposal does not resolve the gap.
8. An approved current claim for the same topic may resolve the gap.
9. Dismissal requires a recorded owner reason.
10. A dismissed gap does not create approved knowledge.
11. Gap status never affects employee visibility directly.
12. The employee selector continues using the approved-knowledge predicate.

Do not claim that absence of a gap proves the company is compliant, safe, or fully documented.

------------------------------
InterviewQuestion
------------------------------

Add a small Phase 2 entity for deterministic interview prompts.

Required concepts:

- id
- companyId
- roleId
- gapId
- topicKey
- prompt
- rationale
- whatItUnlocks
- answerType
- priority
- status
- createdAt
- answeredAt when applicable

Use constrained answer types such as:

- short-text
- long-text
- yes-no
- numeric-limit
- person-or-destination
- single-choice

Use a lifecycle such as:

- queued
- active
- answered
- skipped
- withdrawn

Required behavior:

1. Questions are generated only from current unresolved gaps.
2. Question text comes from reviewed deterministic templates.
3. Re-running generation is idempotent.
4. The queue is sorted by risk tier and stable deterministic tie-breakers.
5. Only one question is active at a time.
6. Skipping requires a reason and does not resolve the gap.
7. An answered question cannot be edited in place.
8. A corrected answer creates a new answer record and a new candidate claim rather than rewriting history.
9. Conditional follow-ups use explicit rules, not free-text interpretation.

Implement useful deterministic branches for several important topics.

Examples:

- If the owner says the employee may approve discounts, ask for the exact limit and when approval is still required.
- If after-hours service exists, ask what qualifies and who receives the escalation.
- If emergency requests are accepted, ask for the explicit qualifying conditions and required dispatch context.
- If refunds are allowed, ask who may authorize them and the limit.
- If permits may be involved, ask what information must be collected and when the owner or project lead must be contacted.

Do not create an open-ended fake “AI interview.”

------------------------------
InterviewAnswer
------------------------------

Add an immutable answer record.

Required concepts:

- id
- questionId
- gapId
- companyId
- roleId
- actorLabel
- answer
- structuredValue where appropriate
- answeredAt
- sourceReferenceId
- generatedClaimId

Required behavior:

1. The exact answer is retained.
2. Answer submission creates immutable provenance.
3. A corresponding SourceReference is created with source type `owner-interview`.
4. The source locator identifies the exact question and answer.
5. The answer excerpt is preserved.
6. The answer creates a new unapproved KnowledgeClaim assigned to the same topic.
7. The new claim begins as `extracted` or `proposed` according to the existing lifecycle, but never as `approved`.
8. The generated claim clearly records provenance as owner-interview-derived.
9. The owner may edit the proposed statement before review only through a legitimate revision or draft operation that preserves the original answer.
10. Approval still requires the existing Phase 1 domain operation and explicit ApprovalDecision.
11. Rejecting the claim leaves the underlying answer and gap history intact.
12. No answer is automatically exposed to the employee.

==================================================
DETERMINISTIC COVERAGE ENGINE
==================================================

Create a pure domain service or projection that evaluates the canonical topic catalog against current session records.

Coverage states should distinguish at least:

- approved
- candidate
- conflicting
- missing
- dismissed

Definitions:

- approved: a current employee-eligible approved claim explicitly assigned to the topic;
- candidate: at least one extracted or proposed source-backed claim exists for the topic, but no current approved claim exists;
- conflicting: the topic has an explicit conflicting-information claim or a conflict record created through the review workflow;
- missing: no current approved or source-backed candidate claim exists;
- dismissed: the owner explicitly dismissed the corresponding gap with a reason.

Do not use substring matching, embeddings, model judgment, or unsound string comparison to decide whether two statements conflict.

A conflict must be explicit through:

- an existing conflicting-information claim;
- an owner conflict marker;
- or a typed structured conflict relation.

The coverage engine must:

- return stable deterministic results;
- include the records supporting each result;
- fail closed when linked records are invalid;
- avoid mutating repositories;
- be independently unit tested;
- never calculate a vague AI confidence score.

==================================================
SOURCE LIBRARY EXPERIENCE
==================================================

Add a functional route:

- /sources

Update navigation appropriately.

The Source Library must allow the owner to:

- view all current source documents;
- create a manual-paste document;
- choose the source type;
- enter title and supplier label;
- paste plain text;
- save a draft;
- validate and make it available;
- inspect stable numbered lines;
- create a reference from a valid line range;
- view the exact derived excerpt;
- manually create an extracted claim from that reference;
- assign the claim an operational topic;
- revise an available document without destroying its prior version;
- inspect document version history;
- see which claims cite each source.

Use simple dependable controls. Do not implement a rich-text editor or drag-and-drop upload area.

The UI must clearly state:

- pasted material remains only in the current browser memory session;
- RelayOS has not automatically verified or interpreted the source;
- the owner is selecting the evidence and proposed claim;
- extracted claims remain unapproved.

Do not use fake processing animations or pretend that AI analyzed the source.

==================================================
KNOWLEDGE COVERAGE EXPERIENCE
==================================================

Add a coverage section to the owner workspace or a focused route if that creates a cleaner implementation.

The coverage interface must show:

- topic
- risk tier
- current coverage state
- approved claim when present
- candidate claims when present
- conflict explanation when explicitly recorded
- open gap when present
- next available action

Use only derived counts and actual records.

Do not present a single overall percentage or “business readiness score” in Phase 2.

Provide filters for:

- all
- critical
- missing
- candidate
- conflicting
- approved

The interface must explain that coverage means documented and reviewed within RelayOS, not legal compliance or guaranteed operational quality.

==================================================
KNOWLEDGE GAP INTERVIEWER
==================================================

Add a functional route:

- /interview

The interviewer must be mobile-first and focused.

Show:

- current topic
- risk tier
- question
- why RelayOS is asking
- what the answer will unlock
- relevant existing evidence or the explicit absence of evidence
- answer control appropriate to the question type
- skip action requiring a reason
- progress as concrete counts, not a motivational score

Example progress:

- 4 critical gaps remaining
- 3 questions answered
- 2 proposals awaiting review

Do not show an invented completion percentage.

On answer submission:

1. Validate the response.
2. Store the immutable InterviewAnswer.
3. Create the owner-interview SourceReference.
4. Create the unapproved topic-assigned KnowledgeClaim.
5. Move the applicable gap to the correct nonresolved state.
6. Queue a deterministic follow-up when required.
7. Send the owner to the next highest-priority question or show an honest queue state.

Provide a visible link to review the newly created proposal.

The interviewer must never:

- approve a claim;
- silently resolve a gap;
- answer on the owner’s behalf;
- generate policy not present in the submitted answer;
- expose the answer to the employee before approval.

==================================================
REVIEW WORKFLOW INTEGRATION
==================================================

Extend the existing /review experience without replacing its Phase 1 behavior.

The owner must be able to identify claims originating from:

- manual source extraction;
- owner interview answers;
- existing Phase 1 manual entry;
- fictional demo data.

For a source-derived or interview-derived claim, show:

- topic
- proposed statement
- provenance
- source title or interview question
- exact source excerpt
- source line anchor when applicable
- related knowledge gap
- existing current approved claim for the topic, when one exists
- decision history

Approval and rejection must continue through the existing domain service.

After an approval:

- reconcile the related gap;
- show the topic as approved in coverage;
- preserve the answer, source, previous claims, and decision history;
- allow the existing employee selector to expose the current approved claim.

After rejection:

- preserve the rejected claim and decision;
- leave the gap unresolved unless the owner explicitly dismisses it;
- allow a corrected interview answer or new source-backed proposal.

==================================================
EMPLOYEE EXPERIENCE
==================================================

Keep /employee intentionally narrow.

Do not add chat or question answering.

It should continue to show only current approved employee-visible knowledge.

Where useful, add:

- topic label;
- source/provenance summary;
- approval date.

Do not expose:

- source documents in full;
- interview questions;
- interview answers;
- open gaps;
- extracted claims;
- proposed claims;
- rejected claims;
- conflicting claims;
- dismissed gaps;
- superseded claims.

Add tests proving these boundaries.

==================================================
DEMO MODE
==================================================

Extend the existing deterministic fictional company:

Summit Comfort Heating & Air

Keep it clearly fictional.

Add at least:

- one fictional office-manager job description;
- one fictional dispatch checklist;
- one fictional customer-handling policy;
- one available document revision chain;
- anchored source references;
- one manually extracted candidate claim;
- one approved topic;
- one candidate topic;
- one explicitly conflicting topic;
- several missing topics;
- a deterministic prioritized interview queue;
- one example answered interview question producing an unapproved claim.

The demo should make the full Phase 2 story understandable without API keys.

Repeated loading must remain idempotent and must not duplicate:

- documents;
- document versions;
- references;
- gaps;
- questions;
- answers;
- claims;
- decisions.

Do not randomize IDs, dates, ordering, or content in demo mode.

==================================================
APPLICATION STATE AND REPOSITORIES
==================================================

Continue using one in-memory application repository instance for the current session.

Extend repository interfaces only as required.

Requirements:

- defensive copies;
- no direct mutable-array access from UI;
- no React dependency in domain code;
- no browser storage;
- no external requests;
- injected clocks and ID factories where determinism matters;
- typed errors for invalid relationships and lifecycle operations;
- no speculative production database abstractions.

Do not replace the existing repository architecture merely to make it more generic.

==================================================
SECURITY AND PRIVACY
==================================================

Phase 2 handles pasted business material, so make the current limitations highly visible.

Requirements:

- no network transmission;
- no telemetry;
- no external fetch;
- no browser persistence;
- no API secrets;
- no hidden logging of document content;
- no document content in URL parameters;
- no source content placed in browser console messages;
- no HTML injection from pasted text;
- render pasted text safely as text;
- preserve the session-only warning.

The fictional demo must contain no real personal data, business secrets, phone numbers, emails, customer records, or credentials.

==================================================
TEST REQUIREMENTS
==================================================

Add comprehensive domain and focused integration tests.

SourceDocument tests:

- ownership and scope validation;
- blank-document rejection;
- draft-to-available transition;
- available-document immutability;
- revision creation;
- explicit supersession;
- historical version preservation;
- invalid lifecycle transitions;
- deterministic line numbering;
- optional deterministic fingerprint behavior if implemented.

SourceReference tests:

- valid document anchors;
- invalid document ID;
- invalid document version;
- invalid start line;
- invalid end line;
- reversed range;
- exact excerpt derivation;
- immutable anchors;
- compatibility with existing Phase 1 metadata-only references;
- historical reference stability after document revision.

Extraction tests:

- manual source-backed extracted claim creation;
- explicit topic assignment;
- claim remains unapproved;
- invalid topic rejection;
- missing source rejection;
- preservation of source provenance.

Coverage-engine tests:

- approved topic;
- candidate topic;
- missing topic;
- explicitly conflicting topic;
- dismissed topic;
- invalid linked data fails closed;
- no free-text semantic inference;
- deterministic ordering;
- critical gaps prioritized first;
- no duplicate gaps after repeated reconciliation;
- approval resolves the correct gap;
- rejection does not resolve the gap;
- unrelated claim approval does not resolve the gap.

Interviewer tests:

- question generation from unresolved gaps;
- no questions for approved topics;
- idempotent question generation;
- deterministic priority ordering;
- only one active question;
- required-answer validation;
- skip reason requirement;
- conditional follow-up creation;
- answer immutability;
- corrected answer creates a new record;
- answer creates exact interview SourceReference;
- answer creates unapproved claim;
- answer never approves knowledge;
- rejected proposal preserves the gap;
- approved proposal resolves the gap.

Repository and demo tests:

- defensive copies;
- source and interview repository behavior;
- demo idempotency across all new record types;
- deterministic IDs and ordering.

UI journey tests:

- create and activate a manual-paste source document;
- inspect numbered lines;
- create a valid anchored reference;
- manually extract a topic-assigned claim;
- view coverage states;
- answer an interview question;
- inspect the resulting proposal;
- approve the proposal through /review;
- confirm the topic becomes approved;
- confirm /employee shows the approved claim;
- confirm /employee excludes all unapproved and interview-only material;
- confirm session-only warnings remain visible.

Avoid large brittle snapshots.

Prefer domain tests for business behavior and narrow integration tests for critical journeys.

==================================================
DOCUMENTATION
==================================================

Update only documentation affected by Phase 2.

Required documentation work:

- set Phase 1 plan status consistently to Complete;
- create and complete the Phase 2 execution plan;
- update AGENTS.md to describe Phase 2 as active/completed at the appropriate point;
- update ARCHITECTURE.md where SourceDocument, KnowledgeGap, interview provenance, or coverage reconciliation require durable rules;
- update DOMAIN_MODEL.md to label Phase 2 entities accurately;
- update DATA_FLOW.md with:
  source paste
  → anchored reference
  → extracted claim or interview question
  → answer
  → unapproved claim
  → owner decision
  → approved coverage;
- update AI_BOUNDARIES.md to state clearly that Phase 2 uses no models and that its interviewer is deterministic;
- update SECURITY.md for pasted source material and session-only handling;
- update USER_JOURNEYS.md with the Source Library and Knowledge Gap Interviewer;
- create an ADR such as:
  docs/decisions/0003-deterministic-source-and-gap-engine.md

The ADR should record:

- why source versions are immutable;
- why line anchors are stable;
- why topic assignment is explicit;
- why the coverage engine does not use free-text inference;
- why interview questions are deterministic;
- why answers create proposals rather than approved policy;
- how idempotent gap reconciliation works.

Do not claim:

- AI understanding;
- automatic document extraction;
- durable storage;
- authentication;
- production readiness;
- legal compliance;
- employee question answering;
- semantic retrieval;
- multi-user collaboration.

==================================================
ACCEPTANCE CRITERIA
==================================================

Phase 2 is complete only when all of the following are true:

1. Phase 1 behavior and tests remain intact.
2. The Phase 1 plan status is consistently Complete.
3. AGENTS.md points to the Phase 2 plan during implementation.
4. Manual plain-text source documents can be created and activated.
5. Available source documents are immutable and can be revised without destroying historical versions.
6. Stable line-anchored references preserve exact excerpts.
7. Existing metadata-only Phase 1 references remain supported.
8. An owner can manually create a source-backed topic-assigned extracted claim.
9. Extracted and interview-derived claims remain unapproved.
10. The canonical operational-topic catalog is typed and deterministic.
11. Coverage states derive only from explicit topic assignments and valid records.
12. The gap engine is idempotent and creates no duplicate active gaps.
13. Critical gaps appear before routine gaps.
14. The interviewer asks one deterministic question at a time.
15. Conditional follow-ups work through explicit rules.
16. Interview answers preserve immutable provenance.
17. Interview answers create source-backed unapproved claims.
18. Approval occurs only through the existing Phase 1 approval operation.
19. Approving the correct claim resolves the related gap.
20. Rejecting a claim does not silently resolve the gap.
21. The employee route shows only current approved eligible knowledge.
22. The fictional demo demonstrates all important Phase 2 states.
23. Repeated demo loading remains idempotent.
24. No model, network, persistence, upload, authentication, or later-phase feature is introduced.
25. All relevant documentation reflects the actual implementation.
26. The application remains usable at 360px without evident horizontal overflow.
27. Direct navigation to /sources, /interview, /review, and /employee works.
28. The complete quality gate and production build pass.

==================================================
VALIDATION
==================================================

During implementation, use focused tests and typechecking for specific changes.

After implementation, run:

- npm run format
- npm run check
- npm run build

Then run a local production preview and verify direct requests to:

- /sources
- /interview
- /owner
- /review
- /employee

Inspect for:

- browser secrets;
- external requests;
- fetch/XMLHttpRequest/WebSocket usage;
- browser persistence;
- unsafe HTML rendering;
- source content in URLs;
- source content in console logging;
- fake AI language;
- fake processing states;
- duplicate demo records;
- duplicate gaps or questions;
- raw UI mutation bypassing domain services;
- later-phase features;
- obvious 360px overflow.

Where no browser executable is available, document that limitation and use focused component tests plus static responsive-CSS inspection. Do not claim pixel-level verification that was not performed.

==================================================
LOOP AND TOKEN CONTROL
==================================================

- Inspect the repository once before planning.
- Write the Phase 2 execution plan before editing implementation code.
- Do not restart or replace the Phase 1 architecture.
- Preserve passing Phase 1 tests.
- Work only from the written Phase 2 acceptance criteria.
- Do not implement AI as a shortcut.
- Do not simulate AI analysis.
- Do not introduce speculative abstractions for future providers.
- Do not add dependencies unless clearly necessary for this phase.
- Do not redesign completed Phase 1 screens beyond required integration.
- Do not perform unrelated cleanup.
- Do not rewrite documentation merely for tone.
- Do not repeatedly rerun an unchanged failing command.
- Do not use broad search-and-replace across domain lifecycle code.
- Run the complete quality gate after implementation.
- After the first complete quality-gate run, make at most two focused repair passes.
- If an environmental issue remains after two focused attempts, record:
  exact command,
  exact error,
  likely cause,
  and recommended next action,
  then stop.
- When all Phase 2 acceptance criteria pass, stop immediately.
- Do not perform an additional visual-polish pass.
- Do not start Phase 3.
- Do not commit or push unless explicitly asked.

==================================================
FINAL RESPONSE
==================================================

Report only:

1. Phase 2 domain entities and invariants implemented
2. Source Library workflow implemented
3. Coverage and Knowledge Gap Interviewer behavior implemented
4. Integration with the Phase 1 approval boundary
5. Files and documentation created or changed
6. Tests added and total passing test count
7. Validation commands and results
8. Honest limitations
9. Whether every Phase 2 acceptance criterion passed
10. Confirmation that no model calls, persistence, uploads, authentication, or Phase 3 work were introduced
11. Exact recommended Phase 3 objective without implementing it

END OF PHASE 2 TASK
