import { z } from "@hono/zod-openapi";

/** Stable, machine-readable error codes. Clients branch on `code`, never on `detail`. */
export const errorCodes = [
  "bad_request",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "payload_too_large",
  "unsupported_media_type",
  "validation_failed",
  "rate_limited",
  "feature_disabled",
  "upstream_unavailable",
  "internal",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

/** RFC 9457 problem details, extended with a stable `code` and optional field issues. */
export const problemSchema = z
  .object({
    code: z.enum(errorCodes),
    detail: z.string().optional(),
    instance: z.string(),
    issues: z
      .array(
        z.object({
          message: z.string(),
          path: z.array(z.union([z.string(), z.number()])),
        })
      )
      .optional(),
    requestId: z.string(),
    status: z.number().int(),
    title: z.string(),
    type: z.string(),
  })
  .openapi("Problem");

export type Problem = z.infer<typeof problemSchema>;
