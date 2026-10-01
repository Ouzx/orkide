import { describe, expect, it } from "vitest";

import { ORIGIN, request, signInAs } from "../../../test/helpers.ts";

/** A valid 1×1 PNG. */
const PNG = Uint8Array.fromBase64(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
);
const PDF = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n"
);

const uploadFile = (
  cookie: string,
  bytes: NonNullable<ConstructorParameters<typeof File>[0]>[number],
  type: string,
  name: string,
  extra: Record<string, string> = {}
) => {
  const form = new FormData();
  form.set("file", new File([bytes], name, { type }));
  for (const [key, value] of Object.entries(extra)) {
    form.set(key, value);
  }
  return request("/api/admin/media", {
    body: form,
    headers: { cookie, origin: ORIGIN },
    method: "POST",
  });
};

describe("media uploads", () => {
  it("stores images with dimensions, a placeholder and localized alt text", async () => {
    const { cookie } = await signInAs("editor");
    const translations = JSON.stringify([
      { alt: "A single pixel", locale: "en" },
    ]);

    const response = await uploadFile(cookie, PNG, "image/png", "pixel.png", {
      translations,
    });
    const media = await response.json<{
      url: string;
      width: number;
      placeholder: string;
      alt: string;
    }>();

    expect(response.status).toBe(201);
    expect(media).toMatchObject({
      alt: "A single pixel",
      height: 1,
      mimeType: "image/png",
      width: 1,
    });
    expect(media.url).toMatch(/^\/api\/media\/[\da-f]{64}\.png$/u);
    expect(media.placeholder).toMatch(/^data:image\/webp;base64,/u);
  });

  it("deduplicates identical uploads by content hash", async () => {
    const { cookie } = await signInAs("owner");
    const first = await uploadFile(cookie, PNG, "image/png", "a.png");
    const second = await uploadFile(cookie, PNG, "image/png", "renamed.png");

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject(await first.json());
  });

  it("trusts magic bytes, not the declared content type", async () => {
    const { cookie } = await signInAs("owner");
    const disguised = new TextEncoder().encode(
      "<html><script>alert(1)</script></html>"
    );

    const response = await uploadFile(
      cookie,
      disguised,
      "image/png",
      "innocent.png"
    );

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toMatchObject({
      code: "unsupported_media_type",
    });
  });

  it("requires the upload permission", async () => {
    const { cookie } = await signInAs("viewer");

    const response = await uploadFile(cookie, PNG, "image/png", "pixel.png");

    expect(response.status).toBe(403);
  });
});

describe("media delivery", () => {
  it("streams documents with byte-range support", async () => {
    const { cookie } = await signInAs("owner");
    const uploaded = await uploadFile(
      cookie,
      PDF,
      "application/pdf",
      "doc.pdf"
    );
    const { url } = await uploaded.json<{ url: string }>();

    const partial = await request(url, { headers: { range: "bytes=0-7" } });

    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe(
      `bytes 0-7/${PDF.byteLength}`
    );
    expect(partial.headers.get("cache-control")).toContain("immutable");
    await expect(partial.text()).resolves.toBe("%PDF-1.4");
  });

  it("rejects anything that is not a content-addressed object name", async () => {
    const traversal = await request("/api/media/..%2F..%2Fsecret.txt");
    const missing = await request(`/api/media/${"0".repeat(64)}.png`);

    expect(traversal.status).toBe(422);
    expect(missing.status).toBe(404);
  });
});
