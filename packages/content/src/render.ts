import type { RichTextDocument } from "@orkide/db/rich-text";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { renderToMarkdown } from "@tiptap/static-renderer/pm/markdown";

import { contentExtensions } from "./extensions.ts";

/** Average adult silent reading speed for technical prose. */
const WORDS_PER_MINUTE = 220;

export interface RenderedDocument {
  readonly html: string;
  readonly markdown: string;
  readonly readingTimeMinutes: number;
}

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/** Rounded-up reading time, never below one minute. */
export const readingTime = (text: string): number =>
  Math.max(1, Math.ceil((text.match(WORD)?.length ?? 0) / WORDS_PER_MINUTE));

/**
 * Derives every stored representation of a document from its Tiptap JSON source of truth.
 * Pure and DOM-free: runs in Workers, Node and browsers alike.
 */
export const renderDocument = (
  document: RichTextDocument
): RenderedDocument => {
  const html = renderToHTMLString({
    content: document,
    extensions: contentExtensions,
  });
  const markdown = renderToMarkdown({
    content: document,
    extensions: contentExtensions,
  }).trim();
  return { html, markdown, readingTimeMinutes: readingTime(markdown) };
};
