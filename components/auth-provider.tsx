"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { signOut as signOutApi } from "@/lib/auth";
import { useUser } from "@/hooks/auth/useUser";
import { AUTH_QUERY_KEY } from "@/hooks/auth/useLogin";
import { fetchProfileById, profileQueryKey } from "@/hooks/auth/useFetchRole";
import type { AuthContextValue } from "@/types/auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides auth state to the entire app.
 *
 * - Resolves the initial session via `useUser` (TanStack Query).
 * - Subscribes to `onAuthStateChange` so that login / logout / token
 *   refresh events immediately propagate through the query cache.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: session, isLoading, isFetching } = useUser();

  // Listen for Supabase auth events and keep the cache in sync
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Refetches to the user id and company_id changes
  useEffect(() => {
    const userId = session?.user.id;
    const companyId = session?.user.app_metadata.company_id as
      | string
      | undefined;

    if (!userId || !companyId) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: [...profileQueryKey(userId), companyId],
      queryFn: () => fetchProfileById(userId, companyId),
    });
  }, [queryClient, session?.user.id, session?.user.app_metadata.company_id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session: session ?? null,
      role: session?.user.app_metadata.role ?? null,
      company_id: session?.user.app_metadata.company_id ?? null,
      isLoading: isLoading || isFetching,
      signOut: signOutApi,
    }),
    [session, isLoading, isFetching],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Convenience hook – throws when used outside AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider />");
  }
  return ctx;
}
