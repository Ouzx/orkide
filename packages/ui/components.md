# Components · Instrument

## Strategy

- **Behaviour from Base UI, looks from us.** `@base-ui/react` keeps providing the accessible behaviour that is hard to get right: focus traps, dialogs, menus, select, combobox, tooltips, toasts. Our components wrap its primitives and style them with the skin's tokens. Plain controls (links, buttons, fields, switches) are native elements.
- **Where they live.** The class contract is `src/styles/kit.css` (`o-*` classes). Public pages are Astro markup on those classes, so they render without hydration; the React kit in `src/kit/` (`@orkide/ui/kit/<name>`) wraps Base UI with the same classes for islands and the admin, keeping the APIs the admin used with shadcn.
- **shadcn is parked** in `src/shadcn/` (`@orkide/ui/shadcn/<name>`), untouched, with its tokens aliased onto the skin in `globals.css`. Screens move from it to `kit/` as they are ported; whatever stays unused is ignored by Knip, not deleted.

| Today (shadcn, parked) | Becomes (kit) | Behaviour from |
| --- | --- | --- |
| `button`, `toggle` | `Key` | native `<button>` / `<a>` |
| `switch`, `toggle-group`, `checkbox` | `Switch` (two or three positions), `Check` | native `<button role="switch">`, radio group, `<input type="checkbox">` |
| `input`, `textarea`, `label`, `field` | `Field` | native |
| `card` | `Unit` (admin), `Panel` (public) | — |
| `badge` | `Lamp` | — |
| `table` | `Table` with `Lamp` statuses | native `<table>` |
| `dialog`, `alert-dialog`, `sheet` | `Dialog`, `Confirm`, `Drawer` | Base UI Dialog / AlertDialog |
| `dropdown-menu`, `select` | `Menu`, `Select` | Base UI Menu / Select |
| `tabs` | `Tabs` | Base UI Tabs |
| `sonner` | `Toast` on a `MiniScreen` | sonner (already a dependency) |
| `avatar`, `skeleton`, `separator` | `Avatar`, `Skeleton` (dim LED segments), plain `<hr>` | — |
| — | `Knob`, `Screen`, `MiniScreen`, `Grille`, `LedBar`, `Dial`, `Meter`, `Jack`, `Cartridge`, `Spec`, `SectionHead`, `Entry`, `Note`, `Screw` | native / ARIA slider |

## Shared states

Every interactive part has these states; the table under each component lists only what differs.

| State | Treatment |
| --- | --- |
| Default | Raised (`shadow-raised`) on `case`, ink text |
| Hover | Key drops 1 px; magnet lean (`effects/magnet`), released with `ease-spring` |
| Press | Drops 4 px in `--o-dur-press` (60 ms); springs back over `--o-dur-spring` (450 ms) |
| Focus-visible | 3 px ring in `signal`, 3 px offset (see the contrast note for light) |
| Disabled | 45 % opacity, no lean, `cursor: not-allowed`, no press |
| Loading | Label kept; lamp turns `warn` and pulses (`o-pulse`); `aria-busy` |
| Success | Lamp turns `ok`; label or screen says what happened |
| Error | Message in `danger` under the part, linked with `aria-describedby`; the part keeps its value |

## Key

A keycap: button or link.

- **Anatomy:** cap (gradient `case` → `panel`), side (`0 calc(4px − press) 0 deep`), label (`font-label`, bold, uppercase, `tracking-wider`), optional lamp before the label, optional arrow after it.
- **Variants:** `plain`; `signal` (cap `signal-hi` → `signal`, side `signal-deep`, text `on-signal` with a `glint` text shadow). Sizes `sm` (32 px, `text-2xs`), `md` (36 px, `text-sm`), `lg` (58 px, `text-md`, `rounded-xl`).
- **States:** current page lights its lamp in `signal`; pressed toggle stays 3 px down with a signal cap.
- **Tokens:** `case`, `panel`, `deep`, `signal*`, `on-signal`, `shadow-raised`, `rounded-md` / `rounded-xl`, `ease-spring`, `--o-dur-press`, `--o-dur-spring`.
- **Micro-interaction:** hover → `--press: 1px` + magnet; press → `--press: 4px` in 60 ms; release → spring 450 ms; with sound on, a click (`sound.click`, pitch 0.7 for signal keys).

## Switch

A slide switch in a recessed slot, with an engraved label under it.

- **Anatomy:** slot (44 × 20 px, `deep` mixed with 24 % `ink`, `shadow-recess`), thumb (22 × 16 px, raised), label (`text-2xs` engraved). A thrown two-position switch shows a `signal` bar in its thumb.
- **Variants:** two positions (`role="switch"`, `aria-checked`): sound, motion, language; three positions (theme: system, light, dark), announced as "Theme: …".
- **Micro-interaction:** the thumb travels with `ease-spring` over 450 ms; click sound.

## Lamp

An LED: 8 px dot, unlit = `deep` + `shadow-recess`.

