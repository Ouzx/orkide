import { locales } from "@orkide/i18n";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@orkide/ui/kit/alert-dialog";
import { Button } from "@orkide/ui/kit/button";
import { ToggleGroup, ToggleGroupItem } from "@orkide/ui/kit/toggle-group";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries } from "../api.ts";
import { issuesFrom } from "../components/document-form.tsx";
import type { FieldIssues } from "../components/document-form.tsx";
import { PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";
import { SECTION_LABELS } from "./labels.ts";
import { SchemaForm } from "./schema-form.tsx";
import type { Schema, Value } from "./schema-form.tsx";

type Sections = Awaited<
  ReturnType<NonNullable<ReturnType<typeof queries.site>["queryFn"]>>
>;
type SectionKey = keyof Sections;
type Entry = Sections[SectionKey];

const NO_ISSUES: FieldIssues = new Map();

/** Asks before dropping the saved text of a section. */
const ResetSection = ({
  name,
  disabled,
  onConfirm,
}: {
  readonly name: string;
  readonly disabled: boolean;
  readonly onConfirm: () => void;
}) => {
  const { options } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={disabled}
        render={<Button type="button" variant="outline" />}
      >
        <RotateCcw aria-hidden="true" />
        {m.admin_site_reset({}, options)}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {m.admin_site_reset_title({ name }, options)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {m.admin_site_reset_body({}, options)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.admin_cancel({}, options)}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {m.admin_site_reset({}, options)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/** One section in one locale: its form, saved as a whole. */
const SectionEditor = ({
  section,
  locale,
  entry,
  draft,
  onDraft,
}: {
  readonly section: SectionKey;
  readonly locale: Locale;
  readonly entry: Entry;
  /** Unsaved edits; `undefined` shows what is stored. */
  readonly draft: Value;
  readonly onDraft: (draft?: Value) => void;
}) => {
  const { can, options } = useAdmin();
  const queryClient = useQueryClient();
  const [issues, setIssues] = useState<FieldIssues>(NO_ISSUES);
  const canEdit = can({ site: ["update"] });
  const name = SECTION_LABELS[section]({}, options);
  // The API sends JSON: the section's content and its JSON Schema.
  const value = draft ?? (entry.content as Value);
  const dates = useMemo(
    () =>
      new Intl.DateTimeFormat(options.locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [options.locale]
  );
  const settle = async () => {
    setIssues(NO_ISSUES);
    await queryClient.invalidateQueries({ queryKey: ["site"] });
    onDraft();
  };
  const save = useMutation({
    mutationFn: () =>
      parseResponse(
        api.api.admin.site[":key"].$put({
          json: value,
          param: { key: section },
          query: { locale },
        })
      ),
    onError: (error) => setIssues(issuesFrom(error)),
    onSuccess: async () => {
      toast.success(m.admin_saved({}, options));
      await settle();
    },
  });
  const reset = useMutation({
    mutationFn: () =>
      parseResponse(
        api.api.admin.site[":key"].$delete({
          param: { key: section },
          query: { locale },
        })
      ),
    onSuccess: async () => {
      toast.success(m.admin_site_reset_done({}, options));
      await settle();
    },
  });
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };
  return (
    <section
      aria-labelledby="site-section"
      className="o-card space-y-6 p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="site-section" className="o-card-title text-2xl">
          {name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {entry.savedAt
            ? m.admin_site_saved_at(
                { date: dates.format(new Date(entry.savedAt)) },
                options
              )
            : m.admin_site_shipped({}, options)}
        </p>
      </header>
      <form className="space-y-6" onSubmit={onSubmit}>
        <fieldset disabled={!canEdit} className="min-w-0">
          <SchemaForm
            section={section}
            issues={issues}
            schema={entry.schema as Schema}
            value={value}
            onChange={onDraft}
          />
        </fieldset>
        {canEdit ? (
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={save.isPending}>
              {m.admin_save({}, options)}
            </Button>
            {entry.savedAt ? (
              <ResetSection
                name={name}
                disabled={reset.isPending}
                onConfirm={() => {
                  reset.mutate();
                }}
              />
            ) : null}
          </div>
        ) : null}
      </form>
    </section>
  );
};

/** Every section of the site, in both languages: a saved section replaces the shipped one. */
export const SitePage = () => {
  const { locale: adminLocale, options } = useAdmin();
  const [locale, setLocale] = useState<Locale>(adminLocale);
  const [section, setSection] = useState<SectionKey>("hero");
  // Unsaved edits per locale and section, kept while the admin moves between sections.
  const [drafts, setDrafts] = useState<Readonly<Record<string, Value>>>({});
  const { data: sections } = useSuspenseQuery(queries.site(locale));
  const keys = Object.keys(sections) as SectionKey[];
  const draftKey = `${locale}:${section}`;
  return (
    <>
      <PageHeader
        title={m.admin_nav_site({}, options)}
        description={m.admin_site_description({}, options)}
        actions={
          <ToggleGroup
            value={[locale]}
            onValueChange={(value) => {
              const next = locales.find((each) => each === value[0]);
              if (next) {
                setLocale(next);
              }
            }}
            variant="outline"
            size="sm"
            aria-label={m.admin_site_language({}, options)}
          >
            {locales.map((each) => (
              <ToggleGroupItem key={each} value={each}>
                {each.toUpperCase()}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label={m.admin_site_sections({}, options)}>
          <ul className="flex flex-wrap gap-1 lg:block lg:space-y-1">
            {keys.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  aria-current={key === section ? "true" : undefined}
                  className="o-palette-link w-full text-left"
                  onClick={() => {
                    setSection(key);
                  }}
                >
                  <i aria-hidden="true" />
                  <span className="truncate">
                    {SECTION_LABELS[key]({}, options)}
                  </span>
                  {sections[key].savedAt ? (
                    <span className="flex items-center">
                      <span
                        aria-hidden="true"
                        className="size-1.5 rounded-full bg-primary"
                      />
                      <span className="sr-only">
                        {m.admin_saved({}, options)}
                      </span>
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <SectionEditor
          key={draftKey}
          section={section}
          locale={locale}
          entry={sections[section]}
          draft={drafts[draftKey]}
          onDraft={(draft) => {
            setDrafts((current) => ({ ...current, [draftKey]: draft }));
          }}
        />
      </div>
    </>
  );
};
