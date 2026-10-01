import { THEME_STORAGE_KEY } from "./theme.ts";

/**
 * Pre-paint theme bootstrap, inlined in <head> so the page never flashes the wrong palette. It is
 * a constant string (not `define:vars`): `astro.config.ts` hashes it into the CSP at build time.
 */
export const themeScript = `(() => {
  let theme = "system";
  try { theme = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) || "system"; } catch {}
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
})();`;
