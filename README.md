# RelayOS

RelayOS helps a business owner transfer one operational role to an employee by
turning source-backed knowledge into a reviewed operating system. Phase 1 adds
a deterministic, session-only engine for one company and its single
Home-Service Office Manager / Dispatcher role.

The current slice supports company and role setup, responsibilities, authority
and escalation definitions, manual source metadata, owner claim review and
revision, and an employee view that receives only approved current knowledge.
The included Summit Comfort Heating & Air record is fixed fictional demo data.

All data is held in browser memory and disappears on reload. AI/model calls,
chat or question answering, uploads, authentication, durable or browser
persistence, training, scoring, and production integrations are intentionally
outside this phase.

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
- [Active Phase 1 execution plan](./docs/exec-plans/phase-1-company-role-engine.md)
- [Phase 1 architecture decision](./docs/decisions/0002-company-role-engine.md)

The site builds to `dist/` as a static Vite application. `public/_redirects`
provides the SPA fallback required for direct route navigation on Cloudflare
Pages.
