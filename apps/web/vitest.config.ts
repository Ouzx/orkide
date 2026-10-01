import { defineConfig } from "vitest/config";

/** Unit tests for pure modules; pages and islands are covered end to end by Playwright. */
export default defineConfig({
  test: { include: ["src/**/*.test.ts"] },
});
