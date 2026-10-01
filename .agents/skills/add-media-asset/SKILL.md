---
name: add-media-asset
description: Add or replace a hand-made image, video, icon or brand asset in the Orkide web app — write its prompt, run the media pipeline, and wire it into a slot, page or the SEO layer. Use when the user supplies new artwork or a layout needs a new visual.
---

# Add a media asset

Originals never enter git. The pipeline turns them into optimized, committed outputs.

## 1. Describe it

Add an entry to `docs/media-prompts.md`: id (kebab-case), size, where it is used, and a prompt
that starts from the shared art direction. Ask the user to drop the original into
`design/incoming/<id>.png` (or `.mp4`, `.svg`).

## 2. Register it in the pipeline

`apps/web/scripts/media.ts`:

- Responsive picture → add `"<id>": [widths…]` to `pictures` (widths ≤ the original's width).
- Needs a stable public URL (link previews, email, structured data) → add it to `stable`.
- Video → call `buildVideo("<id>")` and extend `VideoId` in `src/shared/media/pictures.ts`.

Run `pnpm --filter @orkide/web media` (needs `ffmpeg`). It writes `src/assets/media/<id>/` +
`manifest.json` (fingerprinted by Vite, served immutable) and/or `public/media/`.

## 3. Use it

- Layout visual with a reserved box → add a slot to `src/shared/media/slots.ts`, render
  `<MediaSlot id sizes />`.
- Anywhere else → `<Picture id sizes alt? priority? class imgClass />` (`@/shared/media/Picture.astro`).
- Always pass an accurate `sizes`; set `priority` only for above-the-fold LCP candidates.
- Decorative media keeps `alt=""`. No inline `style` attributes (hashed CSP) — use classes.
- Theme-specific variants: render both and toggle with `dark:hidden` / `hidden dark:block`.

## 4. Verify

`pnpm fix && pnpm check && pnpm exec turbo run typecheck test build`, then view the page in
light and dark themes, with and without reduced motion.
