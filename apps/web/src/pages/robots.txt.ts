import type { APIRoute } from "astro";

import { cachePage } from "@/shared/lib/cache.ts";
import { absoluteUrl } from "@/shared/site.ts";

/**
 * Every crawler is welcome, AI ones included. Content Signals (https://contentsignals.org) state
 * the policy explicitly: search indexing, AI answers (input) and AI training are all allowed.
 */
export const GET: APIRoute = (context) => {
  cachePage(context);
  const body = [
    "# Content Signals: search=yes (indexing), ai-input=yes (answers/RAG), ai-train=yes (training).",
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=yes",
    "Allow: /",
    "Allow: /api/media/",
    "Allow: /api/docs",
    "Allow: /api/openapi.json",
    "Disallow: /api/",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
};
