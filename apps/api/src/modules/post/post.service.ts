import type { Locale } from "@orkide/i18n";
import type {
  PostDetail,
  PostInput,
  PostRecord,
  PostSummary,
} from "@orkide/validators/content";

import { cached, invalidate } from "../../core/cache.ts";
import { ApiError } from "../../core/errors.ts";
import { decodeCursor, paginate } from "../../shared/cursor.ts";
import {
  pickTranslation,
  renderTranslations,
  toAlternates,
  toIso,
  toMedia,
  toTerm,
  toTerms,
} from "../../shared/documents.ts";
import * as repository from "./post.repository.ts";

type PublishedRow = Awaited<
  ReturnType<typeof repository.listPublished>
>[number];
type DetailRow = NonNullable<
  Awaited<ReturnType<typeof repository.findPublishedBySlug>>
>;
type AdminRow = NonNullable<Awaited<ReturnType<typeof repository.findById>>>;

const toSummary = (
  row: PublishedRow | DetailRow,
  locale: Locale
): PostSummary | null => {
  const translation = pickTranslation(row.translations, locale);
  if (!translation) {
    return null;
  }
  return {
    alternates: toAlternates(row.translations),
    category: row.category ? toTerm(row.category, locale) : null,
    cover: row.cover ? toMedia(row.cover, locale) : null,
    id: row.id,
    locale,
    publishedAt: toIso(row.publishedAt),
    readingTimeMinutes: translation.readingTimeMinutes,
    slug: translation.slug,
    summary: translation.summary,
    tags: toTerms(row.tags, locale),
    title: translation.title,
  };
};

const toRecord = (row: AdminRow): PostRecord => ({
  categoryId: row.categoryId,
  coverMediaId: row.coverMediaId,
  createdAt: row.createdAt.toISOString(),
  id: row.id,
  publishedAt: toIso(row.publishedAt),
  scheduledAt: toIso(row.scheduledAt),
  status: row.status,
  tagIds: row.tags.map((tag) => tag.id),
  translations: row.translations.map(
    ({ content, locale, seoDescription, seoTitle, slug, summary, title }) => ({
      content,
      locale,
      seoDescription,
      seoTitle,
      slug,
      summary,
      title,
    })
  ),
  updatedAt: row.updatedAt.toISOString(),
});

export interface ListParams {
  readonly locale: Locale;
  readonly limit: number;
  readonly cursor?: string;
  readonly category?: string;
  readonly tag?: string;
}

/** Published posts for readers. Cached per query until the next content change. */
export const listPublished = ({ cursor, ...params }: ListParams) =>
  cached("posts", `list:${JSON.stringify({ cursor, ...params })}`, async () => {
    const rows = await repository.listPublished({
      ...params,
      cursor: cursor === undefined ? undefined : decodeCursor(cursor),
    });
    const page = paginate(rows, params.limit);
    return {
      items: page.items
        .map((row) => toSummary(row, params.locale))
        .filter((item) => item !== null),
      nextCursor: page.nextCursor,
    };
  });

export const getPublished = (
  locale: Locale,
  slug: string
): Promise<PostDetail> =>
  cached("posts", `detail:${locale}:${slug}`, async () => {
    const row = await repository.findPublishedBySlug(locale, slug);
    const summary = row ? toSummary(row, locale) : null;
    const translation = row
      ? pickTranslation(row.translations, locale)
      : undefined;
    if (!(row && summary && translation)) {
      throw new ApiError("not_found");
    }
    return {
      ...summary,
      attachments: row.attachments.map((media) => toMedia(media, locale)),
      author: row.author,
      html: translation.html,
      seoDescription: translation.seoDescription,
      seoTitle: translation.seoTitle,
      updatedAt: translation.updatedAt.toISOString(),
    };
  });

export const listAll = async (): Promise<PostRecord[]> => {
  const rows = await repository.listAll();
  return rows.map(toRecord);
};

export const getById = async (id: string): Promise<PostRecord> => {
  const row = await repository.findById(id);
  if (!row) {
    throw new ApiError("not_found");
  }
  return toRecord(row);
};

/**
 * Normalizes publication fields: publishing stamps `publishedAt` once (re-saving keeps the
 * original date), scheduling keeps `scheduledAt`, and other states clear the schedule.
 */
const toWrite = (input: PostInput, previous?: PostRecord) => {
  const isPublished = input.status === "published";
  return {
    categoryId: input.categoryId ?? null,
    coverMediaId: input.coverMediaId ?? null,
    publishedAt: isPublished
      ? new Date(previous?.publishedAt ?? Date.now())
      : null,
    scheduledAt:
      input.status === "scheduled" ? (input.scheduledAt ?? null) : null,
    status: input.status ?? "draft",
    tagIds: input.tagIds,
    translations: renderTranslations(input.translations),
  };
};

export const create = async (
  input: PostInput,
  authorId: string
): Promise<PostRecord> => {
  const id = await repository.create({ ...toWrite(input), authorId });
  await invalidate("posts");
  return getById(id);
};

export const update = async (
  id: string,
  input: PostInput
): Promise<PostRecord> => {
  const previous = await getById(id);
  await repository.update(id, toWrite(input, previous));
  await invalidate("posts");
  return getById(id);
};

export const remove = async (id: string): Promise<void> => {
  if (!(await repository.remove(id))) {
    throw new ApiError("not_found");
  }
  await invalidate("posts");
};

/** Cron: publishes due scheduled posts and invalidates the public cache when anything changed. */
export const publishDue = async (now: Date): Promise<number> => {
  const published = await repository.publishDue(now);
  if (published > 0) {
    await invalidate("posts");
  }
  return published;
};
