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

/** Public origin. Canonical URLs, sitemaps, feeds and OpenGraph tags are built from it. */
const site = "https://orkide-web.ouzx.workers.dev";

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
  fonts: [
    {
      cssVariable: "--font-geist",
      fallbacks: ["ui-sans-serif", "system-ui", "sans-serif"],
      name: "Geist",
      provider: fontProviders.fontsource(),
      subsets: ["latin", "latin-ext"],
      weights: ["100 900"],
    },
    {
      cssVariable: "--font-geist-mono",
      fallbacks: ["ui-monospace", "monospace"],
      name: "Geist Mono",
      provider: fontProviders.fontsource(),
      subsets: ["latin", "latin-ext"],
      weights: ["400 600"],
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
      // The largest chunk is the lazy hero scene (Three.js renderer core, ~130 KB gzip),
      // fetched only after idle and never on the critical path.
      chunkSizeWarningLimit: 560,
    },
    plugins: [tailwindcss()],
  },
});
