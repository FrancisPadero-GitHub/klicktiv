import { create } from "zustand";

export type SidebarState = "collapse" | "expand";

export type SidebarStore = {
  // Mobile drawer state
  sidebarState: SidebarState;
  setSidebarState: (state: SidebarState) => void;
  // Desktop sidebar collapsed (icon-only) state
  desktopCollapsed: boolean;
  setDesktopCollapsed: (collapsed: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>((set) => ({
  sidebarState: "collapse",
  setSidebarState: (state: SidebarState) => set({ sidebarState: state }),
  desktopCollapsed: false,
  setDesktopCollapsed: (collapsed: boolean) =>
    set({ desktopCollapsed: collapsed }),
}));
