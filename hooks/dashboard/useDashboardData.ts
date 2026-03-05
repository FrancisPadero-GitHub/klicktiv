"use client";

import { useMemo } from "react";
import type Decimal from "decimal.js";
import { useAuth } from "@/components/auth-provider";
import {
  useDashboardFilterStore,
  toJobsSummaryFilter,
} from "@/features/store/dashboard/useDashboardFilterStore";
import { useFetchJobDetailed } from "@/hooks/jobs/useFetchJobs";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { d, dSum, dSub, dToNum } from "@/lib/decimal";

export interface DashboardMetrics {
  grossRevenue: number;
  netRevenue: number;
  companyNet: number;
  totalTips: number;
  partsCost: number;
  totalJobs: number;
  doneJobs: number;
  pendingJobs: number;
  cancelledJobs: number;
  avgRevenuePerJob: number;
  companyNetMarginPct: number;
}

export interface DailyRevenue {
  date: string;
  sortKey: string;
  gross: number;
  net: number;
}

export interface MonthlyBreakdown {
  month: string;
  monthIndex: number;
  gross: number;
  companyNet: number;
  parts: number;
}

export interface TechRevenue {
  name: string;
  value: number;
}

export interface ProfitSplit {
  name: string;
  value: number;
}

/**
 * Central dashboard data hook.
 * Reads date filter from the Zustand store, fetches filtered jobs,
 * and computes all metrics using decimal.js for precision.
 */
