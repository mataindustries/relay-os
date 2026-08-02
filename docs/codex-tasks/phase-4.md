# RelayOS Phase 4 Task — Pilot Launch Package

Implement Phase 4 of RelayOS: Pilot Launch Package.

This phase is intentionally smaller than Phases 1–3. It exists to make the
current deterministic RelayOS demo easy to understand, demonstrate, export, and
sell as a founding-client service.

Do not build production authentication, durable persistence, multi-tenancy,
billing, model routing, or external integrations in this phase.

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
- docs/decisions/0004-deterministic-question-policy-firewall.md
- docs/exec-plans/README.md
- docs/exec-plans/phase-0-foundation.md
- docs/exec-plans/phase-1-company-role-engine.md
- docs/exec-plans/phase-2-source-intake-interviewer.md
- docs/exec-plans/phase-3-question-to-system.md

Inspect the current routes, demo loader, question-to-system flow, owner
workspace, employee workspace, source library, interviewer, review queue,
escalation queue, print styles, and Cloudflare Pages setup before planning.

Preserve every passing Phase 1–3 invariant and test.

## CURRENT BASELINE

Phase 3 is complete and currently provides:

- deterministic structured employee questions;
- fixed-order answer-eligibility gates;
- approved-only source-backed retrieval;
- provenance, conflict, sensitivity, authority, and escalation gates;
- deterministic cited answers;
- fail-closed outcomes;
- escalations;
- genuine knowledge-gap creation and linkage;
- append-only activity events;
- owner escalation workflow;
- deterministic fictional HVAC demo;
- 214 passing tests across 11 files;
- no model calls, network integrations, authentication, or persistence.

## CREATE THE EXECUTION PLAN FIRST

Create:

`docs/exec-plans/phase-4-pilot-launch-package.md`

Before changing application code, write:

- goal;
- non-goals;
- current baseline;
- work breakdown;
- acceptance criteria;
- validation plan;
- risks;
- stop conditions.

Do not implement application code until the execution plan exists.

==================================================
OBJECTIVE
==================================================

Turn RelayOS into a polished founding-client demonstration and delivery tool
that can help sell a paid Role Transfer Sprint this month.

The product must make the value understandable in under five minutes:

1. What RelayOS does.
2. Why approved knowledge matters.
3. How owner knowledge becomes a role operating system.
4. How an employee asks a question.
5. How RelayOS answers safely or escalates.
6. How gaps improve the operating system.
7. What a founding-client pilot includes.
8. What RelayOS does not yet provide.

This phase must make the current product easier to sell without pretending it is
already a production multi-user SaaS.

==================================================
IN SCOPE
==================================================

- Public pilot landing page
- Guided fictional demo
- Demo reset
- Read-only demo summary
- One-click demo entry
- Clear owner and employee journey
- Print-ready Role Transfer Report
- Print-ready Operating Manual summary
- Exportable pilot handoff package
- Founding-client offer page
- Pilot intake checklist
- Delivery checklist
- Sales/demo script documentation
- Case-study template
- Configurable contact or booking action
- Cloudflare Pages deployment readiness
- Responsive and print validation
- Tests and documentation

==================================================
OUT OF SCOPE
==================================================

Do not implement:

- authentication;
- authorization;
- real client accounts;
- durable server-side persistence;
- Cloudflare D1, R2, KV, Workers, or Durable Objects;
- localStorage, sessionStorage, or IndexedDB;
- OpenAI or other model calls;
- Luna, Terra, or Sol routing;
- embeddings or semantic search;
- billing or subscriptions;
- payment processing;
- email or SMS sending;
- calendar integrations;
- file uploads;
- website crawling;
- multi-company support;
- multi-role support;
- analytics dashboards;
- production telemetry;
- background jobs;
- notifications;
- Phase 5 work.

Do not begin production infrastructure.

==================================================
PUBLIC PILOT PAGE
==================================================

Add a public route:

- `/pilot`

The pilot page must explain:

- Product name: RelayOS
- Positioning: Transfer the role, not just the instructions.
- Primary use case: Home-Service Office Manager / Dispatcher
- The owner problem:
  repeated questions, undocumented decisions, slow onboarding, owner
  interruption, and lost knowledge
- The RelayOS loop:
  source material
  → reviewed knowledge
  → employee question
  → cited answer or escalation
  → knowledge gap
  → owner-approved improvement
- The approved-knowledge principle
- The deterministic policy firewall
- The current founding-client service
- Honest limitations

Use a clear founding-client offer:

## RelayOS Role Transfer Sprint — $1,250

Include:

