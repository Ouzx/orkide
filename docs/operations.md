# Operations

Production runs on workers.dev: web `https://orkide-web.ouzx.workers.dev`, api `https://orkide-api.ouzx.workers.dev` (the browser only talks to web; `/api/*` is forwarded over the Service Binding). Decisions behind this setup: ADR-019 to ADR-021.

## Local setup

1. `pnpm install`, then create `apps/api/.dev.vars` from `apps/api/.dev.vars.example`. `BETTER_AUTH_SECRET` needs 32+ characters (any value locally); `BETTER_AUTH_URL` is `http://localhost:4321`; GitHub, Resend and Turnstile values may be placeholders unless you exercise those flows (Turnstile's test secret `1x0000000000000000000000000000000AA` always passes). Set `ENVIRONMENT=development` (this also switches the per-IP rate limits off).
2. `pnpm dev` for the live stack. For the production build: `pnpm build`, `pnpm e2e:prepare` (migrates and seeds the local D1), then `pnpm test:e2e` / `pnpm lighthouse`.
3. The file is copied into the API build output, so a missing or incomplete `.dev.vars` makes the Worker fail at boot with a ZodError. `pnpm dev` and `pnpm preview` in `apps/api` check it first and say what is missing; builds themselves never need secrets (production secrets live in Cloudflare).

## Claude Code on the web

A cloud session clones the repo and reads only what is committed: `CLAUDE.md`/`AGENTS.md`, `.claude/settings.json` hooks, `.claude/skills` (the project skills, plus `dive-mode`, `flight-mode` and `sloth`) and `.mcp.json` ([what carries over](https://code.claude.com/docs/en/cloud-environments#what-carries-over-from-your-setup)). Plugins declared in `enabledPlugins` do **not** load in the cloud, and neither do `~/.claude` skills, hooks or MCP servers. The Cloudflare, Vercel, Playwright, TypeScript LSP and frontend-design plugins therefore stay local-only; Context7 and GitHub come from the claude.ai connectors. `transitions-dev` is not committed (its licence forbids redistributing the collection); install it per machine with `npx skills add Jakubantalik/transitions.dev`.

`.claude/hooks/cloud-bootstrap.sh` (SessionStart, a no-op unless `CLAUDE_CODE_REMOTE=true`) installs Node 24 from nodejs.org (the VM ships 20 to 22), enables the pinned pnpm, runs `pnpm install` when `node_modules` is missing, and writes `apps/api/.dev.vars` when absent. It uses CI's throwaway placeholders, so **no environment variable is required** for `pnpm dev`, `pnpm test` or `pnpm check`.

Optional variables for the cloud environment (names only; values there are visible to everyone who uses the environment): `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `ANALYTICS_API_TOKEN` (override the placeholders in `.dev.vars`), and `CLOUDFLARE_API_TOKEN` plus `CLOUDFLARE_ACCOUNT_ID` for deploys and remote D1.

Network: the default **Trusted** list covers npm, GitHub and nodejs.org. Use **Custom** with "include default list" and add `api.cloudflare.com`, `*.workers.dev` (smoke-testing production), `api.resend.com` and Playwright's browser CDN (`cdn.playwright.dev`) if you need them; none is in the default list. Wrangler OAuth login (`wrangler login`) cannot run in a cloud session, so remote operations need `CLOUDFLARE_API_TOKEN`.

## Pending production setup

1. **Analytics Engine**: enabled (done); `/api/track` returns 204.
2. **GitHub OAuth app** (done; needed to sign in): GitHub -> Settings -> Developer settings -> OAuth Apps -> New. Homepage `https://orkide-web.ouzx.workers.dev`, callback `https://orkide-web.ouzx.workers.dev/api/auth/callback/github`. Then:
   ```bash
   cd apps/api
   pnpm exec wrangler secret put GITHUB_CLIENT_ID
   pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
   ```
   The first sign-in with an `ADMIN_EMAILS` address creates the `owner` account (sign-up is otherwise closed); add a passkey afterwards.
3. **`ANALYTICS_API_TOKEN`**: create an API token with _Account Analytics: Read_, then `pnpm exec wrangler secret put ANALYTICS_API_TOKEN` (stats and vitals are empty until then).
4. **Email**: nothing to do. Only the owner notification is sent, from `onboarding@resend.dev` to the Resend account owner (ADR-027). Verify a sending domain and change `EMAIL_FROM` only if visitor-facing mail is ever added back.

## Day to day

- Deploys happen from `main` through Workers Builds (one build per Worker, watch paths per app). Manual deploy: `pnpm turbo run build` then `pnpm --filter @orkide/<app> deploy`.
- Remote migrations: `pnpm --filter @orkide/api db:migrate:remote` (the API build runs it before every deploy).
- Secrets: `wrangler secret put <NAME>` inside `apps/api`; values never go in git. Required: `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ANALYTICS_API_TOKEN`.
- Turborepo Remote Cache in CI: set repo secret `TURBO_TOKEN` and variable `TURBO_TEAM`.

## Rate limiting is approximate

The `RATE_LIMIT_*` bindings are Workers Rate Limiting: counters are local to one Cloudflare location, cached per isolate, permissive and eventually consistent (the docs say it is "intentionally designed to not be used as an accurate accounting system"). On 2026-10-02 bursts of 14 and 40 invalid POSTs to `/api/contact` on workers.dev, all served from FRA with `cf-connecting-ip` present and the limiter code deployed, returned 422 and never 429. Treat the binding as soft abuse damping, not a guarantee. Contact abuse is bounded by Turnstile; for a hard limit add a WAF rate-limiting rule once a custom domain exists (issue #10). Open question: why 40 sequential requests from one IP in one location did not trip a 10/60s limit.
