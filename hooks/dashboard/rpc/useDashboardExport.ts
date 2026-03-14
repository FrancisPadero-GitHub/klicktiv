import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type ExportParams =
  Database["public"]["Functions"]["export_dashboard_report"]["Args"];

export interface DashboardExportData {
  monthlyRows?: Record<string, any>[];
  technicianRows?: Record<string, any>[];
  totals?: Record<string, any>;
  reviewTotals?: Record<string, any>;
  reviewTypeRows?: Record<string, any>[];
}

export type DashboardExport = DashboardExportData;

const fetchDashboardExport = async (
  params: ExportParams,
): Promise<DashboardExport | null> => {
  const { data, error } = await supabase.rpc("export_dashboard_report", params);

  if (error) {
    throw new Error(error.message);
  }

  // data is already a perfectly formatted JSON object!
  // If Supabase returns an array, grab the first item.
  // If it returns the JSON object directly, just return the object.
  if (Array.isArray(data)) {
    return (data[0] as DashboardExport) || null;
  }
  return data as DashboardExport;
};

export const useDashboardExport = (params: ExportParams) => {
  return useQuery({
    // Automatically refetch when any of these parameters change
    queryKey: ["export_dashboard_report", params],
    queryFn: () => fetchDashboardExport(params),
    // Prevent the query from running if we don't have a company_id yet
    enabled: Boolean(params.p_company_id),
    // Optional: Keep data fresh for 1 minute before refetching in the background
    staleTime: 1000 * 60,
  });
};
