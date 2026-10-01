import { defineConfig } from "@inlang/paraglide-js";

/**
 * Paths that must never be localized: API traffic (proxied to the API Worker), framework assets
 * and machine-readable endpoints that carry their own locale handling.
 */
const unlocalized = [
  "/api/:path(.*)?",
  "/_astro/:path(.*)?",
  "/_server-islands/:path(.*)?",
  "/media/:path(.*)?",
  "/og/:path(.*)?",
  "/.well-known/:path(.*)?",
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/favicon.svg",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
];

export default defineConfig({
  emitTsDeclarations: true,
  isServer: "typeof window === 'undefined'",
  outdir: "./src/paraglide",
  routeStrategies: unlocalized.map((match) => ({ exclude: true, match })),
  strategy: ["url", "cookie", "preferredLanguage", "baseLocale"],
  /**
   * Every page lives under a locale prefix. Route segments are translated where a native word
   * exists; the catch-all keeps the remaining paths identical across locales.
   */
  urlPatterns: [
    // The locale root has no trailing slash (`/en`, not `/en/`), matching `trailingSlash: "never"`.
    {
      localized: [
        ["en", "/en"],
        ["tr", "/tr"],
      ],
      pattern: "/",
    },
    {
      localized: [
        ["en", "/en/portfolio/:path(.*)?"],
        ["tr", "/tr/portfolyo/:path(.*)?"],
      ],
      pattern: "/portfolio/:path(.*)?",
    },
    {
      localized: [
        ["en", "/en/contact"],
        ["tr", "/tr/iletisim"],
      ],
      pattern: "/contact",
    },
    {
      localized: [
        ["en", "/en/:path(.*)?"],
        ["tr", "/tr/:path(.*)?"],
      ],
      pattern: "/:path(.*)?",
    },
  ],
});
