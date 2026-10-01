import type { InferRequestType } from "@orkide/api-client";
import { m } from "@orkide/i18n/messages";
import { buttonVariants } from "@orkide/ui/components/button";
import { Input } from "@orkide/ui/components/input";
import { Label } from "@orkide/ui/components/label";
import { Switch } from "@orkide/ui/components/switch";
import type { ProjectRecord } from "@orkide/validators/content";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries, translationFor } from "../api.ts";
import {
  DocumentForm,
  emptyDocument,
  issuesFrom,
  SidebarSection,
} from "../components/document-form.tsx";
import type { FieldIssues } from "../components/document-form.tsx";
import { PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

/** Request body for creating or updating a project (the wire type, inferred from the API). */
type ProjectPayload = InferRequestType<
  typeof api.api.admin.projects.$post
>["json"];

type ProjectFields = Pick<
  ProjectRecord,
  | "completedAt"
  | "featured"
  | "position"
  | "repositoryUrl"
  | "startedAt"
  | "websiteUrl"
>;

/** `<input type="date">` value ⇄ ISO-8601 (midnight UTC). */
const toDateInput = (iso: string | null): string =>
  iso ? iso.slice(0, 10) : "";
const fromDateInput = (value: string): string | null =>
  value ? new Date(`${value}T00:00:00Z`).toISOString() : null;

const ProjectEditor = ({
  project,
}: {
  readonly project: ProjectRecord | undefined;
}) => {
  const { can, locale, options } = useAdmin();
  const queryClient = useQueryClient();
  const canSave = can({ project: [project ? "update" : "create"] });
  const navigate = useNavigate();
  const { data: taxonomy } = useSuspenseQuery(queries.taxonomy());
  const [issues, setIssues] = useState<FieldIssues>(new Map());
  const [fields, setFields] = useState<ProjectFields>({
    completedAt: project?.completedAt ?? null,
    featured: project?.featured ?? false,
    position: project?.position ?? 0,
    repositoryUrl: project?.repositoryUrl ?? null,
    startedAt: project?.startedAt ?? null,
    websiteUrl: project?.websiteUrl ?? null,
  });
  const patch = (next: Partial<ProjectFields>) =>
    setFields((current) => ({ ...current, ...next }));

  const save = useMutation({
    mutationFn: (json: ProjectPayload) =>
      project
        ? parseResponse(
            api.api.admin.projects[":id"].$put({
              json,
              param: { id: project.id },
            })
          )
        : parseResponse(api.api.admin.projects.$post({ json })),
    onError: (error) => setIssues(issuesFrom(error)),
    onSuccess: async (saved) => {
      setIssues(new Map());
      toast.success(m.admin_saved({}, options));
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      if (!project) {
        await navigate({
          params: { id: saved.id },
          replace: true,
          to: "/projects/$id",
        });
      }
    },
  });

  return (
    <DocumentForm
      initial={
        project ?? {
          coverMediaId: null,
          scheduledAt: null,
          status: "draft",
          tagIds: [],
          translations: [
            {
              content: emptyDocument(),
              locale,
              seoDescription: null,
              seoTitle: null,
              slug: "",
              summary: "",
              title: "",
            },
          ],
        }
      }
      tags={taxonomy.tags.map((tag) => ({
        id: tag.id,
        name: translationFor(tag.translations, locale)?.name ?? "",
      }))}
      canPublish={can({ project: ["publish"] })}
      canSave={canSave}
      issues={issues}
      saving={save.isPending}
      onSubmit={(draft) =>
        save.mutate({
          ...draft,
          ...fields,
          tagIds: [...draft.tagIds],
          translations: [...draft.translations],
        })
      }
      sidebar={
        <>
          <Label className="flex items-center justify-between">
            {m.admin_field_featured({}, options)}
            <Switch
              checked={fields.featured}
              disabled={!canSave}
              onCheckedChange={(featured) => patch({ featured })}
            />
          </Label>
          <div className="space-y-1.5">
            <Label htmlFor="project-position">
              {m.admin_field_position({}, options)}
            </Label>
            <Input
              id="project-position"
              type="number"
              min={0}
              value={fields.position}
              onChange={(event) =>
                patch({ position: Number(event.currentTarget.value) })
              }
            />
          </div>
          <SidebarSection title={m.admin_section_links({}, options)}>
            {(
              [
                [
                  "websiteUrl",
                  m.admin_field_website({}, options),
                  issues.get("websiteUrl"),
                ],
                [
                  "repositoryUrl",
                  m.admin_field_repository({}, options),
                  issues.get("repositoryUrl"),
                ],
              ] as const
            ).map(([key, label, issue]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`project-${key}`}>{label}</Label>
                <Input
                  id={`project-${key}`}
                  type="url"
                  placeholder="https://"
                  value={fields[key] ?? ""}
                  aria-invalid={issue ? true : undefined}
                  onChange={(event) =>
                    patch({ [key]: event.currentTarget.value || null })
                  }
                />
                {issue ? (
                  <p role="alert" className="text-sm text-destructive">
                    {issue}
                  </p>
                ) : null}
              </div>
            ))}
          </SidebarSection>
          {(
            [
              ["startedAt", m.admin_field_started({}, options)],
              ["completedAt", m.admin_field_completed({}, options)],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`project-${key}`}>{label}</Label>
              <Input
                id={`project-${key}`}
                type="date"
                value={toDateInput(fields[key])}
                onChange={(event) =>
                  patch({ [key]: fromDateInput(event.currentTarget.value) })
                }
              />
            </div>
          ))}
        </>
      }
    />
  );
};

const ExistingProject = ({ id }: { readonly id: string }) => {
  const { data } = useSuspenseQuery(queries.project(id));
  return <ProjectEditor key={data.id} project={data} />;
};

export const ProjectEditorPage = () => {
  const { options } = useAdmin();
  const { id } = useParams({ from: "/projects/$id" });
  const isNew = id === "new";
  return (
    <>
      <PageHeader
        title={
          isNew
            ? m.admin_project_new({}, options)
            : m.admin_project_edit({}, options)
        }
        actions={
          <Link to="/projects" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden="true" />
            {m.admin_back({}, options)}
          </Link>
        }
      />
      {isNew ? (
        <ProjectEditor project={undefined} />
      ) : (
        <ExistingProject id={id} />
      )}
    </>
  );
};
