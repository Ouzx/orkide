import { describe, expect, it } from "vitest";

import { serializeJsonLd } from "./json-ld.ts";

describe(serializeJsonLd, () => {
  const payload = "</script><img src=x onerror=alert(1)>";
  const serialized = serializeJsonLd({
    "@context": "https://schema.org",
    "@graph": [{ "@type": "Thing", name: payload }],
  });

  it("never lets content close the script element", () => {
    expect(serialized).not.toContain("<");
    expect(serialized).toContain("\\u003c/script>");
  });

  it("stays valid JSON that decodes to the original content", () => {
    expect(JSON.parse(serialized)["@graph"][0].name).toBe(payload);
  });
});
