# Media prompts

Every hand-made asset the site expects is a **slot** in `apps/web/src/shared/media/slots.ts`. Until a file exists, the slot renders a labelled placeholder of the exact final shape, so nothing shifts when assets arrive.

**To fill a slot:** generate the asset from its prompt (image prompts for GPT-6 Astra, video prompts for GPT-6 Sol), export it at the listed size, put it in `apps/web/public/media/`, then set `src` (and `poster` for videos) on the slot.

**Shared art direction** — prepend to every prompt:

> Futuristic, quiet and precise. Deep indigo-black space (#110f1c) lit by two light sources: orchid magenta (#e05ad8) and aurora cyan (#5fd4e8). Soft volumetric glow, fine grain, subtle depth of field. Organic forms inspired by orchid petals rendered as translucent glass and light, never literal flowers. No text, no logos, no people, no UI. Generous negative space; nothing important near the edges.

| Slot | Kind | Size | File |
| --- | --- | --- | --- |
| `home-hero-poster` | image | 1920×1080 | `home-hero-poster.avif` |
| `home-work-loop` | video | 1920×1080, 8–12 s loop | `home-work-loop.mp4` + `home-work-loop-poster.avif` |
| `portfolio-banner` | image | 2400×900 | `portfolio-banner.avif` |
| `contact-ambient` | image | 1200×1500 | `contact-ambient.avif` |

## `home-hero-poster` — image

Static backdrop behind the 3D bloom on the home page; also what visitors with reduced motion, Save-Data or no WebGL see. It sits inside a soft circular mask, so keep the subject centered.

> A single luminous five-petal bloom made of translucent iridescent glass, centered, floating in deep indigo space. Petals glow orchid magenta at the core, fading to aurora cyan at the rims, with thin bright fresnel edges. Tiny specks of cyan pollen drift around it. Centered composition, dark vignette, cinematic, 16:9.

## `home-work-loop` — video (seamless loop)

Ambient band above "Selected work". Muted, decorative, hidden for reduced motion.

> Slow seamless loop: ribbons of orchid-magenta and aurora-cyan light flowing horizontally across a dark indigo field, like silk moving through water, with a faint perspective grid receding below. Camera static, motion slow and continuous, no cuts; the last frame matches the first. 16:9.

Poster: a representative still frame of the same loop.

## `portfolio-banner` — image

Wide banner at the top of the portfolio.

> Panoramic, very wide composition: a faint perspective grid of thin lines stretching to the horizon across dark indigo space; above it, abstract glass shards and petal shapes arranged like a constellation of floating artifacts, each catching orchid and cyan rim light. Calm, architectural, lots of empty space in the middle third. 8:3.

## `contact-ambient` — image

Tall visual beside the contact form (desktop only).

> Portrait composition: a single slender orchid stem abstracted into a vertical column of glowing glass nodes connected by thin light filaments, rising from bottom to top through dark indigo haze; magenta near the base, cyan near the top. Quiet, inviting, soft bokeh. 4:5.
