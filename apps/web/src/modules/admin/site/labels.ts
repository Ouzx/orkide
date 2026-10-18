import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { SiteKey } from "@orkide/validators/site";

/** A message without parameters, like every label here. */
type Label = typeof m.admin_site_f_title;

export const SECTION_LABELS: Record<SiteKey, Label> = {
  hero: m.admin_site_s_hero,
};

/** Field names of the section schemas (`@orkide/validators/site`). */
const FIELD_LABELS: Record<string, Label> = {
  contactCta: m.admin_site_f_contact_cta,
  eyebrow: m.admin_site_f_eyebrow,
  lead: m.admin_site_f_lead,
  title: m.admin_site_f_title,
  workCta: m.admin_site_f_work_cta,
};

export const fieldLabel = (
  _section: SiteKey,
  name: string,
  options: { readonly locale: Locale }
): string => FIELD_LABELS[name]?.({}, options) ?? name;

/** Choices of enumerated fields, by value. A product adds its own. */
const OPTION_LABELS: Record<string, Label> = {};

export const optionLabel = (
  value: string,
  options: { readonly locale: Locale }
): string => OPTION_LABELS[value]?.({}, options) ?? value;
