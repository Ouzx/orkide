# Architecture Decision Log

Short, dated records of decisions that shape the codebase. Newest first. Each entry: **context → decision → consequences**.

## 2026-10-01 — Foundations

### ADR-011 · Vitest 4 across the workspace

- **Context:** `@cloudflare/vitest-plugin` (tests inside `workerd`) supports Vitest `^4.1` only.
- **Decision:** the catalog pins Vitest 4; runtime-faithful tests outweigh the newer major.
- **Consequences:** upgrade to Vitest 5 when the plugin supports it (roadmap).

### ADR-012 · Cloudflare Flagship for feature flags

- **Decision:** flags live in the `orkide` Flagship app; `apps/api/src/core/flags.ts` is the typed registry (key, fallback, visibility). Public flags are served by `GET /api/flags`; any route can be gated with `requireFlag()`.

### ADR-013 · KV response cache with versioned namespaces

- **Context:** the Cache API is a no-op on `*.workers.dev`.
- **Decision:** public reads go through `cached()` (KV); writes call `invalidate(namespace)`, which bumps a version key so every entry of that namespace is skipped immediately.

### ADR-008 · Drizzle ORM v1 (release candidate)

- **Context:** Drizzle v1 is at RC with a frozen API; it ships Relational Queries v2, built-in zod schema generation (`drizzle-orm/zod`) and per-migration folders. Migrating from 0.x later is costly.
- **Decision:** adopt `drizzle-orm@1.0.0-rc` / `drizzle-kit@1.0.0-rc` now.
- **Consequences:** the Better Auth CLI still emits RQB v1 relations, so `auth:generate` strips them and all relations live in `@orkide/db/relations`. Wrangler applies the folder layout through `migrations_pattern: "<dir>/*/migration.sql"`. Casing is set per table via `defineTable`.

### ADR-009 · Paraglide compiled once, explicit locale on the server

- **Decision:** `packages/i18n` owns messages and compiles them once (strategy: url → cookie → Accept-Language → base). The web Worker uses `paraglideMiddleware` with translated route segments; the API passes `{ locale }` explicitly to message functions instead of relying on global state.

### ADR-010 · Auth sessions in D1, throttling at the edge

- **Context:** KV is eventually consistent and has no atomic increment.
- **Decision:** no KV secondary storage for Better Auth; sessions in D1 behind a signed cookie cache, rate limiting through the Workers Rate Limiting binding. Sign-up is closed to `ADMIN_EMAILS`.

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
