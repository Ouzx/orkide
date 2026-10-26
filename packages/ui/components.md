# Components · Blueprint

## Strategy

- **Behaviour from Base UI, looks from us.** `@base-ui/react` keeps providing the accessible behaviour that is hard to get right: focus traps, dialogs, menus, select, combobox, tooltips, toasts. Our components wrap its primitives and style them with the skin's tokens. Plain controls (links, buttons, fields, switches) are native elements.
- **Where they live.** The class contract is `src/styles/kit.css` (`o-*` classes, in `@layer components`). Public pages are Astro markup on those classes, so they render without hydration; the React kit in `src/kit/` (`@orkide/ui/kit/<name>`) wraps Base UI with the same classes for islands and the admin, keeping the APIs the admin used with shadcn.
- **shadcn is parked** in `src/shadcn/` (`@orkide/ui/shadcn/<name>`), untouched, with its tokens aliased onto the skin in `globals.css`. Whatever stays unused is ignored by Knip, not deleted.

| Kit (`src/kit`) | Classes | Behaviour from |
| --- | --- | --- |
| `button` | `o-btn` (`-primary`, `-danger`, `-ghost`, `-sm`, `-icon`) | native `<button>` / `<a>` |
| `toggle`, `toggle-group` | `o-tabs`, `o-tab` | Base UI Toggle / ToggleGroup |
| `switch`, `checkbox` | `o-toggle`, `o-check` | Base UI Switch / Checkbox |
| `input`, `textarea`, `label` | `o-input`, `o-label` | native |
| `badge` | `o-badge` (`data-tone`: `ok`, `warn`, `danger`) | — |
| `table`, `tabs` | `o-table`, `o-tabs` / `o-tab` | native `<table>`, Base UI Tabs |
| `dialog`, `alert-dialog`, `sheet` | `o-card`, `o-card-title`, `o-backdrop` | Base UI Dialog / AlertDialog |
| `dropdown-menu` | `o-popup`, `o-popup-menu`, `o-item` | Base UI Menu |
| `sonner` | `o-toaster` | sonner |
| `avatar`, `skeleton` | `o-avatar`, `o-skeleton` | — |

Public pages use the classes directly: the sheet (`o-frame`, `o-status`), the title strip (`o-strip`), section heads (`o-sh`), the cover drawing (`o-axo`, `o-bom`), Section A–A (`o-cut`), the schedule (`o-qty`, `o-notes`), the drawing index (`o-index`, `o-row`), plates (`o-plate`), the assembly (`o-steps`), the RFI sheet (`o-rfi`, `o-field`), stamps (`o-stamp`), revision clouds (`o-cloud`), the title block (`o-tb`, `o-block`), inner-page heads (`o-pagehead`, `o-dwg`, `o-scalebar`, `o-keyplan`), comparisons and meters (`o-two`, `o-case`, `o-meters`), exploded drawings beside their parts list (`o-anatomy`, `data-parts-set`) and the atlas's specimen plates (`o-spec`, styled by the atlas module).

## Shared states

Every interactive part has these states; the notes under each component list only what differs.

| State | Treatment |
| --- | --- |
| Default | Drawn in `line` on `paper`; text in `ink` |
| Hover | A CAD selection: dashed redline outline with six grips (`o-sel`), or the part lifts off its shadow (buttons) |
| Press | Lands on its shadow in `--o-dur-press` (60 ms); springs back with `ease-spring` |
| Focus-visible | 2 px `focus` outline, offset clear of the part's shadow; inside fields, registration marks close in |
| Disabled | 50 % opacity, `cursor: not-allowed`, no lift or press |
| Busy | Label kept, `aria-busy`; the part's status reads what is happening |
| Success | A stamp (`o-stamp`) or an `ok` badge says what happened |
| Error | Message in `danger` under the part (`o-err`), linked with `aria-describedby`; the part keeps its value |

## Sheet frame and status line

The page is a drawing sheet: margin bands, a double border with corner marks, zone letters across the top and bottom (A–M) and numbers down the sides (1–6), a status line in the bottom border (sheet number, the section in view, the cursor's position in millimetres) and, on fine pointers with motion, a CAD cursor with an object snap (`o-cad`, `o-osnap`). The frame's margins are `--o-frame`, `--o-ruler` and `--o-room`; they shrink on tablets and disappear on phones. Decorative parts are `aria-hidden`.

## Title strip (header)

Three boxes on the sheet's top edge: the brand (orchid mark, wordmark, this sheet's number), the navigation (the current page in `mark-ink`) and the tools (language as `o-seg`, print as `o-switch`). On phones the navigation moves into a native popover (`o-menu`).

