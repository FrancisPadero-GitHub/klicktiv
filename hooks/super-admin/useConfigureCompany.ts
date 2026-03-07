import { useRef } from "react";
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

async function configureAccountState({
  supabaseUrl,
  accessToken,
  userId,
  state,
}: {
  supabaseUrl: string;
  accessToken: string;
  userId: string;
  state: boolean | null;
}) {
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
        `Failed to update account state (${response.status})`,
    );
  }

  return json;
}

export function useConfigureCompany() {
  const queryClient = useQueryClient();
  const loadingToastId = useRef<string | number | null>(null);

  return useMutation({
    mutationFn: async ({ companyId, userId, state }: ConfigureCompanyInput) => {
      if (!companyId) {
        throw new Error("Missing company ID for configuration");
      }

      if (state === null) {
        throw new Error("Missing target state for configuration");
      }

      // 1. Soft delete the company
      const { error: companyError } = await supabase
        .from("companies")
        .update({
          deleted_at: state === true ? new Date().toISOString() : null,
        })
        .eq("id", companyId);

      if (companyError) {
        throw new Error(companyError.message);
      }

      // 2. Get valid access token
      const accessToken = await getValidAccessToken();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
      }

      if (!userId) {
        throw new Error("Missing target user ID for company configuration");
      }

      // 3. Configure the primary account tied to the company
      const primaryResult = await configureAccountState({
        supabaseUrl,
        accessToken,
        userId,
        state,
      });

      // 4. Configure every user profile linked to this company
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", companyId);

      if (profilesError) {
        throw new Error(profilesError.message);
      }

      const profileIds = Array.from(
        new Set(profiles.map((profile) => profile.id).filter(Boolean)),
      );

      const secondaryIds = profileIds.filter(
        (profileId) => profileId !== userId,
      );

      if (secondaryIds.length > 0) {
        const settled = await Promise.allSettled(
          secondaryIds.map((profileId) =>
            configureAccountState({
              supabaseUrl,
              accessToken,
              userId: profileId,
              state,
            }),
          ),
        );

        const failedUpdates = settled.filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        );

        if (failedUpdates.length > 0) {
          const firstReason =
            failedUpdates[0].reason instanceof Error
              ? failedUpdates[0].reason.message
              : "Unknown account configuration error";

          throw new Error(
            `Updated company, but failed to configure ${failedUpdates.length} user account(s): ${firstReason}`,
          );
        }
      }

      return primaryResult.data;
    },

    onMutate: () => {
      loadingToastId.current = toast.loading("Updating company configuration…");
    },

    onSuccess: async () => {
      toast.dismiss(loadingToastId.current ?? undefined);
      await queryClient.invalidateQueries({
        queryKey: ["super-admin", "companies"],
        exact: false,
      });
      toast.success("Company configuration updated.");
    },

    onError: (error) => {
      toast.dismiss(loadingToastId.current ?? undefined);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update company configuration";
      toast.error(message);
    },
  });
}