- one operational role;
- owner knowledge-capture session;
- source organization;
- up to 12 core procedures or decision areas;
- authority and escalation map;
- employee question workspace;
- first 30-day onboarding structure;
- gap report;
- final Role Transfer Report;
- four weeks of guided refinement.

Also include a founding pilot option:

## Founding Pilot — $750

Include:

- one operational role;
- up to 8 core procedures or decision areas;
- authority and escalation map;
- deterministic question workspace;
- two weeks of guided refinement;
- final gap report.

Do not claim guaranteed savings, productivity, compliance, revenue, or employee
performance.

Add a configurable CTA using environment variables:

- `VITE_RELAYOS_CONTACT_EMAIL`
- `VITE_RELAYOS_BOOKING_URL`

If neither is configured, show an honest fallback:

“Reply to the person who shared this demo to discuss a founding pilot.”

Do not create a fake submission success state.

==================================================
GUIDED DEMO
==================================================

Add a focused route:

- `/demo`

The route must load the deterministic fictional Summit Comfort Heating & Air
workspace without duplication.

Provide a guided demo with six explicit steps:

1. Company and role
2. Source-backed knowledge
3. Coverage and gaps
4. Employee question
5. Safe answer or escalation
6. System improvement loop

Each step should:

- explain the business value in one concise paragraph;
- link to the real existing route;
- show actual derived record counts;
- include one “What to notice” callout;
- include one “Why this saves time” callout;
- avoid fake metrics.

Provide:

- Start demo
- Continue demo
- Reset fictional demo
- Return to pilot page

Reset must affect only deterministic fictional demo records and must not pretend
to preserve user-created data.

Do not implement a heavy tour library unless one already exists and is clearly
necessary.

==================================================
DEMO SCENARIO
==================================================

Make one primary guided scenario easy to demonstrate:

An employee asks whether they may approve a customer discount.

The demo must show:

- the employee’s structured question;
- the matching topic;
- approved company guidance;
- the structured authority boundary;
- a within-limit answer;
- an above-limit escalation;
- the cited source;
- the owner approval record;
- the escalation queue;
- the related system gap only when genuinely appropriate.

Add a second scenario:

A technician is running late and the customer is upset.

Show:

- approved handling guidance when available;
- escalation when the requested commitment exceeds employee authority;
- no invented promises.

The demo should make it possible to present RelayOS from a phone.

==================================================
ROLE TRANSFER REPORT
==================================================

Add a print-ready route:

- `/report`

Create a professional report using only actual current session records.

Sections:

1. Company and role
2. Role mission
3. Responsibilities
4. Authority boundaries
5. Escalation rules
6. Approved knowledge by topic
7. Coverage summary
8. Open knowledge gaps
9. Question-to-System examples
10. Escalation examples
11. Remaining owner dependencies
12. Recommended next system-building priorities
13. Provenance and approval appendix
14. Current limitations

Requirements:

- excellent print CSS;
- no navigation in print;
- page-break control;
- readable at US Letter size;
- no fake scores;
- no invented recommendations;
- recommendations must derive from open critical/high gaps and actual unresolved
  records;
- clearly identify the fictional demo when demo data is loaded;
- include generation date from the injected or application clock;
- no browser secrets or source content that should remain owner-only.

Add:

- Print / Save as PDF
- Return to owner workspace

Do not add a PDF library unless print CSS is insufficient.

==================================================
OPERATING MANUAL SUMMARY
==================================================

Add a print-ready route:

- `/manual`

This is not a full Phase 5 procedure generator.

It should organize existing approved RelayOS records into a concise operating
manual summary.

Sections:

- Role identity
- Daily responsibility overview
- Approved guidance by operational topic
- Authority map
- Escalation map
- Source and approval appendix
- Known gaps and “Do not guess” areas

Rules:

- only approved employee-visible knowledge may appear as guidance;
- proposed, rejected, conflicting, missing, and superseded claims must not appear
  as policy;
- gaps may appear only in a clearly separate owner-facing “Known gaps” section;
- no generated procedure steps may be invented;
- no unapproved interview answer may appear;
- print styling must be professional and restrained.

==================================================
PILOT HANDOFF EXPORT
==================================================

Add a session-only export action that downloads a deterministic JSON package.

The package should include:

- schema version;
- exportedAt;
- company;
- role;
- responsibilities;
- authority boundaries;
- escalation rules;
- source metadata;
- approved knowledge;
- approval decisions;
- coverage states;
- gaps;
- questions;
- answers;
- escalations;
- safe activity events.

Exclude:

