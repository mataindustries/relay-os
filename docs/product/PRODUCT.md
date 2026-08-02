# RelayOS product

## Purpose

RelayOS turns operational knowledge trapped in a business owner’s head and source material into a reviewed, source-backed operating system for one employee role. Its promise is: **Transfer the role, not just the instructions.**

The first supported role is **Home-Service Office Manager / Dispatcher**. RelayOS is not a generic knowledge base: it must help an employee act within explicit procedures, decisions, responsibilities, authority, and escalation boundaries while preserving owner control over company policy.

## People and outcomes

- The **owner** supplies or confirms source material, resolves ambiguity, and approves or rejects proposed knowledge.
- The **employee** submits structured operational questions, follows cited approved guidance when every deterministic gate passes, and receives an explicit prohibited, withheld, or escalation outcome when RelayOS cannot safely answer.
- The **company** gains a traceable system that improves through real work without silently converting AI output into policy.

A successful transfer means the employee can handle more of the defined role independently while the owner can inspect exactly what guidance was used, where it came from, and why an escalation occurred. Independence is measured from visible operational components, never a model-generated score.

## Product principles

1. **Approved knowledge is the employee boundary.** Employee-visible answers use only owner-approved knowledge.
2. **Provenance is part of the knowledge.** Sources, revisions, and append-only approval decisions remain traceable.
3. **Uncertainty is a workflow.** Missing, conflicting, provenance-invalid, sensitive, or unclear-authority conditions fail closed. A gap is recorded only for a genuine system deficiency, not merely because a known rule requires human action.
4. **Generation proposes; owners decide.** Extracted claims, inferred content, and generated improvements remain visibly unapproved until reviewed.
5. **Real work improves the system.** Questions and escalations reveal gaps that can become reviewable proposals.
6. **Start narrow.** One company and the Home-Service Office Manager / Dispatcher role come before generalized multi-tenancy or arbitrary roles.

## Operating loop

```text
structured employee question
-> retrieve current approved company knowledge by explicit topic
-> deterministic policy firewall
-> cited answer OR prohibited / withheld / escalation outcome
-> identify a genuine knowledge gap when the operating system is deficient
-> owner resolves the operational escalation without creating policy
-> source and review work may later produce approved knowledge
```

Phase 3 implements the employee-question and owner-escalation segment in current-session memory. Topic, request type, sensitivity, and request context are explicit; question text is retained but never semantically searched or parsed. Answers use fixed templates and only current approved employee-visible claims with exact source and approval provenance. Known approval, escalation, emergency, sensitivity-handling, and prohibition rules do not manufacture gaps. Escalation resolution is not knowledge approval, and later source/interview/review work remains the only route to employee-visible policy.

Phase 4 wraps that completed deterministic engine in a sellable but deliberately manual founding-client package: a fictional public pilot and guided demo, actual-session print reports, an approved-only manual summary, a minimized handoff export, and explicit intake and delivery checklists. These surfaces make the operating loop demonstrable and deliverable without claiming authentication, protected accounts, durable persistence, automatic procedure generation, or production readiness. See [V1 scope](V1_SCOPE.md), the [Phase 4 execution plan](../exec-plans/phase-4-pilot-launch-package.md), and the [pilot-before-infrastructure decision](../decisions/0005-pilot-before-production-infrastructure.md).

## Language and boundaries

The canonical entity vocabulary is in the [domain model](../architecture/DOMAIN_MODEL.md). The rules for model use are in [AI boundaries](../architecture/AI_BOUNDARIES.md). Product journeys must preserve both; UI language must never imply that an answer, escalation resolution, or generated proposal is approved company policy.
