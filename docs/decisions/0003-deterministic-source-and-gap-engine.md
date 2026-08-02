# 0003: Deterministic source and knowledge-gap engine

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** Phase 2

## Context

Phase 2 must make real owner-supplied operational evidence and missing role knowledge actionable without introducing a backend, persistence, upload/parser pipeline, model, or automatic interpretation. The principal integrity risks are rewriting cited source history, treating wording similarity as evidence, generating fake interview intelligence, duplicating gaps/questions on reconciliation, or allowing an answer to bypass Phase 1 approval.

## Decision

1. Extend the existing session snapshot, defensive-copy in-memory repository, domain service, and employee selector. Do not introduce a parallel lifecycle or replace the Phase 1 write boundary.
2. Store plain-text source material as scoped versions. Drafts may be edited; available, superseded, and withdrawn versions are immutable. Correcting an available version creates a new draft, and activating it atomically marks the predecessor superseded without deleting either version.
3. Normalize line endings and retain one-based numbered lines. An anchored `SourceReference` identifies a document ID, exact version, and inclusive range; its title, type, locator, and excerpt are derived. Line addressing is deterministic provenance, not a cryptographic integrity or authentication guarantee.
4. Keep Phase 1 metadata-only references valid and immutable. Revising a document never rewrites historical references or the claims/decisions that cite them.
5. Define the first role’s 16 operational topics as checked-in typed configuration. Claims participate in coverage only through an explicit valid topic key. The pure coverage projection never compares, searches, embeds, or semantically classifies free text; conflict requires an explicit conflicting-information lifecycle record.
6. Reconcile stored `KnowledgeGap` workflow records from that pure projection. A scoped topic has at most one active unresolved gap. Re-running unchanged reconciliation preserves IDs, timestamps, and counts; a reasoned dismissal stays dismissed until genuinely new explicit candidate/conflict evidence warrants new work.
7. Generate interview prompts only from unresolved gaps and checked-in templates. Risk tier, catalog order, and template sequence give stable priority; one question is active; typed structured values trigger only explicit follow-up rules.
8. Retain every interview answer exactly and immutably. Submission appends an `owner-interview` reference and a same-topic `owner-interview-derived` proposed claim. Correction appends another answer/reference/claim rather than editing history.
9. Keep `approveKnowledgeClaim` plus its explicit append-only `ApprovalDecision` as the only publication operation. Successful approval may reconcile the related same-topic gap and make the current claim eligible for the unchanged employee selector. Rejection, skipping, answering, or dismissal never publishes knowledge.

## Consequences

- Exact evidence remains addressable after source correction, and the Source Library can show historical anchors and citing claims without a durable database.
- Coverage and question ordering are reproducible and independently testable, but owners must select topics and candidate wording manually; RelayOS makes no semantic-understanding claim.
- Interview branching is useful for known high-risk topics without pretending to be open-ended AI. New topics or branches require reviewed code/configuration changes.
- The aggregate performs multi-record document activation, answer creation, and gap resolution behind one validated repository replacement. There is still no durable transaction, multi-user concurrency, authorization, or recovery.
- Raw documents, questions, answers, gaps, rejected items, and unapproved claims remain outside employee display. Approved answer-derived wording preserves its interview provenance even after owner editing and approval.

## Alternatives not chosen

- **Mutable documents with line offsets updated in place:** rejected because prior citations would silently change meaning.
- **Content checksums presented as tamper proof:** rejected because session-only client memory supplies no authentication or durable integrity boundary.
- **Keyword, substring, fuzzy, embedding, or model-based topic coverage:** rejected because text resemblance is not reviewed evidence and would make conflicts/absence unsound.
- **A general chat interviewer:** rejected because Phase 2 has no model and must not invent policy or imply semantic understanding.
- **Answers directly updating policy:** rejected because it bypasses source provenance, explicit review, append-only decisions, and the employee boundary.
- **Computed gaps only with no workflow records:** rejected because reasoned dismissal, question/answer linkage, and resolution history need stable in-session identities; the read-only coverage result remains a pure projection.

## References

- [Architecture](../../ARCHITECTURE.md)
- [Domain model](../architecture/DOMAIN_MODEL.md)
- [Data flow](../architecture/DATA_FLOW.md)
- [Security boundary](../architecture/SECURITY.md)
- [Phase 2 execution plan](../exec-plans/phase-2-source-intake-interviewer.md)
