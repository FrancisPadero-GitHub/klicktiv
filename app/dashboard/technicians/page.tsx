"use client";

import { TechPerformanceChart } from "@/components/dashboard/technician/tech-performance-chart";
import { TechJobsDonut } from "@/components/dashboard/technician/tech-jobs-donut";
import { AddTechnicianDialog } from "@/components/dashboard/technician/form-technician-dialog";
import { TechnicianCardsGrid } from "@/components/dashboard/technician/technician-cards-grid";
import { TechnicianTable } from "@/components/dashboard/technician/technician-table";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";

export default function TechniciansPage() {
  const { data: techSummary = [], isLoading } = useFetchTechSummary();

  const activeCount = techSummary.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Technicians
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading ? "Counting technicians..." : `${activeCount} active`}
          </p>
        </div>
        <AddTechnicianDialog />
      </div>
      {/* Technician Table */}
      <TechnicianTable />
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TechPerformanceChart />
        <TechJobsDonut />
      </div>

      <div className="grid ">
        {/* Technician Cards Grid */}
        <div className="h-full overflow-hidden p-2 bg-muted/30 dark:bg-card/50 rounded-xl border border-border">
          <TechnicianCardsGrid />
        </div>
      </div>
    </div>
  );
}
