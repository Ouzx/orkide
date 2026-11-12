import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // `.astro` files too, through Oxfmt's bundled prettier-plugin-astro (needs `@astrojs/compiler-rs`).
  astro: true,
  // Tailwind v4 reads the theme (custom utilities like `text-display`) from the stylesheet.
  sortTailwindcss: {
    ...(typeof ultracite.sortTailwindcss === "object"
      ? ultracite.sortTailwindcss
      : {}),
    attributes: ["class:list"],
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
