import { db, generateId } from "@orkide/db";
import {
  category,
  categoryTranslation,
  tag,
  tagTranslation,
} from "@orkide/db/schema";
import type { CategoryInput, TagInput } from "@orkide/validators/taxonomy";
import { eq } from "drizzle-orm";

export const listCategories = () =>
  db.query.category.findMany({
    columns: { id: true, parentId: true, position: true },
    orderBy: (table, { asc }) => [asc(table.position), asc(table.createdAt)],
    with: { translations: { columns: { categoryId: false } } },
  });

export const listTags = () =>
  db.query.tag.findMany({
    columns: { id: true },
    orderBy: (table, { asc }) => [asc(table.createdAt)],
    with: { translations: { columns: { tagId: false } } },
  });

export const createCategory = async ({
  translations,
  parentId,
  position,
}: CategoryInput): Promise<string> => {
  const id = generateId();
  await db.batch([
    db.insert(category).values({ id, parentId: parentId ?? null, position }),
    db
      .insert(categoryTranslation)
      .values(
        translations.map((translation) => ({ ...translation, categoryId: id }))
      ),
  ]);
  return id;
};

export const updateCategory = async (
  id: string,
  { translations, parentId, position }: CategoryInput
) => {
  await db.batch([
    db
      .update(category)
      .set({ parentId: parentId ?? null, position })
      .where(eq(category.id, id)),
    db
      .delete(categoryTranslation)
      .where(eq(categoryTranslation.categoryId, id)),
    db
      .insert(categoryTranslation)
      .values(
        translations.map((translation) => ({ ...translation, categoryId: id }))
      ),
  ]);
};

export const removeCategory = async (id: string): Promise<boolean> => {
  const deleted = await db
    .delete(category)
    .where(eq(category.id, id))
    .returning({ id: category.id });
  return deleted.length > 0;
};

export const createTag = async ({
  translations,
}: TagInput): Promise<string> => {
  const id = generateId();
  await db.batch([
    db.insert(tag).values({ id }),
    db
      .insert(tagTranslation)
      .values(
        translations.map((translation) => ({ ...translation, tagId: id }))
      ),
  ]);
  return id;
};

export const updateTag = async (id: string, { translations }: TagInput) => {
  await db.batch([
    db.update(tag).set({ updatedAt: new Date() }).where(eq(tag.id, id)),
    db.delete(tagTranslation).where(eq(tagTranslation.tagId, id)),
    db
      .insert(tagTranslation)
      .values(
        translations.map((translation) => ({ ...translation, tagId: id }))
      ),
  ]);
};

export const removeTag = async (id: string): Promise<boolean> => {
  const deleted = await db
    .delete(tag)
    .where(eq(tag.id, id))
    .returning({ id: tag.id });
  return deleted.length > 0;
};
