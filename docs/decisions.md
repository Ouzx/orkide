# Architecture Decision Log

Short, dated records of decisions that shape the codebase, numbered in order. Each entry: **context → decision → consequences**.

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

### ADR-008 · Drizzle ORM v1 (release candidate)

- **Context:** Drizzle v1 is at RC with a frozen API; it ships Relational Queries v2, built-in zod schema generation (`drizzle-orm/zod`) and per-migration folders. Migrating from 0.x later is costly.
- **Decision:** adopt `drizzle-orm@1.0.0-rc` / `drizzle-kit@1.0.0-rc` now.
- **Consequences:** the Better Auth CLI still emits RQB v1 relations, so `auth:generate` strips them and all relations live in `@orkide/db/relations`. Wrangler applies the folder layout through `migrations_pattern: "<dir>/*/migration.sql"`. Casing is set per table via `defineTable`.

### ADR-009 · Paraglide compiled once, explicit locale on the server

- **Decision:** `packages/i18n` owns messages and compiles them once (strategy: url → cookie → Accept-Language → base). The web Worker uses `paraglideMiddleware` with translated route segments; the API passes `{ locale }` explicitly to message functions instead of relying on global state.

### ADR-010 · Auth sessions in D1, throttling at the edge

- **Context:** KV is eventually consistent and has no atomic increment.
- **Decision:** no KV secondary storage for Better Auth; sessions in D1 behind a signed cookie cache, rate limiting through the Workers Rate Limiting binding. Sign-up is closed to `ADMIN_EMAILS`.

### ADR-011 · Vitest 4 across the workspace

- **Context:** `@cloudflare/vitest-plugin` (tests inside `workerd`) supports Vitest `^4.1` only.
- **Decision:** the catalog pins Vitest 4; runtime-faithful tests outweigh the newer major.
- **Consequences:** upgrade to Vitest 5 when the plugin supports it (roadmap).

### ADR-012 · Cloudflare Flagship for feature flags

- **Decision:** flags live in the `orkide` Flagship app; `apps/api/src/core/flags.ts` is the typed registry (key, fallback, visibility). Public flags are served by `GET /api/flags`; any route can be gated with `requireFlag()`.

### ADR-013 · Workers Cache with cache tags (supersedes the KV response cache)

- **Context:** Workers Cache is a tiered, request-collapsing cache in front of the Worker. It works on `workers.dev` and through service bindings, is keyed by path + query, and supports global purges by `Cache-Tag` from any handler.
- **Decision:** `cache.enabled` on the API. Every response is `private, no-store` by default; reader routes opt in with `shareable(tag)`, which only shares responses whose locale is explicit in the URL (cookies are not part of the cache key). Writes call `purge(tag)`.
- **Consequences:** no KV cache layer and no `CACHE` binding. Locally (Miniflare) there is no Workers Cache, so purging is a no-op there.

### ADR-014 · Web Worker: Hono in front of Astro, pages cached in the Worker's own cache

- **Context:** Workers Cache is scoped per Worker (and per entrypoint), so the API cannot purge pages cached by the web Worker. Pages are server-rendered from API data.
- **Decision:** `src/worker.ts` is a Hono app: `/api/*` goes to the API over the Service Binding, everything else through `astro/hono`. Pages opt into Astro route caching (`cacheCloudflare()`, `Cloudflare-CDN-Cache-Control` + `Cache-Tag`) for 5 minutes with a day of stale-while-revalidate. Admin writes pass through the forwarder, which reads the `orkide-purge-tags` header set by the API's `purge()` and purges its own tags. Scheduled publishing (cron, no request) is bounded by the 5-minute freshness — the cron's own cadence.
- **Consequences:** every page must be a pure function of its URL: theme and locale preferences stay client-side (pre-paint script, localStorage, cookie only for the unprefixed redirect), and unprefixed URLs redirect with `private, no-store`.

### ADR-015 · Hashed CSP owned by Astro

- **Decision:** `security.csp` emits the `Content-Security-Policy` header (script/style hashes per build); Hono's `secureHeaders` sets every other header and never CSP. The single hand-written inline script (pre-paint theme) is a constant whose hash is computed in `astro.config.ts`. No `define:vars` scripts, no inline `style` attributes, no server-rendered React `<form action>` (React inlines a replay script).
- **Consequences:** the Paraglide runtime and message catalog stay out of client bundles too — islands receive server-rendered strings as props.

