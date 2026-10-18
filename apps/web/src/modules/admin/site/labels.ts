import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import type { SiteKey } from "@orkide/validators/site";

/** A message without parameters, like every label here. */
type Label = typeof m.admin_site_f_title;

export const SECTION_LABELS: Record<SiteKey, Label> = {
  derive: m.admin_site_s_derive,
  hero: m.admin_site_s_hero,
  inside: m.admin_site_s_inside,
  stack: m.admin_site_s_stack,
};

/** Field names of the section schemas (`@orkide/validators/site`). */
const FIELD_LABELS: Record<string, Label> = {
  command: m.admin_site_f_command,
  contactCta: m.admin_site_f_contact_cta,
  cta: m.admin_site_f_cta,
  eyebrow: m.admin_site_f_eyebrow,
  features: m.admin_site_f_features,
  kicker: m.admin_site_f_kicker,
  label: m.admin_site_f_label,
  lead: m.admin_site_f_lead,
  meters: m.admin_site_f_meters,
  name: m.admin_site_f_name,
  note: m.admin_site_f_note,
  stages: m.admin_site_f_stages,
  steps: m.admin_site_f_steps,
  text: m.admin_site_f_text,
  timing: m.admin_site_f_timing,
  title: m.admin_site_f_title,
  unit: m.admin_site_f_unit,
  url: m.admin_site_f_url,
  value: m.admin_site_f_value,
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
