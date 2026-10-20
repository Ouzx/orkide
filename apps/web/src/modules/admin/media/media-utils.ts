import type { Locale } from "@orkide/i18n";
import type { Media } from "@orkide/validators/media";

import { translationFor } from "../api.ts";
import type { queries } from "../api.ts";

/** A media item as the admin list returns it (inferred from the typed query). */
export type MediaRecord = Awaited<
  ReturnType<NonNullable<ReturnType<typeof queries.media>["queryFn"]>>
>[number];

export const isImage = (record: Pick<MediaRecord, "mimeType">): boolean =>
  record.mimeType.startsWith("image/");

/**
 * What a document's cover can be: an image, or a video such as a recorded demo. (Checked here, not
 * with the validators' `isVideo`: importing that module pulls the data models into the admin bundle.)
 */
export const isCover = (record: Pick<MediaRecord, "mimeType">): boolean =>
  isImage(record) || record.mimeType.startsWith("video/");

/** The reader-facing shape (`Media`) of a record in `locale` — what documents embed. */
export const toMedia = (record: MediaRecord, locale: Locale): Media => {
  const translation = translationFor(record.translations, locale);
  return {
    alt: translation?.alt ?? "",
    caption: translation?.caption ?? null,
    height: record.height,
    id: record.id,
    mimeType: record.mimeType,
    placeholder: record.placeholder,
    size: record.size,
    url: record.url,
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
