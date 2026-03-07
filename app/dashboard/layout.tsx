"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  FileText,
  MessageSquareText,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";

// hooks
import { useFetchCompany } from "@/hooks/company/useFetchCompany";
import { useLogout } from "@/hooks/auth/useLogout";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/calendar", label: "Jobs Calendar", icon: CalendarDays },
  { href: "/dashboard/estimates", label: "Estimates", icon: FileText },
  { href: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText },
  {
    href: "/dashboard/technicians",
    label: "Technicians",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface SidebarContentProps {
  companyName: string;
  pathname: string;
  visibleNavItems: typeof navItems;
  user: { email?: string | null } | null;
  logoutMutation: { mutate: () => void; isPending: boolean };
  company: string;
  onClose: () => void;
}

function SidebarContent({
  companyName,
  pathname,
  visibleNavItems,
  user,
  logoutMutation,
  company,
  onClose,
}: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <Link href="/" onClick={onClose}>
        <div className="flex h-16 py-2 items-center justify-center border-b border-zinc-200 dark:border-zinc-800">
          <span className="absolute top-4 left-28 z-99 text-[9px] font-bold uppercase tracking-widest text-zinc-00 dark:text-zinc-500">
            {companyName || "No Company"}
          </span>
          <Image
            src="/kt_logo_name.png"
            title="Go to Klicktiv"
            alt="Klicktiv Logo"
            width={160}
            height={48}
            className="h-12 w-auto dark:brightness-0 dark:invert"
            priority
          />
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800 space-y-3">
        {user && (
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 text-xs font-semibold dark:bg-zinc-50 dark:text-zinc-900">
              {(user.email?.[0] ?? "?").toUpperCase()}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">
                {company}
              </p>
              <p className="truncate text-xs text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
                {user.email || "Something went wrong"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-60 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Log out
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth to determine which nav items to show and whether to allow access to certain routes
  const { user, role, company_id, isLoading: isRoleLoading } = useAuth();

  // fetches the company_id for the current user and displays it in the sidebar.
  const comp_id =
    typeof company_id === "string" && company_id ? company_id : undefined;
  const { data: company } = useFetchCompany(comp_id);
  const companyName = company?.name || "No Company";

  const logoutMutation = useLogout();

  // Admins can see all nav items; non-admins have some items hidden and are redirected if they try to access those routes
  const isAdmin = role === "company" || role === "super_admin";

  const isRestrictedRoute = pathname.startsWith("/dashboard/technicians");

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );

  useEffect(() => {
    if (!isRoleLoading && !isAdmin && isRestrictedRoute) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isRestrictedRoute, isRoleLoading, router]);

  return (
    <ProtectedRoute>
      {isRoleLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : !isAdmin && isRestrictedRoute ? null : (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          {/* Desktop Sidebar */}
          <aside className="hidden w-60 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
            <SidebarContent
              companyName={companyName}
              pathname={pathname}
              visibleNavItems={visibleNavItems}
              user={user}
              logoutMutation={logoutMutation}
              company={companyName}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile Sidebar Drawer */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-zinc-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              companyName={companyName}
              pathname={pathname}
              visibleNavItems={visibleNavItems}
              user={user}
              logoutMutation={logoutMutation}
              company={companyName}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>

          {/* Main */}
          <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {visibleNavItems.find((n) =>
                  n.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(n.href),
                )?.label ?? "Dashboard"}
              </h1>
              <ModeToggle />
            </header>

            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>

          {/* Floating toggle button, mobile only */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      )}
    </ProtectedRoute>
  );
}
