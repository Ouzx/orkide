import type { Locale } from "@orkide/i18n";
import type {
  CategoryInput,
  TagInput,
  TaxonomyTerm,
} from "@orkide/validators/taxonomy";

import { purge } from "../../core/cache.ts";
import { ApiError } from "../../core/errors.ts";
import { toAlternates, toTerm } from "../../shared/documents.ts";
import * as repository from "./taxonomy.repository.ts";

/** Terms are embedded in post and project payloads, so their caches are purged too. */
const invalidateAll = () => purge("taxonomy", "posts", "projects");

const toTaxonomyTerms = (
  rows: Awaited<ReturnType<typeof repository.listTags>>,
  locale: Locale
): TaxonomyTerm[] =>
  rows.flatMap((row) => {
    const term = toTerm(row, locale);
    return term
      ? [{ ...term, alternates: toAlternates(row.translations) }]
      : [];
  });

export const listPublic = async (
  locale: Locale
): Promise<{ categories: TaxonomyTerm[]; tags: TaxonomyTerm[] }> => {
  const [categories, tags] = await Promise.all([
    repository.listCategories(),
    repository.listTags(),
  ]);
  return {
    categories: toTaxonomyTerms(categories, locale),
    tags: toTaxonomyTerms(tags, locale),
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
