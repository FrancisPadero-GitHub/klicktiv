"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetchTechSummary } from "@/hooks/technicians/useFetchTechSummary";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import {
  useDelTechnician,
  useRestoreTechnician,
} from "@/hooks/technicians/useDelTechnicians";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useFilterTechTable } from "@/features/store/technician/useFilterTechTable";
import { useTechnicianStore } from "@/features/store/technician/useFormTechnicianStore";
import { TechnicianDetailDialog } from "@/components/dashboard/technician/technician-detail-dialog";
import { TechnicianRemoveAlert } from "@/components/dashboard/technician/technician-remove-alert";
import { cn } from "@/lib/utils";

/** Merged row combining v_technicians_summary + v_technicians detail fields */
type MergedTechRow = {
  technician_id: string | null;
  name: string | null;
  commission: number | null;
  email: string | null;
  hired_date: string | null;
  deleted_at: string | null;
  total_jobs: number | null;
  gross_revenue: number | null;
  total_company_net: number | null;
  total_commission_earned: number | null;
  total_parts: number | null;
  total_tips: number | null;
};

type SortKey = keyof Pick<
  MergedTechRow,
  | "name"
  | "commission"
  | "total_jobs"
  | "gross_revenue"
  | "total_company_net"
  | "total_commission_earned"
  | "hired_date"
