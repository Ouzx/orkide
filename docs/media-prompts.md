# Media

The Instrument skin (ADR-031) draws its imagery in code: the front panel, cartridges, displays and lamps are components, so the site ships no hand-made pictures or videos. Files exist only for what must live outside a page: the browser and app icons, link previews, the email header and the owner's portrait.

**Pipeline:** `pnpm --filter @orkide/web brand` draws the brand originals from the skin's tokens into `design/incoming/` (git-ignored; Playwright's Chromium, fonts from Google Fonts). `pnpm --filter @orkide/web media` (scripts/media.ts) turns `design/incoming/` into the served files. The `add-media-asset` skill describes adding one.

| id | size | drawn as | used for |
| --- | --- | --- | --- |
| `favicon` | SVG + 1024×1024 PNG | a knob from above, drawn for 16 px: graphite skirt with a case-coloured rim (visible on dark tab bars), a large signal cap, a long ink pointer | browser tab (`favicon.svg`, `favicon.ico`) |
| `app-icon` | 1024×1024 | the knob inside its dial of ticks, on the case colour | Apple touch icon, installable app icons |
| `og-default` | 1200×630 | the front panel; the display reads the site's tagline | link preview of every page without its own |
| `og-blog` | 1200×630 | the front panel; the display reads "§1 Blog" | link preview of the blog |
| `og-portfolio` | 1200×630 | the front panel; the display reads "§2 Work" | link preview of the portfolio |
| `email-header` | 1200×300 | the device's top edge: wordmark, power lamp, knob | transactional email banner |
| `portrait` | 512×512 | a photo of the owner (hand-made, not drawn) | JSON-LD `Person.image` |

A product with its own skin edits `scripts/brand.ts`, or drops its own originals with these ids into `design/incoming/` and runs `media`.
