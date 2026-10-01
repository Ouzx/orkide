import { OpenAPIHono } from "@hono/zod-openapi";
import { createFactory } from "hono/factory";

import type { AppEnv } from "./env.ts";
import { ApiError, toIssues } from "./errors.ts";

/** Typed helpers for middleware and handlers that live outside a router. */
export const factory = createFactory<AppEnv>();

/**
 * Creates a module router. Validation failures from any OpenAPI route surface as a single,
 * consistent `validation_failed` problem with field-level issues.
 */
export const createRouter = () =>
  new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) {
        throw new ApiError("validation_failed", {
          issues: toIssues(result.error),
        });
      }
    },
  });