### ADR-016 · `astro-check` with a private TypeScript 6

- **Context:** `astro check` needs the TypeScript JS API, absent from TypeScript 7.0; its successor (`@astrojs/ts-content-mapper`) requires 7.1 (nightly only).
- **Decision:** `.pnpmfile.cjs` gives `@astrojs/check` and `@astrojs/language-server` their own `typescript@6`; `apps/web` runs the standalone `astro-check` binary (the `astro check` wrapper refuses when the workspace TypeScript is 7). Everything else stays on TypeScript 7 (ADR-004).
- **Consequences:** remove the hook and switch to the content mapper once TypeScript 7.1 is stable (roadmap).

### ADR-017 · Media pipeline with fingerprinted outputs

- **Context:** hand-made art arrives as large PNG/MP4 originals; the site needs responsive AVIF/WebP, posters, icons and stable URLs for crawlers and email clients.
- **Decision:** originals stay out of git (`design/incoming/`); `scripts/media.ts` (sharp + ffmpeg) writes responsive variants and a typed manifest into `src/assets/media/` (imported as URLs, so Vite fingerprints them and they are served immutable), stable-URL files into `public/media/`, and icons into `public/`. Pages use `<Picture>`/`<MediaSlot>`; the hero keeps the artwork as its LCP image and layers WebGL pollen over it.
- **Consequences:** builds need no image processing at runtime (no Images binding transformations for site art); regenerating is one command.
- **Update 2026-10-18:** the Instrument skin draws its imagery in code; only the stable files and icons remain (ADR-031).

### ADR-018 · Admin is a client-side app with client Paraglide

- **Context:** the dashboard is private, interactive and never cached, so ADR-015's server-rendered-strings rule buys nothing there, while threading every string through props would bloat each admin component.
- **Decision:** `/admin/**` is one Astro page that checks the session on the server over the Service Binding, then mounts a `client:only` React app (TanStack Router + Query) that imports Paraglide messages directly. RBAC is enforced again by the API on every request. A 429 from `get-session` is retried quietly (backoff, `Retry-After` honoured, capped) and then shown as a translated message with a 429 status; only a real 401 or an absent session redirects to sign-in.
- **Consequences:** the admin bundle carries the message catalog (public pages still do not); the admin shell stays `private, no-store` and `noindex`.

### ADR-019 · Production on workers.dev with placeholder GitHub OAuth secrets

- **Context:** the production GitHub OAuth app is created by hand, but `@orkide/auth` validates `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` at module load, so a Worker without them does not boot. Resend's shared `onboarding@resend.dev` sender only delivers to the account owner, and Analytics Engine must be enabled once in the dashboard before a Worker can bind it.
- **Decision:** the first deploy ships both secrets as the literal `unset-see-morning-todo` so the Workers start and the public site works; sign-in stays impossible until real OAuth credentials replace them. `ANALYTICS_API_TOKEN` is a blank string (the stats code treats blank as "not provisioned"). Secrets are uploaded with `wrangler deploy --secrets-file` from a git-ignored file, never committed.
- **Consequences:** no production owner can sign in until the OAuth app exists; visitor auto-replies to addresses other than the owner's fail and end in the DLQ until a sending domain is verified (roadmap: custom domain).

### ADR-020 · Auto-deploy with Workers Builds, one build per Worker

