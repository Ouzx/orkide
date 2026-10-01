import { describe, expect, it } from "vitest";

import { hasPermission, isRole, roles } from "./permissions.ts";

describe("rbac roles", () => {
  it("lets owners manage users and every content resource", () => {
    const { success } = roles.owner.authorize({
      message: ["delete"],
      post: ["publish", "delete"],
      user: ["create", "ban", "set-role"],
    });

    expect(success).toBeTruthy();
  });

  it("lets editors publish content but not manage users or the inbox", () => {
    expect(
      roles.editor.authorize({ post: ["create", "publish"] }).success
    ).toBeTruthy();
    expect(roles.editor.authorize({ post: ["delete"] }).success).toBeFalsy();
    expect(roles.editor.authorize({ message: ["read"] }).success).toBeFalsy();
    expect(roles.editor.authorize({ user: ["create"] }).success).toBeFalsy();
  });

  it("limits viewers to read-only access", () => {
    expect(
      roles.viewer.authorize({ post: ["read"], stats: ["read"] }).success
    ).toBeTruthy();
    expect(roles.viewer.authorize({ media: ["upload"] }).success).toBeFalsy();
  });
});

describe(hasPermission, () => {
  it("grants owners everything, including the inbox", () => {
    expect(hasPermission("owner", { message: ["delete"] })).toBeTruthy();
    expect(
      hasPermission("owner", { post: ["publish", "delete"] })
    ).toBeTruthy();
  });

  it("grants editors content writes but denies deletes and the inbox", () => {
    expect(
      hasPermission("editor", { media: ["upload", "update"] })
    ).toBeTruthy();
    expect(hasPermission("editor", { taxonomy: ["delete"] })).toBeFalsy();
    expect(hasPermission("editor", { message: ["read"] })).toBeFalsy();
  });

  it("grants viewers reads only", () => {
    expect(
      hasPermission("viewer", { stats: ["read"], taxonomy: ["read"] })
    ).toBeTruthy();
    expect(hasPermission("viewer", { post: ["create"] })).toBeFalsy();
    expect(hasPermission("viewer", { project: ["update"] })).toBeFalsy();
  });

  it("requires every requested action, not just one", () => {
    expect(hasPermission("viewer", { post: ["read", "update"] })).toBeFalsy();
  });
});

describe(isRole, () => {
  it("accepts the known roles", () => {
    expect(
      ["owner", "editor", "viewer"].every((role) => isRole(role))
    ).toBeTruthy();
  });

  it("rejects unknown strings, prototype keys and non-strings", () => {
    const rejected = [
      "admin",
      "",
      "Owner",
      "toString",
      "__proto__",
      "constructor",
      1,
      null,
      undefined,
    ];

    expect(rejected.some((value) => isRole(value))).toBeFalsy();
  });
});