export function useDashboardData() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;

  const mode = useDashboardFilterStore((s) => s.mode);
  const year = useDashboardFilterStore((s) => s.year);
  const month = useDashboardFilterStore((s) => s.month);
  const isoWeek = useDashboardFilterStore((s) => s.isoWeek);
  const date = useDashboardFilterStore((s) => s.date);
  const startDate = useDashboardFilterStore((s) => s.startDate);
  const endDate = useDashboardFilterStore((s) => s.endDate);

  const filterPayload = useMemo(
    () =>
      toJobsSummaryFilter({
        mode,
        year,
        month,
        isoWeek,
        date,
        startDate,
        endDate,
      }),
    [mode, year, month, isoWeek, date, startDate, endDate],
  );

  const jobsQuery = useFetchJobDetailed(filterPayload);
  const techSummaryQuery = useFetchTechSummary();
  const techniciansQuery = useFetchTechnicians();

  const jobs = useMemo(() => jobsQuery.data || [], [jobsQuery.data]);
  const techSummaries = useMemo(
    () => techSummaryQuery.data || [],
    [techSummaryQuery.data],
  );
  const technicians = useMemo(
    () => (techniciansQuery.data || []).filter((t) => t.deleted_at == null),
    [techniciansQuery.data],
  );

  const missingCompany = !isAuthLoading && !companyId;

  const isLoading =
    isAuthLoading ||
    jobsQuery.isLoading ||
    techSummaryQuery.isLoading ||
    techniciansQuery.isLoading;
  const isError =
    missingCompany ||
    jobsQuery.isError ||
    techSummaryQuery.isError ||
    techniciansQuery.isError;
  const errorMessage = missingCompany
    ? "Company ID is missing from user session"
    : (jobsQuery.error?.message ??
      techSummaryQuery.error?.message ??
      techniciansQuery.error?.message);

  const kpisState = {
    isLoading,
    isError,
    errorMessage,
  };

  const revenueTrendState = {
    isLoading: jobsQuery.isLoading || techniciansQuery.isLoading,
    isError: jobsQuery.isError || techniciansQuery.isError,
    errorMessage: jobsQuery.error?.message ?? techniciansQuery.error?.message,
  };

  const monthlyComparisonState = {
    isLoading: jobsQuery.isLoading || techniciansQuery.isLoading,
    isError: jobsQuery.isError || techniciansQuery.isError,
    errorMessage: jobsQuery.error?.message ?? techniciansQuery.error?.message,
  };

  const techRevenueState = {
    isLoading: jobsQuery.isLoading || techSummaryQuery.isLoading,
    isError: jobsQuery.isError || techSummaryQuery.isError,
    errorMessage: jobsQuery.error?.message ?? techSummaryQuery.error?.message,
  };

  const profitSplitState = {
    isLoading: jobsQuery.isLoading || techniciansQuery.isLoading,
    isError: jobsQuery.isError || techniciansQuery.isError,
    errorMessage: jobsQuery.error?.message ?? techniciansQuery.error?.message,
  };

  const recentJobsState = {
    isLoading: jobsQuery.isLoading || techSummaryQuery.isLoading,
    isError: jobsQuery.isError || techSummaryQuery.isError,
    errorMessage: jobsQuery.error?.message ?? techSummaryQuery.error?.message,
  };

  // Build a tech name map
  const techNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of techSummaries)
      if (t.technician_id && t.name) m.set(t.technician_id, t.name);
    return m;
  }, [techSummaries]);

  // Build a tech commission map
  const techCommissionMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of technicians) m.set(t.id, t.commission);
    return m;
  }, [technicians]);

  // Tech count
  const activeTech = technicians.length;

  // Compute KPI metrics with decimal.js
  const metrics: DashboardMetrics = useMemo(() => {
    const doneJobs = jobs.filter((j) => j.status === "done");
    const pendingJobs = jobs.filter((j) => j.status === "pending");
    const cancelledJobs = jobs.filter((j) => j.status === "cancelled");

    const grossRevenue = dSum(doneJobs.map((j) => j.subtotal));
    const partsCost = dSum(doneJobs.map((j) => j.parts_total_cost));
    const netRevenue = grossRevenue.minus(partsCost);
    const totalTips = dSum(doneJobs.map((j) => j.tip_amount));

    // Company net: sum each job's net * (1 - commissionRate/100)
    const companyNet = doneJobs.reduce((acc, j) => {
      const jobNet = dSub(j.subtotal, j.parts_total_cost);
      const rate = techCommissionMap.get(j.technician_id ?? "") ?? 0;
      return acc.plus(jobNet.times(d(1).minus(d(rate).dividedBy(100))));
    }, d(0));

    const totalDoneJobs = doneJobs.length;
    const avgRevenuePerJob =
      totalDoneJobs > 0 ? grossRevenue.dividedBy(totalDoneJobs) : d(0);
    const companyNetMarginPct = grossRevenue.isZero()
      ? d(0)
      : companyNet.dividedBy(grossRevenue).times(100);

    return {
      grossRevenue: dToNum(grossRevenue),
      netRevenue: dToNum(netRevenue),
      companyNet: dToNum(companyNet),
      totalTips: dToNum(totalTips),
      partsCost: dToNum(partsCost),
      totalJobs: jobs.length,
      doneJobs: totalDoneJobs,
      pendingJobs: pendingJobs.length,
      cancelledJobs: cancelledJobs.length,
      avgRevenuePerJob: dToNum(avgRevenuePerJob),
      companyNetMarginPct: dToNum(companyNetMarginPct, 1),
    };
  }, [jobs, techCommissionMap]);

  // Daily revenue chart data
  const dailyRevenue: DailyRevenue[] = useMemo(() => {
    const doneJobs = jobs.filter((j) => j.status === "done");
    const map = new Map<string, { gross: Decimal; net: Decimal }>();

    for (const job of doneJobs) {
      const dateStr = job.work_order_date;
      if (!dateStr) continue;

      const sortKey = dateStr;
      // const label = new Date(dateStr + "T00:00:00").toLocaleDateString(
      //   "en-US",
      //   {
      //     month: "short",
      //     day: "numeric",
      //   },
      // );

      const existing = map.get(sortKey) ?? { gross: d(0), net: d(0) };
      const rate = techCommissionMap.get(job.technician_id ?? "") ?? 0;
      const jobNet = dSub(job.subtotal, job.parts_total_cost);
      const jobCompanyNet = jobNet.times(d(1).minus(d(rate).dividedBy(100)));

      map.set(sortKey, {
        gross: existing.gross.plus(d(job.subtotal)),
        net: existing.net.plus(jobCompanyNet),
      });
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sortKey, vals]) => ({
        date: new Date(sortKey + "T00:00:00").toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sortKey,
        gross: dToNum(vals.gross),
        net: dToNum(vals.net),
      }));
  }, [jobs, techCommissionMap]);

  // Monthly breakdown chart data
  const monthlyBreakdown: MonthlyBreakdown[] = useMemo(() => {
    const doneJobs = jobs.filter((j) => j.status === "done");
    const map = new Map<
      number,
      { gross: Decimal; companyNet: Decimal; parts: Decimal }
    >();

    for (const job of doneJobs) {
      if (!job.work_order_date) continue;
      const dt = new Date(job.work_order_date + "T00:00:00");
      const monthIdx = dt.getMonth();

      const existing = map.get(monthIdx) ?? {
        gross: d(0),
        companyNet: d(0),
        parts: d(0),
      };

      const rate = techCommissionMap.get(job.technician_id ?? "") ?? 0;
      const jobNet = dSub(job.subtotal, job.parts_total_cost);
      const jobCompanyNet = jobNet.times(d(1).minus(d(rate).dividedBy(100)));

      map.set(monthIdx, {
        gross: existing.gross.plus(d(job.subtotal)),
        companyNet: existing.companyNet.plus(jobCompanyNet),
        parts: existing.parts.plus(d(job.parts_total_cost)),
      });
    }

    const MONTHS = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, vals]) => ({
        month: MONTHS[idx],
        monthIndex: idx,
        gross: dToNum(vals.gross),
        companyNet: dToNum(vals.companyNet),
        parts: dToNum(vals.parts),
      }));
  }, [jobs, techCommissionMap]);

  // Tech revenue donut data
  const techRevenue: TechRevenue[] = useMemo(() => {
    const doneJobs = jobs.filter((j) => j.status === "done");
    const map = new Map<string, Decimal>();

    for (const job of doneJobs) {
      const name = job.technician_id
        ? (techNameMap.get(job.technician_id) ?? "Unassigned")
        : "Unassigned";
      const current = map.get(name) ?? d(0);
      map.set(name, current.plus(d(job.subtotal)));
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value: dToNum(value),
      }))
      .sort((a, b) => b.value - a.value);
  }, [jobs, techNameMap]);

  // Profit split data
  const profitSplit: ProfitSplit[] = useMemo(() => {
    const doneJobs = jobs.filter((j) => j.status === "done");

    let totalCompanyNet = d(0);
    let totalTechPay = d(0);

    for (const job of doneJobs) {
      const jobNet = dSub(job.subtotal, job.parts_total_cost);
      const rate = techCommissionMap.get(job.technician_id ?? "") ?? 0;
      const companyPart = jobNet.times(d(1).minus(d(rate).dividedBy(100)));
      const techPart = jobNet.times(d(rate).dividedBy(100));

      totalCompanyNet = totalCompanyNet.plus(companyPart);
      totalTechPay = totalTechPay.plus(techPart);
    }

    return [
      { name: "Company Net", value: Math.max(0, dToNum(totalCompanyNet)) },
      { name: "Tech Pay", value: Math.max(0, dToNum(totalTechPay)) },
    ];
  }, [jobs, techCommissionMap]);

  // Recent jobs (sorted by date, top 10)
  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort(
        (a, b) =>
          new Date(b.work_order_date ?? "").getTime() -
          new Date(a.work_order_date ?? "").getTime(),
      )
      .slice(0, 10);
  }, [jobs]);

  return {
    // Query states
    isLoading,
    isError,
    errorMessage,
    kpisState,
    revenueTrendState,
    monthlyComparisonState,
    techRevenueState,
    profitSplitState,
    recentJobsState,

    // Raw data
    jobs,
    recentJobs,
    techSummaries,
    technicians,
    techNameMap,
    techCommissionMap,
    activeTech,

    // Computed data
    metrics,
    dailyRevenue,
    monthlyBreakdown,
    techRevenue,
    profitSplit,
  };
}
