export const THEME_STORAGE_KEY = "orkide-theme";

/**
 * Two prints: the blue print is the default (no class, also without JavaScript) and the white
 * print is the visitor's choice (`.light` on <html>, stored as "light"). The choice lives in
 * localStorage, so the cached HTML is the same for everyone.
 */
export const readWhite = (): boolean => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light";
  } catch {
    return false;
  }
};

export const storeWhite = (white: boolean): void => {
  try {
    if (white) {
      localStorage.setItem(THEME_STORAGE_KEY, "light");
    } else {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode, disabled cookies): the choice lasts for the page.
  }
  document.documentElement.classList.toggle("light", white);
};
