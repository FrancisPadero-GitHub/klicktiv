"use client";

import React from "react";
import { PaymentMethodsTable } from "@/components/dashboard/settings/payment-methods";
import { ReviewTypesTable } from "@/components/dashboard/settings/review-types";
import { ProfilesTable } from "@/components/dashboard/settings/profiles-table";
import { cn } from "@/lib/utils";
import { CreditCard, ClipboardList, Users } from "lucide-react";
import {
  useSettingsStore,
  type SettingsTab,
} from "@/features/store/settings/useSettingStore";

const tabs: Array<{
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    id: "payment-methods",
    label: "Payment Methods",
    icon: CreditCard,
    description: "Manage accepted payment types",
  },
  {
    id: "review-types",
    label: "Review Types",
    icon: ClipboardList,
    description: "Configure service review categories",
  },
  {
    id: "profiles",
    label: "User Profiles",
    icon: Users,
    description: "View all registered profiles",
  },
];

export default function SettingsPage() {
  const { activeTab, setActiveTab } = useSettingsStore();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your business configuration
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex sm:flex-col gap-1 sm:w-52 shrink-0">
          {tabs.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors w-full",
                activeTab === id
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:block">
                <span className="block font-medium leading-tight">{label}</span>
                <span className="block text-xs text-muted-foreground leading-tight mt-0.5">
                  {description}
                </span>
              </span>
              <span className="sm:hidden font-medium">{label}</span>
            </button>
          ))}
        </nav>

        {/* Content panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "payment-methods" && <PaymentMethodsTable />}
          {activeTab === "review-types" && <ReviewTypesTable />}
          {activeTab === "profiles" && <ProfilesTable />}
        </div>
      </div>
    </div>
  );
}
