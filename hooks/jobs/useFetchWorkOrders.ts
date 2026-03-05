import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type WorkOrders = Database["public"]["Tables"]["work_orders"]["Row"];

// Data fetching function
export const fetchWorkOrders = async (
  companyId: string,
): Promise<WorkOrders[]> => {
  const { data: result, error } = await supabase
    .from("work_orders")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch work orders");
  }

  return result as WorkOrders[];
};

export function useFetchWorkOrders() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<WorkOrders[], Error>({
    queryKey: ["work_orders", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchWorkOrders(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
