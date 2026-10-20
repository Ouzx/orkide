import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

test("unprefixed paths redirect to a locale", async ({ request }) => {
  const response = await request.get("/blog", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toMatch(/\/(?:en|tr)\/blog$/u);
});

test("the feed is served under its locale", async ({ request }) => {
  const response = await request.get("/en/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
});

test("unknown pages answer 404 with a heading", async ({ page }) => {
  const response = await page.goto("/en/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a seeded post renders its article", async ({ page }) => {
  const response = await page.goto("/en/blog/edge-first-architecture");
  expect(response?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Edge-first architecture on Workers",
    })
  ).toBeVisible();
});

test("the motion switch turns motion off before the next paint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");
  const toggle = page.getByRole("button", { name: "Reduce motion" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveClass(/\bcalm\b/u);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\bcalm\b/u);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
});

/** The print switch sits in the header, or in the menu on phones. */
const printSwitch = async (page: Page) => {
  const menu = page.getByRole("button", { exact: true, name: "Menu" });
  if (await menu.isVisible()) {
    await menu.click();
  }
  return page.getByRole("switch", { name: "White print" });
};

test("the print switch changes the palette and keeps it", async ({ page }) => {
  await page.goto("/en");
  const white = await printSwitch(page);
  await white.click();
  await expect(white).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/\blight\b/u);

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/\blight\b/u);
  await expect(await printSwitch(page)).toBeChecked();
});

test("the admin sign-in page is reachable without a session", async ({
  page,
}) => {
  await page.goto("/en/admin");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sign in" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with GitHub" })
  ).toBeVisible();
});

const consolePaths = [
  "/en",
  "/tr",
  "/en/blog",
  "/en/blog/edge-first-architecture",
  "/en/portfolio",
] as const;

for (const path of consolePaths) {
  test(`${path} loads without console errors or CSP violations`, async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        problems.push(message.text());
      }
    });
    page.on("pageerror", (error) => problems.push(error.message));

    await page.goto(path);
    await page.waitForLoadState("load");
    expect(problems).toEqual([]);
  });
}
