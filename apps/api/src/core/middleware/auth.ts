import { auth, hasPermission, isRole } from "@orkide/auth";
import type { Permissions } from "@orkide/auth";

import type { AppVariables } from "../env.ts";
import { ApiError } from "../errors.ts";
import { factory } from "../factory.ts";

/** Resolves the Better Auth session (cookie cache first, then D1) into `c.var.user`/`session`. */
export const session = factory.createMiddleware(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", result?.user ?? null);
  c.set("session", result?.session ?? null);
  await next();
});

type User = NonNullable<AppVariables["user"]>;

/** Asserts that `user` holds every permission; throws `unauthorized`/`forbidden` otherwise. */
export const assertPermission: (
  user: AppVariables["user"],
  permissions: Permissions
) => asserts user is User = (user, permissions) => {
  if (!user) {
    throw new ApiError("unauthorized");
  }
  if (!(isRole(user.role) && hasPermission(user.role, permissions))) {
    throw new ApiError("forbidden");
  }
};

/**
 * Guards a route with RBAC. Permissions are checked in-process against the role definitions
 * from `@orkide/auth`, so authorization costs no extra database round-trip.
 */
export const requirePermission = (permissions: Permissions) =>
  factory.createMiddleware(async (c, next) => {
    assertPermission(c.var.user, permissions);
    await next();
  });
