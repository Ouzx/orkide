import { baseLocale } from "@orkide/i18n";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { localizeHref } from "@orkide/i18n/runtime";
import {
  atlasCosts,
  atlasFamilies,
  atlasFamilyCodes,
  atlasFits,
} from "@orkide/validators/atlas";

import { absoluteUrl } from "@/shared/site.ts";

import { catalog, latestAddition, specimenHref } from "./catalog.ts";
import { costText, familyName, fitText } from "./labels.ts";

/**
 * `/atlas.json`: the whole catalog for agents, in the base locale. It carries everything a design
 * decision needs (fit, weight, pairings, references, the prompt starter) and how a mix is built.
 */
export const buildAtlasJson = () => {
  const options: { locale: Locale } = { locale: baseLocale };
  return {
    costs: Object.fromEntries(
      atlasCosts.map((cost) => [cost, costText(cost, baseLocale)])
    ),
    description: m.atlas_description({}, options),
    families: atlasFamilies.map((family) => ({
      code: atlasFamilyCodes[family],
      key: family,
      name: familyName(family, baseLocale),
    })),
    fits: Object.fromEntries(
      atlasFits.map((fit) => [fit, fitText(fit, baseLocale)])
    ),
    mixing: {
      aesthetic: m.atlas_role_aesthetic_text({}, options),
      content: m.atlas_role_content_text({}, options),
      hero: m.atlas_role_hero_text({}, options),
      shareExample: absoluteUrl(
        `${localizeHref("/atlas", options)}#mix=MO-03,GN-07,AE-05`
      ),
      support: m.atlas_role_support_text({}, options),
    },
    name: m.atlas_title({}, options),
    specimens: catalog.map((specimen) => ({
      added: specimen.added,
      cost: specimen.cost,
      desc: specimen.desc[baseLocale],
      family: specimen.family,
      fit: specimen.fit,
      id: specimen.id,
      name: specimen.name[baseLocale],
      pairs: specimen.pairs,
      prompt: specimen.prompt,
      refs: specimen.refs,
      slug: specimen.slug,
      tags: specimen.tags,
      url: absoluteUrl(specimenHref(specimen.slug, baseLocale)),
    })),
    updated: latestAddition(),
    url: absoluteUrl(localizeHref("/atlas", options)),
  };
};
