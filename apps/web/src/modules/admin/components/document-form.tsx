import { slugify } from "@orkide/content/slug";
import type { Locale } from "@orkide/i18n";
import { locales } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Badge } from "@orkide/ui/components/badge";
import { Button } from "@orkide/ui/components/button";
import { Checkbox } from "@orkide/ui/components/checkbox";
import { Input } from "@orkide/ui/components/input";
import { Label } from "@orkide/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@orkide/ui/components/tabs";
import { Textarea } from "@orkide/ui/components/textarea";
import type {
  DocumentTranslationInput,
  PostRecord,
} from "@orkide/validators/content";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Plus, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { problemOf, queries } from "../api.ts";
import { useAdmin } from "../context.tsx";
import { RichTextEditor } from "../editor/rich-text-editor.tsx";
import { useMediaPicker } from "../media/media-picker.tsx";
import { isImage, mediaUrl, toMedia } from "../media/media-utils.ts";
import { useStatusLabel } from "./status-badge.tsx";

type Status = PostRecord["status"];
type Translation = DocumentTranslationInput;

/** Shared editable state of a post or project (the fields both document kinds have). */
export interface DocumentDraft {
  readonly status: Status;
  readonly scheduledAt: string | null;
  readonly coverMediaId: string | null;
  readonly tagIds: readonly string[];
  readonly translations: readonly Translation[];
}

/** Field-level problems from the API, keyed by JSON path (`translations.0.slug`). */
export type FieldIssues = ReadonlyMap<string, string>;

/** Maps an API validation problem (RFC 9457 `issues`) to field paths. */
export const issuesFrom = (error: unknown): FieldIssues =>
  new Map(
    (problemOf(error)?.issues ?? []).map((issue) => [
      issue.path.join("."),
      issue.message,
    ])
  );

export const emptyDocument = (): RichTextDocumentValue => ({
  content: [{ type: "paragraph" }],
  type: "doc",
});

type RichTextDocumentValue = Translation["content"];

const emptyTranslation = (locale: Locale): Translation => ({
  content: emptyDocument(),
  locale,
  seoDescription: null,
  seoTitle: null,
  slug: "",
  summary: "",
  title: "",
});

/** `datetime-local` value (local time) ⇄ ISO-8601. */
export const toLocalInput = (iso: string | null): string => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const fromLocalInput = (value: string): string | null =>
  value ? new Date(value).toISOString() : null;

const FieldError = ({ message }: { readonly message: string | undefined }) =>
  message ? (
    <p role="alert" className="text-sm text-destructive">
      {message}
    </p>
  ) : null;

