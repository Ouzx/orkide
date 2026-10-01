/** Document pages that have a Markdown alternate at `<path>.md`. */
const DOCUMENT_PATH = /^\/(?:blog|portfolio)\/[\da-z-]+$/u;

/** Whether the client prefers Markdown over HTML (e.g. an AI agent sending `Accept: text/markdown`). */
const prefersMarkdown = (accept: string | null): boolean => {
  if (!accept?.includes("text/markdown")) {
    return false;
  }
  const quality = (type: string) => {
    const entry = accept
      .split(",")
      .map((part) => part.trim().split(";"))
      .find(([mediaType]) => mediaType?.trim() === type);
    if (!entry) {
      return 0;
    }
    const q = entry.find((parameter) => parameter.trim().startsWith("q="));
    return q ? Number(q.trim().slice(2)) : 1;
  };
  return quality("text/markdown") >= quality("text/html");
};

/**
 * Content negotiation for document pages: returns the request rewritten to the Markdown alternate
 * when the client prefers `text/markdown`, otherwise `undefined`.
 */
export const markdownAlternate = (request: Request): Request | undefined => {
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    !DOCUMENT_PATH.test(url.pathname) ||
    !prefersMarkdown(request.headers.get("accept"))
  ) {
    return undefined;
  }
  url.pathname = `${url.pathname}.md`;
  return new Request(url, request);
};

interface MarkdownDocument {
  readonly title: string;
  readonly summary: string;
  readonly markdown: string;
  readonly publishedAt: string | null;
  readonly updatedAt: string;
}

/**
 * A document as a self-contained Markdown file: title, summary, provenance, then the body.
 * `canonical` points agents back to the HTML page (also sent as a `Link` header).
 */
export const markdownResponse = (
  document: MarkdownDocument,
  canonical: string
): Response => {
  const provenance = [
    `Source: ${canonical}`,
    document.publishedAt && `Published: ${document.publishedAt}`,
    `Updated: ${document.updatedAt}`,
  ]
    .filter(Boolean)
    .join("  \n");
  const body = `# ${document.title}\n\n> ${document.summary}\n\n${provenance}\n\n---\n\n${document.markdown.trim()}\n`;
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      link: `<${canonical}>; rel="canonical"`,
      vary: "accept",
      "x-robots-tag": "noindex",
    },
  });
};

const MARKDOWN_SUFFIX = ".md";

/** Splits a document route param into the slug and whether the Markdown variant was requested. */
export const parseDocumentParam = (
  param = ""
): { slug: string; markdown: boolean } => {
  const markdown = param.endsWith(MARKDOWN_SUFFIX);
  return {
    markdown,
    slug: markdown ? param.slice(0, -MARKDOWN_SUFFIX.length) : param,
  };
};
