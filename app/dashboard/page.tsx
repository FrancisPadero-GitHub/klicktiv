"use client";

import { DashboardDateFilter } from "@/components/dashboard/dashboard-date-filter";
import { DashboardKPIs } from "@/components/dashboard/dashboard-kpis";
import { RecentJobsList } from "@/components/dashboard/jobs/recent-jobs-list";
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button";
import { FinancialTrendsSection } from "@/components/dashboard/financial/financial-trends-section";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { role, company_id } = useAuth();

  const isCompany = role === "company" || role === "super_admin";

  return (
    <div className="space-y-4">
      {/* Header + Date Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Overview / Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Financial dashboard with date filtering
          </p>
        </div>

        <div className="flex flex-col gap-3 justify-between xl:flex-row xl:items-start">
          <DashboardDateFilter />
          {isCompany ? (
            <div className="self-start">
              <DashboardExportButton />
            </div>
          ) : null}
        </div>
      </div>

      {/* Content, loading / error / data */}
      <div className="space-y-4">
        <DashboardKPIs companyId={company_id ?? ""} />
        <FinancialTrendsSection companyId={company_id ?? ""} />
        <RecentJobsList />
      </div>
    </div>
  );
}
