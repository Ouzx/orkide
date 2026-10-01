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
      // Hono/Astro middleware call `await next()` and then continue; that is not a Node callback.
      files: ["apps/**", "packages/**"],
      rules: { "node/callback-return": "off" },
    },
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
    {
      // shadcn registry code keeps its upstream shape, so `shadcn add --diff` stays readable.
      files: ["packages/ui/src/components/**"],
      rules: {
        "eslint/eqeqeq": "off",
        "eslint/func-style": "off",
        "eslint/sort-keys": "off",
        "jsx-a11y/label-has-associated-control": "off",
        "jsx-a11y/prefer-tag-over-role": "off",
        "react-doctor/no-array-index-as-key": "off",
        "react/function-component-definition": "off",
        "shadcn/no-arbitrary-values": "off",
        "shadcn/no-restyle": "off",
      },
    },
    {
      // Astro components are PascalCase by convention (`<BaseLayout>`, `<Seo>`).
      files: ["**/*.astro"],
      rules: { "unicorn/filename-case": "off" },
    },
  ],
  settings: jsPluginSettings,
});
