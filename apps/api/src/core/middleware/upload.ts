import {
  ALLOWED_MEDIA_TYPES,
  MAX_UPLOAD_BYTES,
} from "@orkide/validators/media";
import type { AllowedMediaType } from "@orkide/validators/media";
import { fileTypeFromBuffer } from "file-type";
import { createMiddleware } from "hono/factory";

import type { AppEnv } from "../env.ts";
import { ApiError } from "../errors.ts";
import { limitBody } from "./security.ts";

/** A verified upload: the declared type is ignored, the bytes decide. */
export interface UploadedFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly mimeType: AllowedMediaType;
  readonly extension: (typeof ALLOWED_MEDIA_TYPES)[AllowedMediaType];
  readonly sha256: string;
  readonly size: number;
  /** Original file name, for display only — never used to build storage keys. */
  readonly name: string;
  /** Remaining non-file form fields. */
  readonly fields: Readonly<Record<string, string>>;
}

const isAllowed = (mime: string): mime is AllowedMediaType =>
  Object.hasOwn(ALLOWED_MEDIA_TYPES, mime);

const toHex = (buffer: ArrayBuffer) => new Uint8Array(buffer).toHex();

/**
 * Accepts a single `multipart/form-data` file under `field` and verifies it before any handler runs:
 *
 * 1. Enforces the byte ceiling on the raw body (before buffering) and on the file itself.
 * 2. Sniffs the real type from magic bytes; the client-declared `Content-Type` is never trusted.
 * 3. Rejects anything outside the allowlist (no SVG, HTML, executables or archives).
 * 4. Computes the SHA-256 used for content-addressed storage and deduplication.
 */
export const uploadedFile = (field = "file", maxBytes = MAX_UPLOAD_BYTES) =>
  createMiddleware<AppEnv & { Variables: { upload: UploadedFile } }>(
    async (c, next) => {
      await limitBody(maxBytes)(c, async () => {
        const form = await c.req.parseBody();
        const file = form[field];
        if (!(file instanceof File)) {
          throw new ApiError("bad_request", {
            detail: `Expected a file in the "${field}" field.`,
          });
        }
        if (file.size === 0 || file.size > maxBytes) {
          throw new ApiError("payload_too_large");
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const detected = await fileTypeFromBuffer(bytes);
        if (!(detected && isAllowed(detected.mime))) {
          throw new ApiError("unsupported_media_type");
        }

        const fields = Object.fromEntries(
          Object.entries(form).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string"
          )
        );
        c.set("upload", {
          bytes,
          extension: ALLOWED_MEDIA_TYPES[detected.mime],
          fields,
          mimeType: detected.mime,
          name: file.name,
          sha256: toHex(await crypto.subtle.digest("SHA-256", bytes)),
          size: file.size,
        });
      });
      await next();
    }
  );
