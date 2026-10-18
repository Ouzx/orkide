/**
 * Media pipeline: turns the hand-made originals in `design/incoming/` (git-ignored, see
 * docs/media-prompts.md) into web-ready, committed outputs.
 *
 * - Stable-URL files (link previews, email banner, portrait) → `public/media/`.
 * - Icons → `public/` (favicon.svg/.ico, apple-touch-icon, PWA icons).
 *
 * The skin draws its own originals with `pnpm --filter @orkide/web brand` (scripts/brand.ts).
 * Run: `pnpm --filter @orkide/web media`. Re-running is idempotent.
 */
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const incoming = path.resolve(root, "../../design/incoming");
const publicOut = path.join(root, "public");

/** Files that need a stable public URL (crawlers, email clients, structured data). */
const stable: Record<
  string,
  { width: number; height: number; file: string; format: "jpeg" | "png" }
> = {
  "email-header": {
    file: "email-header.jpg",
    format: "jpeg",
    height: 300,
    width: 1200,
  },
  "og-blog": { file: "og-blog.jpg", format: "jpeg", height: 630, width: 1200 },
  "og-default": {
    file: "og-default.jpg",
    format: "jpeg",
    height: 630,
    width: 1200,
  },
  "og-portfolio": {
    file: "og-portfolio.jpg",
    format: "jpeg",
    height: 630,
    width: 1200,
  },
  portrait: { file: "portrait.jpg", format: "jpeg", height: 512, width: 512 },
};

const source = (id: string, extension = "png") =>
  path.join(incoming, `${id}.${extension}`);

const buildStable = async () => {
  await mkdir(path.join(publicOut, "media"), { recursive: true });
  await Promise.all(
    Object.entries(stable).map(([id, { file, format, height, width }]) => {
      const image = sharp(source(id)).resize({ fit: "cover", height, width });
      const encoded =
        format === "jpeg"
          ? image.jpeg({ mozjpeg: true, quality: 82 })
          : image.png({ compressionLevel: 9, palette: true, quality: 90 });
      return encoded.toFile(path.join(publicOut, "media", file));
    })
  );
};

/** A single-image ICO that embeds a PNG (supported by every browser since IE Vista era). */
const icoFromPng = (png: Buffer, size: number): Buffer => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
};

const buildIcons = async () => {
  await copyFile(source("favicon", "svg"), path.join(publicOut, "favicon.svg"));
  const ico = await sharp(source("favicon")).resize(32, 32).png().toBuffer();
  await writeFile(path.join(publicOut, "favicon.ico"), icoFromPng(ico, 32));
  const icons: [string, number][] = [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512],
  ];
  await Promise.all(
    icons.map(([file, size]) =>
      sharp(source("app-icon"))
        .resize(size, size)
        .png({ compressionLevel: 9 })
        .toFile(path.join(publicOut, file))
    )
  );
};

await Promise.all([buildStable(), buildIcons()]);
process.stdout.write("media: stable files and icons written\n");
