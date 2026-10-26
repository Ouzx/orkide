import type { SpecimenInput } from "@orkide/validators/atlas";

import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "light",
  desc: {
    en: "Glowing phosphor text types itself out behind scanlines.",
    tr: "Parlayan fosfor yazı, tarama çizgilerinin ardında kendi kendini yazar.",
  },
  family: "aesthetic",
  fit: "strong",
  id: "AE-06",
  name: { en: "Terminal / CRT", tr: "Terminal / CRT" },
  pairs: ["GN-05", "GN-03", "SP-02", "GN-07"],
  prompt:
    "Make [subject] feel like a CRT terminal: phosphor-green monospace text that types itself, scanlines, slight flicker and curvature, and real commands the visitor can type (help, posts, contact). Turn the flicker off under reduced motion.",
  refs: [
    {
      label: "CodePen: CRT terminal",
      url: "https://codepen.io/search/pens?q=crt%20terminal",
    },
    {
      label: "Awwwards interactive",
      url: "https://www.awwwards.com/inspiration_search/web-interactive/",
    },
  ],
  slug: "terminal-crt",
  tags: ["monospace", "glow", "scanlines"],
} satisfies SpecimenInput;

const SESSION =
  "> boot orkide.sys\n  loading posts ....... ok\n  loading plates ...... ok\n> whoami\n  visitor_0427\n> ./derive --product\n  sheet issued";

/** Types the session at 18 characters a second, holds it, then starts over; the cursor blinks. */
export const preview: Preview = (stage) => {
  const tube = document.createElement("div");
  tube.className = "st-terminal-crt-tube";
  tube.setAttribute("aria-hidden", "true");
  const screen = document.createElement("pre");
  const scanlines = document.createElement("i");
  scanlines.className = "st-terminal-crt-scan";
  tube.append(screen, scanlines);
  stage.append(tube);
  return (t) => {
    const typed = Math.floor((t * 18) % (SESSION.length + 40));
    const cursor = Math.floor(t * 2) % 2 === 1 ? "█" : " ";
    screen.textContent = `${SESSION.slice(0, typed)}${cursor}`;
  };
};
