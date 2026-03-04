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

      if (!companyId) {
        throw new Error("Company ID is missing from user session");
      }

      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error("Admin is not authenticated");
      }

      const edgeFunction = role === "admin" ? "create_admin" : "create_users";
      const profileRole = role === "admin" ? "admin" : "user";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/${edgeFunction}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email,
            password,
            company_id: companyId,
          }),
        },
      );

      // Read the response body as text
      const text = await response.text();
      let json: CreateUserResponse = {};

      // Attempt to parse the response as JSON
      if (text) {
        try {
          json = JSON.parse(text) as CreateUserResponse;
        } catch {
          // If parsing fails, fallback to an empty object
          json = {};
        }
      }

      // If the response is not OK, throw an error with details from the response
      if (!response.ok) {
        throw new Error(
          json?.error ||
            json?.message ||
            `Failed to create user (${response.status})`,
        );
      }

      // Extract the new user's ID from the response
      const newUserId = json?.data?.user?.id ?? json?.user?.id;
      if (!newUserId) {
        throw new Error("Failed to get new user UID from Edge Function");
      }

      // Upsert the user's profile in the Supabase 'profiles' table
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: newUserId,
          role: profileRole,
          email: email,
          f_name,
          l_name,
          username: username?.trim() || null,
          avatar_url: avatar_url?.trim() || null,
          website: website?.trim() || null,
          company_id: companyId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      // Handle any errors from the profile upsert
      if (profileError) {
        throw new Error(profileError.message || "Failed to insert profile");
      }

      // Insert the user into the 'company_users' table to link them to the company
      const { error: companyUsers } = await supabase
        .from("company_users")
        .insert({
          company_id: companyId,
          user_id: newUserId,
          role: profileRole,
        });

      // Handle any errors from the company_users insert
      if (companyUsers) {
        throw new Error(
          companyUsers.message || "Failed to insert company user",
        );
      }

      // Return the created user data, including profile ID and role
      return {
        ...json.data,
        profile_id: newUserId,
      };
    },
    onSuccess: () => {
      console.log("User created successfully");
    },
    onError: (error) => {
      console.error(
        "Error creating user:",
        error instanceof Error ? error.message : error,
      );
    },
  });
}
