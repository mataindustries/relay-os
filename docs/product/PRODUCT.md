# RelayOS product

## Purpose

RelayOS turns operational knowledge trapped in a business owner’s head and source material into a reviewed, source-backed operating system for one employee role. Its promise is: **Transfer the role, not just the instructions.**

The first supported role is **Home-Service Office Manager / Dispatcher**. RelayOS is not a generic knowledge base: it must help an employee act within explicit procedures, decisions, responsibilities, authority, and escalation boundaries while preserving owner control over company policy.

## People and outcomes

- The **owner** supplies or confirms source material, resolves ambiguity, and approves or rejects proposed knowledge.
- The **employee** will eventually ask operational questions, follow approved guidance, and escalate when guidance or authority is insufficient. Phase 2 still demonstrates only which approved current knowledge is eligible to be shown.
- The **company** gains a traceable system that improves through real work without silently converting AI output into policy.

A successful transfer means the employee can handle more of the defined role independently while the owner can inspect exactly what guidance was used, where it came from, and why an escalation occurred. Independence is measured from visible operational components, never a model-generated score.

## Product principles

1. **Approved knowledge is the employee boundary.** Employee-visible answers use only owner-approved knowledge.
2. **Provenance is part of the knowledge.** Sources, revisions, and append-only approval decisions remain traceable.
3. **Uncertainty is a workflow.** Missing, conflicting, sensitive, or low-confidence evidence leads to escalation and a recorded gap.
4. **Generation proposes; owners decide.** Extracted claims, inferred content, and generated improvements remain visibly unapproved until reviewed.
5. **Real work improves the system.** Questions and escalations reveal gaps that can become reviewable proposals.
6. **Start narrow.** One company and the Home-Service Office Manager / Dispatcher role come before generalized multi-tenancy or arbitrary roles.

## Future operating loop

```text
employee question
-> retrieve approved company knowledge
-> answer or escalate
-> identify a knowledge gap
-> draft a proposed system improvement
-> owner reviews it
-> approved knowledge becomes available in the future
```

This complete loop remains a future product target. Phase 2 implements its owner-side source-to-gap-to-proposal segment: one session-only company and role, immutable manual-paste source versions, exact anchors, explicit-topic coverage, deterministic interview questions, immutable owner answers, normal claim decisions/revisions, and an approved-only employee view. It does not accept employee questions or generate answers. See [V1 scope](V1_SCOPE.md) and the [Phase 2 execution plan](../exec-plans/phase-2-source-intake-interviewer.md).

## Language and boundaries

The canonical entity vocabulary is in the [domain model](../architecture/DOMAIN_MODEL.md). The rules for model use are in [AI boundaries](../architecture/AI_BOUNDARIES.md). Product journeys must preserve both; UI language must never imply that a generated proposal is approved company policy.
