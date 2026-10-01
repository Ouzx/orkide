import { m } from "@orkide/i18n/messages";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@orkide/ui/components/avatar";
import { Button } from "@orkide/ui/components/button";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Fingerprint, KeyRound } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { authClient } from "../auth-client.ts";
import { ConfirmDelete } from "../components/confirm-delete.tsx";
import { SidebarSection } from "../components/document-form.tsx";
import { PageHeader, QueryBoundary } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

const PASSKEYS = ["passkeys"] as const;

/** Better Auth returns `{ data, error }`; surface errors to React Query as throws. */
const unwrap = <T,>(
  result: { data: T; error: null } | { data: null; error: { message?: string } }
): T => {
  if (result.error) {
    throw new Error(result.error.message ?? "Request failed");
  }
  return result.data;
};

const Passkeys = () => {
  const { locale, options } = useAdmin();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryFn: async () =>
      unwrap(await authClient.passkey.listUserPasskeys()) ?? [],
    queryKey: PASSKEYS,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: PASSKEYS });

  const add = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey();
      if (result?.error) {
        throw new Error(result.error.message ?? "Passkey registration failed");
      }
    },
    onSuccess: async () => {
      toast.success(m.admin_passkey_added({}, options));
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      unwrap(await authClient.passkey.deletePasskey({ id })),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await refresh();
    },
  });

  const date = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale]
  );

  return (
    <SidebarSection title={m.admin_passkeys({}, options)}>
      <p className="text-sm text-muted-foreground">
        {m.admin_passkeys_lead({}, options)}
      </p>
      <ul className="divide-y">
        {data.map((passkey) => (
          <li key={passkey.id} className="flex items-center gap-3 py-2.5">
            <KeyRound
              aria-hidden="true"
              className="size-4 text-muted-foreground"
            />
            <span className="flex-1 truncate">
              {passkey.name ?? m.admin_passkey_unnamed({}, options)}
              <span className="ml-2 text-xs text-muted-foreground">
                {date.format(new Date(passkey.createdAt))}
              </span>
            </span>
            <ConfirmDelete
              name={passkey.name ?? m.admin_passkey_unnamed({}, options)}
              onConfirm={() => remove.mutate(passkey.id)}
            />
          </li>
        ))}
      </ul>
      <Button onClick={() => add.mutate()} disabled={add.isPending}>
        <Fingerprint aria-hidden="true" />
        {m.admin_passkey_add({}, options)}
      </Button>
    </SidebarSection>
  );
};

export const AccountPage = () => {
  const { options, user } = useAdmin();
  const role = {
    editor: () => m.admin_role_editor({}, options),
    owner: () => m.admin_role_owner({}, options),
    viewer: () => m.admin_role_viewer({}, options),
  }[user.role]();
  return (
    <>
      <PageHeader title={m.admin_account_title({}, options)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SidebarSection title={user.name}>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {user.image ? <AvatarImage src={user.image} alt="" /> : null}
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <dl className="text-sm">
              <dt className="sr-only">{m.contact_email({}, options)}</dt>
              <dd>{user.email}</dd>
              <dt className="sr-only">{m.admin_role({}, options)}</dt>
              <dd className="text-muted-foreground">{role}</dd>
            </dl>
          </div>
        </SidebarSection>
        <QueryBoundary>
          <Passkeys />
        </QueryBoundary>
      </div>
    </>
  );
};
