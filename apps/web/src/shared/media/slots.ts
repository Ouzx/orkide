/**
 * Every hand-made media asset the site expects, by slot id. Until a file is supplied, the slot
 * renders a labelled placeholder of the right shape, so layouts never shift when assets arrive.
 *
 * To fill a slot: generate it from its prompt in `docs/media-prompts.md`, drop the file in
 * `public/media/`, and set `src` (and `poster` for videos) below.
 */
export interface MediaSlot {
  readonly kind: "image" | "video";
  /** Intrinsic width / height, also used to reserve space (no layout shift). */
  readonly width: number;
  readonly height: number;
  /**
   * Static Tailwind class reserving the box before the file loads. A class, not an inline style:
   * the Content-Security-Policy forbids inline `style` attributes.
   */
  readonly aspect: string;
  /** Purely decorative media is hidden from assistive technology (`alt=""`, `aria-hidden`). */
  readonly decorative: boolean;
  readonly src?: string;
  readonly poster?: string;
}

export const mediaSlots = {
  /** Ambient visual on the contact page. */
  "contact-ambient": {
    aspect: "aspect-[4/5]",
    decorative: true,
    height: 1500,
    kind: "image",
    width: 1200,
  },
  /** Static fallback behind the 3D hero (also shown for reduced motion / no WebGL). */
  "home-hero-poster": {
    aspect: "aspect-video",
    decorative: true,
    height: 1080,
    kind: "image",
    width: 1920,
  },
  /** Ambient loop beside the "Selected work" heading. */
  "home-work-loop": {
    aspect: "aspect-video",
    decorative: true,
    height: 1080,
    kind: "video",
    width: 1920,
  },
  /** Banner of the portfolio index. */
  "portfolio-banner": {
    aspect: "aspect-[8/3]",
    decorative: true,
    height: 900,
    kind: "image",
    width: 2400,
  },
} as const satisfies Record<string, MediaSlot>;

export type MediaSlotId = keyof typeof mediaSlots;