- **Context:** both Workers live in one repository and `web` reaches `api` through a Service Binding.
- **Decision:** Workers Builds (Cloudflare's Git integration) builds each Worker from `main` with watch paths (`apps/<app>/*`, `packages/*`, lockfile, workspace and turbo config; `*.md` and `docs/*` excluded). The API build also runs `d1 migrations apply --remote` before `wrangler deploy`. CI (GitHub Actions) only verifies; it holds no Cloudflare credentials.
- **Consequences:** a change to `packages/*` triggers both builds in parallel, so a breaking API change must stay backward compatible for the length of one deploy. Deploys are gated by Cloudflare's builds, not by CI; a failing CI run on `main` does not roll back a deploy.

### ADR-021 · CI hygiene: Sherif, Knip, grouped Renovate

- **Context:** strict catalog mode already stops version drift on `pnpm add`; nothing stopped dead dependencies or hand-edited ranges.
- **Decision:** CI runs `ultracite check` (plus Prettier for `.astro`), Sherif, Knip, typecheck, tests and build. Knip checks files, dependencies, unlisted imports and binaries; unused-export reporting is off because Astro islands (default exports mounted through `client:*`) and tool entry points are not always followed. Renovate groups all `pnpm-workspace.yaml` bumps into one catalog PR and holds back the majors listed in the roadmap.
- **Consequences:** unused exports must be reviewed by hand (a Knip run with exports enabled lists candidates). Turborepo Remote Cache is wired through optional `TURBO_TOKEN` / `TURBO_TEAM`.

### ADR-022 · The Paraglide config is force-tracked

- **Context:** Paraglide only reads `paraglide.config.ts` from inside the inlang project directory, and inlang's own `project.inlang/.gitignore` ignores everything except `settings.json`. The config (URL patterns, route strategies, `emitTsDeclarations`) was therefore never committed: local builds worked, but every clean clone (CI, Workers Builds) compiled default strategies and served 404 for every page.
- **Decision:** `packages/i18n/project.inlang/paraglide.config.ts` is added with `git add -f`; tracked files ignore the nested ignore rule.
- **Consequences:** never delete it from the index; a clean-clone build (`pnpm i && pnpm turbo build`) is the check that nothing else is hiding behind an ignore rule.

## 2026-10-02 — Quality gates

### ADR-023 · End-to-end and accessibility checks against the production build

- **Context:** unit tests cannot see CSP violations, hydration failures, layout overflow or contrast problems, and the layouts are fluid from phone to 4K.
- **Decision:** Playwright (`apps/web/e2e`) drives the real build of both Workers locally (`vite preview` + `astro preview`, joined by the same Service Binding as in production) against a throwaway D1 database migrated and seeded by `pnpm e2e:prepare` (`apps/api/seed/e2e.sql`). One Chromium project per width (375, 768, 1440, 2560 px); every public page, the 404 and the admin sign-in run axe-core (WCAG 2.0 to 2.2 A/AA plus best practices) in light and dark, assert no horizontal scroll, and the key pages assert a clean console (which is where CSP violations surface). Violations are fixed, never suppressed.
- **Consequences:** `pnpm build` must precede `pnpm test:e2e`. CI runs the suite in its own job with a placeholder `.dev.vars` (`.github/actions/local-stack`). The API's per-IP rate limits are skipped when `ENVIRONMENT=development`, and for calls without `cf-connecting-ip` (the web Worker's server-side renders over the Service Binding, which would otherwise share one key and throttle every visitor together).

### ADR-024 · Lighthouse CI with honest budgets

- **Context:** the goal was 100 in all four categories on the home page, the blog index and a post, measured with Lighthouse's default mobile profile against the local build.
- **Decision:** `@lhci/cli` (`apps/web/lighthouserc.json`, 3 runs per URL, best run asserted) runs against `scripts/preview-stack.ts`, which adds a small compressing front (brotli/gzip, like the Cloudflare edge; Miniflare serves text uncompressed and would fail "enable text compression" for a reason production does not have). Stylesheets are inlined (`build.inlineStylesheets: "always"`; Astro hashes them into the CSP), which removed the render-blocking request. Accessibility and Best Practices must be 100. Performance must be at least 0.95 on the blog pages and 0.90 on the home page; SEO at least 0.92.
- **Why not 100:** SEO loses 8 points to one audit, `robots-txt`, which rejects the `Content-Signal` directive in `robots.txt` as unknown. That directive is the site's deliberate, explicit AI-usage policy (contentsignals.org), so it stays; Lighthouse's validator simply does not know it yet. Performance is capped by the simulated 4x CPU / slow-4G profile: the blog pages score 0.99 (FCP 1.3 s); the home page is 0.93 to 0.97 because its LCP is the hero poster inside a blurred, masked stack of layers on a throttled CPU.
- **Consequences:** raise the thresholds when either cause is removed (tracked in the roadmap). CI uploads the reports as an artifact.
- **Update 2026-10-17:** CI no longer runs Lighthouse; it is an analysis run on request (ADR-028).
- **Update 2026-10-02:** five-run medians on the home page are 98 (LCP 2.0 s, TBT about 125 ms). The run-to-run swing comes from Total Blocking Time, mostly the pollen layer's WebGL setup, which headless CI renders on the CPU. The hero no longer hydrates a React island to schedule that layer; a plain script does it, so the home page ships no framework runtime (6 instead of 10 scripts, 127 instead of 194 KiB of JavaScript). Loading the poster eagerly at high priority did not move LCP, which is dominated by render delay, so it stays lazy.

