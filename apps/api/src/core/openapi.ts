import type { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import type { Schema } from "hono";

import type { AppEnv } from "./env.ts";

/** Serves the OpenAPI 3.1 document at `/api/openapi.json` and the Scalar reference at `/api/docs`. */
export const registerOpenApi = <S extends Schema>(
  app: OpenAPIHono<AppEnv, S, "/api">
) => {
  app.openAPIRegistry.registerComponent("securitySchemes", "session", {
    description:
      "Better Auth session cookie, obtained by signing in at `/api/auth`.",
    in: "cookie",
    name: "orkide.session_token",
    type: "apiKey",
  });

  app.doc31("/openapi.json", (c) => ({
    info: {
      description: "Content, media and analytics API for Orkide.",
      title: "Orkide API",
      version: "1.0.0",
    },
    openapi: "3.1.0",
    servers: [
      { description: c.env.ENVIRONMENT, url: new URL(c.req.url).origin },
    ],
  }));

  app.get(
    "/docs",
    Scalar({
      pageTitle: "Orkide API",
      theme: "deepSpace",
      url: "/api/openapi.json",
    })
  );
};
