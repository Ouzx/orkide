import { expect, test } from "@playwright/test";

test("every atlas specimen starts, and picks make a mix", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(message.text());
    }
  });
  page.on("pageerror", (error) => problems.push(error.message));

  await page.goto("/en/atlas");
  // Each preview's code loads when its stage nears the screen: bring every stage on screen.
  const stages = page.locator("[data-stage]");
  const total = await stages.count();
  expect(total).toBeGreaterThan(0);
  for (let index = 0; index < total; index += 1) {
    // oxlint-disable-next-line no-await-in-loop -- one stage after another, like a visitor scrolling.
    await stages.nth(index).scrollIntoViewIfNeeded();
  }
  await expect
    .poll(() =>
      stages.evaluateAll(
        (elements) =>
          elements.filter((element) => element.childElementCount === 0).length
      )
    )
    .toBe(0);

  // A stage that cannot start says so instead of throwing; only WebGL may be missing here.
  const webgl = await page.evaluate(() =>
    Boolean(document.createElement("canvas").getContext("webgl"))
  );
  if (webgl) {
    await expect(page.locator("[data-stage][data-failed]")).toHaveCount(0);
  }

  await page.locator('[data-spec="GN-07"] [data-pick]').click();
  await page.locator('[data-spec="AE-05"] [data-pick]').click();
  const tray = page.getByRole("complementary", { name: "Your mix" });
  await expect(tray).toBeVisible();
  await expect(tray.locator("li")).toHaveCount(2);
  await expect(tray.locator('li[data-role="hero"]')).toContainText("GN-07");
  await expect(page.locator('[data-spec="GN-07"] [data-pick]')).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  expect(problems).toEqual([]);
});
