import {
  createExecutionContext,
  createScheduledController,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getJson,
  jsonRequest,
  request,
  signInAs,
} from "../../../test/helpers.ts";
import { CRONS, scheduled } from "../../scheduled.ts";
import { rollup } from "./stats.service.ts";

/** A fresh SQL API response per call: a Response body can only be read once. */
const analyticsResponse = () =>
  Promise.resolve(
    Response.json({ data: [{ path: "/en", views: "42", visitors: "17" }] })
  );

const vitalsResponse = () =>
  Promise.resolve(
    Response.json({ data: [{ name: "LCP", p75: "1800.5", samples: "9" }] })
  );

const deniedResponse = () =>
  Promise.resolve(new Response("denied", { status: 403 }));

const runCron = async (cron: string, at: Date) => {
  const controller = createScheduledController({
    cron,
    scheduledTime: at.getTime(),
  });
  await scheduled(controller, env, createExecutionContext());
};

describe("tracking beacon", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("records page views from real browsers and ignores bots", async () => {
    const write = vi.spyOn(env.ANALYTICS, "writeDataPoint");
    const event = {
      locale: "en",
      path: "/en/blog",
      referrer: "https://news.ycombinator.com/item?id=1",
      type: "pageview",
    };

    const human = await jsonRequest("/api/track", "POST", event, {
      "user-agent": "Mozilla/5.0 Firefox/140.0",
    });
    const bot = await jsonRequest("/api/track", "POST", event, {
      "user-agent": "Googlebot/2.1",
    });

    expect([human.status, bot.status]).toStrictEqual([204, 204]);
    expect(write).toHaveBeenCalledOnce();
    expect(write.mock.calls[0]?.[0]?.blobs?.slice(0, 4)).toStrictEqual([
      "pageview",
      "/en/blog",
      "en",
      "news.ycombinator.com",
    ]);
  });
});

describe("daily rollup", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is idempotent and feeds the dashboard overview", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(analyticsResponse);
    const day = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    await rollup(day);
    await rollup(day);
    const { cookie } = await signInAs("viewer");
    const overview = await request("/api/admin/stats?days=7", {
      headers: { cookie },
    });

    await expect(overview.json()).resolves.toMatchObject({
      topPaths: [{ path: "/en", views: 42 }],
      totals: { views: 42, visitors: 17 },
    });
  });
});

describe("web vitals without or with analytics credentials", () => {
  const configuredToken = env.ANALYTICS_API_TOKEN;

  afterEach(() => {
    env.ANALYTICS_API_TOKEN = configuredToken;
    vi.restoreAllMocks();
  });

  it("returns an empty list, without calling upstream, when not configured", async () => {
    env.ANALYTICS_API_TOKEN = "";
    const upstream = vi.spyOn(globalThis, "fetch");
    const { cookie } = await signInAs("viewer");

    const response = await request("/api/admin/stats/vitals?days=30", {
      headers: { cookie },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual([]);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("skips the daily rollup cleanly when not configured", async () => {
    env.ANALYTICS_API_TOKEN = "  ";
    const upstream = vi.spyOn(globalThis, "fetch");

    await expect(rollup("2026-01-01")).resolves.toBe(0);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("serves p75 values when configured", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(vitalsResponse);
    const { cookie } = await signInAs("viewer");

    const response = await request("/api/admin/stats/vitals?days=30", {
      headers: { cookie },
    });

    await expect(response.json()).resolves.toStrictEqual([
      { name: "LCP", p75: 1800.5, samples: 9 },
    ]);
  });

  it("surfaces a real upstream failure as a problem response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(deniedResponse);
    const { cookie } = await signInAs("viewer");

    const response = await request("/api/admin/stats/vitals?days=30", {
      headers: { cookie },
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: "upstream_unavailable",
    });
  });
});

describe("scheduled publishing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes posts whose schedule has passed", async () => {
    const { cookie } = await signInAs("owner");
    const scheduledAt = new Date(Date.now() + 60_000);
    await jsonRequest(
      "/api/admin/posts",
      "POST",
      {
        scheduledAt: scheduledAt.toISOString(),
        status: "scheduled",
        translations: [
          {
            content: {
              content: [
                {
                  content: [{ text: "Soon", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "doc",
            },
            locale: "en",
            slug: "from-the-future",
            summary: "S",
            title: "From the future",
          },
        ],
      },
      { cookie }
    );

    const before = await getJson<{ items: unknown[] }>("/api/posts?locale=en");
    await runCron(
      CRONS.publishScheduled,
      new Date(scheduledAt.getTime() + 1000)
    );
    const after = await getJson<{
      items: { slug: string; publishedAt: string }[];
    }>("/api/posts?locale=en");

    expect(before.items).toHaveLength(0);
    expect(after.items).toMatchObject([
      { publishedAt: scheduledAt.toISOString(), slug: "from-the-future" },
    ]);
  });
});
