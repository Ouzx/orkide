import { db, generateId } from "@orkide/db";
import { project, projectTag, projectTranslation } from "@orkide/db/schema";
import type { Locale } from "@orkide/i18n";
import { and, eq, lte, sql } from "drizzle-orm";

import type { renderTranslations } from "../../shared/documents.ts";

type RenderedTranslation = ReturnType<typeof renderTranslations>[number];

const localized = (locale: Locale) =>
  ({ translations: { where: { locale } } }) as const;

const publicRelations = (locale: Locale) =>
  ({
    cover: { with: localized(locale) },
    tags: { with: localized(locale) },
    translations: { columns: { content: false, html: false, markdown: false } },
  }) as const;

/** Published projects in `locale`: featured first, then curated position, then newest. */
export const listPublished = (locale: Locale) =>
  db.query.project.findMany({
    orderBy: (table, { asc, desc }) => [
      desc(table.featured),
      asc(table.position),
      desc(table.publishedAt),
    ],
    where: { status: "published", translations: { locale } },
    with: publicRelations(locale),
  });

/** A published project by its localized slug; the body is read for that translation only. */
export const findPublishedBySlug = async (locale: Locale, slug: string) => {
  const [row, body] = await db.batch([
    db.query.project.findFirst({
      where: { status: "published", translations: { locale, slug } },
      with: publicRelations(locale),
    }),
    db.query.projectTranslation.findFirst({
      columns: { html: true, markdown: true },
      where: { locale, slug },
    }),
  ]);
  return row && body ? { ...row, body } : undefined;
};

const adminRelations = {
  tags: { columns: { id: true } },
  translations: { columns: { html: false, markdown: false } },
} as const;

export const listAll = () =>
  db.query.project.findMany({
    orderBy: (table, { asc, desc }) => [
      asc(table.position),
      desc(table.updatedAt),
    ],
    with: adminRelations,
  });

export const findById = (id: string) =>
  db.query.project.findFirst({ where: { id }, with: adminRelations });

export type ProjectWrite = Required<
  Omit<typeof project.$inferInsert, "id" | "createdAt" | "updatedAt">
> & {
  readonly tagIds: readonly string[];
  readonly translations: readonly RenderedTranslation[];
};

const split = (
  projectId: string,
  { tagIds, translations, ...fields }: ProjectWrite
) => ({
  fields,
  tags: tagIds.map((tagId) => ({ projectId, tagId })),
  translations: translations.map((translation) => ({
    ...translation,
    projectId,
  })),
});

/** Creates a project with its translations and tags in one atomic D1 batch. */
export const create = async (input: ProjectWrite): Promise<string> => {
  const id = generateId();
  const rows = split(id, input);
  await db.batch([
    db.insert(project).values({ ...rows.fields, id }),
    db.insert(projectTranslation).values(rows.translations),
    ...(rows.tags.length > 0 ? [db.insert(projectTag).values(rows.tags)] : []),
  ]);
  return id;
};

/** Replaces a project's fields, translations and tags atomically. */
export const update = async (
  id: string,
  input: ProjectWrite
): Promise<void> => {
  const rows = split(id, input);
  await db.batch([
    db.update(project).set(rows.fields).where(eq(project.id, id)),
    db.delete(projectTranslation).where(eq(projectTranslation.projectId, id)),
    db.insert(projectTranslation).values(rows.translations),
    db.delete(projectTag).where(eq(projectTag.projectId, id)),
    ...(rows.tags.length > 0 ? [db.insert(projectTag).values(rows.tags)] : []),
  ]);
};

export const remove = async (id: string): Promise<boolean> => {
  const deleted = await db
    .delete(project)
    .where(eq(project.id, id))
    .returning({ id: project.id });
  return deleted.length > 0;
};

/** Publishes scheduled projects whose time has come. */
export const publishDue = async (now: Date): Promise<number> => {
  const published = await db
    .update(project)
    .set({ publishedAt: sql`${project.scheduledAt}`, status: "published" })
    .where(and(eq(project.status, "scheduled"), lte(project.scheduledAt, now)))
    .returning({ id: project.id });
  return published.length;
};
