import { m } from "@orkide/i18n/messages";
import { Badge } from "@orkide/ui/components/badge";
import type { PostRecord } from "@orkide/validators/content";

import { useAdmin } from "../context.tsx";

type Status = PostRecord["status"];

const VARIANTS = {
  archived: "outline",
  draft: "secondary",
  published: "default",
  scheduled: "outline",
} as const satisfies Record<Status, "default" | "secondary" | "outline">;

export const useStatusLabel = () => {
  const { options } = useAdmin();
  return (status: Status): string =>
    ({
      archived: () => m.admin_status_archived({}, options),
      draft: () => m.admin_status_draft({}, options),
      published: () => m.admin_status_published({}, options),
      scheduled: () => m.admin_status_scheduled({}, options),
    })[status]();
};

export const StatusBadge = ({ status }: { readonly status: Status }) => {
  const label = useStatusLabel();
  return <Badge variant={VARIANTS[status]}>{label(status)}</Badge>;
};
