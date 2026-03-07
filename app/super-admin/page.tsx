"use client";

import {
  Building2,
  Users,
  CheckCircle2,
  Archive,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSuperAdminStats } from "@/hooks/super-admin/useSuperAdminStats";
import { useFetchCompanies } from "@/hooks/super-admin/useFetchCompanies";
import { formatDistanceToNow } from "date-fns";

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  color,
  bg,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          {label}
        </p>
        <div className={cn("rounded-md p-1.5", bg)}>
          <Icon className={cn("h-3.5 w-3.5", color)} />
        </div>
      </div>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", color)}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>
    </div>
  );
}

export default function SuperAdminPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useSuperAdminStats();
  const { data: companies, isLoading: companiesLoading } = useFetchCompanies();

  const recentCompanies = (companies ?? []).slice(0, 5);
  const isLoading = statsLoading || companiesLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Overview
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Platform-wide stats across all tenants
        </p>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : statsError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load stats.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Companies"
            value={stats?.totalCompanies ?? 0}
            icon={Building2}
            sub="All registered tenants"
            color="text-zinc-900 dark:text-zinc-50"
            bg="bg-zinc-100 dark:bg-zinc-800"
          />
          <StatCard
            label="Active Companies"
            value={stats?.activeCompanies ?? 0}
            icon={CheckCircle2}
            sub="Currently active"
            color="text-emerald-600 dark:text-emerald-400"
            bg="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <StatCard
            label="Inactive Companies"
            value={stats?.inactiveCompanies ?? 0}
            icon={Archive}
            sub="Disabled tenants"
            color="text-zinc-500 dark:text-zinc-400"
            bg="bg-zinc-100 dark:bg-zinc-800"
          />
          <StatCard
            label="Total VA"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            sub="Across all companies"
            color="text-indigo-600 dark:text-indigo-400"
            bg="bg-indigo-50 dark:bg-indigo-900/20"
          />
        </div>
      )}

      {/* Recently Added Companies */}
      {!isLoading && (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Recently Added Companies
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Last 5 registered tenants
            </p>
          </div>

          {recentCompanies.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
              No companies yet.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentCompanies.map((company) => {
                const isActive = company.deleted_at === null;
                return (
                  <li
                    key={company.id}
                    className="flex items-center justify-between px-6 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                        <Building2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {company.name}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          {formatDistanceToNow(new Date(company.created_at), {
                            addSuffix: true,
                          })}
                          {" · "}
                          {company.user_count}{" "}
                          {company.user_count === 1 ? "user" : "users"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                      )}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
