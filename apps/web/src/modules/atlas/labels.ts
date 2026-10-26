import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type {
  AtlasFamily,
  atlasCosts,
  atlasFits,
  atlasHints,
} from "@orkide/validators/atlas";

/** The atlas's words for its own vocabulary; each map is exhaustive, so a new value needs a label. */
type Labels<Key extends string> = Record<
  Key,
  (options: { locale: Locale }) => string
>;

const families: Labels<AtlasFamily> = {
  aesthetic: (options) => m.atlas_family_aesthetic({}, options),
  generative: (options) => m.atlas_family_generative({}, options),
  motion: (options) => m.atlas_family_motion({}, options),
  play: (options) => m.atlas_family_play({}, options),
  senses: (options) => m.atlas_family_senses({}, options),
  spatial: (options) => m.atlas_family_spatial({}, options),
};

const fits: Labels<(typeof atlasFits)[number]> = {
  good: (options) => m.atlas_fit_good({}, options),
  strong: (options) => m.atlas_fit_strong({}, options),
  tune: (options) => m.atlas_fit_tune({}, options),
};

const fitTexts: Labels<(typeof atlasFits)[number]> = {
  good: (options) => m.atlas_fit_good_text({}, options),
  strong: (options) => m.atlas_fit_strong_text({}, options),
  tune: (options) => m.atlas_fit_tune_text({}, options),
};

const costs: Labels<(typeof atlasCosts)[number]> = {
  heavy: (options) => m.atlas_cost_heavy({}, options),
  light: (options) => m.atlas_cost_light({}, options),
  medium: (options) => m.atlas_cost_medium({}, options),
};

const costTexts: Labels<(typeof atlasCosts)[number]> = {
  heavy: (options) => m.atlas_cost_heavy_text({}, options),
  light: (options) => m.atlas_cost_light_text({}, options),
  medium: (options) => m.atlas_cost_medium_text({}, options),
};

const hints: Labels<(typeof atlasHints)[number]> = {
  click: (options) => m.atlas_hint_click({}, options),
  drag: (options) => m.atlas_hint_drag({}, options),
  hover: (options) => m.atlas_hint_hover({}, options),
  move: (options) => m.atlas_hint_move({}, options),
  slider: (options) => m.atlas_hint_slider({}, options),
  tap: (options) => m.atlas_hint_tap({}, options),
};

export const familyName = (family: AtlasFamily, locale: Locale): string =>
  families[family]({ locale });

export const fitName = (
  fit: (typeof atlasFits)[number],
  locale: Locale
): string => fits[fit]({ locale });

export const fitText = (
  fit: (typeof atlasFits)[number],
  locale: Locale
): string => fitTexts[fit]({ locale });

export const costName = (
  cost: (typeof atlasCosts)[number],
  locale: Locale
): string => costs[cost]({ locale });

export const costText = (
  cost: (typeof atlasCosts)[number],
  locale: Locale
): string => costTexts[cost]({ locale });

export const hintText = (
  hint: (typeof atlasHints)[number],
  locale: Locale
): string => hints[hint]({ locale });
