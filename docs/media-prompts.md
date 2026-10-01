# Media prompts

Every hand-made asset the site uses. Generate from the prompts below (images: GPT-6 Astra, video: GPT-6 Sol), name files by **id**, and drop the originals in `design/incoming/` (git-ignored). They are optimized (AVIF/WebP, AV1/H.264, SVG/ICO) and wired in from there; layout slots live in `apps/web/src/shared/media/slots.ts` and render a sized placeholder until filled.

**Delivery:** images as PNG at the listed size or larger; videos as the highest-quality MP4; brand marks as transparent 2048×2048 PNG (plus SVG if your tool can).

## Shared art direction

Prepend to every prompt except the brand marks:

> Futuristic, quiet and precise. Deep indigo-black space (#110f1c) lit by two light sources: orchid magenta (#e05ad8) and aurora cyan (#5fd4e8). Soft volumetric glow, fine film grain, shallow depth of field. Organic forms inspired by orchid petals rendered as translucent glass, light and fine circuitry, never literal photographed flowers. No text, no letters, no logos, no people, no UI. Generous negative space; nothing important near the edges.

## A. Brand — the techno orchid

| id | size | used for |
| --- | --- | --- |
| `logo-mark` | 2048×2048, transparent | header, emails, link previews |
| `logo-mark-mono` | 2048×2048, transparent | monochrome contexts |
| `favicon` | 1024×1024, transparent | browser tab (must read at 16 px) |
| `app-icon` | 1024×1024, opaque | Apple touch icon, installable app icon |
| `email-header` | 1200×300 | transactional email banner |

**`logo-mark`**

> A logo mark: a techno orchid. A perfectly symmetrical orchid seen from the front: three narrow sepals (top, lower-left, lower-right), two wide rounded petals (left, right) and a distinctive lip (labellum) at the bottom center — drawn entirely in the language of circuitry: uniform thin strokes like PCB traces, 45° and 90° turns softened into curves, small round solder-pad nodes where lines meet, and one glowing node at the flower's heart. Smooth gradient from orchid magenta (#e05ad8) at the top to aurora cyan (#5fd4e8) at the bottom. Flat vector style, no shading, no 3D, no texture, no background, centered with 10% padding, legible at 32 px. Elegant, minimal, timeless — like a premium tech brand mark. No text.

**`logo-mark-mono`**

> The same techno orchid mark in a single flat color (pure white #ffffff) on a transparent background, identical geometry, no gradient, no glow.

**`favicon`**

> An ultra-simplified techno orchid icon for a 16-pixel favicon: only five thick petal shapes around one round center node, chunky strokes (at least 1/10 of the icon width), no fine lines or small details, symmetrical, centered, magenta-to-cyan gradient (#e05ad8 → #5fd4e8), transparent background. Flat vector, no text.

**`app-icon`**

> The simplified techno orchid icon centered on a solid deep indigo (#110f1c) square, with a soft orchid-magenta radial glow behind the flower. The flower occupies the central 60% (safe zone for rounded masks). Flat, crisp, no text.

**`email-header`**

> Wide low banner: the techno orchid mark small on the left third, glowing softly, with thin circuit traces flowing from it horizontally to the right and fading into deep indigo. Lots of empty space, dark and calm.

## B. Link previews (OpenGraph) — titles are composited in code, keep the left 60% calm

**`og-default`** (1200×630)

> Wide composition: on the right third, a luminous glass techno orchid floating with fresnel rim light; the left 60% is a calm, softly lit indigo gradient with a faint perspective grid, ready for overlaid text.

**`og-blog`** (1200×630)

> Wide composition: on the right, layered translucent glass pages fanning out like petals, edged with cyan light; the left 60% is calm and empty.

**`og-portfolio`** (1200×630)

> Wide composition: on the right, abstract glass artifacts (cubes, rings, shards) arranged like an exhibit on an invisible plinth, lit magenta and cyan; the left 60% is calm and empty.

## C. Home

**`home-hero-poster`** (1920×1080) — behind the 3D bloom; what visitors without WebGL see. Keep it centered.

> A single luminous five-petal techno orchid made of translucent iridescent glass with faint circuit traces inside the petals, floating centered in deep indigo space; orchid magenta at the core fading to aurora cyan at the rims, thin bright fresnel edges, tiny specks of cyan pollen drifting around it. Dark vignette, cinematic.

**`home-hero-poster-light`** (1920×1080, optional)

> The same glass techno orchid in a bright airy studio: off-white lavender background (#f9f8fc), soft daylight, subtle magenta and cyan caustics on the floor, gentle shadows. Clean and minimal.

**`home-work-loop`** (video, 1920×1080, 8–12 s seamless loop) + **`home-work-loop-poster`** (a still frame)

> Slow seamless loop: ribbons of orchid-magenta and aurora-cyan light flowing horizontally across a dark indigo field, like silk moving through water, with a faint perspective grid receding below. Static camera, slow continuous motion, no cuts; the last frame matches the first.

## D. Sections

**`blog-header`** (2400×600)

> Very wide, very subtle: dark indigo field with faint horizontal circuit traces and a few glowing nodes, like a calm motherboard at night; soft magenta haze on the left, cyan haze on the right. Low contrast so text stays readable on top.

**`portfolio-banner`** (2400×900)

> Panoramic: a faint perspective grid stretching to the horizon across dark indigo space; above it, abstract glass shards and petal shapes arranged like a constellation of floating artifacts, each catching orchid and cyan rim light. Calm, architectural, lots of empty space in the middle third.

**`contact-ambient`** (1200×1500)

> A single slender orchid stem abstracted into a vertical column of glowing glass nodes connected by thin light filaments, rising through dark indigo haze; magenta near the base, cyan near the top. Quiet, inviting, soft bokeh.

**`default-post-cover`** (1600×900)

> Abstract close-up of a glass orchid petal surface with fine circuit veins, macro lens, magenta-to-cyan light gradient, extreme shallow depth of field.

**`default-project-cover`** (1600×1000)

> Abstract isometric glass blocks interlocking like modules of a system, thin circuit lines connecting them, lit from below in magenta and cyan, on dark indigo.

## E. States

**`not-found`** (1200×1200)

> A single glass orchid petal drifting away alone into dark indigo space, slightly out of focus, a faint dotted trail where it came from. Melancholic but gentle.

**`server-error`** (1200×1200)

> A glass techno orchid with a few of its circuit traces flickering and broken, small sparks of cyan light; calm rather than alarming.

**`empty-state`** (800×600)

> A small glass seed or bud resting on a thin glowing horizontal line in dark indigo space, about to bloom. Minimal.

**`admin-login`** (1920×1080)

> A huge, dimly lit techno orchid seen extremely close, filling the frame with glass petals and circuit veins, almost abstract, very dark, a single bright cyan node in the lower right.

## F. From you (optional)

- **`portrait`** — your photo, square, ≥ 800 px (author byline, `Person` structured data).
- Project screenshots — uploaded through the admin media library.