- secrets;
- environment variables;
- raw source document content unless the owner explicitly chooses an
  “Include source text” option;
- raw sensitive question content;
- browser-only implementation details.

Requirements:

- default export excludes raw source text;
- optional source-text inclusion requires explicit confirmation;
- export is deterministic apart from exportedAt;
- export operation does not change application state;
- downloaded filename is safe and derived from the fictional or active company;
- document the lack of import in this phase unless an existing safe import
  already exists.

Do not implement durable persistence disguised as export.

==================================================
PILOT INTAKE AND DELIVERY CHECKLISTS
==================================================

Add owner-facing static-functional routes or sections:

- `/pilot/intake`
- `/pilot/delivery`

The intake checklist should cover:

- target role;
- job description;
- business overview;
- recurring responsibilities;
- current SOPs;
- customer scripts;
- authority limits;
- escalation contacts;
- common exceptions;
- sensitive information boundaries;
- current tools;
- desired outcomes;
- available owner interview time.

The delivery checklist should cover:

- company and role verified;
- sources organized;
- critical topics reviewed;
- authority map approved;
- escalation map approved;
- employee guidance reviewed;
- demo scenarios tested;
- gaps documented;
- report generated;
- manual generated;
- employee walkthrough completed;
- owner walkthrough completed;
- next review date recorded outside RelayOS.

These checklists may be interactive for the current session but must clearly
state that completion is not persisted.

Do not create fake CRM or project-management functionality.

==================================================
CASE-STUDY TEMPLATE
==================================================

Add:

`docs/CASE_STUDY_TEMPLATE.md`

Include:

- client context;
- role transferred;
- owner bottlenecks before RelayOS;
- source materials captured;
- approved knowledge created;
- authority decisions clarified;
- escalations clarified;
- employee questions handled;
- gaps discovered;
- owner interruptions before and after;
- qualitative client quote;
- limitations;
- permission checklist.

Do not create fabricated outcomes or quotes.

==================================================
SALES AND DELIVERY DOCUMENTATION
==================================================

Create:

- `docs/SALES_DEMO_SCRIPT.md`
- `docs/FOUNDING_PILOT_PLAYBOOK.md`
- `docs/CLIENT_INTAKE_QUESTIONS.md`
- `docs/DELIVERY_CHECKLIST.md`

The sales demo script should support a 7-minute presentation:

1. 45 seconds — owner problem
2. 60 seconds — approved knowledge principle
3. 90 seconds — employee question and cited answer
4. 90 seconds — escalation and policy firewall
5. 60 seconds — gap improvement loop
6. 45 seconds — report and manual
7. 30 seconds — founding pilot offer

The founding pilot playbook should include:

- who to target;
- hiring-trigger outreach;
- discovery call;
- scope boundary;
- source collection;
- owner interview;
- review process;
- employee walkthrough;
- delivery;
- case-study request;
- upsell path.

Keep sales claims honest and specific.

==================================================
DESIGN
==================================================

Use the current visual system.

Do not redesign the application.

Improve only what is necessary for:

- clear public pilot presentation;
- phone-based demonstration;
- professional report/manual printing;
- visible CTA;
- honest demo disclosures;
- clean empty states.

Avoid:

- generic AI purple;
- excessive gradients;
- animated backgrounds;
- fake testimonials;
- fake logos;
- fake awards;
- fake statistics;
- stock-photo dependence;
- elaborate motion;
- new component libraries.

==================================================
DEMO AND DATA SAFETY
==================================================

All public demo routes must use only fictional data.

The application must never expose real client records through a public demo
route.

Because Phase 4 has no authentication or persistence, include clear warnings:

- Use only fictional or non-sensitive data in the public deployment.
- Real client work should be performed in a controlled private environment until
  production security and persistence are implemented.
- Session data disappears on reload.

Do not weaken existing source, employee-visibility, or sensitivity safeguards.

==================================================
TEST REQUIREMENTS
==================================================

Add focused tests for:

Pilot page:

- founding offer copy;
- CTA with booking URL;
- CTA with email;
- honest fallback with neither configured;
- no fake form success;
- limitations visible.

Guided demo:

- deterministic demo loading;
- idempotent reset/load behavior;
- six steps;
- actual derived counts;
- scenario links;
- fictional disclosure.

Report:

- actual record rendering;
- approved-only guidance;
- open-gap rendering;
- derived priorities;
- fictional disclosure;
- no fake score;
- print controls.

Manual:

- approved-only knowledge;
- unapproved exclusion;
- conflicting exclusion;
- superseded exclusion;
- known-gap separation;
- source and approval appendix.

Export:

