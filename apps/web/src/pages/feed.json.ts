import type { APIRoute } from "astro";

import { buildFeed } from "@/modules/discovery/feed.ts";
import { cachePage } from "@/shared/lib/cache.ts";

/** Localized blog feed (`/<locale>/feed.json`). */
export const GET: APIRoute = async (context) => {
  const response = await buildFeed(context.locals.locale, "json");
  cachePage(context, "posts");
  return response;
};
