"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { useDashboardFilterStore } from "@/features/store/dashboard/useDashboardFilterStore";
import {
  useDashboardExport,
  type ExportParams,
} from "@/hooks/dashboard/rpc/useDashboardExport";
import { resolveDateRange } from "@/lib/helper";
import type { MonthlyComparisonRow } from "@/lib/dashboard-export";

const revenueChartConfig = {
  gross: { label: "Gross", color: "var(--chart-1)" },
  net: { label: "Net", color: "var(--chart-3)" },
  companyNet: { label: "Company Net", color: "var(--chart-4)" },
} satisfies ChartConfig;

const jobsChartConfig = {
  jobs: { label: "Jobs Completed", color: "var(--chart-2)" },
} satisfies ChartConfig;

function parseMonth(value: string): Date | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}$/.test(value)) {
    const d = new Date(`${value}-01T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthLabel(value: string, variant: "short" | "long") {
  const d = parseMonth(value);
  if (!d) return value;
  const formatter =
    variant === "short"
      ? new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" })
      : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
  return formatter.format(d);
}

function formatCurrencyAxis(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function normalizeMonthlyRows(rows: MonthlyComparisonRow[]) {
  return rows.map((row) => ({
    ...row,
    monthLabelShort: formatMonthLabel(row.month, "short"),
    monthLabelLong: formatMonthLabel(row.month, "long"),
  }));
}

export function FinancialTrendsSection({ companyId }: { companyId: string }) {
  const { mode, year, month, isoWeek, date, startDate, endDate, technicianId } =
    useDashboardFilterStore();

  const { p_start_date, p_end_date } = useMemo(
    () =>
      resolveDateRange(mode, year, month, isoWeek, date, startDate, endDate),
    [mode, year, month, isoWeek, date, startDate, endDate],
  );

  const params: ExportParams = useMemo(
    () => ({
      p_company_id: companyId,
      p_technician_id:
        technicianId === "all" || technicianId == null
          ? undefined
          : technicianId,
      p_start_date,
      p_end_date,
      p_all_time: mode === "all",
    }),
    [companyId, technicianId, p_start_date, p_end_date, mode],
  );

  const {
    data,
    isLoading: isExportLoading,
    isError: isExportError,
    error: exportError,
  } = useDashboardExport(params);

  const rows = useMemo(
    () => normalizeMonthlyRows(data?.monthlyRows ?? []),
    [data],
  );

  const hasRows = rows.length > 0;

  return (
    <QueryStatePanel
      isLoading={isExportLoading}
      isError={isExportError}
      errorMessage={exportError?.message}
      loadingMessage="Loading financial trends..."
      className="min-h-80"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Revenue &amp; Profit Over Time
            </CardTitle>
            <CardDescription>Gross vs net vs company net by month</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasRows ? (
              <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                No monthly data for this period
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="h-70 w-full">
                <AreaChart data={rows} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthLabelShort"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v) => formatCurrencyAxis(Number(v))}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const first = payload[0]?.payload as
                            | { monthLabelLong?: string }
                            | undefined;
                          return first?.monthLabelLong ?? "";
                        }}
                        formatter={(value) =>
                          `$${Number(value).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="gross"
                    stroke="var(--color-gross)"
                    fill="var(--color-gross)"
                    fillOpacity={0.14}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="var(--color-net)"
                    fill="var(--color-net)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="companyNet"
                    stroke="var(--color-companyNet)"
                    fill="var(--color-companyNet)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Jobs Completed Over Time</CardTitle>
            <CardDescription>Monthly job volume (separate from revenue)</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasRows ? (
              <div className="flex h-70 items-center justify-center text-sm text-muted-foreground">
                No monthly data for this period
              </div>
            ) : (
              <ChartContainer config={jobsChartConfig} className="h-70 w-full">
                <BarChart data={rows} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="monthLabelShort"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={16}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => {
                          const first = payload[0]?.payload as
                            | { monthLabelLong?: string }
                            | undefined;
                          return first?.monthLabelLong ?? "";
                        }}
                        formatter={(value) =>
                          `${Number(value).toLocaleString("en-US")} jobs`
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="jobs"
                    fill="var(--color-jobs)"
                    radius={[4, 4, 0, 0]}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </QueryStatePanel>
  );
}

