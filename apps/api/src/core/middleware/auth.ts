import { auth, roles } from "@orkide/auth";
import type { Permissions, Role } from "@orkide/auth";

import { ApiError } from "../errors.ts";
import { factory } from "../factory.ts";

/** Resolves the Better Auth session (cookie cache first, then D1) into `c.var.user`/`session`. */
export const session = factory.createMiddleware(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
});

const isRole = (value: unknown): value is Role =>
  typeof value === "string" && value in roles;

/**
 * Guards a route with RBAC. Permissions are checked in-process against the role definitions
 * from `@orkide/auth`, so authorization costs no extra database round-trip.
 */
export const requirePermission = (permissions: Permissions) =>
  factory.createMiddleware(async (c, next) => {
    const { user } = c.var;
    if (!user) {
      throw new ApiError("unauthorized");
    }
    if (
      !isRole(user.role) ||
      !roles[user.role].authorize(permissions).success
    ) {
      throw new ApiError("forbidden");
    }
    await next();
  });
