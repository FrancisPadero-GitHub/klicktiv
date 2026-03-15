import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-provider";
import { getValidAccessToken } from "@/lib/auth";
import { toast } from "sonner";

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
      f_name,
      l_name,
      username,
      avatar_url,
      website,
    }: CreateUserInput) => {
      const companyId = session?.user.app_metadata.company_id as
        | string
        | undefined;

      if (!companyId)
        throw new Error("Company ID is missing from user session");
      // Get a valid access token (refreshing the session if needed) before calling the Edge Function
      const accessToken = await getValidAccessToken();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl)
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");

      const response = await fetch(`${supabaseUrl}/functions/v1/create_users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        // Pass ALL required profile data to the Edge Function
        // Profile & Company Users are created together in the Edge Function
        body: JSON.stringify({
          email,
          password,
          company_id: companyId,
          f_name,
          l_name,
          username,
          avatar_url,
          website,
        }),
      });

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
          json.error ||
            json.message ||
            `Failed to create user (${response.status})`,
        );
      }

      const newUserId = json.data?.user?.id ?? json.user?.id;
      if (!newUserId) {
        throw new Error("Failed to get new user UID from Edge Function");
      }

      return {
        ...json.data,
        profile_id: newUserId,
      };
    },
    onSuccess: () => {
      toast.success("User and profile created successfully.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user",
      );
    },
  });
}
