"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { useJobTableStore } from "@/features/store/jobs/useJobTableStore";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useDelJob } from "@/hooks/jobs/useDelJob";
import { useBulkDelJobs } from "@/hooks/jobs/useBulkDelJobs";
import type { ViewJobsRow } from "@/hooks/jobs/useFetchJobTable";
import {
  JobViewDialog,
  paymentStatusColors,
} from "@/components/dashboard/jobs/job-view-dialog";
import { JobDeleteAlert } from "@/components/dashboard/jobs/job-delete-alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// components
import { LogJobDialog } from "@/components/dashboard/jobs/log-job-dialog";

const shortId = (value: string | null) => {
  if (!value) return "";
  return value.slice(0, 8);
};

const fmt = (n: number) => {
  if (n === 0) return "0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
};

type SortKey =
  | "created_at"
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
type PaymentStatusFilter = "all" | "full" | "partial";
type DynamicFilter = "all" | (string & {});

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  pending: "bg-info/10 text-info",
};

function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3)
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

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
  const router = useRouter();
  const pathname = usePathname();
  const highlightIdParam = searchParams.get("highlight");
  const highlightRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightIdParam) {
      const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (params.has("highlight")) {
          params.delete("highlight");
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
          });
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightIdParam, pathname, router, searchParams]);

  useEffect(() => {
    if (highlightIdParam && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightIdParam, jobs]);

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
  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<DynamicFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<DynamicFilter>("all");
  const [technicianFilter, setTechnicianFilter] =
    useState<DynamicFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false); // defaults to hidden, can be toggled with the "Show Filters" button
  const { currentPage, setCurrentPage } = useJobTableStore();

  const activeFilterCount = [
    search !== "",
    startDate !== "",
    endDate !== "",
    statusFilter !== "all",
    paymentStatusFilter !== "all",
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
    setCurrentPage(1);
  }

  // Helpers: update a filter and clear the row selection in the same batch
  const updateSearch = useCallback(
    (v: string) => {
      setSearch(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updateStartDate = useCallback(
    (v: string) => {
      setStartDate(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updateEndDate = useCallback(
    (v: string) => {
      setEndDate(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updateStatusFilter = useCallback(
    (v: StatusFilter) => {
      setStatusFilter(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updatePaymentStatusFilter = useCallback(
    (v: PaymentStatusFilter) => {
      setPaymentStatusFilter(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updatePaymentFilter = useCallback(
    (v: DynamicFilter) => {
      setPaymentFilter(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updateCategoryFilter = useCallback(
    (v: DynamicFilter) => {
      setCategoryFilter(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );
  const updateTechnicianFilter = useCallback(
    (v: DynamicFilter) => {
      setTechnicianFilter(v);
      setSelectedIds(new Set());
      setCurrentPage(1);
    },
    [setCurrentPage],
  );

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
          (j.work_order_id ?? "").toLowerCase().includes(q) ||
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
        const matchPaymentStatus =
          paymentStatusFilter === "all" ||
          (j.payment_status ?? "").toLowerCase() === paymentStatusFilter;
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
          matchPaymentStatus &&
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
    paymentStatusFilter,
    paymentFilter,
    categoryFilter,
    technicianFilter,
    sortKey,
    sortDir,
    startDate,
    endDate,
    techNameMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

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
    setCurrentPage(1);
  }

  // When a column header is clicked: clear any active filters first, then sort.
  const handleHeaderClick = (key: SortKey) => {
    if (activeFilterCount > 0) clearFilters();
    handleSort(key);
  };

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return (
        <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground" />
      );
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-foreground" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-foreground" />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Jobs</h3>
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {jobs.length} jobs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LogJobDialog />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="h-8 gap-1.5 text-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showFilters ? "Hide Filters" : "Show Filters"}
            {!showFilters && activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
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
            <SelectTrigger size="sm" className="w-fit">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Status</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentStatusFilter}
            onValueChange={(v) =>
              updatePaymentStatusFilter(v as PaymentStatusFilter)
            }
          >
            <SelectTrigger size="sm" className="w-fit">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Payment Status</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={paymentFilter}
            onValueChange={(v) => updatePaymentFilter(v)}
          >
            <SelectTrigger size="sm" className="w-fit">
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
            <SelectTrigger size="sm" className="w-fit">
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
        <div className="rounded-b-xl bg-destructive/10 p-6 text-center text-sm text-destructive">
          Failed to load jobs.
        </div>
      ) : (
        <>
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
              <span className="text-sm font-medium text-foreground">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className=" border-b border-border bg-card hover:bg-card">
                  <TableHead
                    className="sticky top-0 z-20 bg-card w-10 px-3"
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
                      { key: "subtotal", label: "Subtotal" },
                      { key: "deposits", label: "Deposit" },
                      { key: "payment_status", label: "Payment" },
                      { key: "tip_amount", label: "Tip" },
                      { key: "parts_total_cost", label: "Parts Cost" },
                      { key: "net_revenue", label: "Net Revenue" },
                      { key: "total_commission", label: "Commission" },
                      { key: "total_company_net", label: "Company Net" },
                      { key: "review_amount", label: "Review" },
                      { key: "status", label: "Status" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <TableHead
                      key={key}
                      onClick={() => handleHeaderClick(key)}
                      className="sticky top-0 z-20 bg-card cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    >
                      {label}
                      <SortIcon col={key} />
                    </TableHead>
                  ))}
                  <TableHead className="sticky top-0 z-20 bg-card text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      No jobs match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((job) => {
                    const statusKey = (job.status ?? "pending").toLowerCase();
                    const techName = job.technician_id
                      ? (techNameMap.get(job.technician_id) ?? "-")
                      : "-";
                    const commRate = job.technician_id
                      ? techCommissionMap.get(job.technician_id)
                      : null;
                    const isHighlighted =
                      !!highlightIdParam &&
                      job.work_order_id === highlightIdParam;

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
                      name: job.name ?? "",
                      deposits: job.deposits ?? 0,
                      payment_status: job.payment_status ?? "full", // full is the default on the database
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
                          "cursor-pointer transition-colors hover:bg-muted/50",
                          job.payment_status === "partial" && "bg-warning/10",
                          job.status === "pending" && "bg-info/10",
                          isHighlighted &&
                            "bg-primary/10 ring-1 ring-inset ring-primary/20",
                          job.work_order_id &&
                            selectedIds.has(job.work_order_id) &&
                            "bg-accent",
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
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {shortId(job.work_order_id ?? "-")}
                        </TableCell>
                        {/* Job Name */}
                        <TableCell className="truncate max-w-xs font-medium text-foreground">
                          {job.work_title ?? "-"}
                        </TableCell>
                        {/* Date */}
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {job.work_order_date
                            ? new Date(job.work_order_date).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        {/* Address */}
                        <TableCell className="truncate max-w-sm font-medium text-foreground">
                          {job.address ?? "-"}
                          {job.region && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {job.region}
                            </span>
                          )}
                        </TableCell>
                        {/* Technician */}
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                              {(techName === "-" ? "?" : techName)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="text-foreground">{techName}</span>
                            {commRate != null && (
                              <span className="text-xs text-muted-foreground">
                                ({commRate}%)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {/* Subtotal */}
                        <TableCell className="tabular-nums font-medium text-foreground">
                          {fmt(job.subtotal ?? 0)}
                        </TableCell>
                        {/* Deposits */}
                        <TableCell
                          className="tabular-nums text-[#64748B]"
                          title="Excluded on the totals if fully paid"
                        >
                          {fmt(job.deposits ?? 0)}
                        </TableCell>
                        {/* Payment Status */}
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <span
                              className={cn(
                                // The Pill Shape & Centering
                                "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                // The Dynamic Colors
                                paymentStatusColors[
                                  (
                                    job.payment_status as "full" | "partial"
                                  ).toLowerCase()
                                ] ?? "bg-muted text-muted-foreground",
                              )}
                            >
                              {job.payment_status ?? "-"}
                            </span>
                          </div>
                        </TableCell>
                        {/* Tip */}
                        <TableCell className="tabular-nums font-medium text-foreground">
                          {fmt(job.tip_amount ?? 0)}
                        </TableCell>
                        {/* Parts Cost */}
                        <TableCell className="tabular-nums text-primary">
                          {fmt(job.parts_total_cost ?? 0)}
                        </TableCell>
                        {/* Net Revenue */}
                        <TableCell
                          className="tabular-nums font-medium text-chart-3"
                          title="Revenue = Subtotal - Parts Costs"
                        >
                          {fmt(job.net_revenue ?? 0)}
                        </TableCell>

                        {/* Commission */}
                        <TableCell
                          className="tabular-nums text-amber-600"
                          title="Commission = Net Revenue * Commission Rate"
                        >
                          {fmt(job.total_commission ?? 0)}
                        </TableCell>
                        {/* Company Net */}
                        <TableCell
                          className="tabular-nums font-medium text-success"
                          title="Company Net = Net Revenue - Commission"
                        >
                          {fmt(job.total_company_net ?? 0)}
                        </TableCell>
                        {/* Review */}
                        <TableCell className="tabular-nums font-medium text-foreground">
                          {fmt(job.review_amount ?? 0)}
                        </TableCell>
                        {/* Status */}
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                              statusColors[statusKey] ??
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {job.status ?? "-"}
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
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
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
                                className="gap-2 text-destructive focus:text-destructive"
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

          {/* Pagination footer */}
          <div className="flex flex-col items-center gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="order-2 text-xs text-muted-foreground sm:order-1">
              Showing{" "}
              <span className="font-bold text-foreground">
                {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
              </span>
              {" - "}
              <span className="font-bold text-foreground">
                {Math.min(currentPage * PAGE_SIZE, filtered.length)}
              </span>
              {" of "}
              <span className="font-bold text-foreground">
                {filtered.length}
              </span>
              {" jobs"}
            </p>

            {totalPages > 1 && (
              <Pagination className="order-1 mx-0 w-auto sm:order-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className={cn(
                        currentPage === 1 && "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>

                  {getPageNumbers(currentPage, totalPages).map((page, i) =>
                    page === "ellipsis" ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page as number);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      className={cn(
                        currentPage === totalPages &&
                          "pointer-events-none opacity-50",
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
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
            payment_method_id: "", // POTENTIAL BUG FIX THIS
            payment_method: viewJob.payment_method, // POTENTIAL BUG FIX THIS
            parts_total_cost: viewJob.parts_total_cost ?? 0,
            subtotal: viewJob.subtotal ?? 0,
            tip_amount: viewJob.tip_amount ?? 0,
            notes: viewJob.notes ?? "",
            status: viewJob.status ?? "pending",
            name: viewJob.name ?? "",
            deposits: viewJob.deposits ?? 0,
            payment_status: viewJob.payment_status ?? "full", // full is the default on the database
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
