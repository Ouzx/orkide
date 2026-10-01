import { describe, expect, it, vi } from "vitest";

import { request, signInAs } from "../../../test/helpers.ts";

/** Without the abort, a stream that never yields bytes would hang the suite instead of failing. */
const FIRST_CHUNK_TIMEOUT_MS = 3000;

describe("live feed", () => {
  it("streams a presence event to signed-in admins", async () => {
    const { cookie } = await signInAs("viewer");

    const response = await request("/api/live/feed", {
      headers: { cookie },
      signal: AbortSignal.timeout(FIRST_CHUNK_TIMEOUT_MS),
    });
    const reader = response.body?.getReader();
    const chunk = await reader?.read();
    await reader?.cancel();

    expect({
      contentType: response.headers.get("content-type"),
      status: response.status,
    }).toStrictEqual({ contentType: "text/event-stream", status: 200 });
    expect(new TextDecoder().decode(chunk?.value)).toContain("event: presence");
  });

  it("rejects anonymous visitors", async () => {
    const response = await request("/api/live/feed");

    expect(response.status).toBe(401);
  });

  it("requires a WebSocket upgrade on the public room", async () => {
    const response = await request("/api/live");

    expect(response.status).toBe(426);
  });

  it("upgrades to a WebSocket that reports presence", async () => {
    const response = await request("/api/live", {
      headers: { upgrade: "websocket" },
    });
    const socket = response.webSocket;
    const messages: string[] = [];
    socket?.addEventListener("message", (event) => {
      messages.push(String(event.data));
    });
    socket?.accept();
    await vi.waitFor(() => expect(messages).toHaveLength(1));
    socket?.close();

    expect(response.status).toBe(101);
    expect(JSON.parse(messages[0] ?? "null")).toStrictEqual({
      type: "presence",
      visitors: 1,
    });
  });
});