### ADR-025 · size-limit budgets per client bundle

- **Context:** the only guard was Vite's `chunkSizeWarningLimit`, which warns and does not fail.
- **Decision:** `apps/web/.size-limit.json` enforces brotli budgets on the built `_astro` assets: the lazy hero scene (Three.js) 115 kB, the React runtime 60 kB, the admin editor (Tiptap) 125 kB, the admin shell 55 kB, all JavaScript 480 kB. There is no CSS budget: the stylesheet is inlined into each document (ADR-024). Each sits about 5 to 10 % above today's size. `pnpm size` runs in CI after a build.
- **Consequences:** a dependency bump that grows a bundle fails the Bundle size job and must either be justified by raising the number in the same PR, or fixed.
- **Update 2026-10-18:** the hero-scene budget went with the scene; a budget for the skin's motion and front panel (8 kB) was added and all client JavaScript lowered to 380 kB (ADR-031).

### ADR-026 · Treat Workers Rate Limiting as best-effort

- **Context:** production bursts above the configured 10/60s never produced a 429 (see `docs/operations.md`); Cloudflare documents the binding as per-location, per-isolate cached and permissive.
- **Decision:** keep the bindings as soft damping; rely on Turnstile for the contact form and plan a WAF rate-limiting rule on a custom domain for hard limits. Local tests still prove the limiter runs before validation.
- **Consequences:** do not promise strict throttling in product docs; revisit when the custom domain lands.

## 2026-10-02 — Email

### ADR-027 · Owner notification only; no visitor auto-reply

- **Context:** production sends from `onboarding@resend.dev`, which Resend only delivers to the account owner, so the `contact.acknowledge-sender` job failed for every visitor and ended in the dead-letter queue. This is a template project that stays on `workers.dev`, so a verified sending domain is not planned.
- **Decision:** remove the visitor acknowledgement entirely (job type, enqueue, handler, email template, `email_contact_ack_*` messages) rather than hide it behind a flag. `contact.notify-owner` remains the only email.
- **Consequences:** visitors get no confirmation mail; the form's on-page success state is the only feedback. Re-adding it later means a verified domain, a new job type and a template. The custom domain (#10) is no longer a blocker for email.

## 2026-10-17 — Analysis on request

### ADR-028 · Lighthouse and accessibility are analysis, not gates

- **Context:** the Lighthouse assertions (ADR-024) and the axe e2e suite failed CI on any score below threshold, and the rules asked for every change to be "accessible and fast". Agents treated a failing score as an instruction and optimised on their own, including changes visitors can see.
- **Decision:** CI no longer runs Lighthouse, and `pnpm test:e2e` skips the axe suite (`pnpm test:a11y` runs it). Both are analyses the agent may offer after building a feature and runs only when the user agrees. Every run is saved to `docs/analysis.md`; fixes need the user's go-ahead, and a fix that changes what visitors see needs approval for that change (AGENTS.md rule 18). `lighthouserc.json` keeps its thresholds as the reference the analysis reports against.
- **Consequences:** regressions in accessibility or speed are no longer caught automatically; they surface when an analysis is run. The size-limit budgets (ADR-025) still run in CI.

## 2026-10-18 — From the first derived product

### ADR-029 · A motion switch on top of the system setting

- **Context:** the first product derived from Orkide added a site-level way to turn motion off, because visitors who find the motion distracting rarely know about the operating system's setting. Orkide has motion too (the pollen layer, the spotlight, scroll reveals).
- **Decision:** a "Reduce motion" switch in the footer stores `orkide-motion=off` in `localStorage`. The pre-paint head script (the theme script, already hashed into the CSP) sets `html.calm` before first paint. `html.calm` does what `prefers-reduced-motion: reduce` does: CSS animations and transitions stop, scroll reveals stay put, the pollen layer unmounts (and mounts again when motion returns, via `motionchange`), and the spotlight rests. The switch is hidden when the system already reduces motion. Scripts ask `motionAllowed()` (`shared/motion/motion.ts`).
- **Consequences:** pages stay identical for every visitor (the choice lives client-side, rule 16). New motion must check `motionAllowed()` or sit under the global rules in `globals.css`.

