# RelayOS V1 scope

## Scope statement

The planned V1 transfers one operational role for one company: **Home-Service Office Manager / Dispatcher**. It builds a reviewed body of role knowledge, uses that knowledge to support an employee, and returns unresolved work to the owner as explicit escalations and improvement proposals.

“Planned V1” describes the product boundary, not permission to begin a later phase. Phase 4 packages the completed Phase 1–3 company/role, source/gap-interviewer, employee Question-to-System, and owner-escalation engine for an honest founding-client demonstration and manual delivery. It does not authorize Phase 5 or production infrastructure.

## Planned V1 capabilities

- Establish one company, one role, users, responsibilities, authority boundaries, and escalation rules.
- Capture source material and immutable references to the exact evidence used.
- Extract candidate claims and draft procedures or decision rules while keeping them visibly unapproved.
- Let an owner approve, reject, or request changes with append-only decision history.
- Retrieve only approved knowledge for an explicitly categorized employee question, then provide a cited grounded answer or fail closed.
- Record genuine missing, conflicting, provenance-invalid, unsupported, and unclear-authority deficiencies as knowledge gaps without treating every escalation as a gap.
- Turn selected gaps into source-backed improvement proposals for owner review.
- Use approved training scenarios and record attempts without treating model output as policy.
- Derive responsibility-level and role-level independence metrics from visible, deterministic components.
- Provide a deterministic no-API demonstration path for the complete supported loop.

The exact sequencing and storage or identity technology require later execution plans. Nothing in this list authorizes implementation beyond the active plan.

## Explicitly outside V1

- Generalized multi-company or multi-role tenancy and tenant administration
- Roles beyond Home-Service Office Manager / Dispatcher
- Autonomous approval, silent policy creation, or answers grounded in unapproved material
- Actions that exceed an employee’s recorded authority boundary
- A general-purpose document management, learning management, CRM, dispatch, payroll, or analytics platform
- Opaque AI-generated independence scores or employee surveillance metrics
- Provider-specific browser integrations or browser-held API secrets

## Completed Phase 1 baseline

Phase 1 provides:

- one company and one Home-Service Office Manager / Dispatcher role in current-page-session memory;
- a five-step setup for company details, role details, responsibilities, authority boundaries, escalation rules, and activation review;
- manually entered `SourceReference` metadata and deterministic `KnowledgeClaim` lifecycle decisions;
- explicit source-backed approval or rejection, append-only decision history, immutable approved versions, and revision/supersession behavior;
- owner views of actual current records and status-derived groups/counts;
- an employee route containing only current approved knowledge returned by the domain selector; and
- a fixed, visibly fictional, idempotent HVAC demonstration record.

## Completed Phase 2 boundary

Phase 2 adds:

- owner-pasted plain-text `SourceDocument` drafts and immutable available/revision history in current-session memory;
- stable one-based lines and exact derived `SourceReference` anchors while retaining Phase 1 metadata-only references;
- manual source-backed claim extraction with explicit canonical operational-topic assignment;
- a pure deterministic coverage map plus idempotently reconciled missing, incomplete, explicit-conflict, or unclear-authority gaps;
- a risk-prioritized, one-active-question deterministic owner interviewer with typed follow-up rules; and
- immutable interview answers that create `owner-interview` evidence and proposed claims, then use the existing decision and employee-selector boundaries.

Phase 2 did not provide AI/model behavior, automatic document interpretation or extraction, semantic retrieval, chat, employee questions or answers, file uploads or parsing, authentication, durable or browser persistence, Cloudflare data services, multi-company/multi-role behavior, training, scoring, analytics, or production infrastructure.

## Completed Phase 3 boundary

Phase 3 adds:

- immutable structured `EmployeeQuestion` records with explicit topic, request type, employee-selected sensitivity, request-specific typed context, and appended corrections;
- deterministic retrieval of current employee-visible approved claims by explicit topic, with exact source and approval provenance validation and independent explicit-conflict checks;
- ten inspectable eligibility gates plus fixed fail-closed precedence, with no confidence score, semantic retrieval, or free-text policy/authority inference;
- immutable fixed-template cited `Answer` records for supported informational or authorized action requests, plus grounded prohibited and safely withheld outcomes;
- structured authority-boundary and escalation-rule bindings, including structural numeric limits and currencies that are never parsed from prose;
- deterministic, idempotent `Escalation` records with explicit destinations or configured owner fallback, minimized typed context, and owner assignment/resolution/closure;
- question/evaluation-linked gap reuse only for genuine missing, conflicting, broken-provenance, unsupported, or unclear-authority deficiencies; and
- append-only safe `ActivityEvent` records and deterministic Summit Comfort examples covering the supported outcomes.

Phase 3 remains a current-page-session demonstration. It does not provide a model or model gateway, natural-language classification, semantic search, embeddings, RAG, free-form answer generation, automatic sensitivity or authority detection, network requests, messaging, file upload/parsing, authentication, durable or browser persistence, protected storage, multi-company/multi-role behavior, training, scoring, analytics, or production infrastructure. `/training` and `/settings` remain informational placeholders.

## Current Phase 4 pilot-launch boundary

Phase 4 adds:

- a public `/pilot` explanation with fixed founding-client offers, honest limitations, and a configurable public booking or email action;
- a phone-usable `/demo` that loads, summarizes, and narrowly resets only the deterministic fictional Summit Comfort records, including discount and technician-late examples;
- a print-ready Role Transfer Report built from actual current-session records and an Operating Manual summary whose guidance comes only from the existing approved employee-visible selector;
- a deterministic allowlisted JSON handoff download that excludes raw source text and raw sensitive question values by default, with a separately confirmed source-text option and no import;
- owner-facing intake and delivery checklists whose completion state is local to the rendered page; and
- an honest founding-pilot sales, intake, delivery, and case-study documentation package.

Phase 4 remains a static, unauthenticated, current-page-session tool. Public demo records are fictional only. Other routes are directly navigable and therefore must not receive confidential real-client material in a public deployment. A controlled private environment is required for any real pilot work until a later paid-pilot-driven plan adds identity, authorization, durable persistence, and protected delivery. Phase 4 adds no model calls, browser persistence, Cloudflare data services, billing, integrations, analytics, or full procedure generator. `/training` and `/settings` remain informational placeholders.

See [Product](PRODUCT.md), [User journeys](USER_JOURNEYS.md), [Architecture](../../ARCHITECTURE.md), and the [Phase 4 plan](../exec-plans/phase-4-pilot-launch-package.md).
