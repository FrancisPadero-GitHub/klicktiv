import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";
import type {
  DashboardTotals,
  TechPerformanceRow,
  MonthlyComparisonRow,
  TechJobDetailGroup,
  ReviewTotals,
  ReviewBreakdownRow,
  ReviewMonthlyRow,
} from "@/lib/dashboard-export";

export type ExportParams =
  Database["public"]["Functions"]["export_dashboard_report"]["Args"];

/** Strongly-typed shape returned by the `export_dashboard_report` RPC. */
export interface DashboardExportData {
  totals: DashboardTotals;
  monthlyRows: MonthlyComparisonRow[];
  technicianRows: TechPerformanceRow[];
  techJobDetailGroups: TechJobDetailGroup[];
  reviewTotals: ReviewTotals;
  reviewTypeRows: ReviewBreakdownRow[];
  paymentMethodRows: ReviewBreakdownRow[];
  reviewTechnicianRows: ReviewBreakdownRow[];
  reviewMonthlyRows: ReviewMonthlyRow[];
}

export type DashboardExport = DashboardExportData;

const fetchDashboardExport = async (
  params: ExportParams,
): Promise<DashboardExport | null> => {
  const { data, error } = await supabase.rpc("export_dashboard_report", params);

  if (error) {
    throw new Error(error.message);
  }

  if (data == null) return null;

  // The RPC returns `{ json: { ... } }` — unwrap it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any;
  const payload = raw?.json ?? raw;

  // If Supabase returns an array, grab the first item.
  if (Array.isArray(payload)) {
    const first = payload[0];
    return (first?.json ?? first) as DashboardExport | null;
  }

  return payload as DashboardExport;
};

export const useDashboardExport = (params: ExportParams) => {
  return useQuery({
    queryKey: ["export_dashboard_report", params],
    queryFn: () => fetchDashboardExport(params),
    enabled: Boolean(params.p_company_id),
    staleTime: 1000 * 60,
  });
};

/** Imperative fetch — same RPC, no React hook. Used by the export button. */
export const fetchExportData = fetchDashboardExport;
