# Orkide design system · Instrument

The site is a hand-built device. The home page's hero is its front panel (display, knobs, keycaps), content pages are pages of its manual, the footer is the back panel and the admin is its service mode. The look is a **skin**: tokens, four fonts, one motion and effects layer and the brand assets. A product built on Orkide replaces the skin without touching page structure (see [Replacing the skin](#replacing-the-skin)).

- **Prototype:** the Instrument artifact, https://claude.ai/artifact/Vk8cYMSJqsdMz3BnxPgJ3R (October 2026). It is the visual and motion reference for every page.
- **Catalog entries (Web Experiment Atlas):** SP-04 tilt and holographic glare, MO-05 micro-interactions (keycaps, switches, knob detents), SN-01 synthesized sound, on an industrial-panel look.

## Files

| File | What it is |
| --- | --- |
| `src/tokens/tokens.json` | **Source of truth.** W3C Design Tokens; `$value` is light, `$extensions.dark` is dark. |
| `scripts/tokens.ts` | Builds the two files below and the contrast table in this document: `pnpm --filter @orkide/ui tokens`. |
| `src/styles/tokens.css` | Generated. Custom properties (`--o-*`) for `:root` and `.dark`, and the Tailwind `@theme` blocks. |
| `src/tokens/tokens.ts` | Generated. The same values, typed, for scripts. |
| `src/styles/motion.css` | Keyframes (`o-boot`, `o-pulse`, `o-caret`, `o-marquee`, `o-hole`, `o-rise`, `o-segment`, `o-power-off`, `o-power-on`) and the page-change transition. |
| `src/motion/motion.ts` | Easings, durations and staggers (from the tokens), springs, the page-load choreography, stagger helpers. |
| `src/effects/*.ts` | One typed preset per effect: `tilt`, `knob`, `sound`, `meters`, `magnet`. |
| `src/styles/kit.css` | The component classes (`o-key`, `o-panel`, `o-display`, `o-knob`, `o-entry`, `o-cartridge`, `o-unit`…), shared by Astro markup and the React kit. Values come only from tokens. |
| `src/kit/*.tsx` | The React kit for islands and the admin: the shadcn APIs the admin used, on Base UI behaviour and the kit classes. |
| `src/styles/globals.css` | Imports the above; maps shadcn's names (`--background`, `--primary`…) onto the skin for the parked components. |
| `components.md` | Every component: anatomy, variants, states, tokens and micro-interactions. |

Generated files are never edited by hand (workspace rule 12): change `tokens.json` and run the script.

## Using it

Tokens surface as Tailwind utilities and as custom properties.

| Kind | Utilities | Custom properties |
| --- | --- | --- |
| Colour | `bg-case`, `bg-panel`, `bg-deep`, `text-ink`, `text-ink-2`, `bg-signal`, `text-signal-ink`, `text-on-signal`, `bg-screen`, `text-led`, `border-line`… | `--o-case`, `--o-ink`… |
| Type | `font-label`, `font-sans` (text), `font-led`, `font-mono`; `text-2xs` … `text-4xl`, `text-lead`, `text-heading`, `text-section`, `text-title`, `text-display`; `tracking-*`, `leading-*`, `font-black`… | `--o-stretch-*` for `font-stretch` |
| Shape | `rounded-xs` … `rounded-3xl`, `rounded-device` |  |
| Depth | `shadow-raised`, `shadow-recess`, `shadow-unit`, `shadow-device`, `shadow-bezel`, `shadow-knob`, `shadow-module` | `--o-shadow-*` |
| Motion | `ease-spring`, `ease-out`, `ease-breathe`, `ease-blink`, `ease-segment` | `--o-dur-*`, `--o-stagger-*` |
| Layout |  | `--o-container`, `--o-page`, `--o-measure`, `--o-header`, `--o-bay`, `--o-gutter`, `--o-z-*` |

**Do**

- Take every colour, size, radius, shadow, easing and duration from a token. Component code has no hex values, px colours or easing strings (`grep` for `#[0-9a-f]{3,6}`, `rgba(` and `cubic-bezier(` outside `packages/ui/src/tokens` and `styles` must find nothing).
- Use `signal` for one thing per view: the primary keycap, the knob caps, the focus ring, lit indicators.
- Engrave labels: `font-label`, uppercase, `tracking-widest`, `text-ink-2`, `--o-stretch-condensed`.
- Put LED text only on `screen`: `font-led`, `text-led`, glow from `display.glow`.
- Give every animated part a designed resting state first. Motion is an enhancement: no-JS, reduced-motion and `html.calm` visitors see the resting state, and that is what axe checks.
- Let `ease-spring` carry releases (keys, switches, titles) and `ease-out` carry arrivals (page changes, rising blocks).

**Don't**

- Don't use `signal` (yellow) as text on the case: use `signal-ink`.
- Don't stack `backdrop-filter`, CSS masks or full-screen overlays over moving parts: they halve the frame rate under software compositing (Firefox on Linux). The skin needs none.
- Don't start sound without the visitor's switch, and don't gate visuals on GPU detection.
- Don't add a second accent. Lamps (`ok`, `warn`, `hot`, `danger`) are states, not decoration.

## Type

| Role | Family | Axes and styles loaded | Used for |
| --- | --- | --- | --- |
| `label` | Saira | `wdth` 75–125 %, `wght` 600–900, normal | Engraved labels, keycaps, headings, section numbers |
| `text` | Hanken Grotesk | `wght` 400–700, normal and italic | Running text |
| `led` | Doto | `wght` 700–900, `ROND` 100, normal | The display, counters, LED readouts |
| `mono` | Martian Mono | `wght` 400–600, normal | Specs, dates, code |

