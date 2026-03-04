import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/database.types";

export type ProfilesRow = Database["public"]["Tables"]["profiles"]["Row"];

export const profileQueryKey = (userId?: string) =>
  ["profiles", "me", userId ?? "anonymous"] as const;

// Deprecated
// use the role from the session instead of fetching the profile for every user
export const fetchProfileById = async (
  userId: string,
): Promise<ProfilesRow | null> => {
  const { data: result, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch profile");
  }

  return result as ProfilesRow | null;
};

// Deprecated
// use the role from the session instead of fetching the profile for every user
export function useFetchRole(userId?: string) {
  return useQuery<ProfilesRow | null, Error>({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfileById(userId as string),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}

export const allProfilesQueryKey = ["profiles", "all"] as const;

export const fetchAllProfiles = async (): Promise<ProfilesRow[]> => {
  const { data: result, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "super_admin")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to fetch profiles");
  }

  return (result ?? []) as ProfilesRow[];
};

export function useFetchProfiles() {
  return useQuery<ProfilesRow[], Error>({
    queryKey: allProfilesQueryKey,
    queryFn: fetchAllProfiles,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  });
}
