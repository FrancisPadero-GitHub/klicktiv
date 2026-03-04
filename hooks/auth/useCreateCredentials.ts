import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";

// For the RLS parameters use this:   (( SELECT auth.uid() AS uid) = id)

// Make sure this does have the same fields as the create_user/admin edge function input
type CreateRole = "user" | "admin";

export type CreateUserInput = {
  email: string;
  password: string;
  role?: CreateRole; // default: "user"
  f_name: string;
  l_name: string;
  username?: string;
  avatar_url?: string;
  website?: string;
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
    mutationFn: async ({
      email,
      password,
      role = "user",
      f_name,
      l_name,
      username,
      avatar_url,
      website,
    }: CreateUserInput) => {
      const companyId = session?.user?.app_metadata?.company_id as
        | string
        | undefined;

      if (!companyId)
        throw new Error("Company ID is missing from user session");
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Admin is not authenticated");

      const edgeFunction = role === "admin" ? "create_admin" : "create_users";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl)
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");

      const response = await fetch(
        `${supabaseUrl}/functions/v1/${edgeFunction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          // Pass ALL required profile data to the Edge Function
          body: JSON.stringify({
            email,
            password,
            company_id: companyId,
            role,
            f_name,
            l_name,
            username,
            avatar_url,
            website,
          }),
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
        profile_id: newUserId,
      };
    },
    onSuccess: () => {
      console.log("User and profile created successfully via Edge Function");
    },
    onError: (error) => {
      console.error(
        "Error creating user:",
        error instanceof Error ? error.message : error,
      );
    },
  });
}
