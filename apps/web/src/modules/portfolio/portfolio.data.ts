import type { Locale } from "@orkide/i18n";

import { api, orNotFound, parseResponse } from "@/shared/lib/api.ts";

/** Every published project, featured and hand-ordered first (a portfolio stays small). */
export const listProjects = (locale: Locale) =>
  parseResponse(api.api.projects.$get({ query: { locale } }));

/** `undefined` when no published project has this slug in this locale. */
export const getProject = (slug: string, locale: Locale) =>
  orNotFound(
    parseResponse(
      api.api.projects[":slug"].$get({ param: { slug }, query: { locale } })
    )
  );
