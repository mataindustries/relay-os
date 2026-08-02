# Security boundary

## Phase 0 posture

RelayOS currently ships public static assets only. It stores no company knowledge, authenticates no users, accepts no uploads, calls no model, and configures no Cloudflare Workers, D1, R2, KV, or production secrets. Placeholder routes must not imply access control or production readiness.

No secret may be placed in source code, browser bundles, Vite-exposed environment variables, demo fixtures, tests, logs, or committed configuration. Values embedded in a static build are public by definition.

## Future data sensitivity

Source material, questions, answers, escalation context, user identity, approval rationale, and activity events may contain confidential business or personal information. Later plans must classify data, define collection and retention, minimize content copied into logs or model requests, and document deletion versus mandatory provenance retention. This foundation makes no compliance certification or retention-policy claim.

## Required future trust boundaries

- **Browser:** untrusted presentation client; receives only authorized, minimum data and public configuration.
- **Server application:** authenticates users, authorizes company/role access, validates inputs, applies domain policies, and owns audit writes.
- **ModelGateway:** server-side only; limits approved context sent to configured providers and normalizes failures. It cannot approve or publish.
- **Persistence:** enforces scope, immutable revisions, source links, and append-only approval decisions; technology is intentionally undecided.
- **Source ingestion:** treats file names, metadata, and content as untrusted data; validates type/size and isolates parsing when later introduced.

## Authorization model to preserve

An owner may review and append approval decisions for the single company/role. An employee may ask questions, view eligible answers and training, submit attempts, and create operational signals, but may not approve knowledge or extend authority. Every server read and write must enforce company and role scope; UI visibility is not authorization.

Identity and authentication are intentionally absent in Phase 0 and require their own threat model and execution plan before protected data is introduced.

## AI and evidence threats

Source documents, employee questions, retrieved passages, and model output may contain prompt injection or misleading instructions. A future system must separate system instructions from source data, minimize provider context, validate returned citations against supplied approved revisions, and run the deterministic employee-answer gate after generation. Sensitive, missing, conflicting, low-confidence, or out-of-authority cases escalate.

Model output must be escaped as data, never executed as HTML, code, queries, or tool commands. Generated text remains visibly unapproved and cannot write to approved knowledge or approval history. See [AI boundaries](AI_BOUNDARIES.md).

## Integrity and audit

- Approved revisions retain immutable source references and all approval decisions.
- Approval decisions are append-only; corrections append rather than overwrite.
- Activity events identify actor, time, target revision, action, and correlation context while avoiding unnecessary sensitive payloads.
- Source integrity metadata and revision locators allow later verification; source withdrawal does not erase historical approval provenance.
- Independence metrics store their deterministic inputs and formula version.

## Later-phase security acceptance criteria

Before any protected-data or model feature ships, its execution plan must cover authorization tests, cross-scope isolation, input limits, output escaping, secret scanning, dependency review, safe logging, provider data handling, failure behavior, backup/retention decisions, and incident observability. Security-sensitive defaults must fail closed.

See [Data flow](DATA_FLOW.md), [Domain model](DOMAIN_MODEL.md), and the [foundation decision](../decisions/0001-foundation.md).
