import { ModeToggle } from "@/components/mode-toggle";
import { useSidebarStore } from "@/features/store/dashboard/useSidebarStore";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

function Topbar() {
  const {
    sidebarState,
    setSidebarState,
    desktopCollapsed,
    setDesktopCollapsed,
  } = useSidebarStore();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card pr-6 pl-2">
      <h1 className="text-sm font-medium text-muted-foreground">
        {/* Desktop toggle — visible lg+ */}
        <button
          title="Toggle sidebar"
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="hidden h-10 w-10 items-center justify-center rounded-md cursor-pointer not-first:text-muted-foreground transition-colors hover:bg-accent text-accent-foreground/90 hover:text-accent-foreground/50 lg:flex"
          aria-label="Toggle sidebar"
        >
          {desktopCollapsed === true ? (
            <PanelLeftClose className="h-6 w-6" />
          ) : (
            <PanelLeftOpen className="h-6 w-6" />
          )}
        </button>

        {/* Mobile toggle — visible below lg */}
        <button
          title="Toggle sidebar"
          onClick={() =>
            setSidebarState(sidebarState === "expand" ? "collapse" : "expand")
          }
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Toggle mobile sidebar"
        >
          {sidebarState === "expand" ? (
            <PanelLeftClose className="h-6 w-6" />
          ) : (
            <PanelLeftOpen className="h-6 w-6" />
          )}
        </button>
      </h1>
      <ModeToggle />
    </header>
  );
}

export default Topbar;
