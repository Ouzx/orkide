import type { APIRoute } from "astro";

import { buildFeed } from "@/modules/discovery/feed.ts";
import { cachePage } from "@/shared/lib/cache.ts";

/** Localized blog feed (`/<locale>/atom.xml`). */
export const GET: APIRoute = async (context) => {
  const response = await buildFeed(context.locals.locale, "atom");
  cachePage(context, "posts");
  return response;
};
