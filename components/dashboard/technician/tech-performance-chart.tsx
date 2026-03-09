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
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { QueryStatePanel } from "@/components/misc/query-state-panel";

const chartConfig = {
  gross: {
    label: "Gross Revenue",
    color: "var(--chart-1)",
  },
  companyNet: {
    label: "Company Net",
    color: "var(--chart-2)",
  },
  parts: {
    label: "Parts",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function TechPerformanceChart() {
  const { data: technicians, isLoading, isError } = useFetchTechSummary();

  const chartData = useMemo(() => {
    if (!technicians) return [];
    return technicians.map((tech) => ({
      name: tech.name || "Unknown",
      gross: tech.gross_revenue || 0,
      companyNet: tech.total_company_net || 0,
      parts: tech.total_parts || 0,
    }));
  }, [technicians]);

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load technician performance chart"
      loadingMessage="Loading technician performance chart..."
      className="min-h-80"
    >
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Technician Performance
          </h3>
          <p className="text-xs text-muted-foreground">
            Gross, company net, and parts - YTD
          </p>
        </div>
        <ChartContainer config={chartConfig} className="h-75 w-full">
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
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
              dataKey="gross"
              fill="var(--color-gross)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="companyNet"
              fill="var(--color-companyNet)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="parts"
              fill="var(--color-parts)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </QueryStatePanel>
  );
}
