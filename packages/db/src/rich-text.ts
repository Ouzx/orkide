import { z } from "zod";

/** A ProseMirror text mark (bold, link, code…) as produced by Tiptap. */
export const richTextMarkSchema = z.object({
  attrs: z.record(z.string(), z.unknown()).optional(),
  type: z.string().min(1),
});

/** Non-recursive fields of a ProseMirror node. */
const richTextNodeBaseSchema = z.object({
  attrs: z.record(z.string(), z.unknown()).optional(),
  marks: z.array(richTextMarkSchema).optional(),
  text: z.string().optional(),
  type: z.string().min(1),
});

/** A node is its base fields plus optional child nodes (the only part TypeScript cannot infer). */
export type RichTextNode = z.infer<typeof richTextNodeBaseSchema> & {
  content?: RichTextNode[];
};

/**
 * The recursive edge of a Tiptap document. Recursion goes through this single `z.lazy` instance so
 * schema generators can name it (the API registers it as the `RichTextNode` OpenAPI component) and
 * emit a `$ref` instead of expanding the tree forever.
 */
export const richTextNodeReference: z.ZodType<RichTextNode> = z.lazy(
  // oxlint-disable-next-line no-use-before-define -- resolved lazily, after both schemas exist.
  () => richTextNodeSchema
);

/** A ProseMirror node: the recursive building block of a Tiptap document. */
export const richTextNodeSchema = richTextNodeBaseSchema.extend({
  content: z.array(richTextNodeReference).optional(),
});

/** Root of a Tiptap document — the lossless source of truth for rich content. */
export const richTextDocumentSchema = z.object({
  content: z.array(richTextNodeReference),
  type: z.literal("doc"),
});

export type RichTextDocument = z.infer<typeof richTextDocumentSchema>;