- **Variants:** `ok` (power, published), `warn` (draft, busy, service mode), `signal` (selected, new), `hot` (peak). Lit lamps glow (`0 0 10px` of their colour, `shade-soft` rim). `pulse` breathes with `o-pulse` (2.4 s).
- **Use with text:** a lamp never carries meaning alone; it sits next to its label (`Published`, `Draft`).

## Screen and MiniScreen

Display glass with LED text.

- **Anatomy:** `screen` background, `shadow-bezel`, scanline columns (`scanline`, `display.scanline`), a diagonal `sheen`; text in `font-led` `text-led` with `led-glow`.
- **Screen (hero):** top row (eyebrow, channel), headline (`text-display`, black, ROND 100) typed over its dim copy (`led-off`) with a blinking caret (`o-caret`, `ease-blink`), and a readout row (selection, hint) separated by a dashed `led-rule`. A selection wider than the readout scrolls (`o-marquee`, 9 s, holds 12 %).
- **MiniScreen:** 30 px high, `text-md` LED text: the header's section readout, a form's status (`READY` → `SENDING…` → `SENT ✓`), toasts.
- **Accessibility:** the heading's accessible name is the full text from the start; the readout is `aria-live="polite"`.

## Knob

A rotary selector with detents (ARIA slider).

- **Anatomy:** dial of ticks (`knob.ticks`, every 10° across 270°, long at detents, lit up to the value in `signal`), skirt (ridged `case`/`panel` conic stripes, `shadow-knob`), cap (radial `signal-glint` → `signal` → `signal-deep`), pointer (`on-signal`), an engraved label and a counter (`01/02`) under it.
- **Input:** drag around the centre, wheel, arrow keys; click or Enter opens the selection. `aria-valuenow`, `aria-valuetext` (the item's title).
- **Micro-interaction:** the skirt chases its detent with `springs.knob`; each detent clicks (pitch 1.3) and plays the next pentatonic note; a single-item knob gives 15 % and springs back.

## Panel and Unit

- **Panel:** the front panel and the form panel. Gradient `case` → `panel` at 160°, `shadow-device`, `rounded-device` (28 px; 22 px on phones), screws in the corners, optional tilt + glare (`effects/tilt.panel`). Powers on with `o-boot`.
- **Unit:** an admin module (`rounded-2xl`/`rounded-3xl`, `shadow-unit`): header row (engraved title, `Sample` tag when its data is invented), body. **Meter** is a unit with a Lamp and an LCD counter that rolls in (`meters.counter`).

## Field

- **Anatomy:** engraved label (`text-2xs`, `tracking-widest`, `ink-2`; optional `small` note in normal case), a well (`deep`, `shadow-recess`, `rounded-lg`, no border).
- **States:** focus adds a 3 px `signal` ring around the well; error puts the message in `danger` under the well (never inside it, see contrast) and sets `aria-invalid`.

## Spec

A definition list in a recessed `panel` box: engraved `dt`, `font-mono` `dd`. Used for post metadata, project facts, the cartridge's back.

## SectionHead and Entry

- **SectionHead:** `§n` in `signal-ink` (compressed, black), the title (`text-section`, condensed, uppercase, balanced), an optional engraved link; a 2 px `ink` rule under it. Numbers encode the manual's real order.
- **Entry:** a post in a list: index (`text-3xl`, compressed, `ink-2` → `signal-ink` on hover), title (`text-heading`), summary, a Spec on the right; a lamp in the margin lights on hover; the row gets a `panel` wash; the title slides 8 px with `ease-spring`.

## Cartridge

A project as a module: dark in both themes (`module` → `module-deep`, `module-ink`), a `signal` sticker with the name, gold pins (`pin` → `pin-deep`), a mono row of facts. Tilts toward the pointer (`effects/tilt.cartridge`) with the holographic `glare`; settles back over `--o-dur-settle`.

## Note

A manual callout: 2 px `ink` frame, `rounded-xl`, a `signal` badge (`NOTE`, `CAUTION`) and the text. Used in posts for real asides only.

## Jack

A link on the back panel: a socket (`jack-hole` in a `jack-ring`) above an engraved label. Hover grows it 12 % with a `signal` ring.

## Grille, LedBar, Dial

- **Grille:** `meters.grille` holes in a recessed panel; a beat ripples across it (`o-hole`, stagger `grille`) on each sound and every 6 s idle. Decorative (`aria-hidden`).
- **LedBar:** 12 lamps filling with scroll position, amber from the 10th. Decorative.
- **Dial:** a round gauge fixed to the corner of manual pages: 21 ticks, a `signal` needle rotating across 270° with reading progress, the percentage in LED type. Decorative (the page itself is the content).

## Bay (admin navigation)

A patch bay: each entry is a jack (lit `signal` when current) with an engraved label; the current entry is raised (`shadow-raised` on `case`). A `MiniScreen` above it reads `SERVICE MODE` next to a pulsing `warn` lamp. On phones it becomes a horizontal, scrollable row.

## Screw

Decoration: 12 px, `deep` with an `hl` highlight and a slot at a fixed angle (`--r`). Always `aria-hidden`.
