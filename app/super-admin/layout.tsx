"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Menu,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";
import { useLogout } from "@/hooks/auth/useLogout";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/super-admin", label: "Overview", icon: LayoutDashboard },
  { href: "/super-admin/companies", label: "Companies", icon: Building2 },
];

function SidebarContent({
  pathname,
  setSidebarOpen,
  user,
  logoutMutation,
}: {
  pathname: string;
  setSidebarOpen: (open: boolean) => void;
  user: User | null;
  logoutMutation: ReturnType<typeof useLogout>;
}) {
  return (
    <>
      {/* Logo */}
      <Link href="/" onClick={() => setSidebarOpen(false)}>
        <div className="flex flex-col items-center justify-center border-b border-zinc-200 px-6 pt-2 pb-2 dark:border-zinc-800">
          <span className="absolute top-4 left-28 z-99 text-[9px] font-bold uppercase tracking-widest text-zinc-00 dark:text-zinc-500">
            Super Admin
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
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/super-admin"
              ? pathname === "/super-admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
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
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        {user && (
          <p className="mb-2 truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {user.user_metadata.full_name ?? user.email}
          </p>
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

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role, isLoading: isRoleLoading } = useAuth();
  const logoutMutation = useLogout();

  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (!isRoleLoading && user && !isSuperAdmin) {
      router.replace("/dashboard");
    }
  }, [isRoleLoading, user, isSuperAdmin, router]);

  return (
    <ProtectedRoute>
      {isRoleLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : !isSuperAdmin ? null : (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
          {/* Desktop Sidebar */}
          <aside className="hidden w-60 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex">
            <SidebarContent
              pathname={pathname}
              setSidebarOpen={setSidebarOpen}
              user={user}
              logoutMutation={logoutMutation}
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
              pathname={pathname}
              setSidebarOpen={setSidebarOpen}
              user={user}
              logoutMutation={logoutMutation}
            />
          </aside>

          {/* Main */}
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            {/* Top bar */}
            <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h1 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {navItems.find((n) =>
                  n.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(n.href),
                )?.label ?? "Super Admin"}
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