const TranslationFields = ({
  translation,
  index,
  issues,
  onChange,
  pickImage,
  editable,
}: {
  readonly translation: Translation;
  readonly index: number;
  readonly issues: FieldIssues;
  readonly onChange: (next: Translation) => void;
  readonly pickImage: () => Promise<ReturnType<typeof toMedia> | undefined>;
  readonly editable: boolean;
}) => {
  const { options } = useAdmin();
  const id = useId();
  // The slug follows the title until it is edited by hand.
  const slugEdited = useRef(translation.slug !== "");
  const issue = (field: string) => issues.get(`translations.${index}.${field}`);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-title`}>
          {m.admin_field_title({}, options)}
        </Label>
        <Input
          id={`${id}-title`}
          value={translation.title}
          required
          maxLength={140}
          className="h-11"
          aria-invalid={issue("title") ? true : undefined}
          onChange={(event) => {
            const title = event.currentTarget.value;
            onChange({
              ...translation,
              slug: slugEdited.current ? translation.slug : slugify(title),
              title,
            });
          }}
        />
        <FieldError message={issue("title")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-slug`}>{m.admin_field_slug({}, options)}</Label>
        <Input
          id={`${id}-slug`}
          value={translation.slug}
          required
          maxLength={96}
          aria-invalid={issue("slug") ? true : undefined}
          onChange={(event) => {
            slugEdited.current = true;
            onChange({ ...translation, slug: event.currentTarget.value });
          }}
        />
        <FieldError message={issue("slug")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-summary`}>
          {m.admin_field_summary({}, options)}
        </Label>
        <Textarea
          id={`${id}-summary`}
          value={translation.summary}
          required
          maxLength={300}
          rows={3}
          aria-invalid={issue("summary") ? true : undefined}
          onChange={(event) =>
            onChange({ ...translation, summary: event.currentTarget.value })
          }
        />
        <FieldError message={issue("summary")} />
      </div>
      <div className="space-y-1.5">
        <p id={`${id}-content`} className="text-sm font-medium">
          {m.admin_field_content({}, options)}
        </p>
        <RichTextEditor
          labelledBy={`${id}-content`}
          editable={editable}
          value={translation.content}
          onChange={(content) => onChange({ ...translation, content })}
          onRequestImage={pickImage}
        />
        <FieldError message={issue("content")} />
      </div>
      <fieldset className="space-y-4 rounded-2xl border glass p-5">
        <legend className="px-1 text-sm font-medium">
          {m.admin_section_seo({}, options)}
        </legend>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-seo-title`}>
            {m.admin_field_seo_title({}, options)}
          </Label>
          <Input
            id={`${id}-seo-title`}
            value={translation.seoTitle ?? ""}
            maxLength={70}
            placeholder={translation.title}
            onChange={(event) =>
              onChange({
                ...translation,
                seoTitle: event.currentTarget.value || null,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-seo-description`}>
            {m.admin_field_seo_description({}, options)}
          </Label>
          <Textarea
            id={`${id}-seo-description`}
            value={translation.seoDescription ?? ""}
            maxLength={160}
            rows={2}
            placeholder={translation.summary}
            onChange={(event) =>
              onChange({
                ...translation,
                seoDescription: event.currentTarget.value || null,
              })
            }
          />
        </div>
      </fieldset>
    </div>
  );
};

export const SidebarSection = ({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) => (
  <section className="space-y-4 rounded-2xl border glass p-5">
    <h2 className="text-sm font-medium">{title}</h2>
    {children}
  </section>
);

const languageName = (locale: Locale) =>
  ({
    en: () => m.locale_name_en({}, { locale: "en" }),
    tr: () => m.locale_name_tr({}, { locale: "tr" }),
  })[locale]();

/**
 * Editor for a post or project. Owns translations, status, schedule, tags and cover; the page
 * adds kind-specific sidebar fields (`sidebar`) and turns the draft into an API payload.
 */
export const DocumentForm = ({
  initial,
  tags,
  canPublish,
  canSave,
  issues,
  saving,
  sidebar,
  onSubmit,
}: {
  readonly initial: DocumentDraft;
  readonly tags: readonly { id: string; name: string }[];
  readonly canPublish: boolean;
  /** Whether the user may write this document; when false the form is a read-only view. */
  readonly canSave: boolean;
  readonly issues: FieldIssues;
  readonly saving: boolean;
  readonly sidebar?: ReactNode;
  readonly onSubmit: (draft: DocumentDraft) => void;
}) => {
  const { locale, options } = useAdmin();
  const statusLabel = useStatusLabel();
  const [draft, setDraft] = useState<DocumentDraft>(initial);
  const [tab, setTab] = useState<Locale>(
    initial.translations.some((each) => each.locale === locale)
      ? locale
      : (initial.translations[0]?.locale ?? locale)
  );
  const [pickerDialog, pick] = useMediaPicker();
  const { data: library } = useQuery(queries.media());
  const coverRecord = library?.find(
    (record) => record.id === draft.coverMediaId
  );

  const patch = (next: Partial<DocumentDraft>) =>
    setDraft((current) => ({ ...current, ...next }));

  const setTranslation = (next: Translation) =>
    patch({
      translations: draft.translations.map((each) =>
        each.locale === next.locale ? next : each
      ),
    });

  const statuses: readonly Status[] = canPublish
    ? ["draft", "published", "scheduled", "archived"]
    : ["draft", "archived"];

  const selectedTags = new Set(draft.tagIds);
  const statusOptions = statuses.includes(draft.status)
    ? statuses
    : [draft.status, ...statuses];

  const pickImage = async () => {
    const record = await pick(isImage);
    return record ? toMedia(record, tab) : undefined;
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }
    onSubmit(draft);
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Locale)}>
        <TabsList>
          {locales.map((each) => (
            <TabsTrigger key={each} value={each}>
              {languageName(each)}
            </TabsTrigger>
          ))}
        </TabsList>
        {locales.map((each) => {
          const index = draft.translations.findIndex((t) => t.locale === each);
          const translation = draft.translations[index];
          return (
            <TabsContent key={each} value={each}>
              {/* A disabled fieldset disables every native control inside it; the tabs stay outside. */}
              <fieldset disabled={!canSave} className="min-w-0 pt-5">
                {translation ? (
                  <>
                    <TranslationFields
                      translation={translation}
                      index={index}
                      issues={issues}
                      onChange={setTranslation}
                      pickImage={pickImage}
                      editable={canSave}
                    />
                    {canSave && draft.translations.length > 1 ? (
                      <Button
                        type="button"
                        variant="destructive"
                        className="mt-4"
                        onClick={() =>
                          patch({
                            translations: draft.translations.filter(
                              (t) => t.locale !== each
                            ),
                          })
                        }
                      >
                        <X aria-hidden="true" />
                        {m.admin_translation_remove(
                          { language: languageName(each) },
                          options
                        )}
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() =>
                      patch({
                        translations: [
                          ...draft.translations,
                          emptyTranslation(each),
                        ],
                      })
                    }
                  >
                    <Plus aria-hidden="true" />
                    {m.admin_translation_add(
                      { language: languageName(each) },
                      options
                    )}
                  </Button>
                )}
              </fieldset>
            </TabsContent>
          );
        })}
      </Tabs>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <fieldset disabled={!canSave} className="min-w-0 space-y-6">
          <SidebarSection title={m.admin_section_publishing({}, options)}>
            {canSave ? null : (
              <Badge variant="outline" className="w-fit">
                {m.admin_read_only({}, options)}
              </Badge>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="document-status">
                {m.admin_status({}, options)}
              </Label>
              <select
                id="document-status"
                value={draft.status}
                onChange={(event) =>
                  patch({ status: event.currentTarget.value as Status })
                }
                className="h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            {draft.status === "scheduled" ? (
              <div className="space-y-1.5">
                <Label htmlFor="document-scheduled-at">
                  {m.admin_field_scheduled_at({}, options)}
                </Label>
                <Input
                  id="document-scheduled-at"
                  type="datetime-local"
                  required
                  value={toLocalInput(draft.scheduledAt)}
                  onChange={(event) =>
                    patch({
                      scheduledAt: fromLocalInput(event.currentTarget.value),
                    })
                  }
                />
                <FieldError message={issues.get("scheduledAt")} />
              </div>
            ) : null}
            {canSave ? (
              <Button type="submit" className="w-full" disabled={saving}>
                {saving
                  ? m.admin_saving({}, options)
                  : m.admin_save({}, options)}
              </Button>
            ) : null}
          </SidebarSection>

          <SidebarSection title={m.admin_field_cover({}, options)}>
            {draft.coverMediaId ? (
              <div className="space-y-2">
                {coverRecord ? (
                  <img
                    src={`${mediaUrl(coverRecord)}?w=640`}
                    alt=""
                    className="aspect-video w-full rounded-xl border object-cover"
                  />
                ) : null}
                {canSave ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => patch({ coverMediaId: null })}
                  >
                    <X aria-hidden="true" />
                    {m.admin_remove({}, options)}
                  </Button>
                ) : null}
              </div>
            ) : null}
            {canSave ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const record = await pick(isImage);
                  if (record) {
                    patch({ coverMediaId: record.id });
                  }
                }}
              >
                <ImagePlus aria-hidden="true" />
                {m.admin_choose_media({}, options)}
              </Button>
            ) : null}
          </SidebarSection>

          <SidebarSection title={m.admin_section_organization({}, options)}>
            {sidebar}
            {tags.length > 0 ? (
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium">
                  {m.admin_field_tags({}, options)}
                </legend>
                {tags.map((tag) => {
                  const checked = selectedTags.has(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        disabled={!canSave}
                        onCheckedChange={(next) =>
                          patch({
                            tagIds: next
                              ? [...draft.tagIds, tag.id]
                              : draft.tagIds.filter((id) => id !== tag.id),
                          })
                        }
                      />
                      {tag.name}
                    </label>
                  );
                })}
              </fieldset>
            ) : null}
          </SidebarSection>
        </fieldset>
      </aside>
      {pickerDialog}
    </form>
  );
};
