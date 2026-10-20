import { MOTION_STORAGE_KEY } from "../motion/motion.ts";
import { THEME_STORAGE_KEY } from "./theme.ts";

/**
 * Pre-paint bootstrap of the visitor's print and motion choice, inlined in <head> so the page never
 * flashes the wrong print or starts motion the visitor switched off (`html.calm`). It is a constant
 * string (not `define:vars`): `astro.config.ts` hashes it into the CSP at build time.
 */
export const themeScript = `(() => {
  const root = document.documentElement;
  try { root.classList.toggle("light", localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "light"); } catch {}
  try { root.classList.toggle("calm", localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)}) === "off"); } catch {}
})();`;
