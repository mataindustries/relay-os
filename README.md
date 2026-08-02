# RelayOS

RelayOS helps a business owner transfer one operational role to an employee by
turning source-backed knowledge into a reviewed operating system. Phase 3 adds
the first deterministic Question-to-System workflow to the completed company,
role, source, gap-interview, and approval foundations for one company and its
single Home-Service Office Manager / Dispatcher role.

The current slice preserves the completed Phase 1 setup and approval lifecycle
and Phase 2 source and Knowledge Gap Interviewer behavior. Employees submit an
explicit topic, request type, sensitivity selection, and request-specific typed
context. A framework-free policy firewall then either delivers fixed-template
guidance cited to current approved claims, exact sources, and approval decisions,
or produces an inspectable prohibited, withheld, or escalation outcome. It
creates or links a knowledge gap only for a genuine system deficiency; resolving
an escalation never creates policy. RelayOS does not semantically interpret
question or source text. The Summit Comfort Heating & Air record remains fixed,
fictional, deterministic demo data.

All data, including pasted source text, employee questions, answers,
escalations, and activity traces, is held in browser memory and disappears on
reload. AI/model calls, semantic retrieval, automatic classification or
extraction, general chat, uploads, authentication, durable or browser
persistence, messaging, training, scoring, and production integrations are
intentionally outside this phase.

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
- [Active Phase 3 execution plan](./docs/exec-plans/phase-3-question-to-system.md)
- [Completed Phase 2 execution plan](./docs/exec-plans/phase-2-source-intake-interviewer.md)
- [Phase 1 architecture decision](./docs/decisions/0002-company-role-engine.md)
- [Phase 2 architecture decision](./docs/decisions/0003-deterministic-source-and-gap-engine.md)
- [Phase 3 architecture decision](./docs/decisions/0004-deterministic-question-policy-firewall.md)

The site builds to `dist/` as a static Vite application. `public/_redirects`
provides the SPA fallback required for direct route navigation on Cloudflare
Pages.
