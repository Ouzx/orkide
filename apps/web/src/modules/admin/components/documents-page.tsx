import { m } from "@orkide/i18n/messages";
import { buttonVariants } from "@orkide/ui/kit/button";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { ComponentProps } from "react";
import { toast } from "sonner";

import { api, parseResponse, queries } from "../api.ts";
import { useAdmin } from "../context.tsx";
import { DocumentTable } from "./document-table.tsx";
import { PageHeader } from "./page.tsx";

/** What the post and project lists differ in. */
const kinds = {
  post: {
    create: { post: ["create"] },
    delete: { post: ["delete"] },
    key: "posts",
    newLabel: m.admin_post_new,
    remove: (id: string) =>
      api.api.admin.posts[":id"].$delete({ param: { id } }),
    title: m.admin_posts_title,
    to: "/posts/$id",
  },
  project: {
    create: { project: ["create"] },
    delete: { project: ["delete"] },
    key: "projects",
    newLabel: m.admin_project_new,
    remove: (id: string) =>
      api.api.admin.projects[":id"].$delete({ param: { id } }),
    title: m.admin_projects_title,
    to: "/projects/$id",
  },
} as const;

const DocumentsPage = ({
  kind,
  rows,
}: {
  readonly kind: keyof typeof kinds;
  readonly rows: ComponentProps<typeof DocumentTable>["rows"];
}) => {
  const { can, options } = useAdmin();
  const queryClient = useQueryClient();
  const config = kinds[kind];
  const remove = useMutation({
    mutationFn: (id: string) => parseResponse(config.remove(id)),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await queryClient.invalidateQueries({ queryKey: [config.key] });
    },
  });

  return (
    <>
      <PageHeader
        title={config.title({}, options)}
        actions={
          can(config.create) ? (
            <Link
              to={config.to}
              params={{ id: "new" }}
              className={buttonVariants()}
            >
              <Plus aria-hidden="true" />
              {config.newLabel({}, options)}
            </Link>
          ) : null
        }
      />
      <DocumentTable
        rows={rows}
        canDelete={can(config.delete)}
        onDelete={(id) => remove.mutate(id)}
        renderTitle={(id, title) => (
          <Link to={config.to} params={{ id }} className="hover:underline">
            {title}
          </Link>
        )}
      />
    </>
  );
};

export const PostsPage = () => (
  <DocumentsPage kind="post" rows={useSuspenseQuery(queries.posts()).data} />
);
export const ProjectsPage = () => (
  <DocumentsPage
    kind="project"
    rows={useSuspenseQuery(queries.projects()).data}
  />
);
