import type { Locale } from "@orkide/i18n";
import type {
  CategoryInput,
  TagInput,
  Term,
} from "@orkide/validators/taxonomy";

import { purge } from "../../core/cache.ts";
import { ApiError } from "../../core/errors.ts";
import { toTerms } from "../../shared/documents.ts";
import * as repository from "./taxonomy.repository.ts";

/** Taxonomy changes alter post/project payloads too, so every namespace that embeds terms is invalidated. */
/** Terms are embedded in post and project payloads, so their caches are purged too. */
const invalidateAll = () => purge("taxonomy", "posts", "projects");

export const listPublic = async (
  locale: Locale
): Promise<{ categories: Term[]; tags: Term[] }> => {
  const [categories, tags] = await Promise.all([
    repository.listCategories(),
    repository.listTags(),
  ]);
  return {
    categories: toTerms(categories, locale),
    tags: toTerms(tags, locale),
  };
};

/** Every term with all translations, for the admin taxonomy manager. */
export const listEditable = async () => {
  const [categories, tags] = await Promise.all([
    repository.listCategories(),
    repository.listTags(),
  ]);
  return { categories, tags };
};

export const createCategory = async (input: CategoryInput) => {
  const id = await repository.createCategory(input);
  await invalidateAll();
  return id;
};

export const updateCategory = async (id: string, input: CategoryInput) => {
  await repository.updateCategory(id, input);
  await invalidateAll();
};

export const removeCategory = async (id: string) => {
  if (!(await repository.removeCategory(id))) {
    throw new ApiError("not_found");
  }
  await invalidateAll();
};

export const createTag = async (input: TagInput) => {
  const id = await repository.createTag(input);
  await invalidateAll();
  return id;
};

export const updateTag = async (id: string, input: TagInput) => {
  await repository.updateTag(id, input);
  await invalidateAll();
};

export const removeTag = async (id: string) => {
  if (!(await repository.removeTag(id))) {
    throw new ApiError("not_found");
  }
  await invalidateAll();
};
