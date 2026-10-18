import type { Locale } from "@orkide/i18n";

import type { SiteContent } from "./site.ts";

/**
 * The site's shipped content, per locale: what each section shows until the admin saves its own
 * (the `site` API).
 */
export const siteDefaults: Record<Locale, SiteContent> = {
  en: {
    hero: {
      contactCta: "Get in touch",
      eyebrow: "Software engineer · Builder",
      lead: "I design and build products end to end — from edge infrastructure to the last pixel — and write about what I learn along the way.",
      title: "Fast, careful software for the open web.",
      workCta: "See the work",
    },
  },
  tr: {
    hero: {
      contactCta: "İletişime geç",
      eyebrow: "Yazılım mühendisi · Üretici",
      lead: "Ürünleri uçtan uca tasarlayıp geliştiriyorum — uç altyapıdan son piksele kadar — ve yol boyunca öğrendiklerimi yazıyorum.",
      title: "Açık web için hızlı ve özenli yazılım.",
      workCta: "İşleri gör",
    },
  },
};
