# Deslop: what makes a design read as AI-made

> [!IMPORTANT] **Never use this doc on a design that isn't finished.** Design every page and component first. Deslopping comes after, it is optional, and it runs only when the user asks for it specifically. Don't apply these recommendations while designing, and don't start a deslop pass on your own.

Research and review from 2026-11-12: what visitors notice, not a style to follow. Deslop checklists applied wholesale flatten a design; the test here is narrow.

**The test:** does this element carry information on this page, or the design's soul? Not everything has to be functional. A lamp that never changes, a grille, an engraved label or an accent colour can carry the theme itself, and that is a reason to keep it. What goes is what only repeats, pretends or fills: the same label twice in one view, a second copy of a title block, a value that pretends to be data and changes on every load, filler copy.

## The tells (2025–2026)

Mostly agency and tool blogs: signals that add up when several appear together, not proof that a site was generated.

| # | Tell | What people point at | Sources |
| --- | --- | --- | --- |
| 1 | Default gradient palette | Blue-to-purple or indigo gradients, often as gradient text in the hero (gradient backgrounds or hero text on 28 % of 500 Show HN pages) | [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026), [Krebs](https://adriankrebs.ch/blog/design-slop/), [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui) |
| 2 | Type with no opinion | Inter, Geist or another safe sans for everything, with no display and body pairing | [Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026), [925Studios](https://www.925studios.co/blog/ai-slop-web-design-guide) |
| 3 | A label above every heading | A small tracked-caps eyebrow or kicker, or a pill badge over the H1, that repeats the heading under it | [Impeccable](https://impeccable.style/slop), [Krebs](https://adriankrebs.ch/blog/design-slop/), [dev.to](https://dev.to/ianwieds/taste-cant-be-linted-the-tells-can-1ah4) |
| 4 | Status dots with no state | Coloured or pulsing dots with nothing switched on behind them | [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Impeccable](https://impeccable.style/slop) |
| 5 | Same text twice, redundant micro-text | The same label twice in one container; helper lines that restate what is on screen | [Impeccable](https://impeccable.style/slop), [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) |
| 6 | Identical card grids | Three or six equal cards, an icon or label on each, the same spacing everywhere, so nothing reads as more important | [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Krebs](https://adriankrebs.ch/blog/design-slop/), [Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026) |
| 7 | Stat banners and decorative numbering | A row of headline numbers; "01 / 02 / 03" next to things that are not a sequence | [Krebs](https://adriankrebs.ch/blog/design-slop/), [Impeccable](https://impeccable.style/slop) |
| 8 | Coloured edge stripes | A thick coloured bar on one side of each card | [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [Krebs](https://adriankrebs.ch/blog/design-slop/) |
| 9 | Glow, glass and neon on dark | Large coloured glows, frosted panels everywhere, glowing accents on dark | [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Krebs](https://adriankrebs.ch/blog/design-slop/), [Impeccable](https://impeccable.style/slop) |
| 10 | Emoji as icons | Emoji in place of an icon set, in navigation or as feature bullets | [Fountain Institute](https://www.thefountaininstitute.com/blog/signs-vibe-coded-ui), [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026) |
| 11 | Motion with no purpose | The same fade on every block; effects that answer nothing the visitor did | [Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c), [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026), [925Studios](https://www.925studios.co/blog/ai-slop-web-design-guide) |
| 12 | Copy tells | Em dashes as filler, "not X, it's Y" contrasts, buzzwords ("seamless", "crafted"), headlines that would fit any product | [Utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026), [Impeccable](https://impeccable.style/slop), [Wikipedia](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), [Canatselis](https://world.hey.com/kostac/spot-the-slop-a-ui-designer-s-guide-to-fixing-ai-defaults-4c448c9c) |

The same lists also flag grid backgrounds, hard offset shadows, tracked-caps mono labels and a blinking cursor. In a skin with a reason for them (Blueprint's paper, slips, drafting lettering and derive command) they are identity, not slop: apply the test above. Tells 4 and 9 (lamps, glows) in particular are often a skin's soul.

## Review of the Blueprint skin (2026-11-12)

Blueprint has none of tells 1, 2, 8 or 10. Its incidents come from 3, 5, 7 and 12: the same label printed several times. Paths are under `apps/web/src/` unless they start with `packages/`.

| # | Incident | Where | Decision |
| --- | --- | --- | --- |
| 1 | The status line printed the sheet twice ("G-002 · G-002 · DRAWING INDEX") | `shared/components/PageHeader.astro`, `DocumentArticle.astro`, `ErrorPanel.astro`, `modules/home/Hero.astro` | Fix: name the sheet once |
| 2 | The sheet number appeared 4 times in the first screen (tab beside the wordmark, crumbs, drawing block, status line) | `shared/components/SiteHeader.astro` | Fix: drop the tab beside the wordmark |
| 3 | The contact sheet stacked two title blocks; "Request for information" appeared 4 times | `pages/contact.astro` | Fix: one title block |
| 4 | Section kickers that only repeat the menu ("BLOG", "PORTFOLIO", "CONTACT") over the section title | `pages/index.astro` | Fix: kickers optional, drop these three |
| 5 | The six general-note labels in the accent colour, against "one redline per view" | `packages/ui/src/styles/kit.css` | Keep: the redline carries the sheet's character (the owner's call) |
| 6 | "Plotted" showed the revision date, then a script replaced it with the visitor's clock | `modules/home/axo-motion.ts` | Fix: keep the date |
| 7 | "Send a message — I read every one." | `packages/i18n/messages/*.json` | Fix: a full stop |
| 8 | Random loads and spans on project plates ("P = 14.4 kN") | `modules/portfolio/plate-art.ts` | Keep: reads as part of the drawing |
| 9 | Hero eyebrow "G-001 COVER SHEET · …" | `modules/home/Hero.astro` | Keep: the sheet name is the skin's identity |
| 10 | Random "purge" flashes on the cover drawing | `modules/home/axo-motion.ts` | Keep: the drawing's story (ADR-032) |
| 11 | Bubbles "n / G-001"; schedule rows 01–04 | `shared/components/SectionHead.astro`, `modules/home/Inside.astro` | Keep: a drafting convention |
| 12 | `<title>` "Orkide — engineering, crafted" | `packages/i18n/messages/en.json` | Copy: rewrite without the buzzword |
