# Roadmap

Planned work that is intentionally out of the first release. Each item is mirrored as a GitHub issue.

## Observability & analytics

- **Sentry** — error tracking for both Workers and the web client (source maps uploaded in CI).
- **PostHog** — product analytics and feature flags (behind cookie consent).
- **Datadog** — log drain from Workers Logs / Logpush, APM via OpenTelemetry export.
- **Google Analytics 4 / Meta Pixel** — marketing analytics, loaded only after consent.

## Payments — Polar.sh

- Add `packages/billing` wrapping `@polar-sh/sdk`, the Better Auth Polar plugin (customer sync on sign-up, checkout, customer portal) and a verified webhook route in `apps/api`.
- Products and prices configured in Polar; entitlements exposed through RBAC permissions.
- Start against the Polar sandbox; production keys only via `wrangler secret put`.

## Platform

- **Vitest 5** — upgrade once `@cloudflare/vitest-plugin` supports it (ADR-011).

- **`cf` CLI migration** — run `cf migrate` once the CLI leaves beta and supports monorepos (ADR-002).
- **Custom domain** — move off `workers.dev`, enable zone features (Image transformations via URL, Cache Rules, Markdown for Agents) and verify a Resend sending domain.
- **Mobile app** — `apps/mobile` with Expo, reusing `api-client`, `validators`, `i18n`.
- **NLWeb / MCP endpoint** — let AI agents query site content directly.
