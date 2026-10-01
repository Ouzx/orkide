# Architecture Decision Log

Short, dated records of decisions that shape the codebase. Newest first. Each entry: **context → decision → consequences**.

## 2026-10-01 — Foundations

### ADR-001 · Cloudflare-only runtime, two Workers joined by a Service Binding

- **Context:** `*.workers.dev` is on the Public Suffix List, so two Workers there cannot share cookies.
- **Decision:** `apps/web` serves every request and forwards `/api/*` to `apps/api` through a Service Binding. The API remains independently deployable for the future React Native client.
- **Consequences:** one origin, no CORS for the browser, no extra network hop; CORS is configured only for non-browser clients.

### ADR-002 · `wrangler.jsonc` + `@cloudflare/vite-plugin` now, `cf` CLI later

- **Context:** the `cf` CLI (typed `cloudflare.config.ts`) entered open beta on 2026-09-28 without `tail`, `secret put`, rollback or documented monorepo support.
- **Decision:** stay on Wrangler config, build every Worker through the Vite plugin.
- **Consequences:** `cf migrate` converts Vite-based Workers automatically once `cf` is stable (tracked in the roadmap).

### ADR-003 · pnpm strict catalog

- **Decision:** every external dependency version is declared once in `pnpm-workspace.yaml` (`catalogMode: strict`); packages use `catalog:` and `workspace:*`.
- **Consequences:** no version drift between apps and packages; upgrades are one-line changes.

### ADR-004 · TypeScript 7 (native compiler)

- **Decision:** `typescript@7` for typechecking and oxlint type-aware rules (tsgolint).
- **Consequences:** tooling that needs the legacy TypeScript JS API (e.g. `astro check`) may require a documented, isolated exception.

### ADR-005 · UUIDv7 text primary keys

- **Decision:** every table, including Better Auth's, uses UUIDv7 strings.
- **Consequences:** time-ordered inserts, no enumeration, IDs can be generated offline by clients.

### ADR-006 · Feature modules

- **Decision:** code is grouped by feature (`modules/<name>`), with shared code lifted to `shared/`, `core/` or a workspace package.

### ADR-007 · Content in D1, media in R2

- **Decision:** posts and projects are stored per locale in D1 (Tiptap JSON as source of truth, with rendered HTML and Markdown); media binaries live in R2 with metadata rows in D1.
