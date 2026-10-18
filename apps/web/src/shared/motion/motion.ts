export const MOTION_STORAGE_KEY = "orkide-motion";

/**
 * False when the visitor switched motion off on the site (`html.calm`, set before first paint by
 * the head script) or their system asks for reduced motion.
 */
export const motionAllowed = (): boolean =>
  !document.documentElement.classList.contains("calm") &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Stores the choice for this browser and applies it; listeners hear `motionchange` on document. */
export const storeCalm = (calm: boolean): void => {
  try {
    if (calm) {
      localStorage.setItem(MOTION_STORAGE_KEY, "off");
    } else {
      localStorage.removeItem(MOTION_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode, disabled cookies): the choice lasts for the page.
  }
  document.documentElement.classList.toggle("calm", calm);
  document.dispatchEvent(new Event("motionchange"));
};

/** Runs `start` once the first contentful paint has happened (or soon after load without it). */
export const afterFirstPaint = (start: () => void): void => {
  let started = false;
  const once = () => {
    if (!started) {
      started = true;
      start();
    }
  };
  if (performance.getEntriesByName("first-contentful-paint").length > 0) {
    once();
    return;
  }
  try {
    new PerformanceObserver((list, observer) => {
      if (list.getEntriesByName("first-contentful-paint").length > 0) {
        observer.disconnect();
        once();
      }
    }).observe({ buffered: true, type: "paint" });
  } catch {
    // Browsers without paint timing: start once the page has loaded.
  }
  addEventListener("load", () => setTimeout(once, 300), { once: true });
};
