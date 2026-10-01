# Operations

Production runs on workers.dev: web `https://orkide-web.ouzx.workers.dev`, api `https://orkide-api.ouzx.workers.dev` (the browser only talks to web; `/api/*` is forwarded over the Service Binding). Decisions behind this setup: ADR-019 to ADR-021.

## Pending production setup

1. **Enable Analytics Engine** once: dashboard -> Workers & Pages -> Analytics Engine -> Enable. Until then the API Worker cannot bind `ANALYTICS` and Workers Builds cannot deploy it. The first deploy was made with that one binding removed (`/api/track` returns 500 meanwhile).
2. **GitHub OAuth app** (needed to sign in): GitHub -> Settings -> Developer settings -> OAuth Apps -> New. Homepage `https://orkide-web.ouzx.workers.dev`, callback `https://orkide-web.ouzx.workers.dev/api/auth/callback/github`. Then:
   ```bash
   cd apps/api
   pnpm exec wrangler secret put GITHUB_CLIENT_ID
   pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
   ```
   The first sign-in with an `ADMIN_EMAILS` address creates the `owner` account (sign-up is otherwise closed); add a passkey afterwards.
3. **`ANALYTICS_API_TOKEN`**: create an API token with _Account Analytics: Read_, then `pnpm exec wrangler secret put ANALYTICS_API_TOKEN` (stats and vitals are empty until then).
4. **Resend sending domain**: verify a domain, change `EMAIL_FROM` in `apps/api/wrangler.jsonc`. With `onboarding@resend.dev` Resend only delivers to the account owner.

## Day to day

- Deploys happen from `main` through Workers Builds (one build per Worker, watch paths per app). Manual deploy: `pnpm turbo run build` then `pnpm --filter @orkide/<app> deploy`.
- Remote migrations: `pnpm --filter @orkide/api db:migrate:remote` (the API build runs it before every deploy).
- Secrets: `wrangler secret put <NAME>` inside `apps/api`; values never go in git. Required: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ANALYTICS_API_TOKEN`.
- Turborepo Remote Cache in CI: set repo secret `TURBO_TOKEN` and variable `TURBO_TEAM`.
