/**
 * A drawing number from a date, so every post and project has a stable sheet number without a
 * counter: "D-261012" is the detail sheet issued on 12 October 2026.
 */
export const sheetNumber = (
  prefix: string,
  date: string | null | undefined
): string =>
  date
    ? `${prefix}-${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}`
    : `${prefix}-000000`;
