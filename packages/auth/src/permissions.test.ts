import { describe, expect, it } from "vitest";

import { roles } from "./permissions.ts";

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
