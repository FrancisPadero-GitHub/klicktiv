"use client";

import {
  TrendingUp,
  Briefcase,
  Users,
  DollarSign,
  Percent,
  Wrench,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtUSD } from "@/lib/decimal";
import type { DashboardMetrics } from "@/hooks/dashboard/useDashboardData";

interface DashboardKPIsProps {
  metrics: DashboardMetrics;
  techCount: number;
}

export function DashboardKPIs({ metrics, techCount }: DashboardKPIsProps) {
  const kpis = [
    {
      label: "Gross Revenue",
      value: fmtUSD(metrics.grossRevenue),
      icon: DollarSign,
      sub: `From ${metrics.doneJobs} completed jobs`,
      color: "text-zinc-900 dark:text-zinc-50",
      bg: "bg-zinc-100 dark:bg-zinc-800",
    },
    {
      label: "Company Net",
      value: fmtUSD(metrics.companyNet),
      icon: TrendingUp,
      sub: "After tech payouts & parts",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Net Revenue",
      value: fmtUSD(metrics.netRevenue),
      icon: Banknote,
      sub: "Gross minus parts cost",
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-900/20",
    },
    {
      label: "Net Margin",
      value: `${metrics.companyNetMarginPct}%`,
      icon: Percent,
      sub: "Company net / gross",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      label: "Total Jobs",
      value: metrics.totalJobs.toString(),
      icon: Briefcase,
      sub: `${metrics.doneJobs} done · ${metrics.pendingJobs} pending`,
      color: "text-zinc-900 dark:text-zinc-50",
      bg: "bg-zinc-100 dark:bg-zinc-800",
    },
    {
      label: "Avg Revenue / Job",
      value: fmtUSD(metrics.avgRevenuePerJob),
      icon: DollarSign,
      sub: `Based on ${metrics.doneJobs} done jobs`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "Parts Cost",
      value: fmtUSD(metrics.partsCost),
      icon: Wrench,
      sub: "Total parts expense",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Active Technicians",
      value: techCount.toString(),
      icon: Users,
      sub: "Currently active",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ label, value, icon: Icon, sub, color, bg }) => (
        <div
          key={label}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
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
      ))}
    </div>
  );
}