## Button

A slip of paper over its hatched shadow (`o-btn`): one element, the shadow and the face are pseudo-elements behind the label.

- **Variants:** plain (`paper` face, `line` edge); `primary` (`mark-fill` face, `on-mark` text, the hatch runs on hover); `danger`; `ghost` (no shadow: toolbars, table actions); sizes `sm` and `icon`.
- **Micro-interaction:** hover lifts the face 2 px and the trailing icon moves 3 px; press lands it on its shadow; with motion, buttons marked `data-magnet` pull toward the pointer in steps (`effects/magnet`).
- **Icons** are inline SVG (16 px, `currentColor`): the text fonts carry no arrows.

## Schematic switches

- **Print switch** (`o-switch[data-throws="2"]`, `role="switch"`): a double-throw switch whose blade points at the print in use; checked means the white print.
- **Motion switch** (`o-switch[data-throws="1"]`, `aria-pressed`): a single-throw switch, closed when motion is reduced.
- **Language** (`o-seg`): links; the current one is circled in redline (`aria-current`).
- **Toggle and check** (admin forms): a slot with a square thumb (`o-toggle`); a square that gets an X (`o-check`).
- **Micro-interaction:** the blade swings with `ease-spring`; the names light as it lands.

## Section head

A callout bubble (section number over the sheet number), a rule and a tag (`o-sh`, `o-bubble`, `o-sh-rule`, `o-sh-tag`), then a kicker and the title. A title's `<em>` is the sheet's one redline accent: redline ink over a red rule (`PageHeader`'s `accent`).

- **Arrival** (a section scrolled into view gets `data-in="arrived"`; one on screen at load is already drawn): the rule draws, the bubble rings in, the kicker's rule extends, the accent's rule is drawn, list parts (notes, rows, stages, quantities, steps, plates, cases, meters, parts-list rows, info cells) arrive one after another (`o-arrive`: a rise behind a wipe, delayed by `--o-i` × `stagger.list`, set by `shared/motion/blueprint.ts` from `arrivals` in `motion/motion.ts`), and badges land like stamps (`o-land`, no fade).

## Cover drawing

- **Drawing** (`o-axo`): the stack as an exploded isometric (SVG drawn by `modules/home/axo.ts`): fills hide what is behind, edges in `line`, hidden lines dashed, cut parts hatched, labels on the faces, balloons numbered like the parts list. The first plot is CSS (`o-plot`, `o-wash`), so it starts with the first paint.
- **Parts list** (`o-bom`) and **drawing info** (`o-info`): a bill of materials whose rows light their part in the drawing, and the strip under the cover (stack, languages, plot time).
- **Micro-interaction:** drag to orbit (`effects/axo.camera`), hover a part or a row to link them, the drawing explodes as the cover scrolls away, a packet travels the route and the cache flashes on purge.

## Section A–A, schedule and notes

- **Section A–A** (`o-cut`): the request's stages as a section through the stack, each with a drawn icon, the stage and its reading from this page load (`performance` entries, so the cached HTML is the same for everyone). With motion a cutting plane follows the scroll, hatches each stage it reaches and counts its reading up; once it reaches the last stage, a request keeps travelling down the chain (`o-travel`, a quiet 7 s loop).
- **Schedule** (`o-qty`): quantities in a table, counted up when they arrive. **General notes** (`o-notes`): numbered notes in two columns.

## Drawing index

Posts as rows of an index (`o-index-head`, `o-index`, `o-row`): sheet number (`D-YYMMDD`), title and summary, discipline, issue date, length. Hover washes the row in `line-3` and steps its number forward. With motion the newest row gets a revision cloud with a delta (`shared/motion/cloud.ts`). Opening a row morphs its number and title into the detail sheet's header (Page changes).

## Plate

A project as a plate (`o-plate`): generated line art (`modules/portfolio/plate-art.ts`, seeded by the slug: truss, plan, flange or section, with dimensions and hatching) over a title block. The lead plate puts its copy beside the art (`data-lead`). Hover lifts it off the sheet like a slip of paper (`shadow-slip`). With motion the art is plotted stroke by stroke when it arrives (`effects/plot`); opening a plate morphs its sheet number and title into the detail sheet.

## Assembly steps

The derive steps (`o-steps`, `data-steps` = their count, 3–6): a numbered box, the title, the text and a command with a copy button (shown only where the clipboard works). Arrows join the steps. With motion the last command's cursor blinks slowly, waiting for the visitor.

## RFI sheet and fields

The contact form as a request for information (`o-rfi`): a head row (drawing, title, drawn by), then fields (`o-field`: mono label, optional note, `o-input`). Focus closes registration marks around the field; errors sit under it in `danger`. Sending ends in a stamp.

## Stamp and revision cloud

- **Stamp** (`o-stamp`): a rotated, double-ruled redline stamp (VOID, NOT ISSUED, SENT); `o-stamp-static` sits in the flow instead of over it. Always `aria-hidden` next to a real status text.
- **Revision cloud** (`o-cloud`): a scalloped outline with a delta, drawn around the newest entry. Decorative.

## Title block (footer)

The sheet's title block (`o-tb`): the wordmark, link groups, a block of cells (`o-block`: project, drawing number, title, revision, scale, drawn by, date; `data-w` sets a cell's width) and the revision table (the last commits of the build). The base row holds the copyright and the motion switch.

