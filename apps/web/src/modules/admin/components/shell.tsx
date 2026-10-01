import type { Permissions } from "@orkide/auth/permissions";
import type { Locale } from "@orkide/i18n";
import { m } from "@orkide/i18n/messages";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@orkide/ui/components/avatar";
import { Button } from "@orkide/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@orkide/ui/components/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@orkide/ui/components/sheet";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  FileText,
  FolderKanban,
  Images,
  Inbox,
  LayoutDashboard,
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
      <ul className="space-y-1">
        {NAV.filter((item) => !item.requires || can(item.requires)).map(
          ({ icon: Icon, label, to }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground aria-[current=page]:bg-primary/10 aria-[current=page]:font-medium aria-[current=page]:text-foreground"
              >
                <Icon className="size-4" />
                {label(options)}
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
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col items-start text-left">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{role}</span>
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
    <Link to="/" className="flex items-center gap-2 px-2 font-semibold">
      <img src="/favicon.svg" alt="" className="size-7" />
      <span>{m.site_name({}, options)}</span>
      <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {m.admin_title({}, options)}
      </span>
    </Link>
  );
};

/** Dashboard frame: glass sidebar on large screens, a drawer on small ones. */
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
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r glass p-4 lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <Navigation />
        </div>
        <UserMenu />
      </aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" showCloseButton={false} className="lg:hidden">
          <div className="flex h-full min-h-0 flex-col gap-6 border-r p-4">
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
            <div className="flex-1 overflow-y-auto">
              <Navigation onNavigate={() => setDrawerOpen(false)} />
            </div>
            <UserMenu />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b glass px-4 lg:hidden">
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
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8"
        >
          <QueryBoundary>
            <Outlet />
          </QueryBoundary>
        </main>
      </div>
    </div>
  );
};
