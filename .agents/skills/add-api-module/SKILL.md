---
name: add-api-module
description: Add a feature module to the Hono API (`apps/api/src/modules/<name>`) — routes, service, repository, RBAC, caching, tests and the typed client. Use when the API needs a new resource or endpoint group.
---

# Add an API module

A module owns its routes, service, repository and tests. Copy the shape of `modules/post/` (admin CRUD + cached public reads) or `modules/contact/` (public write).

## 1. Data and validation first

- Tables: see the `add-db-table` skill.
- Request/response schemas go in `packages/validators/src/<name>.ts`, derived from `models.*` (`.pick/.omit/.extend`), never hand-typed. Zod forbids `.extend()` on refined objects: keep an unrefined base.
- New permission → `packages/auth/src/permissions.ts` (`contentStatements`, then each role in `owner` / `editor` / `viewer`) and extend `permissions.test.ts`.

## 2. The module (`apps/api/src/modules/<name>/`)

- `<name>.repository.ts` — Drizzle only (`db` from `@orkide/db`). Multi-table writes use `db.batch([...])`; multi-column `orderBy` uses the callback form.
- `<name>.service.ts` — business rules; throws `new ApiError("not_found" | "conflict" | …)` (RFC 9457; never ad-hoc error JSON). Every write ends with `await purge("<tag>")`.
- `<name>.routes.ts` — `createRoute({ method, path, request, responses: { 200: json(Schema, "…"), ...problems(401, 403, 404) } })` handled by `createRouter().openapi(route, handler)`. Name schemas with `.openapi("Name")`. Guard admin routes with `middleware: [requirePermission({ <resource>: ["read"] })] as const`; reader routes identical for every visitor use `shareable("<tag>")` (default is `private, no-store`).
- A new cache tag: add it to `CacheTag` in `apps/api/src/client.ts`; pages tagged with it use `cachePage(Astro, "<tag>")`.
- Log via `c.var.logger`, never `console.*`. User-facing strings (error titles) come from Paraglide with `{ locale }`.

## 3. Mount it

`apps/api/src/app.ts` → import the router and add `.route("/", <name>Routes)` to the chained `routes`. The chain is what types `AppType`, so `@orkide/api-client` (and the admin/web `api` clients) gain the endpoints with no further code.

## 4. Test

`<name>.test.ts` beside the module (Vitest in the Workers pool; D1 is migrated and emptied per test). Use `request`, `jsonRequest`, `signInAs("owner" | "editor" | "viewer")` from `apps/api/test/helpers.ts`. Cover: happy path, 401/403 per role, 404, validation (422), and that writes purge the tag.

## 5. Verify

`pnpm --filter @orkide/api test && pnpm fix && pnpm check && pnpm typecheck && pnpm build`, then `pnpm dev` and open `/api/docs` — the new routes must appear under their tag.
