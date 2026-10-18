import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
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
