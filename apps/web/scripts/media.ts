/**
 * Media pipeline: turns the hand-made originals in `design/incoming/` (git-ignored, see
 * docs/media-prompts.md) into web-ready, committed outputs.
 *
 * - Pictures → `src/assets/media/<id>/<width>.{avif,webp}` + `manifest.json` (intrinsic size,
 *   widths, inline placeholder). Vite fingerprints them, so they are served immutable.
 * - Stable-URL files (link previews, email banner, portrait) → `public/media/`.
 * - Icons → `public/` (favicon.svg/.ico, apple-touch-icon, PWA icons).
 * - Video → `src/assets/media/<id>/<height>.{mp4,webm}` (H.264 + AV1, muted, faststart).
 *
 * Run: `pnpm --filter @orkide/web media` (needs ffmpeg). Re-running is idempotent.
 */
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const incoming = path.resolve(root, "../../design/incoming");
const assetsOut = path.join(root, "src/assets/media");
const publicOut = path.join(root, "public");

/** Responsive pictures and the widths generated for each (never wider than the original). */
const pictures: Record<string, readonly number[]> = {
  "admin-login": [960, 1920],
  "blog-header": [960, 1600, 2400],
  "contact-ambient": [480, 800, 1200],
  "default-post-cover": [480, 800, 1200, 1600],
  "default-project-cover": [480, 800, 1200, 1600],
  "empty-state": [400, 800],
  "home-hero-poster": [640, 960, 1280, 1920],
  "home-hero-poster-light": [640, 960, 1280, 1920],
  "home-work-loop-poster": [640, 1280, 1920],
  "not-found": [400, 800, 1200],
  "portfolio-banner": [960, 1600, 2400],
  portrait: [96, 192, 384],
  "server-error": [400, 800, 1200],
};

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

interface PictureEntry {
  readonly width: number;
  readonly height: number;
  readonly widths: number[];
  readonly placeholder: string;
}

const buildPicture = async (id: string, widths: readonly number[]) => {
  const input = sharp(source(id));
  const { width = 0, height = 0 } = await input.metadata();
  const usable = widths.filter((each) => each <= width);
  const directory = path.join(assetsOut, id);
  await rm(directory, { force: true, recursive: true });
  await mkdir(directory, { recursive: true });
  await Promise.all(
    usable.flatMap((each) => [
      sharp(source(id))
        .resize({ width: each })
        .avif({ effort: 6, quality: 55 })
        .toFile(path.join(directory, `${each}.avif`)),
      sharp(source(id))
        .resize({ width: each })
        .webp({ effort: 6, quality: 76 })
        .toFile(path.join(directory, `${each}.webp`)),
    ])
  );
  const placeholder = await sharp(source(id))
    .resize({ width: 16 })
    .webp({ quality: 50 })
    .toBuffer();
  const entry: PictureEntry = {
    height,
    placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
    width,
    widths: usable,
  };
  return [id, entry] as const;
};

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

const buildVideo = async (id: string) => {
  const directory = path.join(assetsOut, id);
  await rm(directory, { force: true, recursive: true });
  await mkdir(directory, { recursive: true });
  const input = source(id, "mp4");
  const common = [
    "-y",
    "-loglevel",
    "error",
    "-i",
    input,
    "-an",
    "-vf",
    "scale=-2:720",
  ];
  const h264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "27"];
  const av1 = ["-c:v", "libsvtav1", "-preset", "6", "-crf", "40"];
  const output = ["-pix_fmt", "yuv420p"];
  execFileSync("ffmpeg", [
    ...common,
    ...h264,
    ...output,
    "-movflags",
    "+faststart",
    path.join(directory, "720.mp4"),
  ]);
  execFileSync("ffmpeg", [
    ...common,
    ...av1,
    ...output,
    path.join(directory, "720.webm"),
  ]);
};

await mkdir(assetsOut, { recursive: true });
const entries = await Promise.all(
  Object.entries(pictures).map(([id, widths]) => buildPicture(id, widths))
);
await Promise.all([buildStable(), buildIcons(), buildVideo("home-work-loop")]);
await writeFile(
  path.join(assetsOut, "manifest.json"),
  `${JSON.stringify(Object.fromEntries(entries.toSorted(([a], [b]) => a.localeCompare(b))), null, 2)}\n`
);
process.stdout.write(
  `media: ${entries.length} pictures, stable files, icons and video written\n`
);
