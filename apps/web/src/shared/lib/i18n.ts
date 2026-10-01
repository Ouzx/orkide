import type { Locale } from "@orkide/i18n";
import { locales } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { localizeHref } from "@orkide/i18n/runtime";

/** Localized path of the same page in each locale (for `hreflang` and the language switcher). */
export type Alternates = Partial<Record<Locale, string>>;

/** Alternates of a page whose path is identical across locales (only the prefix changes). */
export const pageAlternates = (path: string): Alternates =>
  Object.fromEntries(
    locales.map((locale) => [locale, localizeHref(path, { locale })])
  );

/** Alternates of a document whose slug is translated per locale. */
export const documentAlternates = (
  section: "/blog" | "/portfolio",
  alternates: readonly { locale: Locale; slug: string }[]
): Alternates =>
  Object.fromEntries(
    alternates.map(({ locale, slug }) => [
      locale,
      localizeHref(`${section}/${slug}`, { locale }),
    ])
  );

/** BCP 47 tag used for `<html lang>`, `og:locale` and `Intl` formatting. */
export const languageTag = {
  en: "en-US",
  tr: "tr-TR",
} as const satisfies Record<Locale, string>;

export const formatDate = (iso: string, locale: Locale): string =>
  new Intl.DateTimeFormat(languageTag[locale], { dateStyle: "long" }).format(
    new Date(iso)
  );

/** Each locale's name, written in that locale ("English", "Türkçe"). */
export const localeName = (locale: Locale): string =>
  ({
    en: () => m.locale_name_en({}, { locale }),
    tr: () => m.locale_name_tr({}, { locale }),
  })[locale]();
