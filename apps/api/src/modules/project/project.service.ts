import type { Locale } from "@orkide/i18n";
import type {
  ProjectDetail,
  ProjectInput,
  ProjectRecord,
  ProjectSummary,
} from "@orkide/validators/content";

import { purge } from "../../core/cache.ts";
import { ApiError } from "../../core/errors.ts";
import {
  pickTranslation,
  renderTranslations,
  toAlternates,
  toIso,
  toMedia,
  toTerms,
} from "../../shared/documents.ts";
import * as repository from "./project.repository.ts";

type ListRow = Awaited<ReturnType<typeof repository.listPublished>>[number];
type DetailRow = NonNullable<
  Awaited<ReturnType<typeof repository.findPublishedBySlug>>
>;
type AdminRow = NonNullable<Awaited<ReturnType<typeof repository.findById>>>;

const toSummary = (
  row: ListRow | DetailRow,
  locale: Locale
): ProjectSummary | null => {
  const translation = pickTranslation(row.translations, locale);
  if (!translation) {
    return null;
  }
  return {
    alternates: toAlternates(row.translations),
    cover: row.cover ? toMedia(row.cover, locale) : null,
    featured: row.featured,
    id: row.id,
    locale,
    publishedAt: toIso(row.publishedAt),
    readingTimeMinutes: translation.readingTimeMinutes,
    repositoryUrl: row.repositoryUrl,
    slug: translation.slug,
    summary: translation.summary,
    tags: toTerms(row.tags, locale),
    title: translation.title,
    websiteUrl: row.websiteUrl,
  };
};

const toRecord = (row: AdminRow): ProjectRecord => ({
  completedAt: toIso(row.completedAt),
  coverMediaId: row.coverMediaId,
  createdAt: row.createdAt.toISOString(),
  featured: row.featured,
  id: row.id,
  position: row.position,
  publishedAt: toIso(row.publishedAt),
  repositoryUrl: row.repositoryUrl,
  scheduledAt: toIso(row.scheduledAt),
  startedAt: toIso(row.startedAt),
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
  websiteUrl: row.websiteUrl,
});

/** The portfolio is small and curated, so it is served as one ordered list. */
export const listPublished = async (locale: Locale) => {
  const rows = await repository.listPublished(locale);
  return rows
    .map((row) => toSummary(row, locale))
    .filter((item) => item !== null);
};

export const getPublished = async (
  locale: Locale,
  slug: string
): Promise<ProjectDetail> => {
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
    completedAt: toIso(row.completedAt),
    html: translation.html,
    markdown: translation.markdown,
    seoDescription: translation.seoDescription,
    seoTitle: translation.seoTitle,
    startedAt: toIso(row.startedAt),
    updatedAt: translation.updatedAt.toISOString(),
  };
};

export const listAll = async (): Promise<ProjectRecord[]> => {
  const rows = await repository.listAll();
  return rows.map(toRecord);
};

export const getById = async (id: string): Promise<ProjectRecord> => {
  const row = await repository.findById(id);
  if (!row) {
    throw new ApiError("not_found");
  }
  return toRecord(row);
};

const toWrite = (
  input: ProjectInput,
  previous?: ProjectRecord
): repository.ProjectWrite => ({
  completedAt: input.completedAt ?? null,
  coverMediaId: input.coverMediaId ?? null,
  featured: input.featured ?? false,
  position: input.position ?? 0,
  publishedAt:
    input.status === "published"
      ? new Date(previous?.publishedAt ?? Date.now())
      : null,
  repositoryUrl: input.repositoryUrl ?? null,
  scheduledAt:
    input.status === "scheduled" ? (input.scheduledAt ?? null) : null,
  startedAt: input.startedAt ?? null,
  status: input.status ?? "draft",
  tagIds: input.tagIds,
  translations: renderTranslations(input.translations),
  websiteUrl: input.websiteUrl ?? null,
});

export const create = async (input: ProjectInput): Promise<ProjectRecord> => {
  const id = await repository.create(toWrite(input));
  await purge("projects");
  return getById(id);
};

export const update = async (
  id: string,
  input: ProjectInput
): Promise<ProjectRecord> => {
  const previous = await getById(id);
  await repository.update(id, toWrite(input, previous));
  await purge("projects");
  return getById(id);
};

export const remove = async (id: string): Promise<void> => {
  if (!(await repository.remove(id))) {
    throw new ApiError("not_found");
  }
  await purge("projects");
};

export const publishDue = async (now: Date): Promise<number> => {
  const published = await repository.publishDue(now);
  if (published > 0) {
    await purge("projects");
  }
  return published;
};
