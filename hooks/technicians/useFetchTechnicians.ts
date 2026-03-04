import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type TechnicianDetailRow =
  Database["public"]["Tables"]["technicians"]["Row"];

/** You might be asking why I don't put
 * .is("deleted_at", null) in the query to exclude deleted technicians.
 * The reason is that I want to fetch all technicians, including those that are soft-deleted,
 * so that I can determine which ones are deleted and show them differently in the UI.
 */

export const fetchTechnicians = async (
  companyId: string,
): Promise<TechnicianDetailRow[]> => {
  const { data: result, error } = await supabase
    .from("technicians")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch technicians");
  }

  return result as TechnicianDetailRow[];
};

export function useFetchTechnicians() {
  const { session } = useAuth();
  const companyId = session?.user?.app_metadata?.company_id as
    | string
    | undefined;

  return useQuery<TechnicianDetailRow[], Error>({
    queryKey: ["technicians", "details", companyId ?? null],
    queryFn: () => {
      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      return fetchTechnicians(companyId);
    },
    enabled: Boolean(companyId),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
