# Security boundary

## Phase 4 posture

RelayOS still ships public static assets only. Phase 4 can hold owner-entered company/role data, pasted plain-text sources, exact references, claims, gaps, interview records, employee questions, eligibility evaluations, answers, escalations, activity events, and approval records in browser memory until reload. It authenticates no users, provides no authorization, accepts no files, performs no application data requests, messaging, or telemetry, calls no model, and configures no Cloudflare Workers, D1, R2, KV, or production secrets. A configured pilot booking link or `mailto:` action navigates only after a visitor chooses it; those public destinations are not RelayOS data integrations.

The session-only engine is a deterministic product demonstration, not a safe store for real confidential company or customer information. Pasted text and questions are rendered as escaped React text, are not placed in URLs or console output, and disappear on reload; these properties are not encryption, access control, durability, secure deletion, or a retention guarantee. “Owner” and “employee” name product perspectives, not verified identities or access-control roles; direct navigation is public. The employee page uses one fixed session-persona label to avoid casually switching between label-filtered histories, but that label is not identity or authorization. UI separation is not authorization.

The employee form requires an explicit sensitivity selection and warns against pasting passwords, access credentials, payment-card values, health details, or unnecessary personal information. RelayOS does not inspect arbitrary text to detect whether the employee selected correctly. Sensitive selection fails closed, escalation context is assembled from minimized typed fields, and activity metadata does not contain raw question or source text. The demonstration makes no legal, medical, financial, emergency, or other professional-advice claim.

No secret may be placed in source code, browser bundles, Vite-exposed environment variables, demo fixtures, tests, logs, or committed configuration. Values embedded in a static build are public by definition.

## Public demo, report, and export restrictions

- `/pilot` is static public content and reads only public CTA configuration.
- `/demo` may load and render only the fixed fictional Summit Comfort Heating & Air fixture. An active non-demo company causes a fail-closed warning without exposing its identity or records, and demo reset is rejected outside the exact fictional scope.
- `/report`, `/manual`, owner workspaces, and checklist routes are not protected routes. They render the current in-memory session and therefore are suitable for public deployment only with fictional or non-sensitive data.
- The Operating Manual guidance projection reuses the approved employee-visible selector. Proposed, rejected, conflicting, superseded, missing, and unapproved interview material cannot enter its guidance section.
- The handoff package is built by an allowlist rather than serializing the repository snapshot. Its default form excludes source-document content and lines, reference excerpts, raw question text, free-text question context, employee labels, raw escalation resolution text, environment configuration, and implementation state. Explicit source-text inclusion requires both an option and a separate confirmation; it still does not add raw question values.
- Downloaded JSON and printed/saved reports leave RelayOS controls. Phase 4 provides no encrypted delivery, access control, retention management, revocation, or import/restore path. The owner must use a separately agreed controlled channel for any real-client artifact.

These restrictions reduce accidental disclosure but do not make the application production-safe. Use only fictional or non-sensitive data in a public deployment. Real client work should be performed in a controlled private environment until production security and persistence are implemented. Session data disappears on reload.

## Data sensitivity and later requirements

Source material, questions, answers, escalation context, user identity, approval rationale, activity events, printed reports, and exported packages may contain confidential business or personal information. Phase 4 minimizes current-session routing, trace, reporting, and default-export fields but cannot authenticate, authorize, encrypt, durably retain, or securely delete them. Later plans must classify data, define collection and retention, minimize content copied into logs or model requests, and document deletion versus mandatory provenance retention. This slice makes no compliance certification or retention-policy claim.

## Required future trust boundaries

- **Browser:** untrusted presentation client; receives only authorized, minimum data and public configuration.
- **Server application:** authenticates users, authorizes company/role access, validates inputs, applies domain policies, and owns audit writes.
- **ModelGateway:** server-side only; limits approved context sent to configured providers and normalizes failures. It cannot approve or publish.
- **Persistence:** enforces scope, immutable revisions, source links, and append-only approval decisions; technology is intentionally undecided.
- **Source ingestion:** treats file names, metadata, and content as untrusted data; validates type/size and isolates parsing when later introduced.

## Authorization model to preserve

In a future authenticated system, an owner may review and append approval decisions for the single company/role. An employee may ask questions, view eligible answers and training, submit attempts, and create operational signals, but may not approve knowledge or extend authority. Every server read and write must enforce company and role scope; UI visibility is not authorization.

Identity and authentication are intentionally absent in Phase 4 and require their own threat model and execution plan before protected data is introduced.

## AI and evidence threats

Source documents and employee questions may contain misleading or hostile instructions. Phase 4 treats them only as escaped data: it does not execute them, classify them semantically, derive limits or authority from them, or send them anywhere. A future model-enabled system must separate system instructions from source data, minimize provider context, validate returned citations against the already-fixed approved set, and keep any wording subordinate to the deterministic policy firewall. Selected-sensitive, missing, conflicting, provenance-invalid, unsupported, or out-of-authority cases fail closed.

Model output must be escaped as data, never executed as HTML, code, queries, or tool commands. Generated text remains visibly unapproved and cannot write to approved knowledge or approval history. See [AI boundaries](AI_BOUNDARIES.md).

## Integrity and audit

- Available source-document versions and anchored excerpts are immutable for the lifetime of the current in-memory session; correction creates a new version and does not rewrite historical references.
- Interview answers retain their exact source excerpt; correction appends a new answer, source, and candidate claim.
- Approved claim versions retain immutable source-reference IDs and all decisions for the lifetime of the current in-memory session.
- Approval decisions are append-only through the existing domain-service operations; corrections require a new eligible decision or claim revision rather than overwrite.
- Employee questions, eligibility evaluations, and answers become immutable once evaluated; corrections append a linked question rather than rewriting input or outcome history.
- Escalation assignment, resolution, and closure use typed transitions. Resolution creates no claim, approval decision, or gap resolution.
- Phase 3 activity events append safe actor/entity/time/correlation metadata and have no update/delete operation. Phase 4 exports only an allowlisted safe projection of them. They intentionally omit raw sensitive question/source content and are not durable audit records or policy evidence.
- These in-memory guarantees do not survive reload and are not a durable audit trail.
- Phase 2 line anchors provide deterministic addressing, not cryptographic integrity or source authentication. Future integrity metadata and revision locators must allow later verification; source withdrawal cannot erase historical approval provenance.
- Future independence metrics must store their deterministic inputs and formula version.

## Later-phase security acceptance criteria

Before any protected-data or model feature ships, its execution plan must cover authorization tests, cross-scope isolation, input limits, output escaping, secret scanning, dependency review, safe logging, provider data handling, failure behavior, backup/retention decisions, export/delivery handling, and incident observability. Security-sensitive defaults must fail closed. Phase 3’s employee-selected sensitivity control is an honest structured input, not data-loss prevention or automatic classification, and Phase 4’s minimized export is not data-loss prevention.

See [Data flow](DATA_FLOW.md), [Domain model](DOMAIN_MODEL.md), the [foundation decision](../decisions/0001-foundation.md), the [Phase 3 policy-firewall decision](../decisions/0004-deterministic-question-policy-firewall.md), and the [Phase 4 pilot decision](../decisions/0005-pilot-before-production-infrastructure.md).
