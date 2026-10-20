import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

import { themeScript } from "./src/shared/theme/theme-script.ts";

/** The pre-paint theme script is the only hand-written inline script; allow exactly its bytes. */
const themeScriptHash =
  `sha256-${createHash("sha256").update(themeScript).digest("base64")}` as const;

/** Short commit of this build, printed in the title block as its revision. */
const build = (() => {
  const ci = process.env.WORKERS_CI_COMMIT_SHA;
  if (ci) {
    return ci.slice(0, 7);
  }
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"])
      .toString()
      .trim();
  } catch {
    return "dev";
  }
})();

/**
 * The last commits of this build, for the title block's revision table (one entry when the CI
 * clone is shallow, none without git). Conventional-commit prefixes are dropped.
 */
const revisions = (() => {
  try {
    return execFileSync("git", [
      "log",
      "-3",
      "--date=short",
      "--format=%h%x09%ad%x09%s",
    ])
      .toString()
      .trim()
      .split("\n")
      .map((line) => {
        const [hash = "", date = "", subject = ""] = line.split("\t");
        return {
          date,
          hash,
          subject: subject.replace(/^[a-z]+(?:\([^)]*\))?!?: /u, ""),
        };
      });
  } catch {
    return [];
  }
})();

/** Public origin. Canonical URLs, sitemaps, feeds and OpenGraph tags are built from it. */
const site = "https://orkide.ouzx.me";

export default defineConfig({
  adapter: cloudflare({
    // Media is optimized by the API's Images pipeline; local assets need no runtime transforms.
    imageService: "passthrough",
  }),
  // The whole stylesheet is ~17 KB compressed: inlining it (Astro hashes it into the CSP) removes
  // the render-blocking request that otherwise delays first paint.
  build: { inlineStylesheets: "always" },
  // Rendered HTML is cached in the Worker's own cache (Workers Cache) and purged by tag.
  cache: { provider: cacheCloudflare() },
  // The skin's three families (packages/ui/DESIGN_SYSTEM.md), with only the axes and styles it
  // sets: the API adds italics unless `styles` says otherwise.
  fonts: [
    {
      cssVariable: "--font-archivo",
      fallbacks: ["Arial Narrow", "Arial", "sans-serif"],
      name: "Archivo",
      // One variable family for lettering (condensed) and running text (normal width).
      options: { experimental: { variableAxis: { wdth: [["62", "125"]] } } },
      provider: fontProviders.google(),
      stretch: "62% 125%",
      styles: ["normal", "italic"],
      subsets: ["latin", "latin-ext"],
      weights: ["300 900"],
    },
    {
      cssVariable: "--font-chivo-mono",
      fallbacks: ["ui-monospace", "monospace"],
      name: "Chivo Mono",
      provider: fontProviders.google(),
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      weights: ["400 700"],
    },
    {
      cssVariable: "--font-shantell",
      fallbacks: ["Segoe Print", "cursive"],
      name: "Shantell Sans",
      provider: fontProviders.google(),
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      weights: ["500"],
    },
  ],
  integrations: [react()],
  // No Markdown pages are rendered by Astro; Shiki is incompatible with the hashed CSP anyway.
  markdown: { syntaxHighlight: false },
  output: "server",
  prefetch: { defaultStrategy: "hover", prefetchAll: true },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "connect-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "frame-src https://challenges.cloudflare.com",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "object-src 'none'",
        "worker-src 'self' blob:",
      ],
      scriptDirective: {
        hashes: [themeScriptHash],
        resources: ["'self'", "https://challenges.cloudflare.com"],
      },
    },
  },
  // Sessions are handled by Better Auth (D1); Astro sessions would provision an unused KV.
  session: false,
  site,
  trailingSlash: "never",
  vite: {
    build: {
      // Warn threshold only; the enforced per-bundle budgets live in `.size-limit.json`.
      // The largest chunk is the admin editor (Tiptap), loaded only in the dashboard.
      chunkSizeWarningLimit: 560,
    },
    define: {
      "import.meta.env.PUBLIC_BUILD": JSON.stringify(build),
      "import.meta.env.PUBLIC_REVISIONS": JSON.stringify(revisions),
    },
    plugins: [tailwindcss()],
  },
});
