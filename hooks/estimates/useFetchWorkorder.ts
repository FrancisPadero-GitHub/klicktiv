import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type WorkOrdersRow = Database["public"]["Tables"]["work_orders"]["Row"];

// Data fetching function
export const fetchWorkOrdersRow = async (
  companyId: string,
): Promise<WorkOrdersRow[]> => {
  const { data: result, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch work orders table");
  }

  return result as WorkOrdersRow[];
};

export function useFetchWorkOrdersRow() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<WorkOrdersRow[], Error>({
    queryKey: ["jobs", "work-orders", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchWorkOrdersRow(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
