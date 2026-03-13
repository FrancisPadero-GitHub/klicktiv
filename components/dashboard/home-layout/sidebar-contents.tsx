import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import FeedbackPage from "../submit-feedback/feedback-page";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  FileText,
  MessageSquareText,
  Users,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { useSidebarStore } from "@/features/store/dashboard/useSidebarStore";

export const navItems = [
  { href: "/dashboard", label: "Overview / Reports", icon: LayoutDashboard },
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
  /** When true, the sidebar is in desktop icon-only (rail) mode */
  collapsed?: boolean;
}

export default function SidebarContent({
  companyName,
  pathname,
  visibleNavItems,
  user,
  logoutMutation,
  company,
  collapsed = false,
}: SidebarContentProps) {
  const { sidebarState, setSidebarState } = useSidebarStore();

  return (
    <>
      {/* Logo / Header */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border transition-all duration-100",
          "justify-center px-2",
        )}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          <span
            className={cn(
              "absolute top-4 left-28 z-99 text-[9px] font-bold uppercase tracking-widest text-accent-foreground",
              collapsed ? "hidden" : "",
            )}
          >
            {companyName || "No Company"}
          </span>
          <Image
            src="/kt_logo_only.png"
            title="Klicktiv"
            alt="Klicktiv Logo"
            width={60}
            height={60}
            className={cn(
              "absolute transition-all duration-300 object-contain dark:invert dark:mix-blend-screen teal-dark:invert teal-dark:mix-blend-screen",
              collapsed
                ? "opacity-100 scale-150"
                : "opacity-0 scale-75 pointer-events-none",
            )}
            style={{ width: "auto", height: "auto" }}
            priority
          />
          <Image
            src="/kt_logo_name.png"
            title="Klicktiv Dashboard"
            alt="Klicktiv Logo"
            width={90}
            height={40}
            className={cn(
              "transition-all duration-100 w-auto dark:invert dark:mix-blend-screen teal-dark:invert teal-dark:mix-blend-screen",
              !collapsed
                ? "opacity-100 scale-90"
                : "opacity-0 scale-75 pointer-events-none",
            )}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={() => {
                if (sidebarState === "expand") {
                  setSidebarState("collapse");
                }
              }}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-all duration-100 h-10 overflow-hidden",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="flex w-12 shrink-0 items-center justify-center">
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              <span
                className={cn(
                  "truncate transition-all duration-100 ease-in-out whitespace-nowrap",
                  collapsed
                    ? "w-0 opacity-0 pointer-events-none"
                    : "flex-1 opacity-100",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Feedback — hide label when collapsed */}
      <div className="px-2 pb-2">
        <FeedbackPage>
          <button
            title={collapsed ? "Submit Feedback" : undefined}
            className={cn(
              "flex w-full items-center rounded-md text-sm font-medium text-muted-foreground cursor-pointer transition-all duration-100 hover:bg-muted hover:text-foreground h-10 overflow-hidden",
            )}
          >
            <div className="flex w-12 shrink-0 items-center justify-center">
              <MessageSquareText className="h-4 w-4 shrink-0" />
            </div>
            <span
              className={cn(
                "truncate transition-all duration-100 ease-in-out whitespace-nowrap",
                collapsed
                  ? "w-0 opacity-0 pointer-events-none"
                  : "flex-1 opacity-100 text-left",
              )}
            >
              Submit Feedback
            </span>
          </button>
        </FeedbackPage>
      </div>

      {/* User & Logout */}
      <div className="border-t border-sidebar-border p-2 space-y-2">
        {user && (
          <div
            className="flex items-center h-12 rounded-md overflow-hidden px-0"
            title={collapsed ? (user.email ?? undefined) : undefined}
          >
            <div className="flex w-12 shrink-0 items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                {(user.email?.[0] ?? "?").toUpperCase()}
              </div>
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 transition-all duration-100 ease-in-out",
                collapsed
                  ? "w-0 opacity-0 pointer-events-none"
                  : "w-auto opacity-100",
              )}
            >
              <p className="truncate text-xs font-semibold leading-tight text-accent-foreground">
                {company}
              </p>
              <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">
                {user.email || "Something went wrong"}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "flex items-center rounded-md text-sm font-medium text-muted-foreground transition-all cursor-pointer duration-100 hover:bg-muted hover:text-foreground disabled:opacity-60 h-10 w-full overflow-hidden",
          )}
        >
          <div className="flex w-12 shrink-0 items-center justify-center">
            {logoutMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4 shrink-0" />
            )}
          </div>
          <span
            className={cn(
              "truncate transition-all duration-100 ease-in-out whitespace-nowrap",
              collapsed
                ? "w-0 opacity-0 pointer-events-none"
                : "flex-1 opacity-100 text-left",
            )}
          >
            Log out
          </span>
        </button>
      </div>
    </>
  );
}
