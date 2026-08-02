# 0004: Deterministic question policy firewall

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** Phase 3

## Context

Phase 3 must answer the first employee operational questions without weakening the completed approved-knowledge, provenance, gap, and interview lifecycles. The principal integrity risks are treating question wording as a trusted retrieval or classification signal, composing guidance from unapproved or broken evidence, confusing informational guidance with permission, parsing authority limits from prose, creating a gap for every correct escalation, or allowing an owner’s one-time resolution to become company policy.

The application remains a session-only static demonstration with no model, semantic retrieval, server, identity, persistence, upload, or messaging boundary. Its answer decision therefore has to be explicit, deterministic, inspectable, and independently testable.

## Decision

1. Require every `EmployeeQuestion` to carry an explicit canonical topic, request type, employee-selected sensitivity value, and a discriminated request-specific context. Retain the original question text, but never search or parse it to infer topic, policy, sensitivity, conflict, authority, limits, urgency, or escalation destination.
2. Retrieve knowledge only by the explicit topic and the existing employee-visible selector. Every delivered claim must be current, approved, in active company/role scope, nonsuperseded, source-backed, and linked to an exact-version approval decision. Explicit same-topic conflict records are checked independently.
3. Persist ten gates in fixed order: scope, topic, request context, current approved knowledge, provenance, no explicit conflict, sensitivity, authority, escalation rule, and supported answer mode. Each records `pass`, `fail`, or `not-applicable`, a concise safe reason, and supporting record IDs. No confidence score participates.
4. Use fixed fail-closed outcome precedence: invalid scope/topic/context; employee-selected sensitivity; explicitly matching prohibition; mandatory escalation or approval; missing/conflicting/invalid knowledge; missing or incompatible structured authority for an action request; then supported eligible answer. An earlier safety result cannot be overridden by a later gate.
5. Compose eligible answers only from fixed labels and sentence templates. Cite every substantive statement to admitted claim, source-reference, and approval-decision IDs in stable order. An informational lookup can return approved guidance without an authority grant and must state that it does not authorize action.
6. Extend Phase 1 `AuthorityBoundary` and `EscalationRule` records with optional explicit topic/request bindings and typed constraints. Existing unbound records remain valid owner context but cannot deterministically authorize or route a Phase 3 question. Numeric limits and currencies are compared only as structured values; prose is never parsed.
7. Interpret structured permission levels explicitly: matching `may-decide` may authorize only a supported nonfinancial, nonemergency action with no structured amount; compatible `may-act-within-limit` may authorize an amount-bearing action. When several compatible amount limits match, the smallest limit governs. `must-request-approval` and `must-escalate` open an escalation; `prohibited` produces a grounded prohibited outcome; incompatible or missing structured action authority fails closed.
8. Take an escalation destination only from a matching structured rule/boundary or an explicitly configured owner fallback. Assemble required context from typed fields, minimize sensitive values, and never invent a recipient. Re-evaluation reuses the same open escalation and immutable question outcome.
9. Create or reuse a `KnowledgeGap` only for a genuine deficiency: missing approved knowledge, explicit conflict, invalid provenance, unsupported absent policy/procedure, or absent structured authority. Link the triggering question and evaluation. A known approval, mandatory-escalation, emergency, sensitivity-handling, or prohibition rule does not create a gap merely because it correctly routes or restricts work.
10. Keep `EmployeeQuestion`, `AnswerEligibilityEvaluation`, and `Answer` immutable after evaluation. Corrections append linked questions. Append safe `ActivityEvent` records for meaningful question, answer, escalation, and gap-link actions; events are traceability records, not policy evidence or analytics.
11. Treat escalation assignment, resolution, and closure as operational history. Resolution cannot create or approve knowledge, edit the question or answer, change approval history, or resolve/dismiss a gap. Reusable guidance must still enter the source/interview/claim review path and receive a separate approval decision.
12. Permit no model participation in Phase 3 retrieval, eligibility, policy, authority, escalation, citations, or answer wording. A future model may draft presentation wording only after the firewall fixes an eligible outcome and citation set, and it may never alter either.

## Consequences

- Employees receive reproducible cited guidance or an honest explicit failure state; fluent wording can never mask missing evidence or authority.
- Owners can inspect the exact gate statuses and linked records without exposing hidden chain-of-thought or claiming semantic understanding.
- Structured forms require more deliberate employee input and cannot detect an incorrect sensitivity selection in arbitrary text.
- Existing Phase 1 authority/rule records remain compatible, but they need reviewed structured bindings before they can drive Phase 3 authorization or routing.
- Known human-control policy does not pollute coverage with fake deficiencies, while real missing/conflicting/provenance/authority conditions remain linked to the existing gap and improvement workflows.
- Historical question outcomes remain stable after later knowledge changes. A new or corrected question is required to evaluate the updated operating system.
- Session-only traces disappear on reload and provide no authentication, confidentiality, durable audit, notification, or professional-advice guarantee.

## Alternatives not chosen

- **Natural-language or keyword classification:** rejected because wording resemblance is not reviewed topic, sensitivity, authority, or policy evidence.
- **Semantic search, embeddings, or RAG:** rejected because Phase 3 requires explicit-topic deterministic retrieval and has no model or server boundary.
- **Generate first and filter afterward:** rejected because unapproved or ineligible material must never enter answer composition.
- **Parse numeric limits or recipients from prose:** rejected because free text is ambiguous and cannot safely grant authority or route work.
- **Create a gap for every escalation:** rejected because correct approval, emergency, sensitive-handling, or prohibition policy is functioning knowledge, not a system deficiency.
- **Treat an owner’s resolution as policy:** rejected because it bypasses sources, immutable claim versions, append-only approval decisions, and the employee selector.
- **Let a model decide eligibility or improve a withheld answer:** rejected because provider output cannot override deterministic trust and authority decisions.

## References

- [Architecture](../../ARCHITECTURE.md)
- [Domain model](../architecture/DOMAIN_MODEL.md)
- [AI boundaries](../architecture/AI_BOUNDARIES.md)
- [Data flow](../architecture/DATA_FLOW.md)
- [Security boundary](../architecture/SECURITY.md)
- [Phase 3 execution plan](../exec-plans/phase-3-question-to-system.md)
