import { hasPermission } from "@orkide/auth/permissions";
import type { Permissions } from "@orkide/auth/permissions";
import type { Locale } from "@orkide/i18n";
import { createContext, use, useMemo } from "react";
import type { ReactNode } from "react";

import type { AdminUser } from "./session.ts";

export interface AdminContextValue {
  readonly user: AdminUser;
  readonly locale: Locale;
  /** Paraglide message options for this locale (`m.key(params, options)`). */
  readonly options: { readonly locale: Locale };
  /** Localized dashboard root, e.g. `/tr/admin`. */
  readonly basePath: string;
  readonly siteHref: string;
  /**
   * Whether the user's role grants `permissions` — the same role definitions the API enforces,
   * so the UI only offers actions that will succeed.
   */
  readonly can: (permissions: Permissions) => boolean;
}

/** Role-based permission check for `user`, the same one the API enforces. */
export const createCan =
  (user: AdminUser): AdminContextValue["can"] =>
  (permissions) =>
    hasPermission(user.role, permissions);

const AdminContext = createContext<AdminContextValue | null>(null);

export const AdminProvider = ({
  children,
  ...value
}: Omit<AdminContextValue, "can" | "options"> & { children: ReactNode }) => {
  const { basePath, locale, siteHref, user } = value;
  const context = useMemo<AdminContextValue>(
    () => ({
      basePath,
      can: createCan(user),
      locale,
      options: { locale },
      siteHref,
      user,
    }),
    [basePath, locale, siteHref, user]
  );
  return <AdminContext value={context}>{children}</AdminContext>;
};

export const useAdmin = (): AdminContextValue => {
  const context = use(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used inside <AdminProvider>");
  }
  return context;
};
