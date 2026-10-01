import { locales } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Button } from "@orkide/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orkide/ui/components/dialog";
import { Input } from "@orkide/ui/components/input";
import { Label } from "@orkide/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@orkide/ui/components/tabs";
import { ALLOWED_MEDIA_TYPES } from "@orkide/validators/limits";
import type { MediaUpdate } from "@orkide/validators/media";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Copy, FileIcon, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries } from "../api.ts";
import { ConfirmDelete } from "../components/confirm-delete.tsx";
import { EmptyRow, PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";
import { formatBytes, isImage, mediaUrl } from "./media-utils.ts";
import type { MediaRecord } from "./media-utils.ts";
import { uploadMedia } from "./upload.ts";

const ACCEPT = Object.keys(ALLOWED_MEDIA_TYPES).join(",");

/** Square preview: a small image variant, or a file icon for documents and video. */
export const MediaThumb = ({ record }: { readonly record: MediaRecord }) =>
  isImage(record) ? (
    <img
      src={`${mediaUrl(record)}?w=320`}
      alt=""
      loading="lazy"
      className="size-full object-cover"
    />
  ) : (
    <span className="grid size-full place-items-center bg-muted text-muted-foreground">
      <FileIcon aria-hidden="true" className="size-8" />
      <span className="sr-only">{record.mimeType}</span>
    </span>
  );

const useUpload = () => {
  const { options } = useAdmin();
  const queryClient = useQueryClient();
  const uploadOne = async (file: File) => {
    try {
      await toast
        .promise(uploadMedia(file), {
          error: (error: Error) => error.message,
          loading: m.admin_media_uploading({ name: file.name }, options),
          success: m.admin_media_uploaded({ name: file.name }, options),
        })
        .unwrap();
    } catch {
      // The failure is already surfaced by the toast; carry on with the next file.
    }
  };
  // Sequential: each upload is rate-limited and hashed server-side; parallel bursts would 429.
  const uploadInOrder = async (queue: readonly File[]): Promise<void> => {
    const [file, ...rest] = queue;
    if (file) {
      await uploadOne(file);
      await uploadInOrder(rest);
    }
  };
  return async (files: Iterable<File>) => {
    await uploadInOrder([...files]);
    await queryClient.invalidateQueries({ queryKey: ["media"] });
  };
};

const Dropzone = () => {
  const { options } = useAdmin();
  const upload = useUpload();
  const [dragging, setDragging] = useState(false);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files);
  };
  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.currentTarget;
    if (files) {
      upload([...files]);
    }
    event.currentTarget.value = "";
  };
  return (
    <div
      role="presentation"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      data-dragging={dragging}
      className="group mb-8"
    >
      <label className="live-border flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed glass p-10 text-center text-muted-foreground transition-colors group-data-[dragging=true]:border-primary group-data-[dragging=true]:text-foreground hover:text-foreground">
        <UploadCloud aria-hidden="true" className="size-8" />
        <span>{m.admin_media_drop({}, options)}</span>
        <input
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={onPick}
        />
      </label>
    </div>
  );
};

const DetailsDialog = ({
  record,
  onClose,
}: {
  readonly record: MediaRecord;
  readonly onClose: () => void;
}) => {
  const { can, options } = useAdmin();
  const queryClient = useQueryClient();
  const editable = can({ media: ["update"] });
  const save = useMutation({
    mutationFn: (json: MediaUpdate) =>
      parseResponse(
        api.api.admin.media[":id"].$put({ json, param: { id: record.id } })
      ),
    onSuccess: async () => {
      toast.success(m.admin_saved({}, options));
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      onClose();
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      parseResponse(
        api.api.admin.media[":id"].$delete({ param: { id: record.id } })
      ),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await queryClient.invalidateQueries({ queryKey: ["media"] });
      onClose();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const translations = locales.flatMap((locale) => {
      const alt = String(form.get(`alt-${locale}`) ?? "").trim();
      const caption =
        String(form.get(`caption-${locale}`) ?? "").trim() || null;
      return alt.length > 0 ? [{ alt, caption, locale }] : [];
    });
    save.mutate({ translations });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(
      new URL(mediaUrl(record), location.href).href
    );
    toast.success(m.admin_media_copied({}, options));
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{m.admin_media_details({}, options)}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
            <div className="aspect-square overflow-hidden rounded-xl border">
              <MediaThumb record={record} />
            </div>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              <p>{record.mimeType}</p>
              <p>{formatBytes(record.size)}</p>
              {record.width && record.height ? (
                <p>
                  {record.width}×{record.height}
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={copy}
              >
                <Copy aria-hidden="true" />
                {m.admin_media_copy_url({}, options)}
              </Button>
            </div>
          </div>
          <Tabs defaultValue={locales[0]}>
            <TabsList>
              {locales.map((locale) => (
                <TabsTrigger key={locale} value={locale}>
                  <span className="font-mono uppercase">{locale}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {locales.map((locale) => {
              const translation = record.translations.find(
                (each) => each.locale === locale
              );
              return (
                <TabsContent key={locale} value={locale} keepMounted>
                  <div className="space-y-3 pt-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`alt-${locale}`}>
                        {m.admin_field_alt({}, options)}
                      </Label>
                      <Input
                        id={`alt-${locale}`}
                        name={`alt-${locale}`}
                        defaultValue={translation?.alt ?? ""}
                        maxLength={300}
                        disabled={!editable}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`caption-${locale}`}>
                        {m.admin_field_caption({}, options)}
                      </Label>
                      <Input
                        id={`caption-${locale}`}
                        name={`caption-${locale}`}
                        defaultValue={translation?.caption ?? ""}
                        maxLength={500}
                        disabled={!editable}
                      />
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
          <DialogFooter className="items-center sm:justify-between">
            {can({ media: ["delete"] }) ? (
              <ConfirmDelete
                name={record.key.split("/").at(-1) ?? record.id}
                onConfirm={() => remove.mutate()}
              />
            ) : (
              <span />
            )}
            {editable ? (
              <Button type="submit" disabled={save.isPending}>
                {save.isPending
                  ? m.admin_saving({}, options)
                  : m.admin_save({}, options)}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/** Grid of media; `onSelect` turns it into a picker. */
export const MediaGrid = ({
  filter,
  onSelect,
}: {
  readonly filter?: (record: MediaRecord) => boolean;
  readonly onSelect: (record: MediaRecord) => void;
}) => {
  const { locale, options } = useAdmin();
  const { data } = useSuspenseQuery(queries.media());
  const items = filter ? data.filter(filter) : data;
  if (items.length === 0) {
    return <EmptyRow>{m.admin_empty({}, options)}</EmptyRow>;
  }
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((record) => {
        const alt = record.translations.find(
          (each) => each.locale === locale
        )?.alt;
        return (
          <li key={record.id}>
            <button
              type="button"
              onClick={() => onSelect(record)}
              className="group live-border block w-full overflow-hidden rounded-xl border glass text-left focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="block aspect-square overflow-hidden">
                <MediaThumb record={record} />
              </span>
              <span className="block truncate px-3 py-2 text-xs text-muted-foreground">
                {alt ?? record.key.split("/").at(-1)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export const MediaPage = () => {
  const { can, options } = useAdmin();
  const [selected, setSelected] = useState<MediaRecord>();
  return (
    <>
      <PageHeader title={m.admin_media_title({}, options)} />
      {can({ media: ["upload"] }) ? <Dropzone /> : null}
      <MediaGrid onSelect={setSelected} />
      {selected ? (
        <DetailsDialog
          record={selected}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </>
  );
};
