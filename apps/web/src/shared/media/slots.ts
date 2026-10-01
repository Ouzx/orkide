import type { PictureId, VideoId } from "./pictures.ts";

/**
 * Hand-made media placed in layouts, by slot id. A slot names its optimized asset (produced by
 * `pnpm media` from docs/media-prompts.md); a slot without one renders a sized placeholder, so
 * layouts never shift when an asset arrives.
 */
export type MediaSlot =
  | {
      readonly kind: "image";
      readonly picture?: PictureId;
      /** Variant shown in the light theme. */
      readonly lightPicture?: PictureId;
      /** Static Tailwind class reserving the box (no inline styles under the CSP). */
      readonly aspect: string;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: "video";
      readonly video?: VideoId;
      readonly poster?: PictureId;
      readonly aspect: string;
      readonly width: number;
      readonly height: number;
    };

export const mediaSlots = {
  /** Ambient visual on the contact page. */
  "contact-ambient": {
    aspect: "aspect-[4/5]",
    height: 1500,
    kind: "image",
    picture: "contact-ambient",
    width: 1200,
  },
  /** Static fallback behind the 3D hero (also shown for reduced motion / no WebGL). */
  "home-hero-poster": {
    aspect: "aspect-video",
    height: 1080,
    kind: "image",
    lightPicture: "home-hero-poster-light",
    picture: "home-hero-poster",
    width: 1920,
  },
  /** Ambient loop beside the "Selected work" heading. */
  "home-work-loop": {
    aspect: "aspect-video",
    height: 1080,
    kind: "video",
    poster: "home-work-loop-poster",
    video: "home-work-loop",
    width: 1920,
  },
} as const satisfies Record<string, MediaSlot>;

export type MediaSlotId = keyof typeof mediaSlots;
