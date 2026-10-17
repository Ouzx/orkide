# Cloudflare isolation for a derived Orkide app

Read this when a derived product will use Cloudflare. The goal is to keep its deployment, data and public identity independent from Orkide.

## Use Cloudflare MCP when available

Prefer an installed, connected and authorized Cloudflare MCP for account and resource discovery, setup, and read-back verification. Check which capabilities it actually provides; documentation-only access cannot make account changes. Use Cloudflare's normal dashboard or Wrangler workflow when MCP is unavailable or lacks a needed capability. MCP access does not itself authorize changes.

Before changing anything, identify the intended product, Cloudflare account, environment and domain. Treat Orkide's production resources as protected. Never copy or reveal secret values. After setup, use MCP or the available Cloudflare interface to confirm the product points only to its intended resources.

## What must be product-specific, and why

The cloned Wrangler configuration initially refers to Orkide's Workers and bindings. Review the current configuration and code for each product; do not assume this list is exhaustive.

| Area | What to separate or update | Why |
|---|---|---|
| Workers and builds | API and web Workers, their build connections, repository, production branch and product settings | Keeps product releases from deploying over Orkide or each other |
| Web-to-API connection | The web Worker's API Service Binding target | Keeps browser API requests within the product |
| Data and runtime resources | D1 databases, R2 buckets, Queues and dead-letter queues, Analytics datasets, rate-limit namespaces, Durable Objects and Flagship app/flag configuration | Prevents products from sharing or modifying each other's data, jobs, limits or feature state |
| Product identity | Public origin, custom domains/routes, auth URL, OAuth app/callback, Turnstile host/widget and product-specific vars/secrets | Prevents sign-in, verification, email and public links from using Orkide's identity |
| Build and migration behavior | Product's build/deploy configuration and the target database for migrations | Prevents a product build from deploying the wrong Worker or migrating Orkide's database |

Orkide currently has separate API and web Workers; web forwards API requests through a Service Binding. Its API uses D1, R2, Queues with a dead-letter queue, Analytics Engine, rate limiting, Images, Flagship and a Durable Object. The web Worker binds to the API Worker. Confirm the live source configuration before deriving a product because this inventory can change.

## First deployment

Use MCP or the available Cloudflare workflow to create or select the product's own resources, update the derived repo to match, and read the configuration back. Connect only the product repository to its product Workers. Verify that the API Worker and its database are the product's; then verify the web Worker targets that product API. Do not enable automatic production builds or deploy until those boundaries are confirmed.

Keep Orkide's Workers, build connections, bindings, data, secrets and DNS unchanged. If the task is only a disposable local example, no Cloudflare setup is needed.