- deterministic structure;
- schema version;
- raw source text excluded by default;
- explicit opt-in inclusion;
- sensitive raw values excluded;
- no state mutation;
- safe filename.

Checklist routes:

- required items;
- session-only disclosure;
- no fake persistence.

Regression:

- all Phase 1–3 tests;
- employee visibility boundary;
- escalation behavior;
- gap behavior;
- demo idempotency;
- direct routes.

Avoid large snapshots.

==================================================
DOCUMENTATION
==================================================

Update only documentation affected by Phase 4.

Required:

- mark Phase 3 consistently Complete;
- create and complete the Phase 4 execution plan;
- update AGENTS.md for Phase 4;
- update README.md with pilot/demo/report routes;
- update V1_SCOPE.md with the pilot-launch boundary;
- update USER_JOURNEYS.md with public demo and pilot delivery;
- update SECURITY.md with public-demo restrictions;
- create:
  `docs/decisions/0005-pilot-before-production-infrastructure.md`

The ADR should explain:

- why RelayOS is packaging a sellable service before production SaaS
  infrastructure;
- why public demo routes use fictional data only;
- why print/export supports manual pilot delivery;
- why authentication and durable persistence remain a later paid-pilot-driven
  phase;
- why no new model calls are introduced.

Do not claim production readiness.

==================================================
ACCEPTANCE CRITERIA
==================================================

Phase 4 is complete only when:

1. All Phase 1–3 behavior and tests remain intact.
2. Phase 3 documentation is consistently Complete.
3. `/pilot` clearly explains RelayOS and the founding offer.
4. CTA configuration and fallback are honest.
5. `/demo` provides a six-step guided fictional demonstration.
6. Demo load/reset remains deterministic and idempotent.
7. The discount and technician-late scenarios are easy to demonstrate.
8. `/report` renders a professional actual-record Role Transfer Report.
9. `/manual` contains only approved guidance.
10. Print CSS is present and usable.
11. JSON export works and excludes raw source text by default.
12. Sensitive raw values are excluded from export.
13. Pilot intake and delivery checklists are available.
14. Sales, intake, delivery, and case-study documentation exists.
15. Public demo routes use fictional data only.
16. Session-only and non-production limitations are visible.
17. No authentication, persistence, model calls, billing, or production
    infrastructure is introduced.
18. Direct navigation to all new routes works.
19. The app remains usable at 360px without evident horizontal overflow.
20. `npm run format`, `npm run check`, and `npm run build` pass.
21. Phase 5 is not started.

==================================================
VALIDATION
==================================================

After implementation, run:

- npm run format
- npm run check
- npm run build

Run a local production preview and verify direct requests to:

- /pilot
- /demo
- /report
- /manual
- /pilot/intake
- /pilot/delivery
- /employee
- /escalations
- /owner

Inspect for:

- external requests;
- browser secrets;
- browser persistence;
- unsafe HTML;
- real data on public demo routes;
- unapproved knowledge in the manual;
- raw source text in default export;
- sensitive values in export;
- fake metrics;
- fake testimonials;
- broken print layout;
- later-phase infrastructure;
- obvious 360px overflow.

If no browser executable exists, document the limitation and use focused
component tests plus static responsive and print-CSS inspection.

==================================================
LOOP AND TOKEN CONTROL
==================================================

- Inspect the repository once before planning.
- Write the Phase 4 execution plan before application code.
- Do not replace the existing architecture.
- Preserve all passing tests.
- Do not implement production infrastructure.
- Do not add a model.
- Do not add dependencies unless clearly required.
- Do not perform unrelated cleanup.
- Do not redesign completed screens.
- Do not repeatedly rerun an unchanged failing command.
- Run the complete quality gate once after implementation.
- Make at most two focused repair passes after the first complete gate.
- If an environmental issue remains, document it and stop.
- When all acceptance criteria pass, stop immediately.
- Do not perform an extra polish pass.
- Do not start Phase 5.
- Do not commit or push unless explicitly asked.

==================================================
FINAL RESPONSE
==================================================

Report only:

1. Pilot page and offer implemented
2. Guided demo implemented
3. Report and manual implemented
4. Export implemented
5. Pilot intake and delivery workflow implemented
6. Sales and case-study documentation created
7. Tests added and total passing count
8. Validation commands and results
9. Honest limitations
10. Whether every Phase 4 acceptance criterion passed
11. Confirmation that no auth, persistence, model calls, billing, or Phase 5
    work was introduced
12. Exact recommended post-Phase-4 sales action and later Phase 5 objective
    without implementing either

END OF PHASE 4 TASK
