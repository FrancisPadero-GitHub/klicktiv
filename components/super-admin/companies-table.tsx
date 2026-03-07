"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { CompanyWithUserCount } from "@/hooks/super-admin/useFetchCompanies";
import {
  useConfigureCompany,
  type ConfigureCompanyInput,
} from "@/hooks/super-admin/useConfigureCompany";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompaniesTableProps {
  companies: CompanyWithUserCount[] | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const { mutate: configureCompany, isPending } = useConfigureCompany();
  // track the company/user we intend to deactivate along with the desired
  // account state. camelCase makes the intent clearer and aligns with
  // standard React useState naming conventions.
  const [companyId, setCompanyId] = useState<
    ConfigureCompanyInput["companyId"] | null
  >(null);

  const [userId, setUserId] = useState<ConfigureCompanyInput["userId"] | null>(
    null,
  );

  const [accountState, setAccountState] = useState<
    ConfigureCompanyInput["state"] | null
  >(null);

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            All Companies
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {companies?.length} total &mdash;{" "}
            {companies?.filter((c) => !c.deleted_at).length} active
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                {["Company", "Status", "Users", "Created", ""].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500 last:w-10"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies?.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-zinc-400 dark:text-zinc-500"
                  >
                    No companies found.
                  </td>
                </tr>
              ) : (
                companies?.map((company, i) => {
                  const isActive = company.deleted_at === null;
                  return (
                    <tr
                      key={company.id}
                      className={cn(
                        "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                        i !== companies.length - 1 &&
                          "border-b border-zinc-100 dark:border-zinc-800",
                      )}
                    >
                      {/* Company name */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                            <Building2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          </div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {company.name}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                          )}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Users */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                          <Users className="h-3.5 w-3.5" />
                          <span>{company.user_count}</span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-3 text-zinc-500 dark:text-zinc-400">
                        {formatDate(company.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isActive ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={isPending}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Actions</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                onClick={() => {
                                  setCompanyId(company.id);
                                  setUserId(company.auth_id);
                                  setAccountState(true); // deletes the company and disables the user account
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                disabled={isPending}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                {isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Actions</span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-green-600 dark:text-green-400 focus:text-green-600 dark:focus:text-green-400"
                                onClick={() => {
                                  configureCompany({
                                    companyId: company.id,
                                    userId: company.auth_id,
                                    state: false, // enables the company and re-enables the user account
                                  });
                                }}
                              >
                                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                Enable
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate confirmation */}
      <AlertDialog
        open={accountState === true}
        onOpenChange={(open) =>
          !open && (setCompanyId(null), setAccountState(null))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the company and all associated user/va
              accounts. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              className="bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-700"
              onClick={() => {
                if (companyId) {
                  configureCompany({
                    companyId,
                    userId,
                    state: accountState,
                  });
                  setCompanyId(null);
                  setUserId(null);
                  setAccountState(null);
                }
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
