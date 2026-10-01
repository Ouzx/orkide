import type { InferRequestType } from "@orkide/api-client";
import { m } from "@orkide/i18n/messages";
import { buttonVariants } from "@orkide/ui/components/button";
import { Label } from "@orkide/ui/components/label";
import type { PostRecord } from "@orkide/validators/content";
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
} from "../components/document-form.tsx";
import type {
  DocumentDraft,
  FieldIssues,
} from "../components/document-form.tsx";
import { PageHeader } from "../components/page.tsx";
import { useAdmin } from "../context.tsx";

/** Request body for creating or updating a post (the wire type, inferred from the API). */
type PostPayload = InferRequestType<typeof api.api.admin.posts.$post>["json"];

const newDraft = (
  locale: PostRecord["translations"][number]["locale"]
): DocumentDraft => ({
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
});

const PostEditor = ({ post }: { readonly post: PostRecord | undefined }) => {
  const { can, locale, options } = useAdmin();
  const queryClient = useQueryClient();
  const canSave = can({ post: [post ? "update" : "create"] });
  const navigate = useNavigate();
  const { data: taxonomy } = useSuspenseQuery(queries.taxonomy());
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? null);
  const [issues, setIssues] = useState<FieldIssues>(new Map());

  const save = useMutation({
    mutationFn: (json: PostPayload) =>
      post
        ? parseResponse(
            api.api.admin.posts[":id"].$put({ json, param: { id: post.id } })
          )
        : parseResponse(api.api.admin.posts.$post({ json })),
    onError: (error) => setIssues(issuesFrom(error)),
    onSuccess: async (saved) => {
      setIssues(new Map());
      toast.success(m.admin_saved({}, options));
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (!post) {
        await navigate({
          params: { id: saved.id },
          replace: true,
          to: "/posts/$id",
        });
      }
    },
  });

  const named = (
    translations: readonly { locale: typeof locale; name: string }[]
  ) => translationFor(translations, locale)?.name ?? "";

  return (
    <DocumentForm
      initial={post ?? newDraft(locale)}
      tags={taxonomy.tags.map((tag) => ({
        id: tag.id,
        name: named(tag.translations),
      }))}
      canPublish={can({ post: ["publish"] })}
      canSave={canSave}
      issues={issues}
      saving={save.isPending}
      onSubmit={(draft) =>
        save.mutate({
          ...draft,
          categoryId,
          tagIds: [...draft.tagIds],
          translations: [...draft.translations],
        })
      }
      sidebar={
        <div className="space-y-1.5">
          <Label htmlFor="post-category">
            {m.admin_field_category({}, options)}
          </Label>
          <select
            id="post-category"
            value={categoryId ?? ""}
            onChange={(event) =>
              setCategoryId(event.currentTarget.value || null)
            }
            className="h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="">{m.admin_none({}, options)}</option>
            {taxonomy.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {named(category.translations)}
              </option>
            ))}
          </select>
        </div>
      }
    />
  );
};

const ExistingPost = ({ id }: { readonly id: string }) => {
  const { data } = useSuspenseQuery(queries.post(id));
  return <PostEditor key={data.id} post={data} />;
};

export const PostEditorPage = () => {
  const { options } = useAdmin();
  const { id } = useParams({ from: "/posts/$id" });
  const isNew = id === "new";
  return (
    <>
      <PageHeader
        title={
          isNew ? m.admin_post_new({}, options) : m.admin_post_edit({}, options)
        }
        actions={
          <Link to="/posts" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden="true" />
            {m.admin_back({}, options)}
          </Link>
        }
      />
      {isNew ? <PostEditor post={undefined} /> : <ExistingPost id={id} />}
    </>
  );
};
