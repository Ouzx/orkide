import { z } from "@hono/zod-openapi";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { Context, ErrorHandler, NotFoundHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

import type { AppEnv } from "./env.ts";

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
  "internal",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

const STATUS_BY_CODE = {
  bad_request: 400,
  conflict: 409,
  feature_disabled: 503,
  forbidden: 403,
  internal: 500,
  not_found: 404,
  payload_too_large: 413,
  rate_limited: 429,
  unauthorized: 401,
  unsupported_media_type: 415,
  validation_failed: 422,
} as const satisfies Record<ErrorCode, ContentfulStatusCode>;

/** Localized human-readable title for every error code. */
const TITLES = {
  bad_request: m.error_bad_request,
  conflict: m.error_conflict,
  feature_disabled: m.error_feature_disabled,
  forbidden: m.error_forbidden,
  internal: m.error_internal,
  not_found: m.error_not_found,
  payload_too_large: m.error_payload_too_large,
  rate_limited: m.error_rate_limited,
  unauthorized: m.error_unauthorized,
  unsupported_media_type: m.error_unsupported_media_type,
  validation_failed: m.error_validation,
} as const satisfies Record<
  ErrorCode,
  (inputs: Record<string, never>, options: { locale: Locale }) => string
>;

const titleFor = (code: ErrorCode, locale: Locale): string =>
  TITLES[code]({}, { locale });

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

/** Throw from any handler or service to produce a problem response. */
export class ApiError extends HTTPException {
  readonly code: ErrorCode;
  readonly issues: Problem["issues"];

  constructor(
    code: ErrorCode,
    options: {
      detail?: string;
      issues?: Problem["issues"];
      cause?: unknown;
    } = {}
  ) {
    super(STATUS_BY_CODE[code], {
      cause: options.cause,
      message: options.detail,
    });
    this.name = "ApiError";
    this.code = code;
    this.issues = options.issues;
  }
}

const problem = (
  c: Context<AppEnv>,
  code: ErrorCode,
  extra: Pick<Problem, "detail" | "issues"> = {}
) => {
  const status = STATUS_BY_CODE[code];
  const body: Problem = {
    code,
    instance: new URL(c.req.url).pathname,
    requestId: c.var.requestId,
    status,
    title: titleFor(code, c.var.language),
    type: `https://orkide.dev/problems/${code.replaceAll("_", "-")}`,
    ...extra,
  };
  return c.json(body, status, { "content-type": "application/problem+json" });
};

/** Converts a zod error into problem `issues`. */
export const toIssues = (error: z.ZodError): NonNullable<Problem["issues"]> =>
  error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.map((segment) =>
      typeof segment === "symbol" ? String(segment) : segment
    ),
  }));

const CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = Object.fromEntries(
  Object.entries(STATUS_BY_CODE).map(([code, status]) => [
    status,
    code as ErrorCode,
  ])
);

/** Walks an error's `cause` chain (Drizzle wraps driver errors) looking for a matching message. */
const causedBy = (error: unknown, pattern: RegExp): boolean => {
  let current: unknown = error;
  while (current instanceof Error) {
    if (pattern.test(current.message)) {
      return true;
    }
    current = current.cause;
  }
  return false;
};

const UNIQUE_VIOLATION = /UNIQUE constraint failed/u;

export const onError: ErrorHandler<AppEnv> = (error, c) => {
  if (error instanceof ApiError) {
    return problem(c, error.code, {
      detail: error.message || undefined,
      issues: error.issues,
    });
  }
  if (error instanceof HTTPException) {
    return problem(c, CODE_BY_STATUS[error.status] ?? "bad_request", {
      detail: error.message || undefined,
    });
  }
  if (causedBy(error, UNIQUE_VIOLATION)) {
    return problem(c, "conflict");
  }
  c.var.logger.error({ err: error }, "unhandled error");
  return problem(c, "internal");
};

export const onNotFound: NotFoundHandler<AppEnv> = (c) =>
  problem(c, "not_found");
