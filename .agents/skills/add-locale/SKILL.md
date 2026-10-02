---
name: add-locale
description: Add a new language to Orkide (for example `de`) — register it with Paraglide, translate every message, localize URLs, and fix the exhaustive locale maps the compiler points to. Use when the user wants another site language.
---

# Add a locale

`@orkide/i18n` owns the locale list; every other package derives from it (`locales`, `Locale`), so most of the work is translations and URL patterns. Examples below add `de`.

## 1. Register and translate

- `packages/i18n/project.inlang/settings.json` → add `"de"` to `locales` (`baseLocale` stays `en`).
- Copy `packages/i18n/messages/en.json` to `de.json` and translate **every** key (a missing key silently falls back to English). Add `locale_name_de` ("Deutsch", written in that language) to **every** locale file.
- Keep `{placeholders}` identical; Paraglide compiles them into typed message functions.

## 2. Localize URLs

`packages/i18n/project.inlang/paraglide.config.ts` → in each `urlPatterns` entry add `["de", "/de…"]`. Translate route segments where a native word exists (`/de/portfolio` can stay, `/tr/portfolyo` is the Turkish precedent). The last catch-all entry keeps every other path identical.

## 3. Compile and let the compiler list the rest

```bash
pnpm --filter @orkide/i18n build   # regenerates src/paraglide (never hand-edit it)
pnpm typecheck
```

`Record<Locale, …>` maps and `satisfies` checks now fail where `de` is missing. Known sites:

- `apps/web/src/shared/lib/i18n.ts` → `languageTag` (BCP 47, e.g. `de-DE`) and `localeName`.
- `apps/web/src/modules/admin/components/document-form.tsx` → the per-locale tab labels.
- `packages/content/src/slug.ts` → add transliterations if the alphabet has letters `slugify` cannot fold (ä, ö, ü, ß).
- `packages/email/src/templates/*` → pass `locale` through; the strings come from Paraglide.

The database needs no migration: `locale` columns are `text({ enum: locales })` and translation rows are added per document. Existing posts simply have no `de` translation yet and are omitted from `de` listings until one is written in the admin.

## 4. Verify

- Add the new locale's home and blog paths to `apps/web/e2e/pages.ts` so axe covers them at all four widths.
- `pnpm fix && pnpm check && pnpm typecheck && pnpm test`, then `pnpm build && pnpm e2e:prepare && pnpm test:e2e`.
- Open `/de`, switch language in the header, and check `<html lang>`, `hreflang` alternates and `/de/rss.xml`, `/sitemap.xml`.
