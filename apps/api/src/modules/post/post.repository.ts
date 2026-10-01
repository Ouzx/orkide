import { db, generateId } from "@orkide/db";
import { post, postTag, postTranslation } from "@orkide/db/schema";
import type { Locale } from "@orkide/i18n";
import { eq } from "drizzle-orm";

import type { Cursor } from "../../shared/cursor.ts";
import type { renderTranslations } from "../../shared/documents.ts";

type RenderedTranslation = ReturnType<typeof renderTranslations>[number];

/** Localized term/media relations, loaded only in the requested locale. */
const localized = (locale: Locale) =>
  ({ translations: { where: { locale } } }) as const;

const publicRelations = (locale: Locale) =>
  ({
    category: { with: localized(locale) },
    cover: { with: localized(locale) },
    tags: { with: localized(locale) },
    translations: { columns: { content: false, html: false, markdown: false } },
  }) as const;

export interface ListPublishedParams {
  readonly locale: Locale;
  readonly limit: number;
  readonly cursor?: Cursor;
  readonly category?: string;
  readonly tag?: string;
}

/** Published posts available in `locale`, newest first, keyset-paginated (`limit + 1` rows). */
export const listPublished = ({
  locale,
  limit,
  cursor,
  category,
  tag,
}: ListPublishedParams) =>
  db.query.post.findMany({
    limit: limit + 1,
    // Callback form: precedence must not depend on object key order (which `sort-keys` rewrites).
    orderBy: (table, { desc }) => [desc(table.publishedAt), desc(table.id)],
    where: {
      status: "published",
      translations: { locale },
      ...(category
        ? { category: { translations: { locale, slug: category } } }
        : {}),
      ...(tag ? { tags: { translations: { locale, slug: tag } } } : {}),
      ...(cursor
        ? {
            OR: [
              { publishedAt: { lt: cursor.publishedAt } },
              {
                id: { lt: cursor.id },
                publishedAt: { eq: cursor.publishedAt },
              },
            ],
          }
        : {}),
    },
    with: publicRelations(locale),
  });

/** A published post by its localized slug, with everything a reader page needs. */
export const findPublishedBySlug = (locale: Locale, slug: string) =>
  db.query.post.findFirst({
    where: { status: "published", translations: { locale, slug } },
    with: {
      ...publicRelations(locale),
      attachments: { with: localized(locale) },
      author: { columns: { image: true, name: true } },
      translations: { columns: { content: false } },
    },
  });

/** Every post regardless of status, for the admin list. */
export const listAll = () =>
  db.query.post.findMany({
    orderBy: { updatedAt: "desc" },
    with: {
      tags: { columns: { id: true } },
      translations: { columns: { html: false, markdown: false } },
    },
  });

export const findById = (id: string) =>
  db.query.post.findFirst({
    where: { id },
    with: {
      tags: { columns: { id: true } },
      translations: { columns: { html: false, markdown: false } },
    },
  });

export interface PostWrite {
  readonly authorId?: string | null;
  readonly categoryId: string | null;
  readonly coverMediaId: string | null;
  readonly status: "draft" | "scheduled" | "published" | "archived";
  readonly scheduledAt: Date | null;
  readonly publishedAt: Date | null;
  readonly tagIds: readonly string[];
  readonly translations: readonly RenderedTranslation[];
}

const childRows = (postId: string, input: PostWrite) => ({
  tags: input.tagIds.map((tagId) => ({ postId, tagId })),
  translations: input.translations.map((translation) => ({
    ...translation,
    postId,
  })),
});

/**
 * Creates a post with its translations and tags in one atomic D1 batch
 * (D1 has no interactive transactions; a batch is a single implicit transaction).
 */
export const create = async (input: PostWrite): Promise<string> => {
  const id = generateId();
  const rows = childRows(id, input);
  await db.batch([
    db.insert(post).values({ ...input, id }),
    db.insert(postTranslation).values(rows.translations),
    ...(rows.tags.length > 0 ? [db.insert(postTag).values(rows.tags)] : []),
  ]);
  return id;
};

/** Replaces a post's fields, translations and tags atomically. */
export const update = async (id: string, input: PostWrite): Promise<void> => {
  const rows = childRows(id, input);
  const {
    authorId: _authorId,
    tagIds: _tagIds,
    translations: _translations,
    ...fields
  } = input;
  await db.batch([
    db.update(post).set(fields).where(eq(post.id, id)),
    db.delete(postTranslation).where(eq(postTranslation.postId, id)),
    db.insert(postTranslation).values(rows.translations),
    db.delete(postTag).where(eq(postTag.postId, id)),
    ...(rows.tags.length > 0 ? [db.insert(postTag).values(rows.tags)] : []),
  ]);
};

export const remove = async (id: string): Promise<boolean> => {
  const deleted = await db
    .delete(post)
    .where(eq(post.id, id))
    .returning({ id: post.id });
  return deleted.length > 0;
};

/** Publishes scheduled posts whose time has come. Returns how many were published. */
export const publishDue = async (now: Date): Promise<number> => {
  const due = await db.query.post.findMany({
    columns: { id: true, scheduledAt: true },
    where: { scheduledAt: { lte: now }, status: "scheduled" },
  });
  if (due.length === 0) {
    return 0;
  }
  const [first, ...rest] = due.map(({ id, scheduledAt }) =>
    db
      .update(post)
      .set({ publishedAt: scheduledAt ?? now, status: "published" })
      .where(eq(post.id, id))
  );
  if (first) {
    await db.batch([first, ...rest]);
  }
  return due.length;
};
