import manifest from "@/assets/media/manifest.json";

/**
 * Typed access to the optimized media produced by `pnpm media` (scripts/media.ts). Files are
 * imported as URLs, so Vite fingerprints them and they are served immutable from `/_astro/`.
 */
const files = import.meta.glob<string>(
  "/src/assets/media/*/*.{avif,webp,mp4,webm}",
  { eager: true, import: "default", query: "?url" }
);

export type PictureId = keyof typeof manifest;

const fileUrl = (id: string, name: string): string => {
  const url = files[`/src/assets/media/${id}/${name}`];
  if (!url) {
    throw new Error(`Missing media file ${id}/${name}; run \`pnpm media\``);
  }
  return url;
};

export interface Picture {
  readonly width: number;
  readonly height: number;
  readonly placeholder: string;
  readonly avif: string;
  readonly webp: string;
  /** Mid-size WebP for browsers without `<picture>`/`srcset` support and for posters. */
  readonly fallback: string;
}

export const picture = (id: PictureId): Picture => {
  const { height, placeholder, width, widths } = manifest[id];
  const srcset = (format: "avif" | "webp") =>
    widths
      .map((each) => `${fileUrl(id, `${each}.${format}`)} ${each}w`)
      .join(", ");
  const fallbackWidth =
    widths.find((each) => each >= 960) ?? widths.at(-1) ?? width;
  return {
    avif: srcset("avif"),
    fallback: fileUrl(id, `${fallbackWidth}.webp`),
    height,
    placeholder,
    webp: srcset("webp"),
    width,
  };
};

export type VideoId = "home-work-loop";

/** AV1 first (smallest), H.264 as the universal fallback. */
export const videoSources = (id: VideoId) => [
  { src: fileUrl(id, "720.webm"), type: 'video/webm; codecs="av01.0.05M.08"' },
  { src: fileUrl(id, "720.mp4"), type: "video/mp4" },
];
