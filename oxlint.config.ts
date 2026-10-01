import { defineConfig } from "oxlint";
import astro from "ultracite/oxlint/astro";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins(["react-doctor"]);

/** Generated sources are owned by their generators and must not be hand-edited to satisfy lint. */
const generated = [
  ".agents/skills/**",
  "packages/db/src/schema/auth.ts",
  "packages/i18n/src/paraglide/**",
  "**/worker-configuration.d.ts",
];

export default defineConfig({
  extends: [core, react, astro, vitest, shadcn, jsPlugins],
  ignorePatterns: [...(core.ignorePatterns ?? []), ...generated],
  jsPlugins: [...(jsPlugins.jsPlugins ?? []), ...(shadcn.jsPlugins ?? [])],
  overrides: [
    {
      // Column order in a table definition is the DDL column order; it is meaningful, not alphabetical.
      files: ["packages/db/src/schema/**", "packages/db/src/columns.ts"],
      rules: { "eslint/sort-keys": "off" },
    },
    {
      // Drizzle needs one module exposing every table (drizzle-kit, relations, auth adapter).
      files: ["packages/db/src/schema/index.ts"],
      rules: { "oxc/no-barrel-file": "off" },
    },
  ],
  settings: jsPluginSettings,
});
