"use client";

import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import { DashboardKPIs } from "@/components/dashboard/dashboard-kpis";
import { RevenueTrendChart } from "@/components/dashboard/revenue-trend-chart";
import { MonthlyComparisonChart } from "@/components/dashboard/monthly-comparison-chart";
import { TechRevenueDonut } from "@/components/dashboard/technician/tech-revenue-donut";
import { ProfitSplitChart } from "@/components/dashboard/profit-split-chart";
import { RecentJobsTable } from "@/components/dashboard/jobs/recent-jobs-table";
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { role } = useAuth();

  const isAdmin = role === "company" || role === "super_admin";

  const {
    // Query states
    // isLoading,
    // isError,
    // errorMessage,
    kpisState,
    revenueTrendState,
    monthlyComparisonState,
    techRevenueState,
    profitSplitState,
    recentJobsState,

    // Raw data
    jobs,
    recentJobs,
    // techSummaries,
    technicians,
    techNameMap,
    // techCommissionMap,
    activeTech,

    // Computed data
    metrics,
    dailyRevenue,
    monthlyBreakdown,
    techRevenue,
    profitSplit,
  } = useDashboardData();

  return (
    <div className="space-y-8">
      {/* Header + Date Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Overview
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Financial dashboard with date filtering
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <DashboardDateFilter />
          {isAdmin ? (
            <DashboardExportButton
              currentJobs={jobs}
              technicians={technicians}
              techNameMap={techNameMap}
            />
          ) : null}
        </div>
      </div>

      {/* Content, loading / error / data */}
      <div className="space-y-8">
        <QueryStatePanel
          isLoading={kpisState.isLoading}
          isError={kpisState.isError}
          errorMessage={kpisState.errorMessage}
          loadingMessage="Loading KPI cards..."
        >
          <DashboardKPIs metrics={metrics} techCount={activeTech} />
        </QueryStatePanel>

        <div className="grid gap-6 lg:grid-cols-2">
          <QueryStatePanel
            isLoading={revenueTrendState.isLoading}
            isError={revenueTrendState.isError}
            errorMessage={revenueTrendState.errorMessage}
            loadingMessage="Loading revenue trend chart..."
            className="min-h-80"
          >
            <RevenueTrendChart data={dailyRevenue} />
          </QueryStatePanel>

          <QueryStatePanel
            isLoading={monthlyComparisonState.isLoading}
            isError={monthlyComparisonState.isError}
            errorMessage={monthlyComparisonState.errorMessage}
            loadingMessage="Loading monthly comparison chart..."
            className="min-h-80"
          >
            <MonthlyComparisonChart data={monthlyBreakdown} />
          </QueryStatePanel>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <QueryStatePanel
            isLoading={techRevenueState.isLoading}
            isError={techRevenueState.isError}
            errorMessage={techRevenueState.errorMessage}
            loadingMessage="Loading technician revenue chart..."
            className="min-h-80"
          >
            <TechRevenueDonut data={techRevenue} />
          </QueryStatePanel>

          <QueryStatePanel
            isLoading={profitSplitState.isLoading}
            isError={profitSplitState.isError}
            errorMessage={profitSplitState.errorMessage}
            loadingMessage="Loading profit split chart..."
            className="min-h-80"
          >
            <ProfitSplitChart data={profitSplit} />
          </QueryStatePanel>
        </div>

        <QueryStatePanel
          isLoading={recentJobsState.isLoading}
          isError={recentJobsState.isError}
          errorMessage={recentJobsState.errorMessage}
          loadingMessage="Loading recent jobs table..."
          className="min-h-80"
        >
          <RecentJobsTable jobs={recentJobs} techNameMap={techNameMap} />
        </QueryStatePanel>
      </div>
    </div>
  );
}
