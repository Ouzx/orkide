import { MOTION_STORAGE_KEY } from "../motion/motion.ts";
import { THEME_STORAGE_KEY } from "./theme.ts";

/** sessionStorage key: the sheet a list item was opened into, so that sheet morphs the item in. */
export const MORPH_STORAGE_KEY = "orkide-morph";

/**
 * Pre-paint bootstrap of the visitor's print and motion choice, inlined in <head> so the page never
 * flashes the wrong print or starts motion the visitor switched off (`html.calm`). After the first
 * page of a visit it also sets `html.o-seen`, so the sheet frame draws itself in only once. It is a
 * constant string (not `define:vars`): `astro.config.ts` hashes it into the CSP at build time.
 *
 * It also directs page changes (cross-document view transitions, styles/motion.css), which only
 * a script that runs before first paint can do: going back in history or up to a parent sheet
 * adds the `back` type, so the sheets slide the other way; opening a list item names its sheet
 * number and title (`data-morph` inside `[data-morph-href]`) and the opened sheet names its own
 * (`data-morph` inside `[data-morph-target]`), so they glide from the list into place.
 */
export const themeScript = `(() => {
  const root = document.documentElement;
  try { root.classList.toggle("light", localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "light"); } catch {}
  try { root.classList.toggle("calm", localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)}) === "off"); } catch {}
  try { if (sessionStorage.getItem("orkide-seen")) { root.classList.add("o-seen"); } else { sessionStorage.setItem("orkide-seen", "1"); } } catch {}
  const moving = () => !root.classList.contains("calm") && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let named = [];
  const name = (scope) => {
    for (const part of scope.querySelectorAll("[data-morph]")) {
      part.style.viewTransitionName = "o-morph-" + part.dataset.morph;
      named.push(part);
    }
  };
  const unname = () => {
    for (const part of named) { part.style.viewTransitionName = ""; }
    named = [];
  };
  addEventListener("pageswap", (event) => {
    const to = event.activation && event.activation.entry && event.activation.entry.url;
    if (!event.viewTransition || !to || !moving()) { return; }
    const path = new URL(to).pathname;
    const item = document.querySelector("[data-morph-href=\\"" + CSS.escape(path) + "\\"]");
    if (!item) { return; }
    name(item);
    try { sessionStorage.setItem(${JSON.stringify(MORPH_STORAGE_KEY)}, path); } catch {}
  });
  addEventListener("pagereveal", (event) => {
    unname();
    let morph = null;
    try { morph = sessionStorage.getItem(${JSON.stringify(MORPH_STORAGE_KEY)}); sessionStorage.removeItem(${JSON.stringify(MORPH_STORAGE_KEY)}); } catch {}
    const transition = event.viewTransition;
    if (!transition) { return; }
    const activation = window.navigation && navigation.activation;
    const from = activation && activation.from;
    let back = false;
    if (activation && from && activation.navigationType === "traverse") {
      back = activation.entry.index < from.index;
    } else if (from && from.url) {
      const parent = location.pathname.replace(/\\/$/, "") + "/";
      back = new URL(from.url).pathname.startsWith(parent);
    }
    if (back) { transition.types.add("back"); }
    const target = document.querySelector("[data-morph-target]");
    if (!back && morph === location.pathname && target && moving()) {
      name(target);
      transition.finished.finally(unname);
    }
  });
})();`;
