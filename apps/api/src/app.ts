import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@orkide/auth";
import { etag } from "hono/etag";

import { noStoreByDefault } from "./core/cache.ts";
import type { AppEnv } from "./core/env.ts";
import { onError, onNotFound } from "./core/errors.ts";
import { session } from "./core/middleware/auth.ts";
import { requestContext } from "./core/middleware/context.ts";
import { rateLimit } from "./core/middleware/rate-limit.ts";
import { security } from "./core/middleware/security.ts";
import { registerOpenApi } from "./core/openapi.ts";
import { liveRoutes } from "./modules/live/live.routes.ts";
import { mediaRoutes } from "./modules/media/media.routes.ts";
import { postRoutes } from "./modules/post/post.routes.ts";
import { projectRoutes } from "./modules/project/project.routes.ts";
import { systemRoutes } from "./modules/system/system.routes.ts";
import { taxonomyRoutes } from "./modules/taxonomy/taxonomy.routes.ts";

/**
 * The API application. Every route lives under `/api`, which the web Worker forwards through a
 * Service Binding, so browsers only ever talk to a single origin.
 */
const app = new OpenAPIHono<AppEnv>().basePath("/api");

app.use(requestContext, noStoreByDefault, security, etag());
app.use("/auth/*", rateLimit("RATE_LIMIT_STRICT", "auth"));
app.on(["GET", "POST"], "/auth/*", (c) => auth.handler(c.req.raw));
app.use(rateLimit("RATE_LIMIT_API", "api"), session);

const routes = app
  .route("/", systemRoutes)
  .route("/", liveRoutes)
  .route("/", postRoutes)
  .route("/", projectRoutes)
  .route("/", taxonomyRoutes)
  .route("/", mediaRoutes);

registerOpenApi(app);
app.onError(onError);
app.notFound(onNotFound);

export { app };

/** Route types consumed by `@orkide/api-client` for end-to-end type-safe RPC. */
export type AppType = typeof routes;
