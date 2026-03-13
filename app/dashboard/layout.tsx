"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
// import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/components/auth-provider";

// hooks
import { useFetchCompany } from "@/hooks/company/useFetchCompany";
import { useLogout } from "@/hooks/auth/useLogout";

// components
import { navItems } from "@/components/dashboard/home-layout/sidebar-contents";
import Topbar from "@/components/dashboard/home-layout/topbar";
import SidebarContent from "@/components/dashboard/home-layout/sidebar-contents";
import Loading from "../loading";

// store
import { useSidebarStore } from "@/features/store/dashboard/useSidebarStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar state
  const { sidebarState, setSidebarState, desktopCollapsed } = useSidebarStore();

  const pathname = usePathname();
  const router = useRouter();

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
        <div>
          <Loading />
        </div>
      ) : !isAdmin && isRestrictedRoute ? null : (
        <div className="fixed inset-0 flex bg-background">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              "hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-in-out lg:flex overflow-hidden will-change-[width]",
              desktopCollapsed ? "w-16" : "w-60",
            )}
          >
            <SidebarContent
              companyName={companyName}
              pathname={pathname}
              visibleNavItems={visibleNavItems}
              user={user}
              logoutMutation={logoutMutation}
              company={companyName}
              collapsed={desktopCollapsed}
            />
          </aside>

          {/* Mobile Sidebar Overlay: This is for the dimming the background when the sidebar is open and provides close sidebar when clicked */}
          {sidebarState === "expand" && (
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setSidebarState("collapse")}
            />
          )}

          {/* Mobile Sidebar Drawer */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:hidden",
              sidebarState === "expand" ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {/* <button
              onClick={() => setSidebarState("collapse")}
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button> */}
            <SidebarContent
              companyName={companyName}
              pathname={pathname}
              visibleNavItems={visibleNavItems}
              user={user}
              logoutMutation={logoutMutation}
              company={companyName}
              collapsed={false}
            />
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Top bar */}
            <Topbar />
            <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-background p-6">
              {/* Main Content with Children */}
              {children}
            </main>
          </div>

          {/* Floating toggle button, mobile only */}
          {/* <button
            onClick={() =>
              setSidebarState(sidebarState === "expand" ? "collapse" : "expand")
            }
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_20px_rgba(232,68,10,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(232,68,10,0.4)] lg:hidden"
            aria-label="Toggle sidebar"
          >
            {sidebarState === "expand" ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button> */}
        </div>
      )}
    </ProtectedRoute>
  );
}
