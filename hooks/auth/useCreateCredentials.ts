import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

type CreateRole = "user" | "admin";

export type CreateUserInput = {
  email: string;
  password: string;
  role?: CreateRole; // default: "user"
};

type CreateUserResponse = {
  data?: {
    user?: {
      id?: string;
    };
    [key: string]: unknown;
  };
  user?: {
    id?: string;
  };
  error?: string;
  message?: string;
};

export function useCreateUser() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ email, password, role = "user" }: CreateUserInput) => {
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Admin is not authenticated");
      }

      const functionName = role === "admin" ? "create_admin" : "create_users";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ email, password }),
        },
      );

      const text = await response.text();
      let json: CreateUserResponse = {};

      if (text) {
        try {
          json = JSON.parse(text) as CreateUserResponse;
        } catch {
          json = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          json?.error ||
            json?.message ||
            `Failed to create user (${response.status})`,
        );
      }

      const newUserId = json?.data?.user?.id ?? json?.user?.id;
      if (!newUserId) {
        throw new Error("Failed to get new user UID from Edge Function");
      }

      return {
        ...json.data,
        created_role: role,
      };
    },
  });
}
