# Analysis log

Accessibility and performance are analysed on request, not enforced (AGENTS.md rule 18, ADR-028). Each run gets an entry here, newest first: date, code state, how it was run, results, findings, and what is waiting for the owner. Fixes are proposed in the entry and only made once the owner agrees; fixes that change what visitors see are approved one by one.

How to run (after `pnpm build` and `pnpm e2e:prepare`):

- `pnpm test:a11y`: axe (WCAG 2.2 AA + best practices) and a horizontal-scroll check on the public pages at 375/768/1440/2560 px, light and dark scheme.
- `pnpm lighthouse`: Lighthouse CI, default mobile profile, 3 runs per URL against `scripts/preview-stack.ts`; `apps/web/lighthouserc.json` holds the reference thresholds (ADR-024).

Blind spot of both: they run in headless Chromium, which renders WebGL on the CPU (SwiftShader). Scores for pages with WebGL (the home page's pollen layer and hero scene) measure that software path, not what a visitor with a GPU sees, and say nothing about whether the scene looks right. Check WebGL on real hardware: headless Chromium with `--use-angle=gl-egl --ignore-gpu-blocklist` gets the GPU on Linux.

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
