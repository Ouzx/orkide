# Analysis log

Accessibility and performance are analysed on request, not enforced (rule 18 of the workspace `CLAUDE.md`, ADR-028). Each run gets an entry here, newest first: date, code state, how it was run, results, findings, and what is waiting for the owner. Fixes are proposed in the entry and only made once the owner agrees; fixes that change what visitors see are approved one by one.

How to run (after `pnpm build` and `pnpm e2e:prepare`):

- `pnpm test:a11y`: axe (WCAG 2.2 AA + best practices) and a horizontal-scroll check on the public pages at 375/768/1440/2560 px, light and dark scheme.
- `pnpm lighthouse`: Lighthouse CI, default mobile profile, 3 runs per URL against `scripts/preview-stack.ts`; `apps/web/lighthouserc.json` holds the reference thresholds (ADR-024).

Blind spot of both: they run in headless Chromium and never move the pointer, so tilt, typing and other motion is measured only as it starts. Check frame rates in headless Firefox too (software compositing, like many Linux browsers).

## 2026-10-18 · After the fixes (and the new home sections)

- **Code:** `feat/redesign` (uncommitted), with the home page's two new sections (`inside`, `derive`) and the fixes approved from the entry below.
- **Fixes applied:** the language switch's links get 26 × 28 px hit areas (`o-hit`, no visible change); blocks below the fold rise in by moving only, without fading; only the Latin normal cut of the body and display fonts is preloaded (two files instead of the six that `preload` pulled in, which competed with the document). The new install commands wrap instead of scrolling sideways (axe `scrollable-region-focusable`).
- **axe (`pnpm test:a11y`):** 72 of 72 passing.
- **Lighthouse (`pnpm lighthouse`), all reference thresholds met:**

| URL | Performance (3 runs) | Accessibility | Best practices | SEO | Best run |
| --- | --- | --- | --- | --- | --- |
| `/en` | 0.94, 0.94, 0.94 | 1 | 1 | 0.92 | FCP 2.2 s, LCP 2.7 s, TBT 0 ms, CLS 0 |
| `/en/blog` | 0.97, 0.96, 0.95 | 1 | 1 | 0.92 | FCP 2.0 s, LCP 2.3 s, TBT 0 ms, CLS 0.019 |
| `/en/blog/edge-first-architecture` | 0.95, 0.95, 0.96 | 1 | 1 | 0.92 | FCP 2.1 s, LCP 2.4 s, TBT 0 ms, CLS 0.01 |

- **Findings:** FCP is still about 2.1 s against 1.3 s before the redesign; the inlined document is larger (about 31 kB compressed with twenty `@font-face` rules). Not over any threshold.
- **Waiting for the owner:** nothing.

## 2026-10-18 · The Instrument redesign (ADR-031)

- **Code:** branch `feat/redesign` (uncommitted, on top of 1740260), production build served by the local stack in a scratch clone, e2e seed data.
- **axe (`pnpm test:a11y`):** 8 of 72 passing. Every failure is the same node: `target-size` (WCAG 2.2, 2.5.8) on the language switch in the header, whose two link halves are 22 × 20 px, under the 24 px minimum. No other rule fails, and no page scrolls sideways at any width.
- **Lighthouse (`pnpm lighthouse`):**

| URL | Performance (3 runs) | Accessibility | Best practices | SEO | Best run |
| --- | --- | --- | --- | --- | --- |
| `/en` | 0.90, 0.90, 0.90 | 0.93 | 1 | 0.92 | FCP 2.2 s, LCP 3.3 s, TBT 0 ms, CLS 0 |
| `/en/blog` | 0.94, 0.93, 0.93 | 0.96 | 1 | 0.92 | FCP 2.1 s, LCP 2.7 s, TBT 0 ms, CLS 0.019 |
| `/en/blog/edge-first-architecture` | 0.94, 0.93, 0.92 | 0.96 | 1 | 0.92 | FCP 2.0 s, LCP 2.7 s, TBT 0 ms, CLS 0.01 |

- **Findings:**
  1. `target-size` on the language switch (all pages, axe and Lighthouse). Fix without a visible change: let each link's hit area extend 4 px past the slot so it is 26 × 28 px.
  2. `color-contrast` on `/en` (Lighthouse only): the home contact panel's `READY` screen measured 1.01:1 because it was mid-way through the rise-in (`o-armed`, opacity 0.001) when Lighthouse scanned the full page; at rest it is LED on screen glass (12.9:1). Not a real failure for visitors, but a scanner that does not scroll sees it. Possible fix (visible): blocks rise in by moving only, without fading from transparent.
  3. Performance: LCP is the hero headline in Doto; 86 % of it is render delay waiting for that font (Doto is not preloaded; only Hanken Grotesk is). Fix without a visible change: preload Doto too. FCP rose from 1.3 s to about 2.1 s against the baseline; four font families (about 250 KB) and a larger inlined stylesheet are the likely causes and should be measured again after the preload.
  4. Headless Firefox (software compositing, the stand-in for the owner's browser): 17 ms per frame on the home page after the static-mount fix (ADR-031); it was 50 ms with blurred shadows, inset shadows and `soft-light` on the tilting panel.
- **Context:** the reference thresholds in `lighthouserc.json` (0.95 for the blog pages, 1 for accessibility) predate the redesign; the home page meets its 0.90.
- **Waiting for the owner:** nothing; the owner approved all three and they are applied (entry above).

## 2026-10-17 · Baseline when analysis moved out of CI

- **Code:** `main` at 78dfa19 (2026-10-02, PR #17), production build served by the local stack.
- **axe (`e2e/accessibility.test.ts`):** 72 of 72 passing: no violations and no horizontal scroll on any public page, at four widths, in both schemes.
- **Lighthouse:**

| URL | Performance (3 runs) | Accessibility | Best practices | SEO | Best run |
| --- | --- | --- | --- | --- | --- |
| `/en` | 0.96, 0.95, 0.96 | 1 | 1 | 0.92 | FCP 1.3 s, LCP 2.7 s, TBT 30 ms, CLS 0 |
| `/en/blog` | 0.99, 0.99, 0.99 | 1 | 1 | 0.92 | FCP 1.3 s, LCP 2.0 s, TBT 0 ms, CLS 0 |
| `/en/blog/edge-first-architecture` | 0.99, 0.99, 0.99 | 1 | 1 | 0.92 | FCP 1.3 s, LCP 2.0 s, TBT 0 ms, CLS 0 |

- **Findings:** none new. SEO 0.92 is the `robots-txt` audit rejecting the deliberate `Content-Signal` directive; home performance is capped by the hero's LCP on a throttled CPU (both ADR-024, roadmap #16).
- **Context:** in AbanTCon, derived from this template, chasing the Lighthouse gate during a redesign changed the approved design and broke a WebGL scene without any check noticing (AbanTCon `docs/analysis.md`, 2026-10-17). That is why CI no longer runs these checks and agents ask before optimising.
- **Waiting for the owner:** nothing.
