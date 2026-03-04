"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { ReviewSummaryCards } from "@/components/dashboard/reviews/review-summary-cards";
import { ReviewsTable } from "@/components/dashboard/reviews/reviews-table";
import { AddEditReviewDialog } from "@/components/dashboard/reviews/form-review-dialog";
import { Button } from "@/components/ui/button";
import type { Database } from "@/database.types";

type ReviewRecordViewRow =
  Database["public"]["Views"]["v_review_records"]["Row"];

export default function ReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightReviewId = searchParams.get("highlightReviewId");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedReview, setSelectedReview] =
    useState<ReviewRecordViewRow | null>(null);
  const [prefilledJobId, setPrefilledJobId] = useState<string | null>(null);

  useEffect(() => {
    const open = searchParams.get("open");
    const jobId = searchParams.get("jobId");

    if (open !== "add") return;

    setSelectedReview(null);
    setDialogMode("add");
    setPrefilledJobId(jobId);
    setIsDialogOpen(true);

    router.replace("/dashboard/reviews", { scroll: false });
  }, [router, searchParams]);

  const handleOpenAddDialog = () => {
    setSelectedReview(null);
    setDialogMode("add");
    setPrefilledJobId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (review: ReviewRecordViewRow) => {
    setSelectedReview(review);
    setDialogMode("edit");
    setPrefilledJobId(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Review Records
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Manage and track all review records for completed jobs
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Review
        </Button>
      </div>

      <AddEditReviewDialog
        open={isDialogOpen}
        mode={dialogMode}
        selectedReview={selectedReview}
        onOpenChange={setIsDialogOpen}
        prefilledJobId={prefilledJobId}
      />

      {/* Summary Cards */}
      <ReviewSummaryCards />

      {/* Reviews Table */}
      <ReviewsTable
        onEdit={handleOpenEditDialog}
        highlightReviewId={highlightReviewId}
      />
    </div>
  );
}
