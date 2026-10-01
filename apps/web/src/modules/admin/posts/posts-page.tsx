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

export const PostsPage = () => {
  const { can, options } = useAdmin();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(queries.posts());
  const remove = useMutation({
    mutationFn: (id: string) =>
      parseResponse(api.api.admin.posts[":id"].$delete({ param: { id } })),
    onSuccess: async () => {
      toast.success(m.admin_deleted({}, options));
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  return (
    <>
      <PageHeader
        title={m.admin_posts_title({}, options)}
        actions={
          can({ post: ["create"] }) ? (
            <Link
              to="/posts/$id"
              params={{ id: "new" }}
              className={buttonVariants()}
            >
              <Plus aria-hidden="true" />
              {m.admin_post_new({}, options)}
            </Link>
          ) : null
        }
      />
      <DocumentTable
        rows={data}
        canDelete={can({ post: ["delete"] })}
        onDelete={(id) => remove.mutate(id)}
        renderTitle={(id, title) => (
          <Link to="/posts/$id" params={{ id }} className="hover:underline">
            {title}
          </Link>
        )}
      />
    </>
  );
};
