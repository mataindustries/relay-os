# RelayOS architecture

RelayOS is a static React application with a deterministic Phase 3 Question-to-System policy firewall layered on the completed Phase 1 company-and-role lifecycle and Phase 2 source-intake and gap-interview engine. It has no backend, durable or browser persistence, identity, file upload or autonomous ingestion, semantic retrieval, messaging, or model integration. Future architecture in this document remains constraint, not implementation permission.

## Current system

Vite builds a client-side React/TypeScript SPA for Cloudflare Pages. React Router owns navigation, and a static fallback lets direct route requests reach the SPA. One application repository instance lives in React context for the current page session, so in-app navigation retains data and a reload clears it.

Framework-free domain entities and the existing domain service own company/role relationships, role-composition validation, source-document versioning, line anchors, explicit-topic coverage, interview lifecycles, claim lifecycle transitions, approval, revision, supersession, employee eligibility, structured employee questions, deterministic eligibility evaluations, answers, escalations, genuine-gap linkage, and append-only activity events. Small repository interfaces separate those rules from the in-memory adapter. Application and feature code may use domain and shared code; domain code must not import React, browser APIs, or infrastructure. See [ADR 0002](docs/decisions/0002-company-role-engine.md), [ADR 0003](docs/decisions/0003-deterministic-source-and-gap-engine.md), and [ADR 0004](docs/decisions/0004-deterministic-question-policy-firewall.md).

The current application can establish one company and one role, paste plain-text source documents into session memory, activate immutable versions, derive exact line references, manually extract explicitly topic-assigned claims, reconcile coverage gaps, and retain deterministic owner-interview answers as unapproved source-backed claims. An employee can submit a structured question with an explicit topic, request type, sensitivity selection, and request-specific context. RelayOS then uses only explicit records to deliver fixed-template cited guidance, report a grounded prohibition, withhold, or open an escalation. Fixed fictional HVAC demo data exercises the same domain and repository boundaries and loads idempotently. No source or question is transmitted, semantically interpreted, authenticated, or independently verified.

## Current operating loop

```text
structured employee question
  -> explicit topic, request type, sensitivity, and typed context
  -> retrieve current employee-visible approved claims for that topic
  -> deterministic policy firewall
  -> cited answer OR prohibited / withheld / escalation outcome
  -> create or link a KnowledgeGap only for a real system deficiency
  -> owner resolves the escalation without creating policy
  -> source / interview / review workflow may later produce approved knowledge
```

The question, evaluation, answer, escalation, gap, resolution, candidate claim, and resulting approved knowledge are distinct records. Resolution never approves knowledge or resolves a gap, approval never rewrites an item’s origin, and an answer never becomes policy. See [data flow](docs/architecture/DATA_FLOW.md) and [domain model](docs/architecture/DOMAIN_MODEL.md).

## Deterministic policy firewall

Every evaluation records these gates in fixed order: `scope-valid`, `topic-valid`, `request-context-valid`, `current-approved-knowledge-present`, `provenance-valid`, `no-explicit-conflict`, `sensitivity-clear`, `authority-clear`, `escalation-rule-clear`, and `answer-mode-supported`. Each gate records `pass`, `fail`, or `not-applicable`, a concise safe reason, and supporting record IDs. Question text is retained as input but is never searched or parsed to infer topic, policy, sensitivity, conflicts, authority, limits, or destination.

Outcome precedence is fail-closed: invalid scope/topic/context; employee-selected sensitivity; an explicitly matching prohibition; a matching mandatory escalation rule or approval/escalation boundary; missing, conflicting, or provenance-invalid approved knowledge; missing or incompatible structured authority for an action request; then an eligible supported answer. An earlier safety result cannot be overridden by a later gate. Informational lookups may return approved guidance but never grant authority. Action requests require an explicit structured boundary, and numeric limits are compared only as structured values.

## Normative system rules

These rules are architectural acceptance criteria. Later storage, APIs, UI, and tests must enforce them at every write and read boundary.

