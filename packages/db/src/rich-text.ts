import { z } from "zod";

/** A ProseMirror text mark (bold, link, code…) as produced by Tiptap. */
export const richTextMarkSchema = z.object({
  attrs: z.record(z.string(), z.unknown()).optional(),
  type: z.string().min(1),
});

/** A ProseMirror node: the recursive building block of a Tiptap document. */
export const richTextNodeSchema = z.object({
  attrs: z.record(z.string(), z.unknown()).optional(),
  get content() {
    return z.array(richTextNodeSchema).optional();
  },
  marks: z.array(richTextMarkSchema).optional(),
  text: z.string().optional(),
  type: z.string().min(1),
});

/** Root of a Tiptap document — the lossless source of truth for rich content. */
export const richTextDocumentSchema = z.object({
  content: z.array(richTextNodeSchema),
  type: z.literal("doc"),
});

export type RichTextDocument = z.infer<typeof richTextDocumentSchema>;
