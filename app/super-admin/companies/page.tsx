"use client";

import { useFetchCompanies } from "@/hooks/super-admin/useFetchCompanies";
import { CompaniesTable } from "@/components/super-admin/companies-table";
import { AddCompanyDialog } from "@/components/super-admin/add-company-dialog";
import { Loader2, AlertCircle } from "lucide-react";

export default function CompaniesPage() {
  const { data: companies, isLoading, isError, error } = useFetchCompanies();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Companies
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage tenant companies registered on the platform
          </p>
        </div>
        <AddCompanyDialog />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {(error as Error).message || "Failed to load companies."}
        </div>
      ) : (
        <CompaniesTable companies={companies || []} />
      )}
    </div>
  );
}
