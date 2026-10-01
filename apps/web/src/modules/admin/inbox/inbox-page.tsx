import { m } from "@orkide/i18n/messages";
import { Badge } from "@orkide/ui/components/badge";
import { Button, buttonVariants } from "@orkide/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@orkide/ui/components/toggle-group";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Archive, Mail, MailOpen, Reply, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries } from "../api.ts";
import { ConfirmDelete } from "../components/confirm-delete.tsx";
import { EmptyRow, PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

type Message = Awaited<
  ReturnType<NonNullable<ReturnType<typeof queries.messages>["queryFn"]>>
>[number];
type Status = Message["status"];

const STATUSES = [
  "new",
  "read",
  "archived",
  "spam",
] as const satisfies readonly Status[];

const useStatusName = () => {
  const { options } = useAdmin();
  return (status: Status): string =>
    ({
      archived: () => m.admin_message_status_archived({}, options),
      new: () => m.admin_message_status_new({}, options),
      read: () => m.admin_message_status_read({}, options),
      spam: () => m.admin_message_status_spam({}, options),
    })[status]();
};

const useMessageMutations = () => {
  const { options } = useAdmin();
  const queryClient = useQueryClient();
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["messages"] });
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) =>
      parseResponse(
        api.api.admin.messages[":id"].$patch({
          json: { status },
          param: { id },
        })
      ),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      parseResponse(api.api.admin.messages[":id"].$delete({ param: { id } })),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await refresh();
    },
  });
  return { remove, setStatus };
};

const MessageDetail = ({ message }: { readonly message: Message }) => {
  const { can, locale, options } = useAdmin();
  const { remove, setStatus } = useMessageMutations();
  const canUpdate = can({ message: ["update"] });
  const { mutate } = setStatus;
  const received = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale]
  );

  // Opening a new message marks it as read, once: "Mark as unread" must not be undone while the
  // message stays open.
  const autoRead = useRef(false);
  useEffect(() => {
    if (canUpdate && message.status === "new" && !autoRead.current) {
      autoRead.current = true;
      mutate({ id: message.id, status: "read" });
    }
  }, [canUpdate, message.id, message.status, mutate]);
  const markUnread = () => {
    autoRead.current = true;
    mutate({ id: message.id, status: "new" });
  };

  const reply = `mailto:${message.email}?subject=${encodeURIComponent(
    `Re: ${message.subject ?? ""}`.trim()
  )}`;

  return (
    <article className="space-y-5 rounded-2xl border glass p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">
          {message.subject ?? message.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {message.name} &lt;{message.email}&gt; ·{" "}
          <span className="font-mono uppercase">{message.locale}</span> ·{" "}
          <time dateTime={message.createdAt}>
            {received.format(new Date(message.createdAt))}
          </time>
        </p>
      </header>
      <p className="whitespace-pre-wrap">{message.body}</p>
      <footer className="flex flex-wrap items-center gap-2 border-t pt-4">
        <a href={reply} className={buttonVariants()}>
          <Reply aria-hidden="true" />
          {m.admin_inbox_reply({}, options)}
        </a>
        {canUpdate ? (
          <>
            {message.status === "new" ? null : (
              <Button variant="outline" onClick={markUnread}>
                <Mail aria-hidden="true" />
                {m.admin_message_mark_unread({}, options)}
              </Button>
            )}
            {message.status === "archived" ? null : (
              <Button
                variant="outline"
                onClick={() =>
                  setStatus.mutate({ id: message.id, status: "archived" })
                }
              >
                <Archive aria-hidden="true" />
                {m.admin_message_archive({}, options)}
              </Button>
            )}
            {message.status === "spam" ? null : (
              <Button
                variant="outline"
                onClick={() =>
                  setStatus.mutate({ id: message.id, status: "spam" })
                }
              >
                <ShieldAlert aria-hidden="true" />
                {m.admin_message_spam({}, options)}
              </Button>
            )}
          </>
        ) : null}
        {can({ message: ["delete"] }) ? (
          <span className="ml-auto">
            <ConfirmDelete
              name={message.subject ?? message.name}
              onConfirm={() => remove.mutate(message.id)}
            />
          </span>
        ) : null}
      </footer>
    </article>
  );
};

export const InboxPage = () => {
  const { options } = useAdmin();
  const statusName = useStatusName();
  const { data } = useSuspenseQuery(queries.messages());
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selectedId, setSelectedId] = useState<string>();
  const visible =
    filter === "all"
      ? data
      : data.filter((message) => message.status === filter);
  const selected = data.find((message) => message.id === selectedId);

  return (
    <>
      <PageHeader
        title={m.admin_inbox_title({}, options)}
        actions={
          <ToggleGroup
            value={[filter]}
            onValueChange={(value) =>
              setFilter((value[0] as Status | "all" | undefined) ?? "all")
            }
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">
              {m.admin_inbox_all({}, options)}
            </ToggleGroupItem>
            {STATUSES.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {statusName(status)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />
      {visible.length === 0 ? (
        <EmptyRow>{m.admin_inbox_empty({}, options)}</EmptyRow>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <ul className="space-y-2">
            {visible.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  aria-current={message.id === selectedId ? "true" : undefined}
                  className="flex w-full items-start gap-3 rounded-xl border glass p-3 text-left transition-colors hover:border-primary/40 aria-[current]:border-primary"
                >
                  {message.status === "new" ? (
                    <Mail
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                  ) : (
                    <MailOpen
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {message.name}
                      </span>
                      <Badge variant="outline">
                        {statusName(message.status)}
                      </Badge>
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {message.subject ?? message.body}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <MessageDetail key={selected.id} message={selected} />
          ) : null}
        </div>
      )}
    </>
  );
};