>;

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export function TechnicianTable() {
  const { data: techDetails } = useFetchTechnicians();
  const { data: techSummary, isLoading, isError } = useFetchTechSummary();
  const { mutate: deleteTechnician } = useDelTechnician();
  const { mutate: restoreTechnician } = useRestoreTechnician();

  // Local UI state
  const [selectedTech, setSelectedTech] = useState<MergedTechRow | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // merges data from the technicians details and summary queries into a single array for easier display and filtering
  const mergedData: MergedTechRow[] = useMemo(
    () =>
      (techDetails ?? []).map((baseRow) => {
        const summaryRow = techSummary?.find(
          (s) => s.technician_id === baseRow.id,
        );
        return {
          technician_id: baseRow.id,
          name: baseRow.name,
          commission: baseRow.commission,
          email: baseRow.email,
          hired_date: baseRow.hired_date,
          deleted_at: baseRow.deleted_at,
          total_jobs: summaryRow?.total_jobs ?? null,
          gross_revenue: summaryRow?.gross_revenue ?? null,
          total_company_net: summaryRow?.total_company_net ?? null,
          total_commission_earned: summaryRow?.total_commission_earned ?? null,
          total_parts: summaryRow?.total_parts ?? null,
          total_tips: summaryRow?.total_tips ?? null,
        };
      }),
    [techDetails, techSummary],
  );

  const openEdit = useTechnicianStore((state) => state.openEdit);

  // Get filter state from Zustand store
  const search = useFilterTechTable((state) => state.search);
  const commissionFilter = useFilterTechTable(
    (state) => state.commissionFilter,
  );
  const sortKey = useFilterTechTable((state) => state.sortKey);
  const sortDir = useFilterTechTable((state) => state.sortDir);
  const setSearch = useFilterTechTable((state) => state.setSearch);
  const setCommissionFilter = useFilterTechTable(
    (state) => state.setCommissionFilter,
  );
  const setSortKey = useFilterTechTable((state) => state.setSortKey);
  const setSortDir = useFilterTechTable((state) => state.setSortDir);
  const showRemoved = useFilterTechTable((state) => state.showRemoved);
  const setShowRemoved = useFilterTechTable((state) => state.setShowRemoved);

  const techCommissionRates = useMemo(
    () => mergedData.map((t) => ({ name: t.name, commission: t.commission })),
    [mergedData],
  );

  // compute dynamic thresholds (33rd and 66th percentiles) for commission rate percentages
  const [p33, p66] = useMemo(() => {
    const rates = techCommissionRates
      .map((t) => t.commission ?? 0)
      .sort((a, b) => a - b);
    if (rates.length === 0) return [20, 30];
    const percentile = (q: number) => {
      const pos = q * (rates.length - 1);
      const lo = Math.floor(pos);
      const hi = Math.ceil(pos);
      if (lo === hi) return rates[lo];
      const w = pos - lo;
      return rates[lo] * (1 - w) + rates[hi] * w;
    };
    return [percentile(0.33), percentile(0.66)];
  }, [techCommissionRates]);

  const COMMISSION_FILTERS = useMemo(
    () => [
      { label: "All Rates", value: "all" as const },
      { label: `Low (< ${p33.toFixed(0)}%)`, value: "low" as const },
      {
        label: `Mid (${p33.toFixed(0)}–${p66.toFixed(0)}%)`,
        value: "mid" as const,
      },
      { label: `High (> ${p66.toFixed(0)}%)`, value: "high" as const },
    ],
    [p33, p66],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return [...mergedData]
      .filter((t) => {
        const matchesSearch =
          !q ||
          (t.name ?? "").toLowerCase().includes(q) ||
          (t.email ?? "").toLowerCase().includes(q);

        const rate = t.commission ?? 0;
        const matchesCommission =
          commissionFilter === "all" ||
          (commissionFilter === "low" && rate < p33) ||
          (commissionFilter === "mid" && rate >= p33 && rate <= p66) ||
          (commissionFilter === "high" && rate > p66);

        const matchesRemoved = showRemoved
          ? t.deleted_at !== null
          : t.deleted_at === null;

        return matchesSearch && matchesCommission && matchesRemoved;
      })
      .sort((a, b) => {
        // null sortKey means "preserve source order" (created_at desc from the hook)
        if (!sortKey) return 0;

        let av = a[sortKey] ?? "";
        let bv = b[sortKey] ?? "";

        // Invert commission values for sorting since display shows 100 - value
        if (sortKey === "commission") {
          av = typeof av === "number" ? 100 - av : av;
          bv = typeof bv === "number" ? 100 - bv : bv;
        }

        let cmp = 0;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [
    mergedData,
    search,
    commissionFilter,
    showRemoved,
    sortKey,
    sortDir,
    p33,
    p66,
  ]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronsUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3 text-foreground" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3 text-foreground" />
    );
  }

  function handleEditTech(tech: MergedTechRow) {
    openEdit({
      id: tech.technician_id ?? "",
      company_id: "",
      name: tech.name ?? "",
      email: tech.email ?? null,
      commission: tech.commission ?? 0,
      hired_date: tech.hired_date ?? null,
      created_at: "",
      deleted_at: null,
    });
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    deleteTechnician(confirmDeleteId, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        setSelectedTech(null);
      },
    });
  }

  function handleUnremove(technicianId: string) {
    if (!technicianId) return;
    restoreTechnician(technicianId, {
      onSuccess: () => {
        setSelectedTech(null);
      },
    });
  }

  return (
    <>
      <QueryStatePanel
        isLoading={isLoading}
        isError={isError}
        errorMessage="Failed to load technicians table"
        loadingMessage="Loading technicians table..."
        className="min-h-80"
      >
        <div className="rounded-xl border border-border bg-card">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Technicians
              </h3>
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {mergedData.length} technicians
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Search name, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full text-sm sm:w-56"
              />
              <div className="flex gap-1">
                {COMMISSION_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setCommissionFilter(f.value)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      commissionFilter === f.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={() => setShowRemoved(!showRemoved)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    showRemoved
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  Removed
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="min-h-96 max-h-150 overflow-x-auto">
            <Table className="min-w-225 text-sm">
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="border-border">
                  {(
                    [
                      { key: "name", label: "Name" },
                      { key: "commission", label: "Commission" },
                      { key: "total_jobs", label: "Jobs" },
                      { key: "hired_date", label: "Hired" },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <TableHead
                      key={key}
                      onClick={() => handleSort(key)}
                      className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    >
                      {label}
                      <SortIcon col={key} />
                    </TableHead>
                  ))}
                  <TableHead className="text-xs font-semibold uppercase text-muted-foreground">
                    Contact
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground/50"
                    >
                      No technicians match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((tech) => {
                    const initials = (tech.name || "?")
                      .split(" ")
                      .map((n) => n[0])
                      .join("");
                    const isRemoved = tech.deleted_at !== null;
                    const canView = !showRemoved && !isRemoved;
                    return (
                      <TableRow
                        key={tech.technician_id}
                        onClick={() => canView && setSelectedTech(tech)}
                        className={cn(
                          canView
                            ? "cursor-pointer border-border transition-colors hover:bg-muted/30"
                            : "cursor-default border-border",
                          isRemoved &&
                            "opacity-50 line-through decoration-muted-foreground",
                        )}
                      >
                        {/* Name */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                              {initials}
                            </div>
                            <span className="font-medium text-foreground">
                              {tech.name || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        {/* Commission */}
                        <TableCell className="text-muted-foreground">
                          {tech.commission ?? 0} %
                        </TableCell>
                        {/* Jobs */}
                        <TableCell className="font-semibold text-foreground">
                          {tech.total_jobs ?? 0}
                        </TableCell>

                        {/* Hired */}
                        <TableCell className="text-muted-foreground">
                          {tech.hired_date
                            ? new Date(tech.hired_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        {/* Contact */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {tech.email || "-"}
                          </span>
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
                                size="icon"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {showRemoved ? (
                                <DropdownMenuItem
                                  className="text-emerald-600 focus:text-emerald-600 dark:text-emerald-400 dark:focus:text-emerald-400"
                                  onClick={() =>
                                    handleUnremove(tech.technician_id ?? "")
                                  }
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                                  Restore
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTech(tech)}
                                  >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
                                    onClick={() =>
                                      setConfirmDeleteId(
                                        tech.technician_id ?? "",
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Remove
                                  </DropdownMenuItem>
                                </>
                              )}
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
        </div>
      </QueryStatePanel>

      <TechnicianDetailDialog
        selectedTech={selectedTech}
        formatCurrency={fmt}
        onClose={() => setSelectedTech(null)}
        onRemove={(technicianId) => setConfirmDeleteId(technicianId)}
        onEdit={handleEditTech}
      />

      <TechnicianRemoveAlert
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
