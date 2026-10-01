import type { Locale } from "@orkide/i18n";
import type { Media, MediaUpdate } from "@orkide/validators/media";
import { env } from "cloudflare:workers";

import { ApiError } from "../../core/errors.ts";
import type { UploadedFile } from "../../core/middleware/upload.ts";
import { toMedia } from "../../shared/documents.ts";
import * as repository from "./media.repository.ts";

/** Content-addressed keys never change, so every response may be cached forever. */
const IMMUTABLE = "public, max-age=31536000, immutable";

/** Widths images can be requested at. A fixed set bounds the number of billable transformations. */
export const IMAGE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;
const DEFAULT_WIDTH = 1280;

/** Raster formats the Images binding can decode (GIFs keep their animation). */
const TRANSFORMABLE = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
/** The Images binding accepts inputs up to 20 MB. */
const MAX_TRANSFORMABLE_BYTES = 20 * 1024 * 1024;

const PLACEHOLDER_WIDTH = 16;

const objectKey = (sha256: string, extension: string) =>
  `media/${sha256}.${extension}`;
const variantKey = (sha256: string, width: number, format: string) =>
  `variants/${sha256}/${width}.${format}`;
const streamOf = (bytes: Uint8Array<ArrayBuffer>) => new Blob([bytes]).stream();

/** Dimensions and an inline low-quality placeholder, computed once at upload time. */
const describeImage = async (bytes: Uint8Array<ArrayBuffer>) => {
  const [info, placeholder] = await Promise.all([
    env.IMAGES.info(streamOf(bytes)),
    env.IMAGES.input(streamOf(bytes))
      .transform({ width: PLACEHOLDER_WIDTH })
      .output({ anim: false, format: "image/webp", quality: 30 })
      .then((result) => result.response().arrayBuffer()),
  ]);
  const encoded = new Uint8Array(placeholder).toBase64();
  return {
    height: "height" in info ? info.height : null,
    placeholder: `data:image/webp;base64,${encoded}`,
    width: "width" in info ? info.width : null,
  };
};

/**
 * Stores a verified upload. Identical bytes resolve to the existing item (content addressing),
 * so re-uploading never duplicates storage.
 */
export const upload = async (
  file: UploadedFile,
  uploaderId: string,
  translations: MediaUpdate["translations"],
  locale: Locale
): Promise<{ media: Media; created: boolean }> => {
  const existing = await repository.findBySha(file.sha256);
  if (existing) {
    return { created: false, media: toMedia(existing, locale) };
  }

  const isImage = TRANSFORMABLE.has(file.mimeType);
  if (isImage && file.size > MAX_TRANSFORMABLE_BYTES) {
    throw new ApiError("payload_too_large", {
      detail: "Images must be 20 MB or smaller.",
    });
  }

  const key = objectKey(file.sha256, file.extension);
  await env.MEDIA.put(key, file.bytes, {
    customMetadata: { sha256: file.sha256 },
    httpMetadata: { cacheControl: IMMUTABLE, contentType: file.mimeType },
    sha256: file.sha256,
  });

  const dimensions = isImage
    ? await describeImage(file.bytes)
    : { height: null, placeholder: null, width: null };
  const id = await repository.create({
    ...dimensions,
    key,
    mimeType: file.mimeType,
    sha256: file.sha256,
    size: file.size,
    translations,
    uploaderId,
  });
  const row = await repository.findById(id);
  if (!row) {
    throw new ApiError("internal");
  }
  return { created: true, media: toMedia(row, locale) };
};

export const list = async (locale: Locale): Promise<Media[]> => {
  const rows = await repository.list();
  return rows.map((row) => toMedia(row, locale));
};

export const listEditable = async () => {
  const rows = await repository.list();
  return rows.map(({ translations, ...row }) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    translations: translations.map(({ alt, caption, locale }) => ({
      alt,
      caption,
      locale,
    })),
    updatedAt: row.updatedAt.toISOString(),
  }));
};

export const updateTranslations = async (id: string, input: MediaUpdate) => {
  if (!(await repository.findById(id))) {
    throw new ApiError("not_found");
  }
  await repository.updateTranslations(id, input);
};

