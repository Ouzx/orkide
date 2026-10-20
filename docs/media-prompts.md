# Media

The Blueprint skin (ADR-032) draws its imagery in code: the cover's isometric, the plates, the section icons and the stamps are SVG drawn by components, so the site ships no hand-made pictures or videos. Files exist only for what must live outside a page: the browser and app icons, link previews, the email header and the owner's portrait.

**Pipeline:** `pnpm --filter @orkide/web brand` draws the brand originals from the skin's tokens into `design/incoming/` (git-ignored; Playwright's Chromium, fonts from Google Fonts). `pnpm --filter @orkide/web media` (scripts/media.ts) turns `design/incoming/` into the served files. The `add-media-asset` skill describes adding one.

| id | size | drawn as | used for |
| --- | --- | --- | --- |
| `favicon` | SVG + 1024×1024 PNG | the orchid mark on a blue tile inside a sheet border, drawn bold enough for 16 px | browser tab (`favicon.svg`, `favicon.ico`) |
| `app-icon` | 1024×1024 | the orchid mark on its construction circle, on blueprint paper inside a frame | Apple touch icon, installable app icons |
| `og-default` | 1200×630 | a sheet: "G-001 · Cover sheet", the tagline as its title, the stack in isometric, a title block | link preview of every page without its own |
| `og-blog` | 1200×630 | the same sheet as "G-002 · Drawing index", titled "Writing" | link preview of the blog |
| `og-portfolio` | 1200×630 | the same sheet as "G-003 · Plates", titled "Work" | link preview of the portfolio |
| `email-header` | 1200×300 | a strip of the sheet: the mark, the wordmark, "G-001 · Cover sheet" | transactional email banner |
| `portrait` | 512×512 | a photo of the owner (hand-made, not drawn) | JSON-LD `Person.image` |

A product with its own skin edits `scripts/brand.ts`, or drops its own originals with these ids into `design/incoming/` and runs `media`.
