import type { InferRequestType } from "@orkide/api-client";
import { slugify } from "@orkide/content/slug";
import { locales } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Badge } from "@orkide/ui/components/badge";
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
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Pencil, Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries, translationFor } from "../api.ts";
import { ConfirmDelete } from "../components/confirm-delete.tsx";
import { issuesFrom, SidebarSection } from "../components/document-form.tsx";
import type { FieldIssues } from "../components/document-form.tsx";
import { EmptyRow, PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

type Taxonomy = Awaited<
  ReturnType<NonNullable<ReturnType<typeof queries.taxonomy>["queryFn"]>>
>;
type Category = Taxonomy["categories"][number];
type Tag = Taxonomy["tags"][number];
type CategoryPayload = InferRequestType<
  typeof api.api.admin.taxonomy.categories.$post
>["json"];
type TagPayload = InferRequestType<
  typeof api.api.admin.taxonomy.tags.$post
>["json"];

type Editing =
  | { readonly kind: "category"; readonly term?: Category }
  | { readonly kind: "tag"; readonly term?: Tag };

const useInvalidate = () => {
  const queryClient = useQueryClient();
  // Terms appear in posts and projects too: refresh everything that embeds them.
  return () =>
    Promise.all(
      ["taxonomy", "posts", "projects"].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
};

/** Name and slug per locale; the slug follows the name until edited. */
const TermLocaleFields = ({
  locale,
  name,
  initialSlug,
  issues,
  index,
}: {
  readonly locale: (typeof locales)[number];
  readonly name: string;
  readonly initialSlug: string;
  readonly issues: FieldIssues;
  readonly index: number;
}) => {
  const { options } = useAdmin();
  const [slug, setSlug] = useState(initialSlug);
  const slugEdited = useRef(initialSlug !== "");
  const issue = (field: string) => issues.get(`translations.${index}.${field}`);
  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {locale}
      </legend>
      <div className="space-y-1.5">
        <Label htmlFor={`name-${locale}`}>
          {m.admin_field_name({}, options)}
        </Label>
        <Input
          id={`name-${locale}`}
          name={`name-${locale}`}
          defaultValue={name}
          maxLength={80}
          aria-invalid={issue("name") ? true : undefined}
          onChange={(event) => {
            if (!slugEdited.current) {
              setSlug(slugify(event.currentTarget.value));
            }
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`slug-${locale}`}>
          {m.admin_field_slug({}, options)}
        </Label>
        <Input
          id={`slug-${locale}`}
          name={`slug-${locale}`}
          value={slug}
          aria-invalid={issue("slug") ? true : undefined}
          onChange={(event) => {
            slugEdited.current = true;
            setSlug(event.currentTarget.value);
          }}
        />
        {issue("slug") ? (
          <p role="alert" className="text-sm text-destructive">
            {issue("slug")}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
};

const TermDialog = ({
  editing,
  categories,
  onClose,
}: {
  readonly editing: Editing;
  readonly categories: readonly Category[];
  readonly onClose: () => void;
}) => {
  const { locale, options } = useAdmin();
  const invalidate = useInvalidate();
  const [issues, setIssues] = useState<FieldIssues>(new Map());
  // Issue paths index the *submitted* translations (only locales with a name).
  const [submitted, setSubmitted] = useState<readonly string[]>([]);
  const { kind, term } = editing;

  const save = useMutation({
    mutationFn: (form: FormData) => {
      const translations = locales.flatMap((each) => {
        const name = String(form.get(`name-${each}`) ?? "").trim();
        return name.length > 0
          ? [
              {
                locale: each,
                name,
                slug: String(form.get(`slug-${each}`) ?? "").trim(),
              },
            ]
          : [];
      });
      setSubmitted(translations.map((translation) => translation.locale));
      if (kind === "tag") {
        const json: TagPayload = { translations };
        return term
          ? parseResponse(
              api.api.admin.taxonomy.tags[":id"].$put({
                json,
                param: { id: term.id },
              })
            )
          : parseResponse(api.api.admin.taxonomy.tags.$post({ json }));
      }
      const json: CategoryPayload = {
        parentId: String(form.get("parentId") ?? "") || null,
        position: Number(form.get("position") ?? 0),
        translations,
      };
      return term
        ? parseResponse(
            api.api.admin.taxonomy.categories[":id"].$put({
              json,
              param: { id: term.id },
            })
          )
        : parseResponse(api.api.admin.taxonomy.categories.$post({ json }));
    },
    onError: (error) => setIssues(issuesFrom(error)),
    onSuccess: async () => {
      toast.success(m.admin_saved({}, options));
      await invalidate();
      onClose();
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save.mutate(new FormData(event.currentTarget));
  };

  const title =
    kind === "tag"
      ? m.admin_tag_new({}, options)
      : m.admin_category_new({}, options);

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>
              {term ? m.admin_edit({}, options) : title}
            </DialogTitle>
          </DialogHeader>
          {locales.map((each) => {
            const translation = term?.translations.find(
              (t) => t.locale === each
            );
            return (
              <TermLocaleFields
                key={each}
                locale={each}
                index={submitted.indexOf(each)}
                name={translation?.name ?? ""}
                initialSlug={translation?.slug ?? ""}
                issues={issues}
              />
            );
          })}
          {kind === "category" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="parentId">
                  {m.admin_field_parent({}, options)}
                </Label>
                <select
                  id="parentId"
                  name="parentId"
                  defaultValue={editing.term?.parentId ?? ""}
                  className="h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
                >
                  <option value="">{m.admin_none({}, options)}</option>
                  {categories.flatMap((category) =>
                    category.id === term?.id
                      ? []
                      : [
                          <option key={category.id} value={category.id}>
                            {
                              translationFor(category.translations, locale)
                                ?.name
                            }
                          </option>,
                        ]
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="position">
                  {m.admin_field_position({}, options)}
                </Label>
                <Input
                  id="position"
                  name="position"
                  type="number"
                  min={0}
                  defaultValue={editing.term?.position ?? 0}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending
                ? m.admin_saving({}, options)
                : m.admin_save({}, options)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const TermList = <T extends Category | Tag>({
  terms,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: {
  readonly terms: readonly T[];
  readonly onEdit: (term: T) => void;
  readonly onDelete: (term: T) => void;
  readonly canUpdate: boolean;
  readonly canDelete: boolean;
}) => {
  const { locale, options } = useAdmin();
  if (terms.length === 0) {
    return <EmptyRow>{m.admin_empty({}, options)}</EmptyRow>;
  }
  return (
    <ul className="divide-y">
      {terms.map((term) => {
        const name = translationFor(term.translations, locale)?.name ?? term.id;
        return (
          <li key={term.id} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 truncate font-medium">{name}</span>
            <span className="hidden gap-1 sm:flex">
              {term.translations.map((translation) => (
                <Badge key={translation.locale} variant="outline">
                  <span className="font-mono">
                    {translation.locale}: {translation.slug}
                  </span>
                </Badge>
              ))}
            </span>
            {canUpdate ? (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${m.admin_edit({}, options)} — ${name}`}
                onClick={() => onEdit(term)}
              >
                <Pencil aria-hidden="true" />
              </Button>
            ) : null}
            {canDelete ? (
              <ConfirmDelete name={name} onConfirm={() => onDelete(term)} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

export const TaxonomyPage = () => {
  const { can, options } = useAdmin();
  const invalidate = useInvalidate();
  const { data } = useSuspenseQuery(queries.taxonomy());
  const [editing, setEditing] = useState<Editing>();

  const removeCategory = useMutation({
    mutationFn: (id: string) =>
      parseResponse(
        api.api.admin.taxonomy.categories[":id"].$delete({ param: { id } })
      ),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await invalidate();
    },
  });
  const removeTag = useMutation({
    mutationFn: (id: string) =>
      parseResponse(
        api.api.admin.taxonomy.tags[":id"].$delete({ param: { id } })
      ),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await invalidate();
    },
  });

  const permissions = {
    create: can({ taxonomy: ["create"] }),
    delete: can({ taxonomy: ["delete"] }),
    update: can({ taxonomy: ["update"] }),
  };

  return (
    <>
      <PageHeader title={m.admin_taxonomy_title({}, options)} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SidebarSection title={m.admin_categories({}, options)}>
          <TermList
            terms={data.categories}
            canUpdate={permissions.update}
            canDelete={permissions.delete}
            onEdit={(term) => setEditing({ kind: "category", term })}
            onDelete={(term) => removeCategory.mutate(term.id)}
          />
          {permissions.create ? (
            <Button
              variant="outline"
              onClick={() => setEditing({ kind: "category" })}
            >
              <Plus aria-hidden="true" />
              {m.admin_category_new({}, options)}
            </Button>
          ) : null}
        </SidebarSection>
        <SidebarSection title={m.admin_tags({}, options)}>
          <TermList
            terms={data.tags}
            canUpdate={permissions.update}
            canDelete={permissions.delete}
            onEdit={(term) => setEditing({ kind: "tag", term })}
            onDelete={(term) => removeTag.mutate(term.id)}
          />
          {permissions.create ? (
            <Button
              variant="outline"
              onClick={() => setEditing({ kind: "tag" })}
            >
              <Plus aria-hidden="true" />
              {m.admin_tag_new({}, options)}
            </Button>
          ) : null}
        </SidebarSection>
      </div>
      {editing ? (
        <TermDialog
          editing={editing}
          categories={data.categories}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </>
  );
};
