import type { z } from "@hono/zod-openapi";

import { problemSchema } from "./problem.ts";

/** OpenAPI response object for a JSON body. */
export const json = <T extends z.ZodType>(schema: T, description: string) =>
  ({ content: { "application/json": { schema } }, description }) as const;

const PROBLEM_DESCRIPTIONS = {
  400: "Malformed request",
  401: "Not signed in",
  403: "Missing permission",
  404: "Not found",
  409: "Conflicts with existing data",
  413: "Payload too large",
  415: "Unsupported media type",
  422: "Validation failed",
  429: "Rate limited",
  502: "Upstream service unavailable",
  503: "Feature disabled",
} as const;

type ProblemStatus = keyof typeof PROBLEM_DESCRIPTIONS;

interface ProblemResponse {
  readonly content: {
    readonly "application/problem+json": {
      readonly schema: typeof problemSchema;
    };
  };
  readonly description: string;
}

/** Documents the RFC 9457 problem responses a route can produce. */
export const problems = <const S extends ProblemStatus>(
  ...statuses: S[]
): Record<S, ProblemResponse> => {
  const responses: Partial<Record<S, ProblemResponse>> = {};
  for (const status of statuses) {
    responses[status] = {
      content: { "application/problem+json": { schema: problemSchema } },
      description: PROBLEM_DESCRIPTIONS[status],
    };
  }
  return responses as Record<S, ProblemResponse>;
};
