import { expect, test } from "@playwright/test";

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
