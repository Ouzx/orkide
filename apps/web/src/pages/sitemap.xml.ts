import type { APIRoute } from "astro";

import { inventory } from "@/modules/discovery/discovery.data.ts";
import { buildSitemap } from "@/modules/discovery/sitemap.ts";
import { cachePage } from "@/shared/lib/cache.ts";

export const GET: APIRoute = async (context) => {
  const body = buildSitemap(await inventory());
  cachePage(context, "posts", "projects", "taxonomy");
  return new Response(body, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
};
