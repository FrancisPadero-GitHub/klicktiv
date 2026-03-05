"use client";

import { useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6, oklch(0.6 0.2 280))",
  "var(--chart-7, oklch(0.6 0.2 320))",
  "var(--chart-8, oklch(0.6 0.2 60))",
];

export function TopJobsChart() {
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

  const data = useMemo(
    () =>
      [...jobs]
        .sort((a, b) => (b.subtotal ?? 0) - (a.subtotal ?? 0))
        .slice(0, 10)
        .map((j) => ({
          label: j.work_title ?? j.category ?? "Unknown",
          address: j.address ?? "Unknown",
          tech: j.technician_id
            ? (techNameMap.get(j.technician_id) ?? "?")
            : "?",
          gross: j.subtotal ?? 0,
          category: j.category ?? "Uncategorized",
        })),
    [jobs, techNameMap],
  );
  const categoryColorMap = useMemo(() => {
    const map = new Map<string, string>();
    let i = 0;
    for (const d of data) {
      if (!map.has(d.category)) {
        map.set(d.category, PALETTE[i % PALETTE.length]);
        i++;
      }
    }
    return map;
  }, [data]);

  const chartConfig = useMemo(
    () =>
      Object.fromEntries(
        Array.from(categoryColorMap.entries()).map(([cat, color]) => [
          cat,
          { label: cat, color },
        ]),
      ) satisfies ChartConfig,
    [categoryColorMap],
  );

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage={errorMessage}
      loadingMessage="Loading top jobs chart..."
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Top Jobs by Revenue
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Highest grossing jobs - YTD
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 12 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={160}
              tick={{ fontSize: 11 }}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  }
                  labelFormatter={(_, payload) => {
                    const item = payload[0]?.payload;
                    return item
                      ? `${item.address} (${item.tech}) · ${item.category}`
                      : "";
                  }}
                />
              }
            />
            <Bar dataKey="gross" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={categoryColorMap.get(entry.category) ?? PALETTE[0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </QueryStatePanel>
  );
}
