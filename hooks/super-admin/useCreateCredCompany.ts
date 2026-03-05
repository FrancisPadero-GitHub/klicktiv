import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getValidAccessToken } from "@/lib/auth";
import { toast } from "sonner";

export type CreateCompanyInput = {
  email: string;
  password: string;
  company_name: string;
};

type CreateCompanyResponse = {
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

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      company_name,
      email,
      password,
    }: CreateCompanyInput) => {
      // Get a valid access token (refreshing the session if needed) before calling the Edge Function
      const accessToken = await getValidAccessToken();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl)
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");

      const response = await fetch(
        `${supabaseUrl}/functions/v1/create_company`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email,
            password,
            company_name,
          }),
        },
      );

      const text = await response.text();
      let json: CreateCompanyResponse = {};

      if (text) {
        try {
          json = JSON.parse(text) as CreateCompanyResponse;
        } catch {
          json = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          json.error ||
            json.message ||
            `Failed to create company (${response.status})`,
        );
      }

      return {
        ...json.data,
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["super-admin", "companies"],
      });
      toast.success("Company and admin credentials created successfully.");
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create company";
      toast.error(message);
    },
  });
}
