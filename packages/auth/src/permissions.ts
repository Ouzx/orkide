import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/** Content resources and every action that can be performed on them. */
const contentStatements = {
  media: ["read", "upload", "update", "delete"],
  message: ["read", "update", "delete"],
  post: ["read", "create", "update", "publish", "delete"],
  project: ["read", "create", "update", "publish", "delete"],
  stats: ["read"],
  taxonomy: ["read", "create", "update", "delete"],
} as const;

/**
 * Single source of truth for RBAC: Better Auth's user/session statements plus content resources.
 * Roles and route guards are derived from it.
 */
export const statements = {
  ...defaultStatements,
  ...contentStatements,
} as const;

export const ac = createAccessControl(statements);

/** Full control, including user management. */
export const owner = ac.newRole({
  ...adminAc.statements,
  ...contentStatements,
});

/** Manages content end-to-end, but not users or the inbox. */
export const editor = ac.newRole({
  media: ["read", "upload", "update"],
  post: ["read", "create", "update", "publish"],
  project: ["read", "create", "update", "publish"],
  stats: ["read"],
  taxonomy: ["read", "create", "update"],
});

/** Read-only access to the dashboard. */
export const viewer = ac.newRole({
  media: ["read"],
  post: ["read"],
  project: ["read"],
  stats: ["read"],
  taxonomy: ["read"],
});

export const roles = { editor, owner, viewer } as const;

export type Role = keyof typeof roles;

/** A permission request: resources mapped to the actions required on them. */
export type Permissions = {
  readonly [
    Resource in keyof typeof statements
  ]?: readonly (typeof statements)[Resource][number][];
};

export const isRole = (value: unknown): value is Role =>
  typeof value === "string" && Object.hasOwn(roles, value);

/** Whether `role` grants every permission in `permissions` (pure, no I/O — server and client). */
export const hasPermission = (role: Role, permissions: Permissions): boolean =>
  roles[role].authorize(permissions).success;
