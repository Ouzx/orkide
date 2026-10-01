import type { APIRoute } from "astro";

import { inventory } from "@/modules/discovery/discovery.data.ts";
import { buildLlmsFullTxt } from "@/modules/discovery/llms.ts";
import { cachePage } from "@/shared/lib/cache.ts";

export const GET: APIRoute = async (context) => {
  const body = await buildLlmsFullTxt(await inventory());
  cachePage(context, "posts", "projects");
  return new Response(body, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
};