Headings take `text-wrap: balance`, paragraphs `text-wrap: pretty`. Running text stays near 65 characters (`--o-measure`). Turkish strings run longer: labels and keycaps wrap or truncate inside their own box, never the page.

**Font loading.** Fonts go through the Astro Fonts API (`apps/web/astro.config.ts`) from the Google provider, `latin` and `latin-ext` only, with only the axes and styles above (the API adds italics unless `styles` says otherwise). Each family is exposed as a CSS variable (`--font-saira`, `--font-hanken`, `--font-doto`, `--font-martian`) that the `font.family` tokens wrap in fallbacks. The text face is preloaded; the others swap in. The API hashes family names, so a script waiting on a font must read the family from the CSS variable before calling `document.fonts.load`.

## Motion

- **Load:** the panel powers on (`o-boot`, `boot`, `ease-spring`, 100 ms in), the display types the headline from 700 ms (34 ms a character, 70 ms after a space), the power lamp breathes, the grille beats every 6 s while idle.
- **Pointer:** the front panel tilts up to 5° toward the pointer and a cartridge up to 12°, with a glare that follows; on phones both sway on their own. Keycaps lean toward the pointer (`magnet`) and spring back.
- **Press:** a key drops 1 px on hover and 4 px on press in 60 ms, then springs back over 450 ms. Switches throw their thumb with `ease-spring`.
- **Knobs:** detents across 270°; the skirt chases its detent with `springs.knob`; each detent clicks and plays a note when sound is on.
- **Scroll:** the header's readout names the section in view, the page lamps fill with scroll position, blocks below the fold rise in (`o-rise`).
- **Page changes:** cross-document View Transitions; the old page powers down, the new one powers on.
- **Reduced motion:** the system setting and the footer switch (`html.calm`, `motionAllowed()`) give the resting state. The motion modules don't load, so nothing tilts, types or rises; knobs still turn but snap to their detent; keys, meters and links stay in place and answer hover and press with a colour change (`--o-reduced-feedback`); page changes cross-fade (`--o-reduced-crossfade`, `o-fade`). `motion.ts` exports the same values as `reduced`.

## Contrast

Ratios are computed by `scripts/tokens.ts` from the tokens (WCAG 2.2; translucent colours composited over their background). ⚠️ marks a pair below its minimum.

<!-- contrast:start -->

| Pair | Used for | Needs | Light | Dark |
| --- | --- | --- | --- | --- |
| `ink` on `case` | Body text, headings | 4.5:1 | 13.18 | 12.21 |
| `ink` on `panel` | Text on raised panels | 4.5:1 | 11.76 | 13.31 |
| `ink` on `deep` | Text in field wells | 4.5:1 | 9.92 | 14.52 |
| `ink-2` on `case` | Secondary text, labels | 4.5:1 | 5.61 | 5.86 |
| `ink-2` on `panel` | Labels on raised panels | 4.5:1 | 5.01 | 6.39 |
| `placeholder` on `deep` | Placeholders in field wells | 4.5:1 | 4.78 | 6.97 |
| `signal-ink` on `case` | Section numbers, hovered indices | 4.5:1 | 5.55 | 10.37 |
| `signal-ink` on `panel` | Accent text on panels | 4.5:1 | 4.95 | 11.31 |
| `danger` on `case` | Error messages | 4.5:1 | 5.47 | 5.83 |
| `danger` on `panel` | Error text on panels (never inside a well) | 4.5:1 | 4.88 | 6.35 |
| `on-signal` on `signal` | Signal keycaps, NOTE badge | 4.5:1 | 10.88 | 10.88 |
| `on-signal` on `signal-hi` | Top of a signal keycap | 4.5:1 | 11.95 | 11.95 |
| `led` on `screen` | Display text | 4.5:1 | 12.93 | 13.86 |
| `module-ink` on `module-deep` | Text on a cartridge | 4.5:1 | 15.19 | 15.19 |
| `module-ink-2` on `module` | Secondary text on a cartridge | 4.5:1 | 5.56 | 5.56 |
| `focus` on `case` | Focus ring on the case (non-text, 3:1) | 3:1 | 5.55 | 9.63 |
| `focus` on `panel` | Focus ring on panels (non-text, 3:1) | 3:1 | 4.95 | 10.50 |
| `ink` on `case` | Rules and keycap outlines (non-text, 3:1) | 3:1 | 13.18 | 12.21 |

<!-- contrast:end -->

## Replacing the skin

A product keeps Orkide's pages, components and APIs and changes how they look:

1. **Tokens.** Edit `packages/ui/src/tokens/tokens.json` (colours for both themes, type scale, radii, shadows, motion) and run `pnpm --filter @orkide/ui tokens`. Keep the token names: components use them. Check the contrast table this writes below.
2. **Fonts.** Replace the four families in `apps/web/astro.config.ts` (and the `<Font>` tags in `BaseLayout` and `AdminLayout`). Either keep the CSS variable names or point the `font.family` tokens at the new ones.
3. **Motion and effects.** Adjust the presets in `src/effects/` and `src/motion/motion.ts`, or the keyframes in `src/styles/motion.css`. A product that wants less motion sets amplitudes to 0 rather than deleting code paths.
4. **Brand assets.** `pnpm --filter @orkide/web brand` (`apps/web/scripts/brand.ts`) draws the favicon, app icon, link previews and email header from these tokens; `pnpm --filter @orkide/web media` serves them (`add-media-asset` skill). Edit the script's markup, or drop your own originals into `design/incoming/`.

What a product does **not** change for a reskin: page structure under `apps/web/src/pages` and `modules`, component props, the `@orkide/*` package names, translated strings (Paraglide) or site content (`loadSite`).
