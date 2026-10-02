import { env } from "cloudflare:workers";
import { describe, expect, it, vi } from "vitest";

import { ORIGIN, request, signInAs } from "../../../test/helpers.ts";
import { MAX_SOCKETS_PER_VISITOR } from "./live-visitors.ts";

/** Without the abort, a stream that never yields bytes would hang the suite instead of failing. */
const FIRST_CHUNK_TIMEOUT_MS = 3000;

const room = () => env.LIVE_VISITORS.get(env.LIVE_VISITORS.idFromName("site"));

const wsHeaders = (ip: string) => ({
  "cf-connecting-ip": ip,
  origin: ORIGIN,
  upgrade: "websocket",
});

/** Opens a presence socket as the visitor at `ip`. */
const join = async (ip: string) => {
  const response = await request("/api/live", { headers: wsHeaders(ip) });
  const socket = response.webSocket;
  if (!socket) {
    throw new Error(`Expected a WebSocket, got ${response.status}`);
  }
  socket.accept();
  return { socket, status: response.status };
};

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
    const response = await request("/api/live", {
      headers: { origin: ORIGIN },
    });

    expect(response.status).toBe(426);
  });

  it.each([
    ["another site", { origin: "https://evil.example" }],
    ["a client without an Origin", {}],
  ])("refuses sockets from %s", async (_, headers) => {
    const response = await request("/api/live", {
      headers: { ...headers, upgrade: "websocket" },
    });

    expect(response.status).toBe(403);
    expect(response.webSocket).toBeNull();
  });

  it("counts an open socket without sending it anything", async () => {
    const before = await room().count();
    const { socket } = await join("192.0.2.1");
    const messages: unknown[] = [];
    socket.addEventListener("message", (event) => messages.push(event.data));

    await expect(room().count()).resolves.toBe(before + 1);
    socket.close();
    await vi.waitFor(async () => {
      await expect(room().count()).resolves.toBe(before);
    });
    expect(messages).toStrictEqual([]);
  });

  it("caps the sockets one visitor can hold", async () => {
    const held = await Promise.all(
      Array.from({ length: MAX_SOCKETS_PER_VISITOR }, () => join("192.0.2.2"))
    );
    const extra = await request("/api/live", {
      headers: wsHeaders("192.0.2.2"),
    });
    const otherVisitor = await join("192.0.2.3");

    expect(held.map(({ status }) => status)).toStrictEqual(
      Array.from({ length: MAX_SOCKETS_PER_VISITOR }, () => 101)
    );
    expect(extra.status).toBe(429);
    expect(otherVisitor.status).toBe(101);
    for (const { socket } of [...held, otherVisitor]) {
      socket.close();
    }
  });
});
