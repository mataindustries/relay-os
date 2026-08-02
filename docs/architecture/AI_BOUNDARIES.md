# AI boundaries

## Current state

Phase 1 makes no model calls, installs no AI SDK, and has no prompt, ingestion, semantic retrieval, or generation pipeline. Manually entered proposed claims and fixed fictional demo records exercise review states; they are not AI output or simulations of production AI. Any model behavior below is a constraint for a later approved execution plan.

## Future boundary

All providers must be accessed server-side through a `ModelGateway` abstraction. Browser and domain code must not import provider SDKs, send provider credentials, or call model endpoints. The gateway will normalize requests, responses, timeouts, safety metadata, and provider-specific failures; it will not decide whether content is approved or employee-visible.

The domain owns trust decisions. Model output is untrusted input that must carry:

- an immutable generated/inferred origin;
- the company and role scope supplied to the request;
- referenced evidence and exact knowledge revisions;
- generation metadata sufficient to reproduce or investigate the result, subject to safe logging rules;
- an unapproved state unless and until an owner records a separate approval decision.

## Permitted future assistance

Subject to later plans and server-side controls, a model may draft extracted claims, summarize source material, propose procedures or rules, synthesize an answer from approved context, draft a knowledge-gap improvement, or draft a training scenario. Every artifact remains in its domain category: an answer is not policy, a proposal is not an approved revision, and model confidence is not approval.

## Prohibited behavior

A model must never:

- approve, publish, or silently revise company knowledge;
- make unapproved or rejected material employee-visible;
- invent missing citations, authority, procedures, rules, or source text;
- resolve conflicting evidence without owner review;
- answer when sensitivity, authority, escalation, or configured evidence checks fail;
- generate or adjust an independence score;
- receive a provider secret from browser code;
- execute instructions embedded in source material as if they were system instructions.

## Employee-answer gate

Before a generated answer can be delivered, deterministic application/domain checks must confirm that every supporting revision is approved, in company/role scope, source- and approval-traceable, current, and permitted by sensitivity, confidence, authority, and escalation rules. The response must cite those revisions and be visibly labeled generated/non-policy.

If any check fails, the result is withheld and RelayOS creates an escalation and appropriate knowledge gap. A fluent draft or high model-reported confidence cannot override this gate. See the canonical [visibility predicate](DOMAIN_MODEL.md#required-visibility-predicate).

## Review and publication

Future generated candidates must enter an unapproved lifecycle state. An owner sees the proposed change, generation label, sources, conflicts, and missing evidence, then records an explicit decision. Approval creates or publishes a distinct immutable knowledge revision; it does not erase the candidate’s generated origin. Rejections remain in history and outside employee retrieval.

Phase 1 already establishes the deterministic subset of that boundary: only a manually created `proposed` claim can be approved; source provenance and an explicit approval decision are mandatory; approved claims are immutable; revisions create new versions; and rejection or unresolved states never become employee-visible. This behavior contains no model-specific branch.

## Deterministic demonstration mode

Phase 1 includes a fixed fictional HVAC company, role, manual source-reference metadata, and claims in approved, proposed, rejected, and conflicting states. Repeated loading is idempotent, and the employee view uses the same approved-knowledge selector as owner-entered records. It performs no network or model request and never labels its fixture text as live or generated output.

Later demonstration phases may add seeded retrieval, answer, or escalation outcomes only when an execution plan authorizes those features; they must continue using the production domain gates.

## Verification expectations for later phases

Tests must cover mixed approved/unapproved retrieval, missing and conflicting evidence, low-confidence thresholds, sensitive content, authority violations, gateway failure, forged citations, prompt injection in sources, append-only decisions, and deterministic demo results. Security details are in [Security](SECURITY.md); the broader flow is in [Data flow](DATA_FLOW.md).