| #   | Rule                                                                                                                              | Required enforcement                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Employee-visible answers may use only approved knowledge.                                                                         | The approved-knowledge selector and Phase 3 provenance gates admit only exact current approved claim versions.                       |
| 2   | Generated or inferred content must remain visibly unapproved.                                                                     | Manual extraction and interview-derived claims remain proposals; deterministic answers are immutable outcome records, not knowledge. |
| 3   | Every approved knowledge item must retain its source and approval history.                                                        | Approval requires exact references and a decision; every delivered answer records claim, source, and exact decision IDs.             |
| 4   | Missing, conflicting, sensitive, provenance-invalid, or unclear-authority conditions cause a fail-closed result, never invention. | The policy firewall withholds or escalates and links a gap only when the records expose a genuine system deficiency.                 |
| 5   | Approval history is append-only.                                                                                                  | The Phase 1 domain service appends immutable decisions; revisions create new claim versions.                                         |
| 6   | Independence scores must be derived from visible components, not generated by a language model.                                   | A later phase must introduce a versioned deterministic formula with inspectable inputs and tests.                                    |
| 7   | No API secret may exist in browser code.                                                                                          | Build/config review and secret scanning; browser receives only public configuration.                                                 |
| 8   | Model providers must be accessed through a server-side `ModelGateway` abstraction in a later phase.                               | No provider SDK or call in client/domain code; gateway boundary owns provider access.                                                |
| 9   | The application must support a deterministic no-API demonstration mode.                                                           | Fixed Phase 0–3 records and outcomes load idempotently without model or network access.                                              |
| 10  | The first version supports one company and one role well before supporting generalized multi-tenancy.                             | The domain service rejects cross-company/role relationships and does not expose tenant administration.                               |

Rule 2 means a deterministic Phase 3 answer may be delivered only from fixed templates and eligible approved knowledge with citations. It is never silently promoted into reusable knowledge. A future model may improve wording only after the same eligibility result and may never alter policy, authority, escalation, or citations. Rule 4 takes precedence whenever any earlier safety condition fails. More detail is in [AI boundaries](docs/architecture/AI_BOUNDARIES.md).

## Knowledge states and traceability

- **Source material** is represented by immutable available `SourceDocument` versions held in session memory and by immutable `SourceReference` records. A reference may remain Phase 1 metadata-only or cite an exact historical document version and inclusive line range.
- **Extracted claims** remain unavailable until an owner decision; extraction is not approval.
- **Interview answers** retain the exact owner input and create `owner-interview` evidence plus an unapproved same-topic claim. Editing proposal wording does not rewrite the answer.
- **Generated proposals** preserve their generated origin and referenced evidence.
- **Owner-approved knowledge** is an immutable revision with sources and an append-only `ApprovalDecision` history.
- **Rejected knowledge** is retained with its rejection decision and never retrieved as approved.
- **Employee questions** retain the original explicit selections and typed context. Corrections append a linked question; evaluation never rewrites the original.
- **Eligibility evaluations and answers** are immutable, correlated records. Delivered guidance cites exact claims, sources, and approval decisions; informational guidance explicitly does not authorize action.
- **Escalations and activity events** retain a safe trace of deterministic routing and lifecycle actions. Resolution is operational history, not policy evidence.
- **Missing, incomplete, conflicting, provenance-invalid, unsupported, or unclear-authority information** can create or reuse a topic-scoped `KnowledgeGap`. A known approval, escalation, emergency, sensitivity-handling, or prohibition rule does not create a fake gap.

## Hosting and later boundaries

Phase 3 still deploys only static assets. Its in-memory pasted sources, questions, escalations, and traces are a product demonstration, not protected or durable company storage. Cloudflare Workers, D1, R2, KV, authentication, messaging, and secrets are intentionally absent. Before introducing model calls or protected company information, a later plan must add a server trust boundary, authorization, durable audit/provenance storage, and the `ModelGateway` described in [security](docs/architecture/SECURITY.md).

## Key references

- [Product boundary](docs/product/V1_SCOPE.md)
- [Domain entities](docs/architecture/DOMAIN_MODEL.md)
- [Data flow](docs/architecture/DATA_FLOW.md)
- [Foundation ADR](docs/decisions/0001-foundation.md)
- [Company and role engine ADR](docs/decisions/0002-company-role-engine.md)
- [Deterministic source and gap engine ADR](docs/decisions/0003-deterministic-source-and-gap-engine.md)
- [Deterministic question policy firewall ADR](docs/decisions/0004-deterministic-question-policy-firewall.md)
- [Execution plans](docs/exec-plans/README.md)
