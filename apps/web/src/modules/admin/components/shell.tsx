import type { Permissions } from "@orkide/auth/permissions";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@orkide/ui/kit/avatar";
import { Button } from "@orkide/ui/kit/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orkide/ui/kit/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@orkide/ui/kit/sheet";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Tags,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";

import { authClient } from "../auth-client.ts";
import { useAdmin } from "../context.tsx";
import { QueryBoundary } from "./page.tsx";

interface NavItem {
  readonly to:
    | "/"
    | "/site"
    | "/posts"
    | "/projects"
    | "/taxonomy"
    | "/media"
    | "/inbox"
    | "/stats";
  readonly label: (options: { locale: Locale }) => string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly requires?: Permissions;
}

const NAV: readonly NavItem[] = [
  {
    icon: LayoutDashboard,
    label: (o) => m.admin_nav_dashboard({}, o),
    to: "/",
  },
  {
    icon: LayoutTemplate,
    label: (o) => m.admin_nav_site({}, o),
    requires: { site: ["read"] },
    to: "/site",
  },
  {
    icon: FileText,
    label: (o) => m.admin_nav_posts({}, o),
    requires: { post: ["read"] },
    to: "/posts",
  },
  {
    icon: FolderKanban,
    label: (o) => m.admin_nav_projects({}, o),
    requires: { project: ["read"] },
    to: "/projects",
  },
  {
    icon: Tags,
    label: (o) => m.admin_nav_taxonomy({}, o),
    requires: { taxonomy: ["read"] },
    to: "/taxonomy",
  },
  {
    icon: Images,
    label: (o) => m.admin_nav_media({}, o),
    requires: { media: ["read"] },
    to: "/media",
  },
  {
    icon: Inbox,
    label: (o) => m.admin_nav_inbox({}, o),
    requires: { message: ["read"] },
    to: "/inbox",
  },
  {
    icon: BarChart3,
    label: (o) => m.admin_nav_stats({}, o),
    requires: { stats: ["read"] },
    to: "/stats",
  },
];

const initials = (name: string): string =>
  name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const Navigation = ({ onNavigate }: { readonly onNavigate?: () => void }) => {
  const { can, options } = useAdmin();
  return (
    <nav aria-label={m.admin_nav_label({}, options)}>
      <ul>
        {NAV.filter((item) => !item.requires || can(item.requires)).map(
          ({ icon: Icon, label, to }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                activeOptions={{ exact: to === "/" }}
                className="o-bay-link"
              >
                <i aria-hidden="true" />
                <span className="truncate">{label(options)}</span>
                <Icon className="size-4 text-ink-2" />
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
};

const UserMenu = () => {
  const { options, siteHref, user } = useAdmin();
  const signOut = async () => {
    await authClient.signOut();
    globalThis.location.assign(siteHref);
  };
  const role = {
    editor: () => m.admin_role_editor({}, options),
    owner: () => m.admin_role_owner({}, options),
    viewer: () => m.admin_role_viewer({}, options),
  }[user.role]();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`${user.name}, ${role}`}
            className="flex w-full items-center gap-3 rounded-xl bg-case px-2.5 py-2 text-left shadow-raised transition-transform duration-(--o-dur-spring) ease-spring hover:-translate-y-px"
          />
        }
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span className="truncate text-md font-bold">{user.name}</span>
          <span className="o-eng">{role}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/account" />}>
          <UserRound aria-hidden="true" />
          {m.admin_nav_account({}, options)}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => globalThis.location.assign(siteHref)}>
          <ExternalLink aria-hidden="true" />
          {m.admin_view_site({}, options)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut aria-hidden="true" />
          {m.admin_sign_out({}, options)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Brand = () => {
  const { options } = useAdmin();
  return (
    <Link to="/" className="o-brand px-1">
      <b>{m.site_name({}, options)}</b>
      <span>{m.admin_title({}, options)}</span>
    </Link>
  );
};

/** The service-mode readout under the brand: a breathing amber lamp and a small screen. */
const Mode = () => {
  const { options } = useAdmin();
  return (
    <div className="o-mode">
      <span
        className="o-lamp o-lamp-pulse"
        data-tone="warn"
        aria-hidden="true"
      />
      {m.admin_service_mode({}, options)}
    </div>
  );
};

/** Service mode: a patch bay on large screens, a drawer on small ones. */
export const Shell = () => {
  const { options } = useAdmin();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  // The drawer is open for the page it was opened on, so any navigation closes it.
  const [openOn, setOpenOn] = useState<string | undefined>();
  const drawerOpen = openOn === pathname;
  const setDrawerOpen = (open: boolean) =>
    setOpenOn(open ? pathname : undefined);

  return (
    <div className="flex min-h-dvh">
      <aside className="o-bay sticky top-0 hidden h-dvh w-(--o-bay) shrink-0 grid-rows-[auto_auto_1fr_auto] lg:grid">
        <Brand />
        <Mode />
        <div className="flex-1 overflow-y-auto">
          <Navigation />
        </div>
        <UserMenu />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" showCloseButton={false} className="lg:hidden">
          <div className="o-bay flex h-full min-h-0 flex-col">
            <SheetTitle className="sr-only">
              {m.nav_menu({}, options)}
            </SheetTitle>
            <div className="flex items-center justify-between">
              <Brand />
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={m.admin_nav_close({}, options)}
                  />
                }
              >
                <X aria-hidden="true" />
              </SheetClose>
            </div>
            <Mode />
            <div className="flex-1 overflow-y-auto">
              <Navigation onNavigate={() => setDrawerOpen(false)} />
            </div>
            <UserMenu />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="o-head flex h-14 items-center gap-3 px-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={m.nav_menu({}, options)}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu aria-hidden="true" />
          </Button>
          <Brand />
        </header>
        <main
          id="main"
          className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 sm:px-7"
        >
          <QueryBoundary>
            <Outlet />
          </QueryBoundary>
        </main>
      </div>
    </div>
  );
};
