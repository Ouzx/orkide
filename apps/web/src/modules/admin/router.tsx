import type { Permissions } from "@orkide/auth/permissions";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from "@tanstack/react-router";

import { queries } from "./api.ts";
import { Shell } from "./components/shell.tsx";
import type { AdminContextValue } from "./context.tsx";
import { Dashboard } from "./dashboard.tsx";

export interface RouterContext {
  readonly queryClient: QueryClient;
  /** The signed-in user's permission check, so guards run before a route loads. */
  readonly can: AdminContextValue["can"];
}

/*
 * Code-based route tree. Loaders prime React Query, so hovering a link (`defaultPreload: intent`)
 * fetches the next screen's data; pages read it with `useSuspenseQuery`. Heavy screens (the
 * rich-text editor, analytics) are separate chunks.
 */
/** Redirects to the dashboard when the user lacks `requires`, so a URL never reaches a screen
 * whose data the API would refuse (the same permissions that hide its nav link). */
const requirePermission =
  (requires: Permissions) =>
  ({ context }: { readonly context: RouterContext }) => {
    if (!context.can(requires)) {
      throw redirect({ replace: true, to: "/" });
    }
  };

const root = createRootRouteWithContext<RouterContext>()({ component: Shell });

const dashboard = createRoute({
  component: Dashboard,
  getParentRoute: () => root,
  path: "/",
});

const posts = createRoute({
  beforeLoad: requirePermission({ post: ["read"] }),
  component: lazyRouteComponent(
    () => import("./posts/posts-page.tsx"),
    "PostsPage"
  ),
  getParentRoute: () => root,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(queries.posts());
  },
  path: "posts",
});

const postEditor = createRoute({
  // `new` is only reachable with create permission; redirect before anything mounts or loads.
  beforeLoad: ({ context, params }) => {
    requirePermission({ post: ["read"] })({ context });
    if (params.id === "new" && !context.can({ post: ["create"] })) {
      throw redirect({ replace: true, to: "/posts" });
    }
  },
  component: lazyRouteComponent(
    () => import("./posts/post-editor-page.tsx"),
    "PostEditorPage"
  ),
  getParentRoute: () => root,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(queries.taxonomy());
    if (params.id !== "new") {
      context.queryClient.prefetchQuery(queries.post(params.id));
    }
  },
  path: "posts/$id",
});

const projects = createRoute({
  beforeLoad: requirePermission({ project: ["read"] }),
  component: lazyRouteComponent(
    () => import("./projects/projects-page.tsx"),
    "ProjectsPage"
  ),
  getParentRoute: () => root,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(queries.projects());
  },
  path: "projects",
});

const projectEditor = createRoute({
  // `new` is only reachable with create permission; redirect before anything mounts or loads.
  beforeLoad: ({ context, params }) => {
    requirePermission({ project: ["read"] })({ context });
    if (params.id === "new" && !context.can({ project: ["create"] })) {
      throw redirect({ replace: true, to: "/projects" });
    }
  },
  component: lazyRouteComponent(
    () => import("./projects/project-editor-page.tsx"),
    "ProjectEditorPage"
  ),
  getParentRoute: () => root,
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(queries.taxonomy());
    if (params.id !== "new") {
      context.queryClient.prefetchQuery(queries.project(params.id));
    }
  },
  path: "projects/$id",
});

const taxonomy = createRoute({
  beforeLoad: requirePermission({ taxonomy: ["read"] }),
  component: lazyRouteComponent(
    () => import("./taxonomy/taxonomy-page.tsx"),
    "TaxonomyPage"
  ),
  getParentRoute: () => root,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(queries.taxonomy());
  },
  path: "taxonomy",
});

const media = createRoute({
  beforeLoad: requirePermission({ media: ["read"] }),
  component: lazyRouteComponent(
    () => import("./media/media-page.tsx"),
    "MediaPage"
  ),
  getParentRoute: () => root,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(queries.media());
  },
  path: "media",
});

const inbox = createRoute({
  beforeLoad: requirePermission({ message: ["read"] }),
  component: lazyRouteComponent(
    () => import("./inbox/inbox-page.tsx"),
    "InboxPage"
  ),
  getParentRoute: () => root,
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(queries.messages());
  },
  path: "inbox",
});

const stats = createRoute({
  beforeLoad: requirePermission({ stats: ["read"] }),
  component: lazyRouteComponent(
    () => import("./stats/stats-page.tsx"),
    "StatsPage"
  ),
  getParentRoute: () => root,
  path: "stats",
});

const account = createRoute({
  component: lazyRouteComponent(
    () => import("./account/account-page.tsx"),
    "AccountPage"
  ),
  getParentRoute: () => root,
  path: "account",
});

const routeTree = root.addChildren([
  dashboard,
  posts,
  postEditor,
  projects,
  projectEditor,
  taxonomy,
  media,
  inbox,
  stats,
  account,
]);

export const createAdminRouter = (
  basepath: string,
  queryClient: QueryClient,
  can: AdminContextValue["can"]
) =>
  createRouter({
    basepath,
    context: { can, queryClient },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAdminRouter>;
  }
}
