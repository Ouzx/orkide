---
name: add-admin-resource
description: Add a resource screen to the admin dashboard (a list, optionally an editor) — API client query, route with permission guard, nav entry, translated strings and a11y check. Use when the owner needs to manage a new kind of content.
---

# Add an admin resource

The admin is a client-side React app (TanStack Router + React Query) mounted by `apps/web/src/pages/admin/[...path].astro`; ADR-018 allows client-side Paraglide there. Read `modules/admin/inbox/` (simple list) or `modules/admin/posts/` (list + editor) first.

## 1. Backend first

The API endpoints, permissions and tests come from `add-api-module`. Add the resource's `read`/`create`/`update`/`delete` actions to `packages/auth/src/permissions.ts` and decide which roles get them.

## 2. Query

`apps/web/src/modules/admin/api.ts` → add an entry to `queries` (`queryOptions` with `parseResponse(api.api.admin.<name>.$get())` and `queryKey: ["<name>"]`). The client is fully typed from `AppType`; do not declare response types by hand. Mutations call `api.api.admin.<name>…`, then `queryClient.invalidateQueries({ queryKey: ["<name>"] })`, and surface failures with `problemOf(error)` in a `toast`.

## 3. Screen

`modules/admin/<name>/<name>-page.tsx`, exporting a named component that reads data with `useSuspenseQuery(queries.<name>())` and renders inside `PageHeader` / `EmptyRow` from `../components/page.tsx`. Reuse `DocumentTable`, `ConfirmDelete`, `StatusBadge`, and `@orkide/ui` primitives (add missing shadcn ones with the `shadcn` skill). Gate buttons with `const { can, options } = useAdmin()`; `options` is the `{ locale }` for message calls.

## 4. Route and navigation

- `modules/admin/router.tsx`: `createRoute({ beforeLoad: requirePermission({ <resource>: ["read"] }), component: lazyRouteComponent(() => import("./<name>/<name>-page.tsx"), "<Name>Page"), getParentRoute: () => root, loader: ({ context }) => { context.queryClient.prefetchQuery(queries.<name>()); }, path: "<name>" })`, then add it to `routeTree`. Editors with an `$id` param follow `postEditor` (redirect `new` without `create`).
- `modules/admin/components/shell.tsx`: extend the `to` union in `NavItem` and add an entry to `NAV` with an icon, `requires`, and a label via `m.admin_nav_<name>`.

## 5. Strings

Every string goes through Paraglide: add `admin_<name>_*` keys to **both** `packages/i18n/messages/en.json` and `tr.json`, then `pnpm --filter @orkide/i18n build`. No inline `style` attributes (hashed CSP); icons need `aria-hidden`, icon-only buttons an `aria-label`.

## 6. Verify

`pnpm fix && pnpm check && pnpm typecheck && pnpm test`. Run `pnpm dev`, sign in locally (the GitHub flow needs `GITHUB_CLIENT_*` in `apps/api/.dev.vars`; otherwise insert a user and session like `signInAs` in `apps/api/test/helpers.ts`), exercise every role, check keyboard focus order and 375 px layout. The public sign-in page is covered by `apps/web/e2e`; extend it if the resource changes the shell.
