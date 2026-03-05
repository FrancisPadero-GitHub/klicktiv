"use client";

import { Pie, PieChart, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { QueryStatePanel } from "@/components/misc/query-state-panel";

// Yotam: { label: "Yotam", color: "var(--chart-1)" },
// Tamir: { label: "Tamir", color: "var(--chart-2)" },
// Shalom: { label: "Shalom", color: "var(--chart-3)" },
// Subs: { label: "Subs", color: "var(--chart-4)" },

export function TechJobsDonut() {
  const { data: technicians = [], isLoading, isError } = useFetchTechSummary();

  // Filters out technicians with zero jobs to avoid cluttering the chart with empty slices
  const filteredTechs = technicians.filter((t) => (t.total_jobs ?? 0) > 0);

  // Prepares the data for the PieChart by mapping each technician to an object with name and value properties
  const pieData = filteredTechs.map((t, i) => ({
    name: t.name || `Tech ${i + 1}`,
    value: t.total_jobs ?? 0,
  }));

  // Generates the chart configuration dynamically based on the filtered technicians, assigning a unique color to each technician slice in the chart
  const chartConfig = filteredTechs.reduce(
    (acc, t, i) => {
      const name = t.name || `Tech ${i + 1}`;
      acc[name] = {
        label: name,
        color: `var(--chart-${(i % 4) + 1})`,
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>,
  ) as ChartConfig;

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load jobs distribution chart"
      loadingMessage="Loading jobs distribution chart..."
      className="min-h-80"
    >
      <div className="h-full rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Jobs Distribution
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Total jobs per technician - YTD
          </p>
        </div>
        <ChartContainer config={chartConfig} className="mx-auto h-70 w-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value} jobs`}
                  nameKey="name"
                />
              }
            />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={2}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartConfig[pieData[index].name].color || "#000"}
                />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </div>
    </QueryStatePanel>
  );
}
