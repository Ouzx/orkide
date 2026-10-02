import { defineConfig, devices } from "@playwright/test";

const WEB_PORT = 4322;
const API_PORT = 8788;

/** Widths the layouts are verified at: phone, tablet, laptop and large desktop. */
export const viewports = [375, 768, 1440, 2560] as const;

/**
 * Runs against the production build (`pnpm build` first): the API and the web Worker are both
 * served by `vite preview`/`astro preview` on Miniflare, joined by the same Service Binding as
 * in production. The local D1 database must be migrated and seeded (`pnpm e2e:prepare`).
 */
export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: viewports.map((width) => ({
    name: `${width}px`,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { height: width < 1000 ? 900 : 1100, width },
    },
  })),
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "e2e",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `pnpm --filter @orkide/api preview --port ${API_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `http://localhost:${API_PORT}/api/health`,
    },
    {
      command: `pnpm --filter @orkide/web preview --port ${WEB_PORT} --ignore-lock`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: `http://localhost:${WEB_PORT}/en`,
    },
  ],
  workers: process.env.CI ? 2 : undefined,
});
