import type { Locale } from "@orkide/i18n";
import { locales } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Badge } from "@orkide/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@orkide/ui/components/table";
import type { PostRecord } from "@orkide/validators/content";
import type { ReactNode } from "react";

import { translationFor } from "../api.ts";
import { useAdmin } from "../context.tsx";
import { ConfirmDelete } from "./confirm-delete.tsx";
import { EmptyRow } from "./page.tsx";
import { StatusBadge } from "./status-badge.tsx";

/** The fields a post or project row shares (both records derive from the same document model). */
type DocumentRow = Pick<PostRecord, "id" | "status" | "updatedAt"> & {
  readonly translations: readonly { locale: Locale; title: string }[];
};

const date = (iso: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(iso)
  );

/** Posts and projects share this table: title, status, translations, last update, actions. */
export const DocumentTable = ({
  rows,
  renderTitle,
  canDelete,
  onDelete,
}: {
  readonly rows: readonly DocumentRow[];
  readonly renderTitle: (id: string, title: string) => ReactNode;
  readonly canDelete: boolean;
  readonly onDelete: (id: string) => void;
}) => {
  const { locale, options } = useAdmin();
  if (rows.length === 0) {
    return <EmptyRow>{m.admin_empty({}, options)}</EmptyRow>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border glass">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.admin_field_title({}, options)}</TableHead>
            <TableHead>{m.admin_status({}, options)}</TableHead>
            <TableHead className="hidden sm:table-cell">
              <span className="sr-only">{m.locale_label({}, options)}</span>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              {m.admin_updated({}, options)}
            </TableHead>
            <TableHead className="w-12">
              <span className="sr-only">{m.admin_actions({}, options)}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const title =
              translationFor(row.translations, locale)?.title ?? row.id;
            const translated = new Set(
              row.translations.map((each) => each.locale)
            );
            return (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="block max-w-80 truncate font-medium">
                    {renderTitle(row.id, title)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="flex gap-1">
                    {locales.map((each) => (
                      <Badge
                        key={each}
                        variant={translated.has(each) ? "secondary" : "outline"}
                      >
                        <span
                          className="font-mono uppercase data-[missing=true]:opacity-40"
                          data-missing={!translated.has(each)}
                        >
                          {each}
                        </span>
                      </Badge>
                    ))}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-muted-foreground">
                    {date(row.updatedAt, locale)}
                  </span>
                </TableCell>
                <TableCell>
                  {canDelete ? (
                    <ConfirmDelete
                      name={title}
                      onConfirm={() => onDelete(row.id)}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
