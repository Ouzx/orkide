import { z } from "@hono/zod-openapi";

import { ApiError } from "../core/errors.ts";

/** Position of the last item of a page in a `(publishedAt DESC, id DESC)` ordering. */
const cursorSchema = z.tuple([z.number().int(), z.string().min(1)]);

export interface Cursor {
  readonly publishedAt: Date;
  readonly id: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Opaque, URL-safe keyset cursor. Clients must treat it as an unstructured token. */
export const encodeCursor = ({ publishedAt, id }: Cursor): string =>
  encoder
    .encode(JSON.stringify([publishedAt.getTime(), id]))
    .toBase64({ alphabet: "base64url", omitPadding: true });

export const decodeCursor = (token: string): Cursor => {
  try {
    const [time, id] = cursorSchema.parse(
      JSON.parse(
        decoder.decode(Uint8Array.fromBase64(token, { alphabet: "base64url" }))
      )
    );
    return { id, publishedAt: new Date(time) };
  } catch (error) {
    throw new ApiError("bad_request", {
      cause: error,
      detail: "Invalid cursor.",
    });
  }
};

/**
 * Splits a `limit + 1` result into a page and the cursor for the next one.
 * Fetching one extra row is how we know whether another page exists without a COUNT query.
 */
export const paginate = <T extends { id: string; publishedAt: Date | null }>(
  rows: readonly T[],
  limit: number
) => {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  const nextCursor =
    rows.length > limit && last?.publishedAt
      ? encodeCursor({ id: last.id, publishedAt: last.publishedAt })
      : null;
  return { items, nextCursor };
};
