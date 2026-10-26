import type { Locale } from "@orkide/i18n";
import { localizeHref } from "@orkide/i18n/runtime";
import { atlasFamilies, atlasSchema } from "@orkide/validators/atlas";
import type {
  AtlasFamily,
  Specimen,
  SpecimenInput,
} from "@orkide/validators/atlas";

/**
 * The atlas's catalog: one file per specimen in `specimens/`, named after its slug. Adding a
 * design is adding a file; its entry is validated here, so a broken one fails the tests and the
 * build instead of a page.
 */
const files = import.meta.glob<SpecimenInput>("./specimens/*.ts", {
  eager: true,
  import: "specimen",
});

const familyOrder = (family: AtlasFamily) => atlasFamilies.indexOf(family);

/** Every specimen, in catalog order: by family, then by number. */
export const catalog: readonly Specimen[] = atlasSchema
  .parse(Object.values(files))
  .toSorted(
    (a, b) =>
      familyOrder(a.family) - familyOrder(b.family) || a.id.localeCompare(b.id)
  );

/** The file each specimen came from, by slug (the tests check that they match). */
export const specimenFiles: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, specimen]) => [specimen.slug, path])
);

/** How many specimens each family has. */
export const familyCounts = (): Record<AtlasFamily, number> => {
  const counts = Object.fromEntries(
    atlasFamilies.map((family) => [family, 0])
  ) as Record<AtlasFamily, number>;
  for (const specimen of catalog) {
    counts[specimen.family] += 1;
  }
  return counts;
};

/** The newest month in the catalog (YYYY-MM). */
export const latestAddition = (): string => {
  let latest = "";
  for (const { added } of catalog) {
    if (added > latest) {
      latest = added;
    }
  }
  return latest;
};

/** A specimen's place on the atlas page. */
export const specimenHref = (slug: string, locale: Locale): string =>
  `${localizeHref("/atlas", { locale })}#${slug}`;
