// tabs store to remember what tabs are active

import { create } from "zustand";

export type SettingsTab =
  | "payment-methods"
  | "review-types"
  | "profiles"
  | "update-information";

type SettingsStore = {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  activeTab: "payment-methods",
  setActiveTab: (tab: SettingsTab) => set({ activeTab: tab }),
}));
