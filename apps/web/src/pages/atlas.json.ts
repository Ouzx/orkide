import type { APIRoute } from "astro";

import { buildAtlasJson } from "@/modules/atlas/atlas-json.ts";
import { cachePage } from "@/shared/lib/cache.ts";

/** The design atlas for agents (`/atlas.json`); it changes only with a deployment. */
export const GET: APIRoute = (context) => {
  cachePage(context);
  return Response.json(buildAtlasJson());
};
