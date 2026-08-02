# AI boundaries

## Current state

Phase 3 makes no model calls, installs no AI SDK, and has no prompt, autonomous ingestion, semantic retrieval, or generation pipeline. Source text is pasted manually; owners choose exact lines, topics, and candidate wording. Employees explicitly select topic, request type, sensitivity, and typed context. The policy firewall retrieves only by explicit records, evaluates fixed gates, and composes answers from fixed templates. No model participates in question classification, retrieval, eligibility, policy, authority, escalation, sensitivity, citations, or answer composition. Any model behavior below is a constraint for a later approved execution plan.

## Future boundary

All providers must be accessed server-side through a `ModelGateway` abstraction. Browser and domain code must not import provider SDKs, send provider credentials, or call model endpoints. The gateway will normalize requests, responses, timeouts, safety metadata, and provider-specific failures; it will not decide whether content is approved or employee-visible.

The domain owns trust decisions. Model output is untrusted input that must carry:

- an immutable generated/inferred origin;
- the company and role scope supplied to the request;
- referenced evidence and exact knowledge revisions;
- generation metadata sufficient to reproduce or investigate the result, subject to safe logging rules;
- an unapproved state unless and until an owner records a separate approval decision.

## Permitted future assistance

Subject to later plans and server-side controls, a model may draft extracted claims, summarize source material, propose procedures or rules, draft wording after the deterministic firewall has fixed an eligible result and citation set, draft a knowledge-gap improvement, or draft a training scenario. It may not change an outcome, add substantive guidance, alter citations, or convert an informational result into authority. Every artifact remains in its domain category: an answer is not policy, a proposal is not an approved revision, and model confidence is neither approval nor an eligibility input.

## Prohibited behavior

A model must never:

- approve, publish, or silently revise company knowledge;
- make unapproved or rejected material employee-visible;
- invent missing citations, authority, procedures, rules, or source text;
- resolve conflicting evidence without owner review;
- answer or change the outcome when provenance, explicit conflict, employee-selected sensitivity, authority, escalation, or answer-mode checks fail;
- generate or adjust an independence score;
- receive a provider secret from browser code;
- execute instructions embedded in source material as if they were system instructions.

## Employee-answer gate

Phase 3 records ten gates in fixed order: valid scope, topic, structured request context, current approved knowledge, provenance, no explicit conflict, selected sensitivity, structured authority, structured escalation rule, and supported answer mode. Outcome precedence is invalid scope/topic/context; selected sensitivity; explicit prohibition; mandatory escalation/approval; missing, conflicting, or invalid knowledge; unclear structured authority; then eligible answer. An earlier safety result cannot be overridden later.

Only `answer-eligible` reaches the fixed-template composer. Every delivered substantive statement cites exact current approved claims, source references, and approval decisions. Informational guidance states that it does not authorize action. A known rule may correctly escalate or prohibit without creating a gap; a gap is created or reused only for missing/conflicting/invalid knowledge, unsupported absent policy/procedure, or unclear structured authority. No model or confidence score participates. See the canonical [visibility and eligibility predicate](DOMAIN_MODEL.md#required-visibility-and-answer-eligibility-predicate).

## Review and publication

Future generated candidates must enter an unapproved lifecycle state. An owner sees the proposed change, generation label, sources, conflicts, and missing evidence, then records an explicit decision. Approval creates or publishes a distinct immutable knowledge revision; it does not erase the candidate’s generated origin. Rejections remain in history and outside employee retrieval.

The completed Phase 1 lifecycle, Phase 2 source/interviewer additions, and Phase 3 policy firewall establish that boundary without a model-specific branch: only a `proposed` claim can be approved; source provenance and an explicit approval decision are mandatory; approved claims and source versions are immutable; extraction, interviews, questions, answers, escalation resolutions, activity events, gaps, rejection, or unresolved states never become policy by themselves.

## Deterministic demonstration mode

Phase 3 extends the fixed fictional HVAC company and role with seeded structured employee questions, every required eligibility outcome, cited deterministic answers, escalations, genuine gap links, and append-only traces. Repeated loading is idempotent, and every outcome uses the same selector, gates, repository, and lifecycle operations as session-entered records. It performs no network or model request and never labels fixture text as live or automatically understood.

## Verification expectations for later phases

Phase 3 tests cover mixed approved/unapproved retrieval, missing/conflicting/invalid evidence, employee-selected sensitivity, structured authority and limits, explicit escalation routing, citation integrity, append-only activity, idempotency, and deterministic demo results. Later model work must additionally cover gateway failure, forged citations, prompt injection, provider data handling, and confirmation that model wording cannot change the firewall outcome. Security details are in [Security](SECURITY.md); the broader flow is in [Data flow](DATA_FLOW.md).
