import { describe, expect, it } from "vitest";

import { emails } from "./index.ts";

const siteUrl = "https://orkide.test";

describe("contact emails", () => {
  it("escapes visitor-provided content", async () => {
    const email = await emails.contactNotification({
      body: "<img src=x onerror=alert(1)>",
      email: "ada@example.com",
      locale: "en",
      name: "<b>Ada</b>",
      senderLocale: "en",
      siteUrl,
      subject: null,
    });

    expect(email.html).not.toContain("<img src=x");
    expect(email.html).not.toContain("<b>Ada</b>");
    expect(email.html).toContain("mailto:ada@example.com");
  });
});
