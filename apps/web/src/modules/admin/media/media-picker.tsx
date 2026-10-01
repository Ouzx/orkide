import { m } from "@orkide/i18n/messages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@orkide/ui/components/dialog";
import { useState } from "react";
import type { ReactNode } from "react";

import { QueryBoundary } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";
import { MediaGrid } from "./media-page.tsx";
import type { MediaRecord } from "./media-utils.ts";

interface PickRequest {
  readonly resolve: (record: MediaRecord | undefined) => void;
  readonly filter?: (record: MediaRecord) => boolean;
}

/**
 * A media picker as a promise: `const record = await pick(isImage)` opens the library and
 * resolves with the choice, or `undefined` when dismissed. Render `dialog` once.
 */
export const useMediaPicker = (): readonly [
  dialog: ReactNode,
  pick: (
    filter?: (record: MediaRecord) => boolean
  ) => Promise<MediaRecord | undefined>,
] => {
  const { options } = useAdmin();
  const [request, setRequest] = useState<PickRequest>();

  const pick = (filter?: (record: MediaRecord) => boolean) => {
    const { promise, resolve } = Promise.withResolvers<
      MediaRecord | undefined
    >();
    setRequest({ filter, resolve });
    return promise;
  };

  const settle = (record: MediaRecord | undefined) => {
    request?.resolve(record);
    setRequest(undefined);
  };

  const dialog = request ? (
    <Dialog
      open
      onOpenChange={(open) => (open ? undefined : settle(undefined))}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{m.admin_choose_media({}, options)}</DialogTitle>
        </DialogHeader>
        <QueryBoundary>
          <MediaGrid filter={request.filter} onSelect={settle} />
        </QueryBoundary>
      </DialogContent>
    </Dialog>
  ) : null;

  return [dialog, pick] as const;
};
