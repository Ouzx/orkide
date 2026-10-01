import type { Locale } from "@orkide/i18n";

declare global {
  namespace App {
    interface Locals {
      /** Locale of the current request, resolved from the URL by the i18n middleware. */
      locale: Locale;
    }
  }
}
