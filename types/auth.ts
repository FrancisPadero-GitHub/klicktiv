import type { User, Session } from "@supabase/supabase-js";

// ── Form values ──────────────────────────────────────────────
export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignUpFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// ── Auth state ───────────────────────────────────────────────
export type AuthState = {
  user: User | null;
  role: string | null;
  session: Session | null;
  isLoading: boolean;
};

// ── Context value ────────────────────────────────────────────
export type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};
