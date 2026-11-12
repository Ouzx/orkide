# Security

The gates that protect Orkide and every product derived from it: what lives in code (every product inherits it) and what is set on the Cloudflare zone that holds the custom domain (each product checks its own zone). Set up on 2026-11-12 after a security review; the decisions are ADR-015, ADR-026 and ADR-035 in `decisions.md`.

```text
Request → Cloudflare zone (TLS, WAF rule, rate-limiting rule, Managed Ruleset)
        → web Worker (workers.dev redirect first, security headers, hashed CSP)
        → Service Binding → API Worker (no public address: RBAC, CSRF, body cap, rate limits, Turnstile)
```

## In code

| Gate | Where | Notes |
| --- | --- | --- |
| The API has no public address | `apps/api/wrangler.jsonc` (`workers_dev: false`, `preview_urls: false`) | The Service Binding is its only door, so nothing reaches it around the zone's rules. ADR-035. |
| workers.dev redirect runs first | `apps/web/src/worker.ts`, `onSite()` in `shared/site.ts` | Every request on the web Worker's workers.dev address moves to the public origin (301 for GET/HEAD, 308 otherwise). The path is set, not resolved, so `//evil.example` can't become another host. |
| No preview URLs for the web Worker | `apps/web/wrangler.jsonc` (`preview_urls: false`) | Branch builds upload versions without a reachable URL; they would run with production bindings. Protect previews with Cloudflare Access if a product needs them. |
| Security headers | `apps/web/src/worker.ts` (`secureHeaders`), `apps/api/src/core/middleware/security.ts` | HSTS (2 years, `includeSubDomains`, `preload`), `X-Frame-Options: DENY`, COOP/CORP, `nosniff`, Permissions-Policy; the API sends `default-src 'none'`. |
| Hashed CSP | Astro `security.csp` (ADR-015) | No inline `style` attributes, no `define:vars` scripts; scripts only from the origin and `challenges.cloudflare.com`. |
| Auth and roles | `packages/auth` (Better Auth), `requirePermission` on every admin route | GitHub OAuth and passkeys, sign-up closed to `ADMIN_EMAILS`, roles `owner` / `editor` / `viewer`. A product with password sign-in limits attempts in D1 (`rateLimit.customRules`). |
| CSRF and body size | `apps/api/src/core/middleware/security.ts` | Origin check against `BETTER_AUTH_URL` on state-changing requests; 256 KB body cap. |
| Per-IP rate limits | `apps/api/src/core/middleware/rate-limit.ts` | Workers Rate Limiting bindings, best effort (ADR-026); the zone rule below is the hard limit. |
| Turnstile | `apps/api/src/shared/turnstile.ts` | Verified on the server, with a hostname check. Widgets list only the custom domain. |
| Uploads | `apps/api/src/modules/media` | Type from the file's bytes, size limits, images re-encoded, private R2 bucket. |
| Caching | `shareable()` / `purge()` (rule 8), `cachePage` | `private, no-store` by default; shared caching only for responses identical for every visitor. |

## At the edge (the zone)

Everything here fits the Free plan (5 custom rules, 1 rate-limiting rule on path fields with a 10 s period).

| Setting | Value | Why |
| --- | --- | --- |
| SSL/TLS mode | Full (strict), custom mode | The right default for any future proxied record with a real origin. |
| Minimum TLS | 1.2 (TLS 1.3 on) | 1.0 and 1.1 are deprecated. |
| Always Use HTTPS | on |  |
| DNSSEC | on | Cloudflare signs the zone; the DS record has to be added at the registrar (the parent zone), even when Cloudflare is the DNS host. |
| CAA | `issue` for `letsencrypt.org`, `pki.goog; cansignhttpexchanges=yes`, `ssl.com`, `sectigo.com` | Only Cloudflare's certificate authorities can issue. |
| SPF and DMARC | `v=spf1 -all`; `_dmarc`: `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` | The domain sends no mail of its own (the mail provider sends from its domain), so forged mail from it is rejected. Update both before sending from the domain. |
| Custom rule: block exploit probes | Block, expression below | These apps never serve PHP, WordPress, dotfiles or CGI; probes stop at the edge. |
| Rate-limiting rule | 5 requests per 10 s per IP, block 10 s | On `/api/contact`, the social and password sign-in paths and each product's own form endpoints. Leave out `/api/auth/get-session`, passkey endpoints and `/api/track`. |
| Free Managed Ruleset | on (default) |  |
| Bot Fight Mode | off | No rule can skip it, and its injected script is blocked by the hashed CSP; it also challenges feed readers, agents and your own scripts. Forms already have Turnstile. |
| AI crawlers | allowed | robots.txt allows search, AI input and training, and the site ships `llms.txt` and Markdown alternates. |
| HSTS | from code, not the zone setting | One source of truth. |

The exploit-probe rule (the Free plan has no regex):

```txt
(starts_with(lower(http.request.uri.path), "/wp-")
 or lower(http.request.uri.path) contains "/wp-admin"
 or lower(http.request.uri.path) contains "/wp-content"
 or lower(http.request.uri.path) contains "/wp-includes"
 or lower(http.request.uri.path) contains "/xmlrpc"
 or lower(http.request.uri.path) contains ".php/"
 or lower(http.request.uri.path) contains "/cgi-bin"
 or lower(http.request.uri.path) contains "/.env"
 or lower(http.request.uri.path) contains "/.git"
 or lower(http.request.uri.path) contains "/.aws"
 or lower(http.request.uri.path) contains "/.ssh"
 or lower(http.request.uri.path) contains "/.ds_store"
 or lower(http.request.uri.path) contains "/phpmyadmin"
 or lower(http.request.uri.path) contains "/vendor/phpunit"
 or lower(http.request.uri.path) contains "/server-status"
 or lower(http.request.uri.path) contains "/actuator"
 or ends_with(lower(http.request.uri.path), ".php")
 or ends_with(lower(http.request.uri.path), ".asp")
 or ends_with(lower(http.request.uri.path), ".aspx")
 or ends_with(lower(http.request.uri.path), ".jsp")
 or ends_with(lower(http.request.uri.path), ".cgi"))
```

## Left as decisions

- **HSTS preload submission.** The header already says `preload`, but submitting the domain to hstspreload.org is close to permanent and covers every subdomain. A derived product on its own domain inherits the `preload` token: drop it there if that product doesn't want to submit.
- **security.txt.** Needs a contact address you are willing to publish and a yearly renewal. Use the zone's Security Center file, or `apps/web/public/.well-known/security.txt` in the product (never in Orkide: the contact is product-specific).

## For a new product

1. Turn on 2FA on the Cloudflare login and enforce it on the account: that login controls DNS, the Workers, the data and the secrets.
2. Keep `workers_dev: false` and `preview_urls: false` on the API, and `preview_urls: false` on the web Worker; set `WORKERS_DEV_HOST` to the web Worker's workers.dev address.
3. Apply the zone table above. If the zone is shared with other products, add the new product's form endpoints to the one rate-limiting rule.
4. List only the custom domain in the Turnstile widget.
5. Check:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<api-worker>.<account>.workers.dev/api/health   # 404
curl -s -o /dev/null -w '%{redirect_url}\n' 'https://<web-worker>.<account>.workers.dev//evil.example/x'   # stays on the site
curl -s -o /dev/null -w '%{http_code}\n' https://<domain>/wp-admin/   # 403
dig +short CAA <domain>; dig +short TXT _dmarc.<domain>
```
