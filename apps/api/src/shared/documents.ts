import { renderDocument } from "@orkide/content/render";
import type { Locale } from "@orkide/i18n";
import type { DocumentTranslationInput } from "@orkide/validators/content";
import type { Media } from "@orkide/validators/media";
import type { Term } from "@orkide/validators/taxonomy";

/** Adds the derived representations (HTML, Markdown, reading time) to translation inputs. */
export const renderTranslations = (
  translations: readonly DocumentTranslationInput[]
) =>
  translations.map((translation) => ({
    ...translation,
    ...renderDocument(translation.content),
    seoDescription: translation.seoDescription ?? null,
    seoTitle: translation.seoTitle ?? null,
  }));

interface Translated {
  readonly locale: Locale;
}

/** Picks the translation for `locale`; documents without one are not served in that locale. */
export const pickTranslation = <T extends Translated>(
  translations: readonly T[],
  locale: Locale
): T | undefined =>
  translations.find((translation) => translation.locale === locale);

/** Every locale the document is available in, for `hreflang` links and the language switcher. */
export const toAlternates = (
  translations: readonly (Translated & { slug: string })[]
) => translations.map(({ locale, slug }) => ({ locale, slug }));

interface TermRow {
  readonly id: string;
  readonly translations: readonly (Translated & {
    name: string;
    slug: string;
  })[];
}

export const toTerm = (row: TermRow, locale: Locale): Term | null => {
  const translation = pickTranslation(row.translations, locale);
  return translation
    ? { id: row.id, name: translation.name, slug: translation.slug }
    : null;
};

export const toTerms = (rows: readonly TermRow[], locale: Locale): Term[] =>
  rows
    .map((row) => toTerm(row, locale))
    .filter((term): term is Term => term !== null);

interface MediaRow {
  readonly id: string;
  readonly key: string;
  readonly mimeType: string;
  readonly size: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly placeholder: string | null;
  readonly translations: readonly (Translated & {
    alt: string;
    caption: string | null;
  })[];
}

/** Public URL of a stored object; served (and transformed for images) by the media module. */
export const mediaUrl = (key: string): string =>
  `/api/media/${key.replace(/^media\//u, "")}`;

export const toMedia = (row: MediaRow, locale: Locale): Media => {
  const translation = pickTranslation(row.translations, locale);
  return {
    alt: translation?.alt ?? "",
    caption: translation?.caption ?? null,
    height: row.height,
    id: row.id,
    mimeType: row.mimeType,
    placeholder: row.placeholder,
    size: row.size,
    url: mediaUrl(row.key),
    width: row.width,
  };
};

export const toIso = (date: Date | null): string | null =>
  date?.toISOString() ?? null;
