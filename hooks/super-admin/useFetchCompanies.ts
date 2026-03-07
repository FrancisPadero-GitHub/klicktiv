import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

type CompanyRow = Database["public"]["Tables"]["companies"]["Row"];

export interface CompanyWithUserCount extends CompanyRow {
  user_count: number;
}

async function fetchCompanies(): Promise<CompanyWithUserCount[]> {
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (companies.length === 0) return [];

  // Fetch user counts per company
  const { data: companyUsers, error: cuError } = await supabase
    .from("company_users")
    .select("company_id");

  if (cuError) throw new Error(cuError.message);

  const countMap = new Map<string, number>();
  for (const cu of companyUsers) {
    countMap.set(cu.company_id, (countMap.get(cu.company_id) ?? 0) + 1);
  }

  return companies.map((c) => ({
    ...c,
    user_count: countMap.get(c.id) ?? 0,
  }));
}

export function useFetchCompanies() {
  return useQuery<CompanyWithUserCount[], Error>({
    queryKey: ["super-admin", "companies"],
    queryFn: fetchCompanies,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });
}
