import { expect, test } from "@playwright/test";

import { signInAsOwner } from "./session.ts";

const MOBILE_MAX_WIDTH = 1024;

test("the admin console runs without console errors or CSP violations", async ({
  context,
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      problems.push(message.text());
    }
  });
  page.on("pageerror", (error) => problems.push(error.message));

  await signInAsOwner(context);
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // On small screens the navigation lives in a sheet (a base-ui dialog): open it too.
  const viewport = page.viewportSize();
  if (viewport && viewport.width < MOBILE_MAX_WIDTH) {
    await page.getByRole("button", { name: "Menu" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }
  await page.waitForLoadState("load");

  expect(problems).toEqual([]);
});

test("the owner edits the hero, and the home page shows it", async ({
  context,
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "1440px",
    "The content is shared by every project: one run edits it."
  );
  await signInAsOwner(context);
  await page.goto("/en/admin/site");
  await page.getByLabel("Title").fill("Edited from the admin.");
  await page.getByRole("button", { exact: true, name: "Save" }).click();
  await expect(page.getByText("Saved ·")).toBeVisible();

  await page.goto("/en");
  await expect(
    page.getByRole("heading", { level: 1, name: "Edited from the admin." })
  ).toBeVisible();

  // Back to the shipped content, so other runs see the site as it ships.
  await page.goto("/en/admin/site");
  await page
    .getByRole("button", { name: "Back to the shipped content" })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Back to the shipped content" })
    .click();
  await expect(
    page.getByText("Shipped content", { exact: true })
  ).toBeVisible();
});
