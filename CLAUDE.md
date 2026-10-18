# Orkide

Orkide is a blog/portfolio that doubles as a production-grade template for future products. Technical excellence is the product: every change must be typed end-to-end and tested. Accessibility and speed are analysed when the user asks.

This repository is **public**. The shared stack, rules and commands are in the workspace root's `CLAUDE.md` (`orkide-solutions`); this file covers what is specific to Orkide.

- **Template first.** Products derive from Orkide and merge its `main` (`upstream`). Keep changes generic and backwards compatible for them: no product names, client content or product resource ids here, and keep the layout and `@orkide/*` package names stable.
- **Content:** blog posts, portfolio projects and taxonomies, each translated per locale; RSS, Atom and JSON feeds; a live visitor count (Durable Object).
- **Admin:** `/admin`, signing in with GitHub OAuth (`GITHUB_CLIENT_*` in `apps/api/.dev.vars`) or a passkey.
- **Languages:** English is the base locale (`baseLocale: en`), Turkish under `/tr` with translated slugs.
- **Design:** light and dark themes; responsive pictures and videos through the media pipeline (`add-media-asset`).
