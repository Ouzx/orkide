import path from "node:path";

import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const migrationsDir = path.resolve(
  import.meta.dirname,
  "../../packages/db/migrations"
);

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      miniflare: {
        bindings: {
          ADMIN_EMAILS: "owner@orkide.test",
          BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-0000",
          BETTER_AUTH_URL: "http://localhost:4321",
          ENVIRONMENT: "test",
          GITHUB_CLIENT_ID: "test",
          GITHUB_CLIENT_SECRET: "test",
          LOG_LEVEL: "warn",
          TEST_MIGRATIONS: await readD1Migrations({
            migrationsDir,
            migrationsPattern: `${migrationsDir}/*/migration.sql`,
            projectPath: migrationsDir,
          }),
        },
      },
      wrangler: { configPath: "./wrangler.jsonc" },
    })),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
  },
});
