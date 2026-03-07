import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getValidAccessToken } from "@/lib/auth";
import { toast } from "sonner";

/** This configuration enables / disables company as well as their login credentials */

export type ConfigureCompanyInput = {
  companyId: string | null;
  userId: string | null;
  state: boolean | null; // true = deactivate, false = activate, since the column on the auth is named "disabled" and take either boolean
};

type DisableAccountsResponse = {
  data?: unknown;
  error?: string;
  message?: string;
};

export function useConfigureCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, userId, state }: ConfigureCompanyInput) => {
      // 1. Soft delete the company
      if (state === true) {
        const { error: companyError } = await supabase
          .from("companies")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", companyId);

        if (companyError) {
          throw new Error(companyError.message);
        }
      } else {
        // enable the company by clearing the deleted_at timestamp
        const { error: companyError } = await supabase
          .from("companies")
          .update({ deleted_at: null })
          .eq("id", companyId);

        if (companyError) {
          throw new Error(companyError.message);
        }
      }

      // 2. Get valid access token
      const accessToken = await getValidAccessToken();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      }

      // 3. Call edge function
      const response = await fetch(
        `${supabaseUrl}/functions/v1/configure_state_accounts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId,
            state,
          }),
        },
      );

      const text = await response.text();
      let json: DisableAccountsResponse = {};

      if (text) {
        try {
          json = JSON.parse(text) as DisableAccountsResponse;
        } catch {
          json = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          json.error ||
            json.message ||
            `Failed to disable account (${response.status})`,
        );
      }

      return json.data;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["super-admin", "companies"],
        exact: false,
      });
      toast.success("Company configuration updated.");
    },

    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update company configuration";
      toast.error(message);
    },
  });
}