### ADR-030 · Site content as validated sections, edited in the admin

- **Context:** the home page's words were Paraglide messages, so changing them meant a deploy. Every product built on Orkide needs its owner to edit page copy, and per-section tables with their own endpoints and screens are a lot of code for a few fields each.
- **Decision:** each section is a JSON document per locale in `site_block`, validated by its Zod schema in `@orkide/validators/site`; types are inferred from the schemas and the shipped content lives in `@orkide/validators/site-defaults`. `GET /api/site` returns the edited sections, shared-cached under the `site` tag; saves and resets purge it. Pages call `loadSite(locale)` (`modules/home/site.server.ts`), which puts the saved sections over the shipped ones and falls back to them if the API is unreachable. The admin's **Site content** screen builds its forms from each section's JSON Schema (served by the API, so no Zod ships to the browser) and the API validates every save. Owners and editors edit; viewers read. Orkide ships one section, `hero`; interface chrome stays in Paraglide.
- **Consequences:** a stored section that no longer matches its schema is ignored and the shipped content shows until it is saved again. A new section means a schema in `site.ts`, its shipped content in `site-defaults.ts`, labels in `modules/admin/site/labels.ts` and the page reading it through `loadSite` (tagged `site`).

## 2026-10-18 — Instrument

### ADR-031 · The Instrument skin