## Inner pages

- **Page head** (`o-pagehead`): crumbs (`o-crumbs`), the drawing-number block (`o-dwg`: drawing, title, revision) and the title.
- **Detail sheet** (`o-docgrid`): a key plan of the sections (`o-keyplan`, sticky, the current one marked), the body (`prose-orkide`: numbered h2 bubbles, dimension-line links, redline blockquotes), a scale bar for reading progress (`o-scalebar`) and the pager.
- **Empty and error sheets:** a NOT ISSUED stamp (`o-empty`), a VOID stamp on X-404 and X-500 that lands as the page loads.
- **Load sequence:** every sheet's header arrives as the page loads, in CSS so it starts with the first paint and hides nothing (transforms only): crumbs, the drawing block's cells, then the title (its accent's rule drawn) and the lead.

## Page changes

Cross-document view transitions (`styles/motion.css`), directed by the pre-paint head script (`shared/theme/theme-script.ts`), since only a script that runs before first paint sees `pagereveal`:

- **Forward:** the old sheet slides out to the left, the new one in from the right; the frame and the status line stay put.
- **Back** (history back, or up to a parent sheet: a post to the index, any sheet to the cover): the `back` type slides them the other way.
- **List → detail:** opening a post row or a plate names its sheet number and title (`data-morph` inside `[data-morph-href]`), the detail sheet names its own (`data-morph` inside `[data-morph-target]`, parsed before first paint by `<link rel="expect">`), and they glide into place (`o-morph-no`, `o-morph-title`). Skipped when motion is reduced.
- **Status line:** the section name flashes in redline ink when it changes.
- Reduced motion cross-fades the page in 150 ms; same-page transitions use `viewTransition()` (`shared/motion/motion.ts`), which gives up on the animation when the page draws no frames.

## Comparisons, meters and exploded drawings

- **Two-up** (`o-two`, `data-split="5-7"` or `"7-5"`): two parts side by side, one column below 1080 px.
- **Case** (`o-card o-case`): what happens now, or (`data-was`) what used to happen, dashed and hatched with its text in `ink-2`. Lifts on hover.
- **Meters** (`o-meters`): a quantity per row as a hatched bar; each bar is an SVG `rect` whose width the server sets (`data-track`, `data-bar`), so it is right without script. With motion the bars grow in when their section arrives.
- **Exploded drawing and its parts list** (`o-anatomy`): an `o-axo` drawing beside an `o-bom`. Wrapped in `data-parts-set`, pointing at or focusing a part (`data-part`), a balloon (`data-balloon`) or a row (`data-part`) lights the same number everywhere (`shared/lib/parts-set.ts`, with motion off too).

## Atlas (G-005)

The design atlas (`modules/atlas`, its own stylesheet `atlas.css`): specimen plates (`o-plate o-spec`): a live stage in a drawn frame with its hint, the title strip (ID, family, fit, weight), the spec (tags, references, pairings, the prompt starter) and Copy prompt / Pick. Each stage paints its own world (`specimens/<slug>.css`, unlayered and prefixed `st-<slug>`); previews load as their stage nears the screen, draw on the one animation loop while visible, and draw a still when motion is off. A sticky filter strip (family chips that morph the plates, search) and the mix tray (picks in order, the first is the hero; copy a link or the brief) appear with script. Picking stamps the stage; plates that pair with the mix get a dashed redline.

## Admin (the drafting table)

Cards are sheets (`o-card`, `o-card-title`), statistics are big mono figures (`o-stat`, `o-stat-value`), tables and tabs are drawn (`o-table`, `o-tabs`), the navigation is a palette of tools (`o-palette`, `o-palette-link`, the current one in redline) with an app bar (`o-appbar`) reading "Drafting table A-201". Toasts are transmittal slips (`o-toaster`).
