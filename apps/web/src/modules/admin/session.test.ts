import { describe, expect, it, vi } from "vitest";

import { resolveAdminSession } from "./session.ts";

type SessionFetcher = Parameters<typeof resolveAdminSession>[1];

const request = new Request("https://orkide.dev/admin", {
  headers: { cookie: "session=abc" },
});
const limited = (retryAfter?: string): Response =>
  new Response(null, {
    headers: retryAfter ? { "retry-after": retryAfter } : {},
    status: 429,
  });
const owner = (): Response =>
  Response.json({
    user: { email: "a@b.c", id: "u1", image: null, name: "A", role: "owner" },
  });

describe("admin session", () => {
  it("is anonymous without a cookie and never calls the API", async () => {
    const fetcher = vi.fn<SessionFetcher>();
    const session = await resolveAdminSession(
      new Request("https://orkide.dev/admin"),
      fetcher
    );
    expect(session).toStrictEqual({ status: "anonymous" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("is anonymous on a real 401 and on a null session", async () => {
    const unauthorized = await resolveAdminSession(request, () =>
      Promise.resolve(new Response(null, { status: 401 }))
    );
    const empty = await resolveAdminSession(request, () =>
      Promise.resolve(Response.json(null))
    );
    expect(unauthorized.status).toBe("anonymous");
    expect(empty.status).toBe("anonymous");
  });

  it("quietly retries a 429 and resolves the user", async () => {
    const fetcher = vi
      .fn<SessionFetcher>()
      .mockResolvedValueOnce(limited("0"))
      .mockResolvedValueOnce(owner());
    const session = await resolveAdminSession(request, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(session.status).toBe("ok");
  });

  it("reports rate-limited with Retry-After after exhausting retries", async () => {
    const fetcher = vi.fn<SessionFetcher>().mockResolvedValue(limited("7"));
    vi.useFakeTimers();
    const pending = resolveAdminSession(request, fetcher);
    await vi.runAllTimersAsync();
    const session = await pending;
    vi.useRealTimers();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(session).toStrictEqual({ retryAfter: 7, status: "rate-limited" });
  });
});
