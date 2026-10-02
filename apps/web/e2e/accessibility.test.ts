import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { pages } from "./pages.ts";

const schemes = ["light", "dark"] as const;
const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

for (const scheme of schemes) {
  test.describe(`${scheme} scheme`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path } of pages) {
      test(`${name} has no axe violations and no horizontal scroll`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        await page.waitForLoadState("load");
        // Islands that hydrate on load/idle must be interactive before they are scanned.
        await page
          .waitForFunction(
            () => !document.querySelector("astro-island[ssr][client='load']")
          )
          .catch(() => {});

        const { passes, violations } = await new AxeBuilder({ page })
          .withTags(WCAG_TAGS)
          .analyze();
        expect(passes.length).toBeGreaterThan(0);
        expect(
          violations.map(({ help, id, nodes }) => ({
            help,
            id,
            targets: nodes.map((node) => node.target.join(" ")),
          }))
        ).toEqual([]);

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        );
        expect(overflow).toBeLessThanOrEqual(0);
      });
    }
  });
}
