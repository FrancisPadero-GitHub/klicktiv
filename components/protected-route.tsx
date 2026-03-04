"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: ReactNode;
  /** Where to redirect unauthenticated users (default: /auth/login) */
  redirectTo?: string;
};

/**
 * Wrapper that gates its children behind authentication.
 *
 * While the session is being resolved it renders a centered spinner.
 * Once resolved, unauthenticated users are redirected to `redirectTo`.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/auth/login",
}: ProtectedRouteProps) {
  const { user, isLoading, session } = useAuth();
  console.log("ProtectedRoute session:", session);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, router, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user) {
    // Will redirect via the effect above; render nothing in the meantime
    return null;
  }

  return <>{children}</>;
}
