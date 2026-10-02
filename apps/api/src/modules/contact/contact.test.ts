import {
  createExecutionContext,
  createMessageBatch,
  getQueueResult,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

import { jsonRequest, signInAs } from "../../../test/helpers.ts";
import { queue } from "../../queue.ts";

const submission = {
  body: "I would like to talk about an edge-first project.",
  email: "ada@example.com",
  locale: "tr",
  name: "Ada",
  turnstileToken: "token",
};

/** Routes outbound calls to fakes for Turnstile and Resend; everything else is unexpected. */
const mockProviders = ({ human = true, resendStatus = 200 } = {}) => {
  const sent: {
    body: Record<string, unknown>;
    idempotencyKey: string | null;
  }[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const request = new Request(input, init);
    if (request.url.startsWith("https://challenges.cloudflare.com/")) {
      return Response.json({ success: human });
    }
    if (request.url.startsWith("https://api.resend.com/emails")) {
      sent.push({
        body: await request.json(),
        idempotencyKey: request.headers.get("idempotency-key"),
      });
      return resendStatus === 200
        ? Response.json({ id: crypto.randomUUID() })
        : Response.json(
            {
              message: "Invalid `to` field.",
              name: "validation_error",
              statusCode: resendStatus,
            },
            { status: resendStatus }
          );
    }
    throw new Error(`Unexpected fetch: ${request.url}`);
  });
  return sent;
};

describe("contact submissions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the message and returns immediately", async () => {
    mockProviders();

    const response = await jsonRequest("/api/contact", "POST", submission);
    const { cookie } = await signInAs("owner");
    const inbox = await jsonRequest("/api/admin/messages", "GET", undefined, {
      cookie,
    });

    expect(response.status).toBe(202);
    await expect(inbox.json()).resolves.toMatchObject([
      { locale: "tr", name: "Ada", status: "new" },
    ]);
  });

  it("rejects submissions that fail human verification", async () => {
    mockProviders({ human: false });

    const response = await jsonRequest("/api/contact", "POST", submission);

    expect(response.status).toBe(403);
  });

  it("validates input with field-level issues", async () => {
    mockProviders();

    const response = await jsonRequest("/api/contact", "POST", {
      ...submission,
      body: "hi",
      email: "nope",
    });
    const problem = await response.json<{ issues: { path: string[] }[] }>();

    expect(response.status).toBe(422);
    expect(problem.issues.map((issue) => issue.path[0])).toStrictEqual(
      expect.arrayContaining(["body", "email"])
    );
  });

  it("answers 429 with Retry-After once the strict limit is hit", async () => {
    mockProviders();
    vi.spyOn(env.RATE_LIMIT_STRICT, "limit").mockResolvedValue({
      success: false,
    });

    const response = await jsonRequest("/api/contact", "POST", submission, {
      "cf-connecting-ip": "203.0.113.7",
    });

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json"
    );
  });

  it("throttles before it validates the body", async () => {
    vi.spyOn(env.RATE_LIMIT_STRICT, "limit").mockResolvedValue({
      success: false,
    });

    const response = await jsonRequest(
      "/api/contact",
      "POST",
      {},
      {
        "cf-connecting-ip": "203.0.113.7",
      }
    );

    expect(response.status).toBe(429);
  });

  it("does not throttle internal calls that carry no client IP", async () => {
    mockProviders();
    const limit = vi.spyOn(env.RATE_LIMIT_STRICT, "limit");

    const response = await jsonRequest("/api/contact", "POST", submission);

    expect(response.status).toBe(202);
    expect(limit).not.toHaveBeenCalled();
  });

  it("honours the contact-form kill switch with a 503 problem", async () => {
    mockProviders();
    vi.spyOn(env.FLAGS, "getBooleanValue").mockResolvedValue(false);

    const response = await jsonRequest("/api/contact", "POST", submission);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "feature_disabled",
    });
  });
});

const storedMessageId = async () => {
  const response = await jsonRequest("/api/contact", "POST", submission);
  const { id } = await response.json<{ id: string }>();
  return id;
};

describe("contact jobs", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emails the owner and the sender with stable idempotency keys", async () => {
    const sent = mockProviders();
    const messageId = await storedMessageId();
    const batch = createMessageBatch("orkide-jobs", [
      {
        attempts: 1,
        body: { messageId, type: "contact.notify-owner" },
        id: "1",
        timestamp: new Date(),
      },
      {
        attempts: 1,
        body: { messageId, type: "contact.acknowledge-sender" },
        id: "2",
        timestamp: new Date(),
      },
    ]);
    const context = createExecutionContext();

    await queue(batch, env, context);
    const result = await getQueueResult(batch, context);

    expect(result.explicitAcks).toStrictEqual(["1", "2"]);
    expect(sent.map((email) => email.idempotencyKey).toSorted()).toStrictEqual([
      `contact-ack/${messageId}`,
      `contact-notify/${messageId}`,
    ]);
    expect(
      sent.find((email) => email.body.to === "ada@example.com")?.body.subject
    ).toBe("Ulaştığın için teşekkürler, Ada");
  });

  it("acknowledges permanently rejected emails instead of retrying them", async () => {
    mockProviders({ resendStatus: 422 });
    const messageId = await storedMessageId();
    const batch = createMessageBatch("orkide-jobs", [
      {
        attempts: 1,
        body: { messageId, type: "contact.acknowledge-sender" },
        id: "1",
        timestamp: new Date(),
      },
      { attempts: 1, body: { nonsense: true }, id: "2", timestamp: new Date() },
    ]);
    const context = createExecutionContext();

    await queue(batch, env, context);
    const result = await getQueueResult(batch, context);

    expect(result.explicitAcks).toStrictEqual(["1", "2"]);
    expect(result.retryMessages).toStrictEqual([]);
  });
});

describe("inbox RBAC", () => {
  it("forbids viewers and editors from reading or updating messages", async () => {
    const statuses: number[] = [];
    for (const role of ["viewer", "editor"] as const) {
      // oxlint-disable-next-line no-await-in-loop -- sequential sessions keep the order stable.
      const { cookie } = await signInAs(role);
      // oxlint-disable-next-line no-await-in-loop -- see above.
      const read = await jsonRequest("/api/admin/messages", "GET", undefined, {
        cookie,
      });
      // oxlint-disable-next-line no-await-in-loop -- see above.
      const update = await jsonRequest(
        `/api/admin/messages/${crypto.randomUUID()}`,
        "PATCH",
        { status: "read" },
        { cookie }
      );
      statuses.push(read.status, update.status);
    }

    expect(statuses).toStrictEqual([403, 403, 403, 403]);
  });
});
