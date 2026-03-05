"use client";

import { useMemo, useState } from "react";
import {
  useFetchJobsV2,
  type JobsSummaryFilter,
} from "@/hooks/jobs/useFetchJobsV2";

import { TopCategoriesChart } from "@/components/dashboard/jobs/job-top-categories";
import { TechRevenueBarChart } from "@/components/dashboard/technician/tech-revenue-bar-chart";
import { TopJobsChart } from "@/components/dashboard/jobs/top-jobs-chart";
import { LogJobDialog } from "@/components/dashboard/jobs/log-job-dialog";
import { JobsTable } from "@/components/dashboard/jobs/jobs-table";
import { JobSummaryCards } from "@/components/dashboard/jobs/job-summary-cards";

export default function JobsPage() {
  const now = new Date();
  const [mode, setMode] = useState<JobsSummaryFilter["mode"]>("all");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [isoWeek, setIsoWeek] = useState("");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filter = useMemo<JobsSummaryFilter>(() => {
    if (mode === "all") return { mode: "all" };
    if (mode === "year") return { mode, year: Number(year) };
    if (mode === "month")
      return { mode, year: Number(year), month: Number(month) };
    if (mode === "week") return { mode, isoWeek: isoWeek || undefined };
    if (mode === "day") return { mode, date: date || undefined };
    return {
      mode: "range",
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
  }, [mode, year, month, isoWeek, date, startDate, endDate]);

  const { data: summary } = useFetchJobsV2(filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Jobs
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {summary?.total_jobs ?? 0} jobs logged
          </p>
        </div>
        <LogJobDialog />
      </div>

      {/* Summary cards */}
      <JobSummaryCards
        filter={filter}
        onFilterChange={(newFilter) => {
          setMode(newFilter.mode ?? "all");
          if (newFilter.year !== undefined) setYear(String(newFilter.year));
          if (newFilter.month !== undefined) setMonth(String(newFilter.month));
          if (newFilter.isoWeek !== undefined)
            setIsoWeek(newFilter.isoWeek ?? "");
          if (newFilter.date !== undefined) setDate(newFilter.date ?? "");
          if (newFilter.startDate !== undefined)
            setStartDate(newFilter.startDate ?? "");
          if (newFilter.endDate !== undefined)
            setEndDate(newFilter.endDate ?? "");
        }}
      />

      <JobsTable />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCategoriesChart />
        <TechRevenueBarChart />
      </div>

      <TopJobsChart />
    </div>
  );
}
