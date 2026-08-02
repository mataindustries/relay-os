# 0005: Package a founding-client pilot before production infrastructure

- **Status:** Accepted
- **Date:** 2026-08-02
- **Scope:** Phase 4

## Context

The completed Phase 1-3 engine already demonstrates the core RelayOS promise for one Home-Service Office Manager / Dispatcher role: reviewed source-backed knowledge, deterministic employee questions, cited answers, explicit authority, fail-closed escalation, genuine gaps, and append-only traces. The next business risk is not a missing cloud service; it is whether an owner understands and will pay for a Role Transfer Sprint.

Building authentication, durable persistence, multi-tenancy, billing, model routing, or production integrations before a paid pilot would select infrastructure without validated delivery requirements. At the same time, a public static route cannot safely expose real client records, and session-only work needs a practical manual handoff.

## Decision

1. Phase 4 packages the existing deterministic engine as a founding-client service and demonstration rather than a production SaaS product.
2. Public `/pilot` content is static. Public `/demo` may load and render only the fixed fictional Summit Comfort Heating & Air fixture. If a non-demo session is active, the route fails closed without showing or overwriting those records.
3. Demo reset is constrained to the fixed fictional company/role scope and installs a fresh aggregate-validated fixture. It cannot reset a non-demo session.
4. `/report` and `/manual` provide browser-print delivery from actual current-session records. The manual’s guidance uses the existing employee-visible selector; it does not generate Phase 5 procedure steps.
5. The pilot handoff export is an allowlisted JSON projection, not persistence. Raw source text is excluded by default, explicit confirmation is required to include it, raw employee question/free-text context is always omitted, and Phase 4 has no import.
6. CTA configuration uses `VITE_RELAYOS_CONTACT_EMAIL` and `VITE_RELAYOS_BOOKING_URL` as public static-build configuration. These values are never secrets.
7. Authentication, authorization, protected durable persistence, and production data handling remain a later paid-pilot-driven phase with their own threat model and execution plan.
8. No model call or provider abstraction is introduced. Current retrieval, eligibility, answer composition, counts, recommendations, print content, and export remain deterministic.

## Consequences

- A prospect can understand and demonstrate the value loop in under five minutes without fake metrics or production claims.
- A practitioner can deliver printable artifacts and a minimized handoff while the application remains session-only.
- Real client work still requires a controlled private process outside the public deployment. Print/export ease does not create confidentiality, authorization, durability, secure deletion, or a protected audit trail.
- The product can gather paid-pilot evidence before choosing production identity and storage infrastructure.
- Export cannot be presented as backup or migration because no import exists.
- A later Phase 5 procedure generator remains separate and must preserve approved-only guidance, citations, generated-origin labels, and explicit owner review.

## Alternatives not chosen

- **Production SaaS infrastructure first:** rejected because no paid-pilot requirement yet justifies the identity, storage, tenancy, retention, and operating choices.
- **Public demo using active session records:** rejected because a public route must never expose real client data.
- **Browser persistence as a shortcut:** rejected because `localStorage`, IndexedDB, or similar storage could imply unsupported confidentiality and durability.
- **PDF library:** rejected because browser print and dedicated Letter CSS meet the delivery requirement without another dependency.
- **Tour/component library:** rejected because six explicit route-linked steps fit the current visual system.
- **Snapshot dump as export:** rejected because raw documents, questions, contexts, and resolution text require an allowlist and explicit source-text control.
- **Model-generated sales/demo content or manual procedures:** rejected because Phase 4 needs no model and generated procedure work belongs to a later reviewed phase.

## References

- [Phase 4 execution plan](../exec-plans/phase-4-pilot-launch-package.md)
- [Security boundary](../architecture/SECURITY.md)
- [V1 scope](../product/V1_SCOPE.md)
- [Phase 3 policy-firewall decision](0004-deterministic-question-policy-firewall.md)
