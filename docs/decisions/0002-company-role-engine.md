# 0002: Session-only company and role engine

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** Phase 1

## Context

Phase 1 must prove the first company/role and approved-knowledge vertical slice without choosing authentication, durable storage, browser persistence, source ingestion, or AI infrastructure. The principal integrity risks are letting UI state bypass domain rules, editing approved policy in place, losing decision provenance, or making an unapproved version employee-visible.

## Decision

1. Keep entities, validation, lifecycle transitions, revision rules, and employee eligibility in framework-free TypeScript domain code. React and browser APIs do not enter the domain.
2. Use one application/domain service as the write boundary for active company/role ownership, role composition, claim decisions, revisions, and supersession. UI components do not mutate repository arrays directly.
3. Define small repository interfaces around current Phase 1 operations. Supply one in-memory adapter for both the application and tests; do not add a durable adapter, browser storage, or synchronization behavior.
4. Hold exactly one repository instance in application context for the current page session. In-app navigation retains records; reload discards them.
5. Store approved knowledge as immutable claim versions. Revising an approved claim creates a proposed version with an incremented version and a link to its predecessor. Only successful approval of that revision supersedes the prior approved version.
6. Append immutable `ApprovalDecision` records against exact claim versions. Approval requires an explicit decision plus at least one resolvable `SourceReference`; rejection also appends its reason.
7. Inject clocks and ID creation where domain/repository operations need them so tests and the fixed fictional demo remain deterministic without another dependency.
8. Load the Summit Comfort Heating & Air fixture through stable IDs and repository/domain operations so repeated selection in one session is idempotent and uses the same visibility gate as owner-entered records.

## Consequences

- Domain tests can exhaustively cover transition, provenance, versioning, scope, and visibility rules without rendering React.
- Focused UI tests verify that setup and review controls call the same protected operations.
- The employee route consumes a selector, not a general claim list, so unresolved and historical versions cannot leak through presentation filtering mistakes.
- Repository interfaces establish a real substitution boundary for later persistence without selecting its technology now.
- The in-memory adapter provides no confidentiality, durability, concurrency, recovery, or cross-tab synchronization. Phase 1 data is demonstration data and disappears on reload.
- Source references are owner-entered metadata; RelayOS neither stores nor verifies the referenced source material.

## Alternatives not chosen

- **Raw React arrays as the source of truth:** rejected because UI code could bypass lifecycle and ownership rules.
- **Reducer-only domain behavior:** rejected because business rules must remain usable without React.
- **`localStorage` or IndexedDB:** rejected because browser persistence is explicitly outside Phase 1 and could imply unsupported durability or security.
- **Database or Cloudflare adapter:** rejected until identity, authorization, data classification, and persistence requirements have their own plan.
- **Mutable approved records:** rejected because silent edits break source and approval traceability.
- **Event sourcing:** rejected as unnecessary for an in-memory vertical slice; append-only decisions and immutable claim versions provide the required semantics without speculative infrastructure.

## References

- [Architecture](../../ARCHITECTURE.md)
- [Domain model](../architecture/DOMAIN_MODEL.md)
- [Data flow](../architecture/DATA_FLOW.md)
- [Security boundary](../architecture/SECURITY.md)
- [Phase 1 execution plan](../exec-plans/phase-1-company-role-engine.md)
