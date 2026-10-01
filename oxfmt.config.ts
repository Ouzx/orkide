import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

/** Third-party skills are pinned by hash in skills-lock.json and must stay byte-identical. */
const vendored = [".agents/skills/**", "skills-lock.json"];

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), ...vendored],
});
