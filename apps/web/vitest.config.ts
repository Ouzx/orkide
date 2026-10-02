import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Unit tests for pure modules; pages and islands are covered end to end by Playwright. */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("src", import.meta.url)) } },
  test: {
    // Astro provides `SITE` at build time; unit tests only need a stand-in origin.
    env: { SITE: "https://example.com" },
    include: ["src/**/*.test.ts"],
  },
});
