"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  SlidersHorizontal,
  X,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useJobStore } from "@/features/store/jobs/useFormJobStore";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useDelJob } from "@/hooks/jobs/useDelJob";
import { useBulkDelJobs } from "@/hooks/jobs/useBulkDelJobs";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";
import { JobViewDialog } from "@/components/dashboard/jobs/job-view-dialog";
import { JobDeleteAlert } from "@/components/dashboard/jobs/job-delete-alert";

// helpers

const shortId = (value: string | null) => {
  if (!value) return "";
  return value.slice(0, 8);
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

type SortKey =
  | "work_order_id"
  | "work_title"
  | "work_order_date"
  | "address"
  | "technician_id"
  | "subtotal"
  | "net_revenue"
  | "parts_total_cost"
  | "total_commission"
  | "total_company_net"
  | "status";

type SortDir = "asc" | "desc";
type StatusFilter = "all" | "done" | "pending" | "cancelled";
type DynamicFilter = "all" | (string & {});

const statusColors: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

export function JobsTable() {
  const { data: jobs = [], isLoading, isError } = useFetchViewJobRow();
  const { data: techSummary = [] } = useFetchTechSummary();
  const { data: techDetails = [] } = useFetchTechnicians();
  const { openEdit } = useJobStore();
  const { mutate: deleteJob } = useDelJob();
  const { mutate: bulkDeleteJobs } = useBulkDelJobs();

  const [viewJob, setViewJob] = useState<ViewJobsRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, jobs]);

  // Build tech name & commission lookup maps
  const techNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of techSummary) {
      if (t.technician_id && t.name) map.set(t.technician_id, t.name);
    }
    return map;
  }, [techSummary]);

  const techCommissionMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of techDetails) {
      if (t.id) map.set(t.id, t.commission);
    }
    return map;
  }, [techDetails]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<DynamicFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<DynamicFilter>("all");
  const [technicianFilter, setTechnicianFilter] =
    useState<DynamicFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("work_order_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  const activeFilterCount = [
    search !== "",
    startDate !== "",
    endDate !== "",
    statusFilter !== "all",
    paymentFilter !== "all",
    categoryFilter !== "all",
    technicianFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setCategoryFilter("all");
    setTechnicianFilter("all");
    setSelectedIds(new Set());
  }

  // Helpers: update a filter and clear the row selection in the same batch
  const updateSearch = useCallback((v: string) => {
    setSearch(v);
    setSelectedIds(new Set());
  }, []);
  const updateStartDate = useCallback((v: string) => {
    setStartDate(v);
    setSelectedIds(new Set());
  }, []);
  const updateEndDate = useCallback((v: string) => {
    setEndDate(v);
    setSelectedIds(new Set());
  }, []);
  const updateStatusFilter = useCallback((v: StatusFilter) => {
    setStatusFilter(v);
    setSelectedIds(new Set());
  }, []);
  const updatePaymentFilter = useCallback((v: DynamicFilter) => {
    setPaymentFilter(v);
    setSelectedIds(new Set());
  }, []);
  const updateCategoryFilter = useCallback((v: DynamicFilter) => {
    setCategoryFilter(v);
    setSelectedIds(new Set());
  }, []);
  const updateTechnicianFilter = useCallback((v: DynamicFilter) => {
    setTechnicianFilter(v);
    setSelectedIds(new Set());
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(jobs.map((j) => j.category).filter(Boolean)),
      ).sort() as string[],
    [jobs],
  );

  const technicians = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((j) =>
              j.technician_id ? techNameMap.get(j.technician_id) : null,
            )
            .filter(Boolean),
        ),
      ).sort() as string[],
    [jobs, techNameMap],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    return [...jobs]
      .filter((j) => {
        const techName = j.technician_id
          ? (techNameMap.get(j.technician_id) ?? "")
          : "";
        const matchSearch =
          !q ||
          (j.address ?? "").toLowerCase().includes(q) ||
          techName.toLowerCase().includes(q) ||
          (j.region ?? "").toLowerCase().includes(q) ||
          (j.work_title ?? "").toLowerCase().includes(q) ||
          (j.category ?? "").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "all" ||
          (j.status ?? "").toLowerCase() === statusFilter;
        const matchPayment =
          paymentFilter === "all" ||
          (j.payment_method ?? "").toLowerCase() ===
            paymentFilter.toLowerCase();
        const matchCategory =
          categoryFilter === "all" || (j.category ?? "") === categoryFilter;
        const matchTechnician =
          technicianFilter === "all" || techName === technicianFilter;

        let matchDate = true;
        if (startDateObj || endDateObj) {
          const jobDate = j.work_order_date
            ? new Date(j.work_order_date)
            : null;
          if (jobDate) {
            if (startDateObj && jobDate < startDateObj) matchDate = false;
            if (endDateObj) {
              const endOfDay = new Date(endDateObj);
              endOfDay.setHours(23, 59, 59, 999);
              if (jobDate > endOfDay) matchDate = false;
            }
          }
        }

        return (
          matchSearch &&
          matchStatus &&
          matchPayment &&
          matchCategory &&
          matchTechnician &&
          matchDate
        );
      })
      .sort((a, b) => {
        const av: string | number = a[sortKey] as string | number;
        const bv: string | number = b[sortKey] as string | number;
        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [
    jobs,
    search,
    statusFilter,
    paymentFilter,
    categoryFilter,
    technicianFilter,
    sortKey,
    sortDir,
    startDate,
    endDate,
    techNameMap,
  ]);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const filteredIds = filtered
        .map((j) => j.work_order_id)
        .filter((id): id is string => !!id);
      const allSelected =
        filteredIds.length > 0 && filteredIds.every((id) => prev.has(id));
      return allSelected ? new Set<string>() : new Set(filteredIds);
    });
  }, [filtered]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-zinc-400" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-zinc-600 dark:text-zinc-300" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-zinc-600 dark:text-zinc-300" />
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Jobs
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {filtered.length} of {jobs.length} jobs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {!showFilters && activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
          <Input
            placeholder="Search job, category, technician, address…"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            className="h-8 w-full text-sm sm:w-56"
          />

          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateStartDate(e.target.value)}
            className="h-8 w-full text-sm sm:w-40"
            title="Start date"
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateEndDate(e.target.value)}
            className="h-8 w-full text-sm sm:w-40"
            title="End date"
          />

          <Select
            value={statusFilter}
            onValueChange={(v) => updateStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger size="sm" className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentFilter}
            onValueChange={(v) => updatePaymentFilter(v)}
          >
            <SelectTrigger size="sm" className="w-full sm:w-36">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {Array.from(
                new Set(jobs.map((j) => j.payment_method).filter(Boolean)),
              )
                .sort()
                .map((pm) => (
                  <SelectItem key={pm} value={pm ?? ""}>
                    {pm}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(v) => updateCategoryFilter(v)}
          >
            <SelectTrigger size="sm" className="w-full sm:w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={technicianFilter}
            onValueChange={(v) => updateTechnicianFilter(v)}
          >
            <SelectTrigger size="sm" className="w-full sm:w-40">
              <SelectValue placeholder="Technician" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technicians</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : isError ? (
        <div className="rounded-b-xl bg-red-50 p-6 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed to load jobs.
        </div>
      ) : (
        <>
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {selectedIds.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="h-7 gap-1.5 text-xs"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmBulkDelete(true)}
                className="h-7 gap-1.5 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                Delete ({selectedIds.size})
              </Button>
            </div>
          )}

          <div className="min-h-96 max-h-150 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-900">
                  <TableHead
                    className="w-10 px-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={
                        filtered.length > 0 &&
                        filtered.every(
                          (j) =>
                            j.work_order_id && selectedIds.has(j.work_order_id),
                        )
                      }
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {(
                    [
                      { key: "work_order_id", label: "ID" },
                      { key: "work_title", label: "Job Name" },
                      { key: "work_order_date", label: "Date" },
                      { key: "address", label: "Address" },
                      { key: "technician_id", label: "Technician" },
                      { key: "subtotal", label: "Gross" },
                      { key: "parts_total_cost", label: "Parts Cost" },
                      { key: "net_revenue", label: "Net Revenue" },
                      { key: "total_commission", label: "Commission" },
                      { key: "total_company_net", label: "Company Net" },
                      { key: "status", label: "Status" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <TableHead
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer select-none  text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                      {label}
                      <SortIcon col={key} />
                    </TableHead>
                  ))}
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-600"
                    >
                      No jobs match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((job) => {
                    const statusKey = (job.status ?? "pending").toLowerCase();
                    const techName = job.technician_id
                      ? (techNameMap.get(job.technician_id) ?? "—")
                      : "—";
                    const commRate = job.technician_id
                      ? techCommissionMap.get(job.technician_id)
                      : null;
                    const isHighlighted =
                      !!highlightId && job.work_order_id === highlightId;

                    const editPayload = {
                      work_order_id: job.work_order_id ?? "",
                      work_title: job.work_title ?? "",
                      description: job.description ?? "",
                      work_order_date:
                        job.work_order_date ??
                        new Date().toISOString().slice(0, 10),
                      technician_id: job.technician_id ?? "",
                      category: job.category ?? "",
                      address: job.address ?? "",
                      region: job.region ?? "",
                      contact_no: job.contact_no ?? "",
                      contact_email: job.contact_email ?? "",
                      payment_method_id: "",
                      payment_method: job.payment_method,
                      parts_total_cost: job.parts_total_cost ?? 0,
                      subtotal: job.subtotal ?? 0,
                      tip_amount: job.tip_amount ?? 0,
                      notes: job.notes ?? "",
                      status: job.status ?? "pending",
                    };

                    return (
                      <TableRow
                        key={job.work_order_id}
                        ref={isHighlighted ? highlightRowRef : undefined}
                        onClick={() => {
                          setViewJob(job);
                          setViewOpen(true);
                        }}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                          isHighlighted &&
                            "bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-950/30 dark:ring-amber-700",
                          job.work_order_id &&
                            selectedIds.has(job.work_order_id) &&
                            "bg-blue-50 dark:bg-blue-950/20",
                        )}
                      >
                        <TableCell
                          className="w-10 px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={
                              !!job.work_order_id &&
                              selectedIds.has(job.work_order_id)
                            }
                            onCheckedChange={() =>
                              job.work_order_id && toggleRow(job.work_order_id)
                            }
                            aria-label={`Select ${job.work_title ?? "job"}`}
                          />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {shortId(job.work_order_id ?? "—")}
                        </TableCell>
                        {/* Job Name */}
                        <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">
                          {job.work_title ?? "—"}
                        </TableCell>
                        {/* Date */}
                        <TableCell className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                          {job.work_order_date
                            ? new Date(job.work_order_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        {/* Address */}
                        <TableCell className="font-medium text-zinc-800 dark:text-zinc-200">
                          {job.address ?? "—"}
                          {job.region && (
                            <span className="ml-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                              {job.region}
                            </span>
                          )}
                        </TableCell>
                        {/* Technician */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {(techName === "—" ? "?" : techName)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {techName}
                            </span>
                            {commRate != null && (
                              <span className="text-xs text-zinc-400">
                                ({commRate}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {/* Gross */}
                        <TableCell className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                          {fmt(job.subtotal ?? 0)}
                        </TableCell>
                        {/* Parts Cost */}
                        <TableCell className="tabular-nums text-orange-600 dark:text-orange-400">
                          {fmt(job.parts_total_cost ?? 0)}
                        </TableCell>
                        {/* Net Revenue */}
                        <TableCell className="tabular-nums font-medium text-sky-600 dark:text-sky-400">
                          {fmt(job.net_revenue ?? 0)}
                        </TableCell>

                        {/* Commission */}
                        <TableCell className="tabular-nums text-amber-600 dark:text-amber-400">
                          {fmt(job.total_commission ?? 0)}
                        </TableCell>
                        {/* Company Net */}
                        <TableCell className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                          {fmt(job.total_company_net ?? 0)}
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                              statusColors[statusKey] ??
                                "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                            )}
                          >
                            {job.status ?? "—"}
                          </span>
                        </TableCell>
                        {/* Actions */}
                        <TableCell
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEdit(editPayload)}
                                className="gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  job.work_order_id &&
                                  setConfirmDeleteId(job.work_order_id)
                                }
                                className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <JobViewDialog
        job={viewJob}
        techName={
          viewJob?.technician_id
            ? techNameMap.get(viewJob.technician_id)
            : undefined
        }
        commRate={
          viewJob?.technician_id
            ? techCommissionMap.get(viewJob.technician_id)
            : null
        }
        open={viewOpen}
        onOpenChange={setViewOpen}
        onEdit={() => {
          if (!viewJob) return;
          openEdit({
            work_order_id: viewJob.work_order_id ?? "",
            work_title: viewJob.work_title ?? "",
            description: viewJob.description ?? "",
            work_order_date:
              viewJob.work_order_date ?? new Date().toISOString().slice(0, 10),
            technician_id: viewJob.technician_id ?? "",
            category: viewJob.category ?? "",
            address: viewJob.address ?? "",
            region: viewJob.region ?? "",
            contact_no: viewJob.contact_no ?? "",
            contact_email: viewJob.contact_email ?? "",
            payment_method_id: "",
            payment_method: viewJob.payment_method,
            parts_total_cost: viewJob.parts_total_cost ?? 0,
            subtotal: viewJob.subtotal ?? 0,
            tip_amount: viewJob.tip_amount ?? 0,
            notes: viewJob.notes ?? "",
            status: viewJob.status ?? "pending",
          });
        }}
        onDelete={() => {
          if (viewJob?.work_order_id) setConfirmDeleteId(viewJob.work_order_id);
        }}
      />

      <JobDeleteAlert
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) deleteJob(confirmDeleteId);
          setConfirmDeleteId(null);
          setViewOpen(false);
        }}
      />

      {/* Bulk delete confirmation */}
      <JobDeleteAlert
        open={confirmBulkDelete}
        onOpenChange={(open) => !open && setConfirmBulkDelete(false)}
        onConfirm={() => {
          bulkDeleteJobs(Array.from(selectedIds));
          setSelectedIds(new Set());
          setConfirmBulkDelete(false);
        }}
      />
    </div>
  );
}
