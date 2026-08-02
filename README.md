# RelayOS

RelayOS helps a business owner transfer one operational role to an employee by
turning source-backed knowledge into a reviewed operating system. Phase 2 adds
manual plain-text source intake and a deterministic Knowledge Gap Interviewer
to the session-only engine for one company and its single Home-Service Office
Manager / Dispatcher role.

The current slice supports the completed Phase 1 setup and approval lifecycle,
immutable source-document versions, exact numbered-line references, explicit
operational-topic coverage, reconciled knowledge gaps, deterministic owner
questions, immutable interview answers, and an employee view that receives only
approved current knowledge. Owners select topics and proposed wording manually;
RelayOS does not semantically interpret sources. The included Summit Comfort
Heating & Air record is fixed fictional demo data.

All data, including pasted source text, is held in browser memory and disappears
on reload. AI/model calls, automatic extraction, chat or employee question
answering, uploads, authentication, durable or browser persistence, training,
scoring, and production integrations are intentionally outside this phase.

## Local development

Requires a current Node.js LTS release and npm.

```sh
npm install
npm run dev
```

Run the same noninteractive quality gate used in CI:

```sh
npm run check
```

Other commands are documented in [AGENTS.md](./AGENTS.md). Before changing the
application, read the active execution plan in
[docs/exec-plans](./docs/exec-plans/README.md).

## Project documentation

- [Product definition](./docs/product/PRODUCT.md)
- [V1 scope](./docs/product/V1_SCOPE.md)
- [Architecture](./ARCHITECTURE.md)
- [Completed Phase 2 execution plan](./docs/exec-plans/phase-2-source-intake-interviewer.md)
- [Phase 1 architecture decision](./docs/decisions/0002-company-role-engine.md)
- [Phase 2 architecture decision](./docs/decisions/0003-deterministic-source-and-gap-engine.md)

The site builds to `dist/` as a static Vite application. `public/_redirects`
provides the SPA fallback required for direct route navigation on Cloudflare
Pages.
