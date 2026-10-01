import { defineConfig } from "oxlint";
import astro from "ultracite/oxlint/astro";
import core from "ultracite/oxlint/core";
import { jsPluginSettings, selectJsPlugins } from "ultracite/oxlint/js-plugins";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";

const jsPlugins = selectJsPlugins(["react-doctor"]);

export default defineConfig({
  extends: [core, react, astro, vitest, shadcn, jsPlugins],
  ignorePatterns: [...(core.ignorePatterns ?? []), ".agents/skills/**"],
  jsPlugins: [...(jsPlugins.jsPlugins ?? []), ...(shadcn.jsPlugins ?? [])],
  settings: jsPluginSettings,
});
