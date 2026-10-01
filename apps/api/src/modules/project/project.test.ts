import { describe, expect, it } from "vitest";

import {
  jsonRequest,
  ORIGIN,
  request,
  signInAs,
} from "../../../test/helpers.ts";

describe("project admin RBAC", () => {
  it("forbids viewers from creating, updating or deleting projects", async () => {
    const { cookie } = await signInAs("viewer");
    const id = crypto.randomUUID();

    const create = await jsonRequest(
      "/api/admin/projects",
      "POST",
      {},
      { cookie }
    );
    const update = await jsonRequest(
      `/api/admin/projects/${id}`,
      "PUT",
      {},
      { cookie }
    );
    const remove = await request(`/api/admin/projects/${id}`, {
      headers: { cookie, origin: ORIGIN },
      method: "DELETE",
    });

    expect([create.status, update.status, remove.status]).toStrictEqual([
      403, 403, 403,
    ]);
  });
});
