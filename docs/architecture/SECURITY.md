# Security boundary

## Phase 2 posture

RelayOS still ships public static assets only. Phase 2 can hold owner-entered company, role, pasted plain-text source documents, exact references, claims, gaps, interview questions/answers, and approval records in browser memory until reload. It authenticates no users, provides no authorization, accepts no files, performs no external requests or telemetry, calls no model, and configures no Cloudflare Workers, D1, R2, KV, or production secrets.

The session-only engine is a deterministic product demonstration, not a safe store for real confidential company information. Pasted text is rendered as escaped React text, is not placed in URLs or console output, and disappears on reload; these properties are not encryption, access control, durability, or a retention guarantee. “Owner” and “employee” name product perspectives, not verified identities or access-control roles; direct navigation is public. UI separation is not authorization.

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

In a future authenticated system, an owner may review and append approval decisions for the single company/role. An employee may ask questions, view eligible answers and training, submit attempts, and create operational signals, but may not approve knowledge or extend authority. Every server read and write must enforce company and role scope; UI visibility is not authorization.

Identity and authentication are intentionally absent in Phase 2 and require their own threat model and execution plan before protected data is introduced.

## AI and evidence threats

Source documents, employee questions, retrieved passages, and model output may contain prompt injection or misleading instructions. A future system must separate system instructions from source data, minimize provider context, validate returned citations against supplied approved revisions, and run the deterministic employee-answer gate after generation. Sensitive, missing, conflicting, low-confidence, or out-of-authority cases escalate.

Model output must be escaped as data, never executed as HTML, code, queries, or tool commands. Generated text remains visibly unapproved and cannot write to approved knowledge or approval history. See [AI boundaries](AI_BOUNDARIES.md).

## Integrity and audit

- Available source-document versions and anchored excerpts are immutable for the lifetime of the current in-memory session; correction creates a new version and does not rewrite historical references.
- Interview answers retain their exact source excerpt; correction appends a new answer, source, and candidate claim.
- Approved claim versions retain immutable source-reference IDs and all decisions for the lifetime of the current in-memory session.
- Approval decisions are append-only through the existing domain-service operations; corrections require a new eligible decision or claim revision rather than overwrite.
- These in-memory guarantees do not survive reload and are not a durable audit trail.
- Future activity events must identify actor, time, target revision, action, and correlation context while avoiding unnecessary sensitive payloads.
- Phase 2 line anchors provide deterministic addressing, not cryptographic integrity or source authentication. Future integrity metadata and revision locators must allow later verification; source withdrawal cannot erase historical approval provenance.
- Future independence metrics must store their deterministic inputs and formula version.

## Later-phase security acceptance criteria

Before any protected-data or model feature ships, its execution plan must cover authorization tests, cross-scope isolation, input limits, output escaping, secret scanning, dependency review, safe logging, provider data handling, failure behavior, backup/retention decisions, and incident observability. Security-sensitive defaults must fail closed.

See [Data flow](DATA_FLOW.md), [Domain model](DOMAIN_MODEL.md), the [foundation decision](../decisions/0001-foundation.md), and the [Phase 1 engine decision](../decisions/0002-company-role-engine.md).
