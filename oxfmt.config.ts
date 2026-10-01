import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

/** Third-party skills are pinned by hash in skills-lock.json and must stay byte-identical. */
const vendored = [".agents/skills/**", "skills-lock.json"];

export default defineConfig({
  ...ultracite,
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), ...vendored],
  // Tailwind v4 reads the theme (custom utilities like `text-display`) from the stylesheet.
  sortTailwindcss: {
    ...(typeof ultracite.sortTailwindcss === "object"
      ? ultracite.sortTailwindcss
      : {}),
    functions: [
      "clsx",
      "cva",
      "tw",
      "twMerge",
      "cn",
      "twJoin",
      "tv",
      "buttonVariants",
    ],
    stylesheet: "./packages/ui/src/styles/globals.css",
  },
});
