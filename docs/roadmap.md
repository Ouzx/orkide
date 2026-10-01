# Roadmap

Planned work that is intentionally out of the first release. Each item is mirrored as a GitHub issue (label `roadmap`) on the [Orkide roadmap board](https://github.com/users/Ouzx/projects/5).

## Observability & analytics

- [#1](https://github.com/Ouzx/orkide/issues/1) **Sentry** — error tracking for both Workers and the web client (source maps uploaded in CI).
- [#2](https://github.com/Ouzx/orkide/issues/2) **PostHog** — product analytics and feature flags (behind cookie consent).
- [#3](https://github.com/Ouzx/orkide/issues/3) **Datadog** — log drain from Workers Logs / Logpush, APM via OpenTelemetry export.
- [#4](https://github.com/Ouzx/orkide/issues/4) **Google Analytics 4 / Meta Pixel** — marketing analytics, loaded only after consent.

## Payments — Polar.sh ([#5](https://github.com/Ouzx/orkide/issues/5))

- Add `packages/billing` wrapping `@polar-sh/sdk`, the Better Auth Polar plugin (customer sync on sign-up, checkout, customer portal) and a verified webhook route in `apps/api`.
- Products and prices configured in Polar; entitlements exposed through RBAC permissions.
- Start against the Polar sandbox; production keys only via `wrangler secret put`.

## Platform

- [#6](https://github.com/Ouzx/orkide/issues/6) **TypeScript 7.1 + `@astrojs/ts-content-mapper`** — type-check `.astro` files with `tsc` and drop the TypeScript 6 hook (ADR-016).
- [#7](https://github.com/Ouzx/orkide/issues/7) **`prettier-plugin-astro` 1.x** — upgrade once `prettier-plugin-tailwindcss` supports its JSX-based AST (pinned to 0.14 so `.astro` classes stay sorted).
- [#8](https://github.com/Ouzx/orkide/issues/8) **Vitest 5** — upgrade once `@cloudflare/vitest-plugin` supports it (ADR-011).

- [#9](https://github.com/Ouzx/orkide/issues/9) **`cf` CLI migration** — run `cf migrate` once the CLI leaves beta and supports monorepos (ADR-002).
- [#10](https://github.com/Ouzx/orkide/issues/10) **Custom domain** — move off `workers.dev`, enable zone features (Image transformations via URL, Cache Rules, Markdown for Agents) and verify a Resend sending domain.
- [#11](https://github.com/Ouzx/orkide/issues/11) **Mobile app** — `apps/mobile` with Expo, reusing `api-client`, `validators`, `i18n`.
- [#12](https://github.com/Ouzx/orkide/issues/12) **NLWeb / MCP endpoint** — let AI agents query site content directly.
