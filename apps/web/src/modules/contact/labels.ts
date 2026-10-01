import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";

/**
 * Every string the contact island needs, rendered on the server. Passing them as props keeps the
 * Paraglide runtime and message catalog out of the client bundle.
 */
export const contactLabels = (locale: Locale) => {
  const options = { locale };
  return {
    body: m.contact_message({}, options),
    email: m.contact_email({}, options),
    failed: m.error_internal({}, options),
    name: m.contact_name({}, options),
    optional: m.contact_optional({}, options),
    sending: m.contact_sending({}, options),
    subject: m.contact_subject({}, options),
    submit: m.contact_submit({}, options),
    successBody: m.contact_success_body({}, options),
    successTitle: m.contact_success_title({}, options),
    verifying: m.contact_verification({}, options),
  };
};

export type ContactLabels = ReturnType<typeof contactLabels>;