/** Deletes the database row first (so the item disappears immediately), then the object and variants. */
export const remove = async (id: string) => {
  const deleted = await repository.remove(id);
  if (!deleted) {
    throw new ApiError("not_found");
  }
  const variants = await env.MEDIA.list({
    prefix: `variants/${deleted.sha256}/`,
  });
  await env.MEDIA.delete([
    deleted.key,
    ...variants.objects.map((object) => object.key),
  ]);
};

const snapWidth = (requested: number | undefined): number =>
  IMAGE_WIDTHS.find((width) => width >= (requested ?? DEFAULT_WIDTH)) ??
  IMAGE_WIDTHS.at(-1) ??
  DEFAULT_WIDTH;

/** Best format the client accepts, by the `Accept` header. */
const negotiateFormat = (
  accept: string | undefined
): "avif" | "webp" | "jpeg" => {
  if (accept?.includes("image/avif")) {
    return "avif";
  }
  return accept?.includes("image/webp") ? "webp" : "jpeg";
};

/**
 * Serves an image variant. Originals are never served for images: every response passes through
 * the Images binding, which strips EXIF/GPS metadata. Variants are persisted in R2 so a transform
 * runs once per (image, width, format) — across deployments and cache evictions.
 */
const serveImage = async (
  sha256: string,
  original: R2ObjectBody,
  width: number,
  accept: string | undefined,
  waitUntil: (promise: Promise<unknown>) => void
) => {
  const format = negotiateFormat(accept);
  const headers = { "cache-control": IMMUTABLE, vary: "accept" };
  const key = variantKey(sha256, width, format);

  const stored = await env.MEDIA.get(key);
  if (stored) {
    original.body.cancel();
    return new Response(stored.body, {
      headers: { ...headers, "content-type": `image/${format}` },
    });
  }

  const result = await env.IMAGES.input(original.body)
    .transform({ fit: "scale-down", width })
    .output({ format: `image/${format}`, quality: 80 });
  const [client, persist] = result.image().tee();
  waitUntil(
    env.MEDIA.put(key, persist, {
      httpMetadata: { cacheControl: IMMUTABLE, contentType: `image/${format}` },
    })
  );
  return new Response(client, {
    headers: { ...headers, "content-type": `image/${format}` },
  });
};

/** Streams a non-image object with HTTP Range and conditional request support. */
const serveFile = async (key: string, request: Request) => {
  const object = await env.MEDIA.get(key, {
    onlyIf: request.headers,
    range: request.headers,
  });
  if (!object) {
    throw new ApiError("not_found");
  }
  const headers = new Headers({
    "accept-ranges": "bytes",
    "cache-control": IMMUTABLE,
    etag: object.httpEtag,
  });
  object.writeHttpMetadata(headers);
  if (!("body" in object)) {
    return new Response(null, { headers, status: 304 });
  }
  if (object.range && "offset" in object.range) {
    const start = object.range.offset ?? 0;
    const end = start + (object.range.length ?? object.size - start) - 1;
    headers.set("content-range", `bytes ${start}-${end}/${object.size}`);
    return new Response(object.body, { headers, status: 206 });
  }
  return new Response(object.body, { headers });
};

export const serve = async (
  file: string,
  options: {
    width?: number;
    request: Request;
    waitUntil: (promise: Promise<unknown>) => void;
  }
): Promise<Response> => {
  const key = `media/${file}`;
  const [sha256] = file.split(".");
  const head = await env.MEDIA.head(key);
  if (!(head && sha256)) {
    throw new ApiError("not_found");
  }
  if (!TRANSFORMABLE.has(head.httpMetadata?.contentType ?? "")) {
    return serveFile(key, options.request);
  }
  const original = await env.MEDIA.get(key);
  if (!original) {
    throw new ApiError("not_found");
  }
  return serveImage(
    sha256,
    original,
    snapWidth(options.width),
    options.request.headers.get("accept") ?? undefined,
    options.waitUntil
  );
};
