"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  useFetchReviewRecords,
  type ReviewRecordRow,
} from "@/hooks/reviews/useFetchReviewRecords";
import { useDelReviewRecord } from "@/hooks/reviews/useDelReviewRecords";
import { ReviewViewDialog } from "./review-view-dialog";
import { ReviewDeleteAlert } from "./review-delete-alert";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

type SortKey =
  | "review_date"
  | "review_amount"
  | "technician_id"
  | "work_order_id";
type SortDir = "asc" | "desc";
type DynamicFilter = "all" | (string & {});

interface ReviewsTableProps {
  onEdit: (record: ReviewRecordRow) => void;
  highlightReviewId?: string | null;
}

export function ReviewsTable({ onEdit, highlightReviewId }: ReviewsTableProps) {
  const {
    data: records = [],
    isLoading,
    isError,
    error,
  } = useFetchReviewRecords();
  const { mutate: deleteReview } = useDelReviewRecord();

  const [viewRecord, setViewRecord] = useState<ReviewRecordRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("review_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviewTypeFilter, setReviewTypeFilter] =
    useState<DynamicFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<DynamicFilter>("all");
  const [showFilters, setShowFilters] = useState(true);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!highlightReviewId) return;
    setActiveHighlightId(highlightReviewId);

    const timeout = window.setTimeout(() => {
      setActiveHighlightId((current) =>
        current === highlightReviewId ? null : current,
      );
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [highlightReviewId]);

  const reviewTypes = useMemo(
    () =>
      Array.from(
        new Set(records.map((r) => r.review_type).filter(Boolean)),
      ).sort() as string[],
    [records],
  );

  const paymentMethods = useMemo(
    () =>
      Array.from(
        new Set(records.map((r) => r.payment_method).filter(Boolean)),
      ).sort() as string[],
    [records],
  );

  const activeFilterCount = [
    search !== "",
    startDate !== "",
    endDate !== "",
    reviewTypeFilter !== "all",
    paymentFilter !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setReviewTypeFilter("all");
    setPaymentFilter("all");
  }

  // Filtered and sorted data
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    return [...records]
      .filter((r) => {
        const matchesSearch =
          !q ||
          (r.work_title ?? "").toLowerCase().includes(q) ||
          (r.review_type ?? "").toLowerCase().includes(q) ||
          (r.technician_id ?? "").toLowerCase().includes(q) ||
          (r.payment_method ?? "").toLowerCase().includes(q) ||
          (r.work_order_id ?? "").toLowerCase().includes(q);

        const matchesReviewType =
          reviewTypeFilter === "all" ||
          (r.review_type ?? "") === reviewTypeFilter;

        const matchesPayment =
          paymentFilter === "all" || (r.payment_method ?? "") === paymentFilter;

        let matchesDate = true;
        if (startDateObj || endDateObj) {
          const rowDate = r.review_date ? new Date(r.review_date) : null;
          if (rowDate) {
            if (startDateObj && rowDate < startDateObj) matchesDate = false;
            if (endDateObj) {
              const endOfDay = new Date(endDateObj);
              endOfDay.setHours(23, 59, 59, 999);
              if (rowDate > endOfDay) matchesDate = false;
            }
          }
        }

        return (
          matchesSearch && matchesReviewType && matchesPayment && matchesDate
        );
      })
      .sort((a, b) => {
        const rawAv = a[sortKey as keyof ReviewRecordRow] ?? "";
        const rawBv = b[sortKey as keyof ReviewRecordRow] ?? "";

        const av =
          typeof rawAv === "string" ? rawAv.toLowerCase() : String(rawAv);
        const bv =
          typeof rawBv === "string" ? rawBv.toLowerCase() : String(rawBv);

        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
  }, [
    records,
    search,
    sortKey,
    sortDir,
    startDate,
    endDate,
    reviewTypeFilter,
    paymentFilter,
  ]);

  useEffect(() => {
    if (!activeHighlightId) return;

    const targetRow = document.getElementById(
      `review-row-${activeHighlightId}`,
    );
    if (targetRow) {
      targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [filtered, activeHighlightId]);

  function handleSort(k: SortKey) {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
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
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage={error?.message || "Failed to load reviews"}
      loadingMessage="Loading reviews table..."
      className="min-h-80"
    >
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Reviews
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {filtered.length} of {records.length} records
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
              placeholder="Search work title, review type, technician, payment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full text-sm sm:w-64"
            />

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-full text-sm sm:w-40"
              title="Start date"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-full text-sm sm:w-40"
              title="End date"
            />

            <Select
              value={reviewTypeFilter}
              onValueChange={(v) => setReviewTypeFilter(v)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-44">
                <SelectValue placeholder="Review Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {reviewTypes.map((reviewType) => (
                  <SelectItem key={reviewType} value={reviewType}>
                    {reviewType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentFilter}
              onValueChange={(v) => setPaymentFilter(v)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-44">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {paymentMethods.map((paymentMethod) => (
                  <SelectItem key={paymentMethod} value={paymentMethod}>
                    {paymentMethod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Table */}
        <div className="min-h-96 max-h-150 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-900">
                <TableHead
                  onClick={() => handleSort("review_date")}
                  className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Date
                  <SortIcon col="review_date" />
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Finished Job
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Job Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Review Type
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Payment
                </TableHead>
                <TableHead
                  onClick={() => handleSort("review_amount")}
                  className="cursor-pointer select-none text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Amount
                  <SortIcon col="review_amount" />
                </TableHead>
                <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-600"
                  >
                    No reviews match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => (
                  <TableRow
                    key={record.review_id}
                    id={
                      record.review_id
                        ? `review-row-${record.review_id}`
                        : undefined
                    }
                    onClick={() => {
                      setViewRecord(record);
                      setViewOpen(true);
                    }}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      activeHighlightId &&
                        record.review_id === activeHighlightId &&
                        "bg-amber-50 ring-1 ring-inset ring-amber-300 dark:bg-amber-950/30 dark:ring-amber-700",
                    )}
                  >
                    {/* Date */}
                    <TableCell className="whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(record.review_date)}
                    </TableCell>

                    {/* Finished Job */}
                    <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                      {record.work_order_id ? (
                        <Link
                          href={`/dashboard/jobs?highlight=${record.work_order_id}`}
                          className="text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {record.work_order_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    {/* Job Name */}
                    <TableCell className="whitespace-nowrap font-medium text-zinc-800 dark:text-zinc-200">
                      {record.work_title || "—"}
                    </TableCell>

                    {/* Review Type */}
                    <TableCell>
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {record.review_type || "—"}
                      </span>
                    </TableCell>

                    {/* Payment */}
                    <TableCell className="whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {record.payment_method || "—"}
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right font-semibold text-zinc-900 dark:text-zinc-50">
                      {fmt(record.review_amount ?? 0)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="text-center"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={() => onEdit(record)}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              if (record.review_id)
                                setConfirmDeleteId(record.review_id);
                            }}
                            className="cursor-pointer gap-2 text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <ReviewViewDialog
          record={viewRecord}
          open={viewOpen}
          onOpenChange={setViewOpen}
          onEdit={() => {
            if (!viewRecord) return;
            onEdit(viewRecord);
          }}
          onDelete={() => {
            if (viewRecord?.review_id) setConfirmDeleteId(viewRecord.review_id);
          }}
        />

        <ReviewDeleteAlert
          open={!!confirmDeleteId}
          onOpenChange={(open) => !open && setConfirmDeleteId(null)}
          onConfirm={() => {
            if (confirmDeleteId) deleteReview(confirmDeleteId);
            setConfirmDeleteId(null);
            setViewOpen(false);
          }}
        />
      </div>
    </QueryStatePanel>
  );
}
