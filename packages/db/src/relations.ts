import { defineRelations } from "drizzle-orm";

import * as schema from "./schema/index.ts";

/** Relational Queries v2 graph for every table, including the generated Better Auth tables. */
export const relations = defineRelations(schema, (r) => ({
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  category: {
    children: r.many.category({
      alias: "category_parent",
      from: r.category.id,
      to: r.category.parentId,
    }),
    parent: r.one.category({
      alias: "category_parent",
      from: r.category.parentId,
      to: r.category.id,
    }),
    posts: r.many.post({ from: r.category.id, to: r.post.categoryId }),
    translations: r.many.categoryTranslation({
      from: r.category.id,
      to: r.categoryTranslation.categoryId,
    }),
  },
  media: {
    translations: r.many.mediaTranslation({
      from: r.media.id,
      to: r.mediaTranslation.mediaId,
    }),
    uploader: r.one.user({ from: r.media.uploaderId, to: r.user.id }),
  },
  passkey: {
    user: r.one.user({ from: r.passkey.userId, to: r.user.id }),
  },
  post: {
    attachments: r.many.media({
      from: r.post.id.through(r.postAttachment.postId),
      to: r.media.id.through(r.postAttachment.mediaId),
    }),
    author: r.one.user({ from: r.post.authorId, to: r.user.id }),
    category: r.one.category({ from: r.post.categoryId, to: r.category.id }),
    cover: r.one.media({ from: r.post.coverMediaId, to: r.media.id }),
    tags: r.many.tag({
      from: r.post.id.through(r.postTag.postId),
      to: r.tag.id.through(r.postTag.tagId),
    }),
    translations: r.many.postTranslation({
      from: r.post.id,
      to: r.postTranslation.postId,
    }),
  },
  project: {
    cover: r.one.media({ from: r.project.coverMediaId, to: r.media.id }),
    tags: r.many.tag({
      from: r.project.id.through(r.projectTag.projectId),
      to: r.tag.id.through(r.projectTag.tagId),
    }),
    translations: r.many.projectTranslation({
      from: r.project.id,
      to: r.projectTranslation.projectId,
    }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  tag: {
    translations: r.many.tagTranslation({
      from: r.tag.id,
      to: r.tagTranslation.tagId,
    }),
  },
  user: {
    accounts: r.many.account(),
    passkeys: r.many.passkey(),
    posts: r.many.post(),
    sessions: r.many.session(),
  },
}));
