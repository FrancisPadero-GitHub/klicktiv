"use client";

import { useState, useMemo } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import { useFetchCompany } from "@/hooks/company/useFetchCompany";
import {
  useDashboardExport,
  fetchExportData,
  type ExportParams,
} from "@/hooks/dashboard/rpc/useDashboardExport";
import { useDashboardMetrics } from "@/hooks/dashboard/rpc/useDashboardMetrics";
import { useDashboardFilterStore } from "@/features/store/dashboard/useDashboardFilterStore";
import { resolveDateRange } from "@/lib/helper";
import {
  mapHookDataToReport,
  exportDashboardReportAsExcel,
  exportDashboardReportAsPdf,
  type ExportFormat,
  type MetricsKpis,
} from "@/lib/dashboard-export";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DashboardExportButton() {
  const { session } = useAuth();
  const companyId = session?.user.app_metadata.company_id as string | undefined;
  const companyQuery = useFetchCompany(companyId);

  // Read filter store to build RPC params for "current filter" scope
  const { mode, year, month, isoWeek, date, startDate, endDate, technicianId } =
    useDashboardFilterStore();

  const { p_start_date, p_end_date } = useMemo(
    () =>
      resolveDateRange(mode, year, month, isoWeek, date, startDate, endDate),
    [mode, year, month, isoWeek, date, startDate, endDate],
  );

  const currentFilterParams: ExportParams = useMemo(
    () => ({
      p_company_id: companyId ?? "",
      p_technician_id:
        technicianId === "all" || technicianId == null
          ? undefined
          : technicianId,
      p_start_date,
      p_end_date,
      p_all_time: mode === "all",
    }),
    [companyId, technicianId, p_start_date, p_end_date, mode],
  );

  // Pre-fetch current-filter data via the hook so it's cached / fast
  const { data: currentFilterData } = useDashboardExport(currentFilterParams);

  // Fetch extra KPIs from the dashboard_metrics RPC
  const { data: metricsData } = useDashboardMetrics(currentFilterParams);

  const buildMetricsKpis = (): MetricsKpis | undefined => {
    if (!metricsData) return undefined;
    return {
      estimatePipeline: metricsData.total_estimate_pipeline,
      techCommissionMarginPct: metricsData.tech_commission_margin * 100,
      reviewRecordsTotal: metricsData.review_records_total,
      totalJobsDone: metricsData.total_jobs_done,
      totalJobsPending: metricsData.total_jobs_pending,
    };
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);

  const requestExport = (format: ExportFormat) => {
    setSelectedFormat(format);
    setDialogOpen(true);
  };

  const runExport = async (scope: "current" | "all") => {
    if (!selectedFormat) return;
    if (!companyId) {
      toast.error("Company ID is missing from user session");
      return;
    }

    setIsExporting(true);
    try {
      let hookData: typeof currentFilterData;

      if (scope === "current") {
        // Use the already-cached data from the hook, or fetch on demand
        hookData =
          currentFilterData ?? (await fetchExportData(currentFilterParams));
      } else {
        // "All records" scope — fetch with p_all_time = true
        hookData = await fetchExportData({
          p_company_id: companyId,
          p_technician_id: undefined,
          p_start_date: undefined,
          p_end_date: undefined,
          p_all_time: true,
        });
      }

      if (!hookData) {
        toast.error("No data returned from the server.");
        return;
      }

      const report = mapHookDataToReport(hookData, {
        scopeLabel: scope === "current" ? "Current Filter" : "All Records",
        company: {
          id: companyId,
          name: companyQuery.data?.name,
        },
        metricsKpis: buildMetricsKpis(),
      });

      if (selectedFormat === "excel") {
        await exportDashboardReportAsExcel(report);
      } else {
        await exportDashboardReportAsPdf(report);
      }

      toast.success(
        `Exported ${selectedFormat.toUpperCase()} report (${report.scopeLabel}).`,
      );
      setDialogOpen(false);
      setSelectedFormat(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to export dashboard report.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="size-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => requestExport("pdf")}>
            <FileText className="size-4" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => requestExport("excel")}>
            <FileSpreadsheet className="size-4" />
            Export Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={!isExporting} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose export scope</DialogTitle>
            <DialogDescription>
              Export as {selectedFormat?.toUpperCase() ?? "file"}. Do you want
              to apply the current dashboard filter, or export all records?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setSelectedFormat(null);
              }}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                void runExport("current");
              }}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Use Current Filter"}
            </Button>
            <Button
              onClick={() => {
                void runExport("all");
              }}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
