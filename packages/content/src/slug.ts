/** Letters that NFKD normalization does not decompose into ASCII. */
const TRANSLITERATIONS: Readonly<Record<string, string>> = {
  ß: "ss",
  æ: "ae",
  ð: "d",
  ø: "o",
  þ: "th",
  ı: "i",
  ł: "l",
  œ: "oe",
};

const COMBINING_MARKS = /\p{M}+/gu;
const NON_ALPHANUMERIC = /[^a-z0-9]+/gu;
const EDGE_DASHES = /^-+|-+$/gu;

/** URL slug rules: lowercase ASCII, digits and single dashes, 1–96 characters. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
export const SLUG_MAX_LENGTH = 96;

/**
 * Converts any title into a URL slug, transliterating accented and Turkish letters
 * (`"Çalışma Ağacı"` → `"calisma-agaci"`).
 */
export const slugify = (input: string): string =>
  input
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replaceAll(
      /\P{ASCII}/gu,
      (character) => TRANSLITERATIONS[character] ?? "-"
    )
    .replace(NON_ALPHANUMERIC, "-")
    .replace(EDGE_DASHES, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(EDGE_DASHES, "");
