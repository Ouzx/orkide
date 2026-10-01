import { db, generateId } from "@orkide/db";
import { project, projectTag, projectTranslation } from "@orkide/db/schema";
import type { Locale } from "@orkide/i18n";
import { eq } from "drizzle-orm";

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

export const findPublishedBySlug = (locale: Locale, slug: string) =>
  db.query.project.findFirst({
    where: { status: "published", translations: { locale, slug } },
    with: {
      ...publicRelations(locale),
      translations: { columns: { content: false } },
    },
  });

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

export interface ProjectWrite {
  readonly completedAt: Date | null;
  readonly coverMediaId: string | null;
  readonly featured: boolean;
  readonly position: number;
  readonly publishedAt: Date | null;
  readonly repositoryUrl: string | null;
  readonly scheduledAt: Date | null;
  readonly startedAt: Date | null;
  readonly status: "draft" | "scheduled" | "published" | "archived";
  readonly tagIds: readonly string[];
  readonly translations: readonly RenderedTranslation[];
  readonly websiteUrl: string | null;
}

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
  const due = await db.query.project.findMany({
    columns: { id: true, scheduledAt: true },
    where: { scheduledAt: { lte: now }, status: "scheduled" },
  });
  const [first, ...rest] = due.map(({ id, scheduledAt }) =>
    db
      .update(project)
      .set({ publishedAt: scheduledAt ?? now, status: "published" })
      .where(eq(project.id, id))
  );
  if (first) {
    await db.batch([first, ...rest]);
  }
  return due.length;
};
