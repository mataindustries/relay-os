# RelayOS

RelayOS helps a business owner transfer one operational role to an employee by
turning source-backed knowledge into a reviewed operating system. The Phase 0
repository contains only the application shell, a small approved-knowledge
domain boundary, project documentation, and the quality system needed for later
work.

The first planned role is a home-service office manager or dispatcher. Product
generation, AI chat, uploads, authentication, persistence, training, and
production integrations are intentionally outside this phase.

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
- [Phase 0 execution plan](./docs/exec-plans/phase-0-foundation.md)

The site builds to `dist/` as a static Vite application. `public/_redirects`
provides the SPA fallback required for direct route navigation on Cloudflare
Pages.
