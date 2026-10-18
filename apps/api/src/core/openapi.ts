import type { OpenAPIHono } from "@hono/zod-openapi";
import { richTextNodeReference } from "@orkide/db/rich-text";
import { Scalar } from "@scalar/hono-api-reference";
import type { Schema } from "hono";

import type { AppEnv } from "./env.ts";

// Names the recursive Tiptap node so the generator references it instead of expanding it forever.
richTextNodeReference.openapi("RichTextNode");

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

  // Generating walks every route's schema and the result never changes, so it is built once per
  // isolate; only the server entry depends on the request.
  let document: ReturnType<typeof app.getOpenAPI31Document> | undefined;
  app.get("/openapi.json", (c) => {
    document ??= app.getOpenAPI31Document({
      info: {
        description: "Content, media and analytics API for Orkide.",
        title: "Orkide API",
        version: "1.0.0",
      },
      openapi: "3.1.0",
    });
    return c.json({
      ...document,
      servers: [
        { description: c.env.ENVIRONMENT, url: new URL(c.req.url).origin },
      ],
    });
  });

  app.get(
    "/docs",
    Scalar({
      pageTitle: "Orkide API",
      theme: "deepSpace",
      url: "/api/openapi.json",
    })
  );
};
