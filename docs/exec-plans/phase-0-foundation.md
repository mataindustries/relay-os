# Phase 0: Repository Foundation

Status: Complete

## Goal

Establish a production-quality, Cloudflare Pages-compatible React repository with durable product and architecture guidance, a restrained route skeleton, and an executable approved-knowledge boundary.

## Non-goals

Phase 0 does not implement knowledge generation, AI chat, uploads, authentication, persistence, employee training, dashboards, scoring, analytics, production model calls, or Cloudflare data services.

## Work breakdown

- [x] Record product scope, journeys, domain language, invariants, security boundaries, data flow, and foundation decisions.
- [x] Build the mobile-first application shell and later-phase placeholder routes.
- [x] Add the smallest domain primitive that prevents unapproved knowledge from becoming employee-visible.
- [x] Configure TypeScript, Vite, React Router, Vitest, Testing Library, ESLint, Prettier, CI, and Cloudflare Pages SPA fallback.
- [x] Add rendering, routing, and domain-invariant tests.
- [x] Run and record the complete validation sequence.

## Acceptance criteria

- [x] All requested repository knowledge files exist, remain concise and consistent, and cross-link to deeper guidance.
- [x] `AGENTS.md` is a short repository map and directs contributors to the relevant execution plan.
- [x] Every requested route renders deliberately without fake data or dead actions.
- [x] The homepage states the product positioning, approved-knowledge principle, phase, and future loop.
- [x] The mobile-first CSS has no fixed narrow-width overflow hazard at 360px and remains usable on desktop.
- [x] Strict TypeScript, linting, formatting, tests, and the static production build pass.
- [x] Cloudflare Pages direct-route fallback is present without Workers or data services.
- [x] No later-phase capability or browser secret is introduced.

## Validation results

- `npm install` — passed with registry access; created `package-lock.json` and installed 271 packages.
- `npm run check` — passed after two focused configuration/formatting repairs: Prettier, ESLint, strict typecheck, 3 test files / 12 tests, and the production build all succeeded.
- `npm run build` — passed independently; Vite produced the static `dist/` bundle.
- `npm exec vite -- preview --host 127.0.0.1 --port 4173 --strictPort` plus direct HTTP checks — passed with local-port permission; all seven requested routes returned `200` and `dist/_redirects` contains `/* /index.html 200`.
- Static final audit — no secret-like browser variables, console error/warning calls, fake dashboard behavior, fixed narrow-width overflow hazards, missing requested files, or product/documentation contradictions found. Vitest emitted no console warnings.

## Decisions made

- Follow the static React/Vite SPA boundaries in [Architecture](../../ARCHITECTURE.md) and keep infrastructure empty except for documented ownership.
- Represent the [employee-visibility predicate](../architecture/DOMAIN_MODEL.md#required-visibility-predicate) with a small domain function that requires approval, source references, and approval history; future storage and AI behavior are absent.
- Treat documentation, [ADR 0001](../decisions/0001-foundation.md), and executable tests as the Phase 0 source of truth until a later approved execution plan supersedes them.
- Copy and freeze source-reference and approval-history lists when knowledge crosses the employee-visibility boundary.
- Pin React Router `7.18.2` exactly until a published release resolves its RSC-only advisory without reintroducing older advisories.

## Remaining known limitations

- All feature routes are informational placeholders.
- There is no server, persistence, model integration, identity, or production deployment configuration beyond static SPA behavior.
- No headless browser is installed in the validation environment; the 360px check used CSS inspection and responsive implementation review rather than a browser screenshot.
- `npm audit` reports one high-severity React Router advisory as two affected packages. It concerns RSC action handling, which this static `BrowserRouter` SPA does not use; npm's suggested `8.3.0` fix was not published (`ETARGET`) at validation time.

## Phase completion status

Complete. Every Phase 0 acceptance criterion passed on 2026-08-02. This status does not authorize Phase 1; a separate reviewed execution plan is required.
