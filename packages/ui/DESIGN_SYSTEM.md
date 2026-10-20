# Orkide design system · Blueprint

Every page is a sheet of a drawing set. The home page is the cover sheet (G-001) with the stack drawn as an exploded isometric, the blog is the drawing index (G-002), the portfolio is a set of plates (G-003), contact is a request for information (G-004), posts and projects are detail sheets numbered from their date (`D-YYMMDD`, `P-YYMMDD`), error pages are void sheets (X-404, X-500) and the admin is the drafting table (A-201). Each sheet sits in a frame with zone letters and numbers, a status line and a title block. The look is a **skin**: tokens, three fonts, one motion layer and the brand assets. A product built on Orkide replaces the skin without touching page structure (see [Replacing the skin](#replacing-the-skin)).

- **Prototype:** the Orkide Blueprint artifact, https://claude.ai/artifact/ULaUVPyMDaAjRnX2x4QG6r (October 2026). It is the visual and motion reference for every page.
- **Conventions borrowed from drafting:** sheet numbers and a title block, callout bubbles and balloons, hatching for cut material, dimension lines, revision clouds with a delta, redline notes in a hand font, a parts list (bill of materials).

## Files

| File | What it is |
| --- | --- |
| `src/tokens/tokens.json` | **Source of truth.** W3C Design Tokens; `$value` is the blue print, `$extensions.light` is the white print. |
| `scripts/tokens.ts` | Builds the two files below and the contrast table in this document: `pnpm --filter @orkide/ui tokens`. |
| `src/styles/tokens.css` | Generated. Custom properties (`--o-*`) for `:root` (blue) and `.light` (white), and the Tailwind `@theme` blocks. |
| `src/tokens/tokens.ts` | Generated. The same values, typed (`tokens.color.blue`, `tokens.color.white`), for scripts. |
| `src/styles/motion.css` | Page-level keyframes (`o-sheet-out`, `o-sheet-in`, `o-expose`, `o-fade`), the page-change and print-change transitions. |
| `src/motion/motion.ts` | Easings, durations and staggers (from the tokens), springs, the plot choreography and easing functions for scripts. |
| `src/effects/*.ts` | One typed preset per effect: `axo` (the cover drawing's camera, explode, packets, purges), `cad` (the cursor), `magnet`, `plot`. |
| `src/styles/kit.css` | The component classes (`o-frame`, `o-strip`, `o-btn`, `o-switch`, `o-sh`, `o-axo`, `o-index`, `o-plate`, `o-tb`…) in `@layer components`, shared by Astro markup and the React kit. Values come only from tokens. |
| `src/kit/*.tsx` | The React kit for islands and the admin: the shadcn APIs the admin used, on Base UI behaviour and the kit classes. |
| `src/styles/globals.css` | Imports the above; the base sheet (grid paper, selection, focus), long-form prose (`prose-orkide`), the reduced-motion rules; maps shadcn's names (`--background`, `--primary`…) onto the skin for the parked components. |
| `components.md` | Every component: anatomy, variants, states, tokens and micro-interactions. |

Generated files are never edited by hand (workspace rule 12): change `tokens.json` and run the script.

Cascade layers matter: Tailwind's utilities are layered, so the kit stays inside `@layer components` (an unlayered class would beat every utility). Only `:root` custom-property overrides (the frame margins per breakpoint) sit outside it.

## Using it

Tokens surface as Tailwind utilities and as custom properties.

| Kind | Utilities | Custom properties |
| --- | --- | --- |
| Colour | `bg-paper`, `bg-paper-2`, `bg-paper-3`, `text-ink`, `text-ink-2`, `border-line`, `border-line-2`, `bg-mark-fill`, `text-mark-ink`, `text-on-mark`, `text-ok`, `text-warn`, `text-danger`… | `--o-paper`, `--o-ink`, `--o-grid`, `--o-lamp`, `--o-exposure`… |
| Type | `font-display`, `font-text`, `font-mono`, `font-hand`; `text-3xs` … `text-4xl`, `text-lead`, `text-heading`, `text-section`, `text-title`, `text-display`; `tracking-*`, `leading-*`, `font-black`… | `--o-stretch-*` for `font-stretch` |
| Shape | `rounded-*` (all 0: drawings have square corners) |  |
| Depth | `shadow-slip` (a sheet laid on the drawing), `shadow-inset` | `--o-shadow-*` |
| Motion | `ease-spring`, `ease-bounce`, `ease-out`, `ease-in-out`, `ease-lamp` | `--o-dur-*`, `--o-stagger-*` |
| Layout |  | `--o-container`, `--o-measure`, `--o-header`, `--o-frame`, `--o-ruler`, `--o-room`, `--o-palette`, `--o-gutter`, `--o-z-*` |

**Do**

- Take every colour, size, easing and duration from a token. Component code has no hex values, px colours or easing strings (`grep` for `#[0-9a-f]{3,6}`, `rgba(` and `cubic-bezier(` outside `packages/ui/src/tokens` and `styles` must find nothing).
- Draw with lines, not fills: 1 px `line-3` for construction, `line-2` for secondary, `line` for objects, 1.5–2 px for outlines that matter. Hatch what is cut (`url(#o-hatch)`).
- Keep `mark` (the redline) for one thing per view: the primary button, sheet numbers, the current item, a correction. Text in the accent uses `mark-ink`.
- Label in mono: `font-mono`, uppercase, `tracking-widest`, `text-ink-2`. Headings are Archivo condensed (`--o-stretch-display`), uppercase, balanced.
- Give every animated part a finished resting state first. Motion only draws it: no-JS, reduced-motion and `html.calm` visitors see the finished drawing, and that is what axe checks.
- Number things the way a drawing set does: sections are bubbles (`§n` on sheet G-001), parts are balloons that match the parts list, dates become sheet numbers (`sheetNumber()`).

**Don't**

- Don't round corners or add soft shadows: a sheet casts `shadow-slip` (a hard offset) and nothing else.
- Don't stack `backdrop-filter` or full-screen overlays over moving parts: they halve the frame rate under software compositing (Firefox on Linux). The lamp of a print change is the only full-sheet overlay, and it lives for one second.
- Don't put inline `style` attributes in server markup (the CSP is hashed); set computed values through CSSOM (`el.style.setProperty`) in scripts.
- Don't add a second accent. `ok`, `warn` and `danger` are states, not decoration.

## Type

| Role | Family | Axes and styles loaded | Used for |
| --- | --- | --- | --- |
| `display` / `text` | Archivo | `wdth` 62–125 %, `wght` 300–900, normal and italic | Headings (condensed), the wordmark (expanded), running text |
| `mono` | Chivo Mono | `wght` 400–700, normal | Labels, sheet numbers, tables, dates, code |
| `hand` | Shantell Sans | `wght` 500, normal | Redline notes ("drag to turn it") |

Headings take `text-wrap: balance`, paragraphs `text-wrap: pretty`. Running text stays near 65 characters (`--o-measure`). Turkish strings run longer: labels wrap inside their own box, never the page. Code ligatures are off everywhere (`calt`, `liga`).

**Font loading.** Fonts go through the Astro Fonts API (`apps/web/astro.config.ts`) from the Google provider, `latin` and `latin-ext` only. Each family is exposed as a CSS variable (`--font-archivo`, `--font-chivo-mono`, `--font-shantell`) that the `font.family` tokens wrap in fallbacks. Archivo (normal, latin) is preloaded; the others swap in. The latin subsets have no arrows other than ↑ and ↓: draw arrows and icons as inline SVG.

## Motion

- **Load:** the frame and its zone letters draw in; the cover's title sits on lettering guide lines; the stack is plotted part by part from the back to the front (`o-plot`, 250 ms apart), then its faces wash in and the balloons pop in (70 ms apart); a stamp records how long the plot took.
- **Pointer:** on fine pointers a CAD cursor follows the pointer (crosshair, ruler marks, the zone letters light, the status line reads the position in millimetres) and snaps with an osnap grip (end, mid, centre) to buttons and links. Buttons pull toward the pointer in steps (`magnet`). Hovering a part in the parts list lights it in the drawing and the other way round; dragging the drawing orbits it.
- **Press:** a button drops onto its hatched shadow in `--o-dur-press` and springs back.
- **Scroll:** the stack explodes as the cover scrolls away, a packet travels the request route and the edge cache flashes on purge; section A–A's cutting plane follows the scroll and each stage's reading counts up; sections arrive (rules and bubbles draw, blocks rise); the status line names the section in view; the newest post gets a revision cloud; plates are plotted by pen (`effects/plot`); dimension lines stretch out.
- **Print change:** a lamp sweeps across the sheet and exposes the other print behind it (View Transition + `o-expose`).
- **Page changes:** cross-document View Transitions: the old sheet slides out of the drawer, the new one slides in, while the frame and status line stay put.
- **Reduced motion:** the system setting and the footer switch (`html.calm`, `motionAllowed()`) give the resting state. The motion layer (`shared/motion/blueprint.ts`, the drawing's motion) doesn't load and every animation finishes at once with no delay, so the drawing is complete on the first frame; buttons and links answer hover and press with a colour change (`--o-reduced-feedback`); page changes cross-fade (`--o-reduced-crossfade`, `o-fade`). `motion.ts` exports the same values as `reduced`.

## Contrast

Ratios are computed by `scripts/tokens.ts` from the tokens (WCAG 2.2; translucent colours composited over their background). ⚠️ marks a pair below its minimum.

<!-- contrast:start -->

| Pair | Used for | Needs | Blue | White |
| --- | --- | --- | --- | --- |
| `ink` on `paper` | Body text, headings | 4.5:1 | 9.58 | 10.27 |
| `ink` on `paper-2` | Text in wells | 4.5:1 | 11.46 | 9.29 |
| `ink` on `paper-3` | Text on raised sheets | 4.5:1 | 8.35 | 11.23 |
| `ink-2` on `paper` | Secondary text, labels | 4.5:1 | 5.76 | 5.21 |
| `ink-2` on `paper-3` | Labels on raised sheets | 4.5:1 | 5.02 | 5.70 |
| `placeholder` on `paper-2` | Placeholders in wells | 4.5:1 | 6.89 | 4.71 |
| `mark-ink` on `paper` | Sheet numbers, kickers, hand notes | 4.5:1 | 5.35 | 5.62 |
| `mark-ink` on `paper-3` | Accent text on raised sheets | 4.5:1 | 4.66 | 6.15 |
| `danger` on `paper` | Error messages | 4.5:1 | 5.35 | 5.62 |
| `danger` on `paper-2` | Error text in wells | 4.5:1 | 6.40 | 5.08 |
| `on-mark` on `mark-fill` | The primary button | 4.5:1 | 4.69 | 5.11 |
| `ok` on `paper` | Published, sent | 4.5:1 | 6.92 | 5.02 |
| `warn` on `paper` | Drafts, samples | 4.5:1 | 7.30 | 5.42 |
| `focus` on `paper` | Focus ring on the sheet (non-text, 3:1) | 3:1 | 4.06 | 4.00 |
| `focus` on `paper-3` | Focus ring on raised sheets (non-text, 3:1) | 3:1 | 3.54 | 4.37 |
| `line` on `paper` | Borders and drawn lines (non-text, 3:1) | 3:1 | 8.46 | 7.79 |
| `mark` on `paper` | Redlines and markers (non-text, 3:1) | 3:1 | 4.06 | 4.00 |

<!-- contrast:end -->

## Replacing the skin

A product keeps Orkide's pages, components and APIs and changes how they look:

1. **Tokens.** Edit `packages/ui/src/tokens/tokens.json` (colours for both prints, type scale, motion, layout) and run `pnpm --filter @orkide/ui tokens`. Keep the token names: components use them. Check the contrast table this writes above.
2. **Fonts.** Replace the three families in `apps/web/astro.config.ts` (and the `<Font>` tags in `BaseLayout` and `AdminLayout`). Either keep the CSS variable names or point the `font.family` tokens at the new ones.
3. **Motion and effects.** Adjust the presets in `src/effects/` and `src/motion/motion.ts`, or the keyframes in `src/styles/motion.css` and `kit.css`. A product that wants less motion sets amplitudes to 0 rather than deleting code paths.
4. **Brand assets.** `pnpm --filter @orkide/web brand` (`apps/web/scripts/brand.ts`) draws the favicon, app icon, link previews and email header from these tokens; `pnpm --filter @orkide/web media` serves them (`add-media-asset` skill). Edit the script's markup, or drop your own originals into `design/incoming/`.

What a product does **not** change for a reskin: page structure under `apps/web/src/pages` and `modules`, component props, the `@orkide/*` package names, translated strings (Paraglide) or site content (`loadSite`).
