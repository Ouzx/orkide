import { m } from "@orkide/i18n/messages";
import { buttonVariants } from "@orkide/ui/components/button";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { api, parseResponse, queries } from "../api.ts";
import { DocumentTable } from "../components/document-table.tsx";
import { PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

export const ProjectsPage = () => {
  const { can, options } = useAdmin();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(queries.projects());
  const remove = useMutation({
    mutationFn: (id: string) =>
      parseResponse(api.api.admin.projects[":id"].$delete({ param: { id } })),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  return (
    <>
      <PageHeader
        title={m.admin_projects_title({}, options)}
        actions={
          can({ project: ["create"] }) ? (
            <Link
              to="/projects/$id"
              params={{ id: "new" }}
              className={buttonVariants()}
            >
              <Plus aria-hidden="true" />
              {m.admin_project_new({}, options)}
            </Link>
          ) : null
        }
      />
      <DocumentTable
        rows={data}
        canDelete={can({ project: ["delete"] })}
        onDelete={(id) => remove.mutate(id)}
        renderTitle={(id, title) => (
          <Link to="/projects/$id" params={{ id }} className="hover:underline">
            {title}
          </Link>
        )}
      />
    </>
  );
};
