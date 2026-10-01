import type { Config } from "prettier";
import type { PluginOptions } from "prettier-plugin-tailwindcss";

/**
 * Prettier formats `.astro` files only (oxfmt has no Astro support). Scripts, lint-staged and
 * VS Code invoke it for `*.astro` alone — there is no `.prettierignore` because oxfmt reads it too.
 * Style options mirror the ultracite oxfmt preset so both formatters agree, and Tailwind classes
 * are sorted with the same algorithm oxfmt uses for every other file.
 */
const config: Config & PluginOptions = {
  arrowParens: "always",
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: "lf",
  overrides: [{ files: "*.astro", options: { parser: "astro" } }],
  plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  printWidth: 80,
  quoteProps: "as-needed",
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  tailwindAttributes: ["class:list"],
  tailwindFunctions: ["cn", "cva", "buttonVariants"],
  tailwindStylesheet: "./packages/ui/src/styles/globals.css",
  trailingComma: "es5",
  useTabs: false,
};

export default config;
