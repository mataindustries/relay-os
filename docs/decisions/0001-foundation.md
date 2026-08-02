# 0001: Repository and application foundation

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** Phase 0

## Context

RelayOS needs a small, production-quality base that later work can extend without rediscovering product boundaries. The highest-risk product mistake is treating extracted or generated content as company policy. The highest-risk technical mistake in the current phase is prematurely choosing backend, identity, storage, or model-provider architecture before those requirements have an execution plan.

## Decision

1. Use React, strict TypeScript, Vite, npm, React Router, Vitest, React Testing Library, ESLint, Prettier, and plain CSS. Keep dependencies minimal.
2. Ship Phase 0 as a Cloudflare Pages-compatible static SPA with direct-route fallback. Do not configure Workers, D1, R2, KV, authentication, databases, uploads, analytics, or production model calls.
3. Organize source by clear ownership: application composition, framework-free domain, features, infrastructure adapters, shared code, deterministic demo behavior, and test support. Add abstractions only when a current use requires them.
4. Establish employee visibility as an executable domain rule: unapproved knowledge cannot become employee-visible.
5. Treat documentation, tests, and the active execution plan as part of the repository contract. `AGENTS.md` remains a short map to deeper sources.
6. Preserve ten normative invariants in [Architecture](../../ARCHITECTURE.md), including provenance, append-only approvals, fail-closed escalation, deterministic metrics/demo mode, browser secret exclusion, and a future server-side `ModelGateway`.
7. Design V1 product language around one company and one Home-Service Office Manager / Dispatcher role before generalized multi-tenancy.

## Consequences

- The repository can validate routing, rendering, static deployment, and the critical approval boundary without pretending later systems exist.
- Feature routes remain informational placeholders; there are no fake dashboards, statistics, action controls, or data.
- Future server, persistence, authentication, ingestion, training, measurement, and AI choices remain open and require new decisions and execution plans.
- A later model integration cannot be added only in the client: it must introduce an authorized server boundary and `ModelGateway` while preserving deterministic demo behavior.
- Knowledge schemas may change, but later implementations must maintain the entity semantics and provenance rules in the [domain model](../architecture/DOMAIN_MODEL.md).

## Alternatives not chosen

- **Full-stack or Cloudflare data services now:** rejected because Phase 0 has no persistence or server requirement.
- **Provider SDK in the browser:** rejected because it exposes secrets and bypasses the required gateway and domain policy boundaries.
- **UI, state, or component framework:** rejected because the placeholder shell does not justify the dependency or abstraction cost.
- **General multi-tenant domain first:** rejected because it broadens scope before the first company/role loop is proven.
- **Documentation without executable policy:** rejected because the approved-knowledge boundary must be testable from the foundation.

## References

- [Product](../product/PRODUCT.md)
- [V1 scope](../product/V1_SCOPE.md)
- [Architecture](../../ARCHITECTURE.md)
- [Phase 0 execution plan](../exec-plans/phase-0-foundation.md)
