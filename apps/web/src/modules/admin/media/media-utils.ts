import type { Locale } from "@orkide/i18n";
import type { Media } from "@orkide/validators/media";

import type { queries } from "../api.ts";

/** A media item as the admin list returns it (inferred from the typed query). */
export type MediaRecord = Awaited<
  ReturnType<NonNullable<ReturnType<typeof queries.media>["queryFn"]>>
>[number];

/** Public URL of a stored object: the R2 key (`media/<sha256>.<ext>`) under `/api`. */
export const mediaUrl = (record: Pick<MediaRecord, "key">): string =>
  `/api/${record.key}`;

export const isImage = (record: Pick<MediaRecord, "mimeType">): boolean =>
  record.mimeType.startsWith("image/");

/** The reader-facing shape (`Media`) of a record in `locale` — what documents embed. */
export const toMedia = (record: MediaRecord, locale: Locale): Media => {
  const translation =
    record.translations.find((each) => each.locale === locale) ??
    record.translations[0];
  return {
    alt: translation?.alt ?? "",
    caption: translation?.caption ?? null,
    height: record.height,
    id: record.id,
    mimeType: record.mimeType,
    placeholder: record.placeholder,
    size: record.size,
    url: mediaUrl(record),
    width: record.width,
  };
};

const units = ["B", "KB", "MB", "GB"] as const;

export const formatBytes = (bytes: number): string => {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};
