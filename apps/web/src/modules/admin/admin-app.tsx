import type { Locale } from "@orkide/i18n";
import { Toaster } from "@orkide/ui/components/sonner";
import { TooltipProvider } from "@orkide/ui/components/tooltip";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";

import { errorMessage } from "./api.ts";
import { AdminProvider, createCan } from "./context.tsx";
import { createAdminRouter } from "./router.tsx";
import type { AdminUser } from "./session.ts";

interface AdminAppProps {
  readonly user: AdminUser;
  readonly locale: Locale;
  readonly basePath: string;
  readonly siteHref: string;
}

/** The dashboard SPA: data cache, router and toasts, scoped to the signed-in user. */
export const AdminApp = (props: AdminAppProps) => {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          // Admin data changes only through this UI: keep it fresh for a while, refetch on focus.
          queries: { retry: 1, staleTime: 30_000 },
        },
        // Every failed write surfaces once, with the API's localized problem title.
        mutationCache: new MutationCache({
          onError: (error) => toast.error(errorMessage(error)),
        }),
      }),
    []
  );
  const { basePath, user } = props;
  const router = useMemo(
    () => createAdminRouter(basePath, queryClient, createCan(user)),
    [basePath, queryClient, user]
  );
  return (
    <AdminProvider {...props}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </AdminProvider>
  );
};

export default AdminApp;
