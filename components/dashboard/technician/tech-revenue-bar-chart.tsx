"use client";

import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";

const chartConfig = {
  companyNet: {
    label: "Company Net",
    color: "var(--chart-4)",
  },
  techPay: {
    label: "Tech Pay",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function TechRevenueBarChart() {
  const {
    data: jobs = [],
    isLoading: isJobsLoading,
    isError: isJobsError,
    error: jobsError,
  } = useFetchViewJobRow();
  const {
    data: techSummaries = [],
    isLoading: isTechLoading,
    isError: isTechError,
    error: techError,
  } = useFetchTechSummary();

  const isLoading = isJobsLoading || isTechLoading;
  const isError = isJobsError || isTechError;
  const errorMessage = jobsError?.message || techError?.message;

  const techNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of techSummaries)
      if (t.technician_id && t.name) m.set(t.technician_id, t.name);
    return m;
  }, [techSummaries]);

  const data = useMemo(() => {
    const techRevenueMap: Record<
      string,
      { companyNet: number; techPay: number }
    > = {};
    for (const j of jobs) {
      const name = j.technician_id
        ? (techNameMap.get(j.technician_id) ?? "Unknown")
        : "Unknown";
      if (!(name in techRevenueMap)) {
        techRevenueMap[name] = { companyNet: 0, techPay: 0 };
      }
      techRevenueMap[name].companyNet += j.total_company_net ?? 0;
      techRevenueMap[name].techPay += j.total_commission ?? 0;
    }
    return Object.entries(techRevenueMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.companyNet + b.techPay - (a.companyNet + a.techPay));
  }, [jobs, techNameMap]);
  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingMessage="Loading technician revenue chart..."
      className="min-h-80"
    >
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Revenue Split by Technician
          </h3>
          <p className="text-xs text-muted-foreground">
            Company net vs tech pay - YTD
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="companyNet"
              stackId="a"
              fill="var(--color-companyNet)"
              radius={[1, 1, 0, 0]}
              className="transition-all duration-300 hover:opacity-80"
            />
            <Bar
              dataKey="techPay"
              stackId="a"
              fill="var(--color-techPay)"
              radius={[4, 4, 0, 0]}
              className="transition-all duration-300 hover:opacity-80"
            />
          </BarChart>
        </ChartContainer>
      </div>
    </QueryStatePanel>
  );
}
