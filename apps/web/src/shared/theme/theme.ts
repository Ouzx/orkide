export const THEME_STORAGE_KEY = "orkide-theme";

export const themes = ["system", "light", "dark"] as const;
export type Theme = (typeof themes)[number];

export const isTheme = (value: unknown): value is Theme =>
  themes.includes(value as Theme);

const darkQuery = () => matchMedia("(prefers-color-scheme: dark)");

export const readTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    return "system";
  }
};

/** Applies `theme` to <html>: the `.dark` class drives the palette, `data-theme` the switch. */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && darkQuery().matches);
  root.classList.toggle("dark", dark);
  root.dataset.theme = theme;
};

export const storeTheme = (theme: Theme): void => {
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Storage can be unavailable (private mode, disabled cookies): the choice lasts for the page.
  }
  applyTheme(theme);
};

/** Keeps a "system" choice in sync when the OS switches between light and dark. */
export const followSystemTheme = (): void => {
  darkQuery().addEventListener("change", () => {
    if (readTheme() === "system") {
      applyTheme("system");
    }
  });
};