- **Context:** the first look (glass panels, an orchid-and-aurora palette, a Three.js pollen scene over hand-made art) was replaced by a new identity chosen from built prototypes (the Web Experiment Atlas, catalog entries SP-04, MO-05 and SN-01). Orkide is also the template every product derives from, so the look has to be swappable without touching page structure.
- **Decision:** the site is a hand-built device. The home hero is a front panel (an LED display that types the headline, knobs that turn through the latest posts and work, keycaps, a speaker grille, page lamps); listings and posts are pages of a manual (§ numbers, specs, a reading dial); projects are cartridges that tilt with a holographic glare; the footer is the back panel; the admin is service mode. Under the panel, a signal chain (`stack`, a second site-content section) walks one request from the edge to the last pixel and reads this page load's own timings in the visitor's browser, so the cached HTML stays the same for everyone. Two more sections describe the template itself: "Inside Orkide" (meters and the features that matter) and "Build on it" (clone, run, reskin); like the hero, all of them are site-content sections the owner edits. The skin lives in `packages/ui`: tokens in `src/tokens/tokens.json` (W3C Design Tokens, light and dark) built by `scripts/tokens.ts` into `tokens.css`, `tokens.ts` and a computed contrast table; the component classes in `styles/kit.css`, shared by Astro markup and the React kit (`src/kit`, Base UI behaviour under our styles); `motion/motion.ts`, `effects/*` and `styles/motion.css`; four fonts (Saira, Hanken Grotesk, Doto, Martian Mono) through the Astro Fonts API. shadcn is parked in `src/shadcn` (ignored by Knip) with its names aliased onto the skin. `packages/ui/DESIGN_SYSTEM.md` explains how a product replaces the skin.
- **Motion:** an enhancement over a designed resting state. The site-wide layer (tilt, magnetic keys, rising blocks) and the panel's typing, grille and lamps load after first contentful paint only when `motionAllowed()`; knobs work for everyone and snap instead of springing when motion is reduced. Reduced motion keeps every part in place, answers hover and press with colour, and cross-fades page changes. Sound (synthesized clicks and pentatonic notes, Web Audio) is off until the visitor switches it on in the header.
- **Consequences:** the Three.js pollen scene, its `hero-scene` flag, its size budget, the `three` dependency, the spotlight, the orchid mark and the responsive-picture part of ADR-017 (`Picture`, `MediaSlot`, the manifest, the videos) are removed; the media pipeline keeps the stable files and icons, and `pnpm --filter @orkide/web brand` draws their originals from the tokens. The `hero-scene` flag can be deleted from the Flagship dashboard. Every interface string is still a Paraglide message (the panel's labels are new messages); the hero's words stay admin-editable (ADR-030).
- **Update 2026-10-20:** replaced by the Blueprint skin (ADR-032).

## 2026-10-20 — Blueprint

### ADR-032 · The Blueprint skin

- **Context:** the Instrument skin (ADR-031) made the site a hand-built device. It was too particular for a template: a product deriving from Orkide had to strip the device before it could look like itself, and a product that kept its own design could no longer exchange changes with Orkide without conflicts in every page. Orkide needs a look that reads as a template and that products restyle through the skin alone.
- **Decision:** every page is a sheet of a drawing set on blueprint paper, in a frame with zones, a status line and a title block. The home page is the cover sheet (G-001): the stack as an exploded isometric with a parts list, Section A–A (the request's stages with this page load's own timings, ADR-031's `stack`), a schedule and general notes ("Inside Orkide"), the drawing index of posts, plates of projects (line art generated per project), the assembly steps for deriving a product (now ending in merging upstream) and a request-for-information teaser. The blog is the drawing index (G-002), the portfolio the plates (G-003), contact an RFI (G-004); posts and projects are detail sheets numbered from their date (`D-YYMMDD`, `P-YYMMDD`), errors are void sheets (X-404, X-500) and the admin is the drafting table (A-201). The blue print is the default, also without JavaScript; the white print is the visitor's choice (`.light` on `<html>`, stored as `orkide-theme=light`), exposed by a lamp sweeping across the sheet. The skin keeps ADR-031's structure in `packages/ui` (tokens built into `tokens.css`, `tokens.ts` and the contrast table; `kit.css`, now in `@layer components` so utilities win; the React kit on Base UI; motion and effects) with new values and three fonts: Archivo with its width axis, Chivo Mono, and Shantell Sans for redline notes. The hero's site-content schema gains the parts list (`parts`, nine rows) and `deriveCta`/`sourceCta`.
- **Motion:** at rest every drawing is complete; motion only draws it. The cover's first plot is CSS, so it starts with the first paint. The rest (`shared/motion/blueprint.ts` and the drawing's own motion) loads after first paint when `motionAllowed()`: a CAD cursor with object snap on fine pointers, magnetic buttons, sections that arrive, plates plotted by pen, counters, a revision cloud around the newest post, and the drawing's orbit, explode, packet and purge. Reduced motion finishes every animation at once, without delays.
- **Consequences:** sound, the knobs, tilt, the LED display and the meters are gone with their presets and messages. The theme is two prints instead of system, light and dark, so `prefers-color-scheme` no longer chooses it. A stored hero saved under the Instrument schema no longer validates, so the shipped hero shows until the owner saves the section again (ADR-030). A product that keeps its own skin merges the design commits with `git merge -s ours`, then the rest of `main`, so only the template's other changes arrive.

## 2026-10-27 — Blueprint refinements

### ADR-033 · Blueprint refinements: readable labels, arrivals and directed page changes

- **Context:** using the kit for presentation sheets read across a room showed what the blue print lacks at a distance: the secondary ink was too faint for labels, the grid competed with the text, thin weights broke up, and sentences set in the secondary ink read as labels. The sheets' motion also had more life than the site's: lists arriving item by item, stamps landing, accents drawn in.
- **Decision:** tokens: `ink-2` #C4D7F2 on the blue print and #34547E on the white (7.1:1 on both, from 5.8 and 5.2), a fainter grid, display and condensed widths of 70 % and 76 %, mono tracking of 0.06–0.1 em, light and normal weights of 400 and 450. Sentences (leads, notes, stages, schedule labels, row summaries, plate and step text, empty states) are set in the main ink; `ink-2` is for labels. The kit gains `o-two`, `o-case`, `o-meters`, `o-anatomy` with `data-parts-set`, and a title accent (`<em>`). Motion: when a section scrolls in, its list parts arrive one after another and its badges land like stamps (never what is on screen at load, so first paint is unchanged); every sheet's header arrives at load with transforms only; plates lift like slips of paper, row numbers step forward, the brand mark redraws on hover, the status line flashes on a new section, Section A–A keeps a request travelling and the last derive command's cursor blinks. Page changes slide the other way when going back or up a level, and an opened post row or plate morphs its number and title into the detail sheet.
- **Consequences:** products on the Blueprint skin get the new values through `tokens.json`; one with its own skin merges as before (`-s ours` on the design commits). The `back` direction and the morphs need cross-document view transitions (Chromium, Safari 18.2+); other browsers change pages as before.
