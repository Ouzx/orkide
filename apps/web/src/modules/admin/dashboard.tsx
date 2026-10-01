import { m } from "@orkide/i18n/messages";
import { buttonVariants } from "@orkide/ui/components/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FilePlus2, FolderPlus, Upload } from "lucide-react";

import { queries, translationFor } from "./api.ts";
import {
  PageHeader,
  Panel,
  QueryBoundary,
  StatTile,
} from "./components/page.tsx";
import { StatusBadge } from "./components/status-badge.tsx";
import { useAdmin } from "./context.tsx";
import { LiveVisitors } from "./stats/live-visitors.tsx";

const number = new Intl.NumberFormat();

const TrafficCards = () => {
  const { options } = useAdmin();
  const { data } = useSuspenseQuery(queries.stats(7));
  const hint = m.admin_stats_range({ days: "7" }, options);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile label={m.admin_stats_views({}, options)} hint={hint}>
        {number.format(data.totals.views)}
      </StatTile>
      <StatTile label={m.admin_stats_visitors({}, options)} hint={hint}>
        {number.format(data.totals.visitors)}
      </StatTile>
      <StatTile label={m.admin_stats_online({}, options)}>
        <LiveVisitors />
      </StatTile>
    </div>
  );
};

const RecentPosts = () => {
  const { locale, options } = useAdmin();
  const { data } = useSuspenseQuery(queries.posts());
  return (
    <Panel title={m.admin_posts_title({}, options)}>
      <ul className="divide-y">
        {data.slice(0, 5).map((post) => (
          <li
            key={post.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <Link
              to="/posts/$id"
              params={{ id: post.id }}
              className="truncate font-medium hover:underline"
            >
              {translationFor(post.translations, locale)?.title}
            </Link>
            <StatusBadge status={post.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
};

/** Landing screen: today's numbers, quick actions and the latest work. */
export const Dashboard = () => {
  const { can, options, user } = useAdmin();
  const quick = "gap-2";
  return (
    <>
      <PageHeader
        title={m.admin_welcome(
          { name: user.name.split(" ")[0] ?? user.name },
          options
        )}
        actions={
          <>
            {can({ post: ["create"] }) ? (
              <Link
                to="/posts/$id"
                params={{ id: "new" }}
                className={buttonVariants({ className: quick })}
              >
                <FilePlus2 aria-hidden="true" />
                {m.admin_post_new({}, options)}
              </Link>
            ) : null}
            {can({ project: ["create"] }) ? (
              <Link
                to="/projects/$id"
                params={{ id: "new" }}
                className={buttonVariants({
                  className: quick,
                  variant: "outline",
                })}
              >
                <FolderPlus aria-hidden="true" />
                {m.admin_project_new({}, options)}
              </Link>
            ) : null}
            {can({ media: ["upload"] }) ? (
              <Link
                to="/media"
                className={buttonVariants({
                  className: quick,
                  variant: "outline",
                })}
              >
                <Upload aria-hidden="true" />
                {m.admin_media_upload({}, options)}
              </Link>
            ) : null}
          </>
        }
      />
      <div className="space-y-6">
        {can({ stats: ["read"] }) ? (
          <QueryBoundary>
            <TrafficCards />
          </QueryBoundary>
        ) : null}
        {can({ post: ["read"] }) ? (
          <QueryBoundary>
            <RecentPosts />
          </QueryBoundary>
        ) : null}
      </div>
    </>
  );
};
