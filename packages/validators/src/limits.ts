/**
 * Dependency-free limits shared by the API, the web app and future clients. Kept apart from the
 * schemas so importing a constant never pulls the database models into a bundle.
 */

/** MIME types accepted by the upload pipeline, verified against the file's magic bytes. */
export const ALLOWED_MEDIA_TYPES = {
  "application/pdf": "pdf",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;

export type AllowedMediaType = keyof typeof ALLOWED_MEDIA_TYPES;

/** Text lengths the schemas enforce; forms reuse them as `maxLength` so browsers stop at the same place. */
export const TEXT_MAX = {
  alt: 300,
  caption: 500,
  categoryName: 80,
  contactBody: 5000,
  contactName: 120,
  contactSubject: 160,
  email: 254,
  seoDescription: 160,
  seoTitle: 70,
  summary: 300,
  tagName: 48,
  title: 140,
} as const;

export const CONTACT_BODY_MIN = 10;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Widths an image can be served at (`/api/media/<file>?w=`); requests snap up to the next one. */
export const IMAGE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;
