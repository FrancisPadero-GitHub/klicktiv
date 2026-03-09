"use client";

import { useState } from "react";
import { useFetchReviewTypes } from "@/hooks/reviews/useFetchReviewTypes";
import { useAddReviewType } from "@/hooks/reviews/useAddReviewType";
import { useEditReviewType } from "@/hooks/reviews/useEditReviewType";
import { useDelReviewType } from "@/hooks/reviews/useDelReviewType";
import type { Database } from "@/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClipboardList, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { QueryStatePanel } from "@/components/misc/query-state-panel";

type ReviewTypeRow = Database["public"]["Tables"]["review_types"]["Row"];

export function ReviewTypesTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", price: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: reviewTypes, isLoading, isError } = useFetchReviewTypes();
  const addMutation = useAddReviewType();
  const editMutation = useEditReviewType();
  const deleteMutation = useDelReviewType();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({ name: "", price: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      return;
    }

    if (editingId) {
      await editMutation.mutateAsync({
        id: editingId,
        data: { name: formData.name, price },
      });
    } else {
      await addMutation.mutateAsync({ name: formData.name, price });
    }

    setFormData({ name: "", price: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (reviewType: ReviewTypeRow) => {
    setEditingId(reviewType.id);
    setFormData({ name: reviewType.name, price: reviewType.price.toString() });
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  if (isLoading) return <Spinner />;

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load review types"
      loadingMessage="Loading review types..."
      className="min-h-80"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Review Types
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {reviewTypes?.length ?? 0} type
              {(reviewTypes?.length ?? 0) !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingId(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit" : "Add"} Review Type
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update the review type details"
                    : "Create a new review type"}
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  void handleSubmit(e);
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Half Day, Full Day, Emergency"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Rate</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingId ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {reviewTypes && reviewTypes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviewTypes.map((reviewType) => (
              <Card
                key={reviewType.id}
                className="group border-border bg-card shadow-none hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <ClipboardList className="h-4 w-4 text-secondary-foreground/60" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {reviewType.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                            ${reviewType.price.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground/70">
                            {new Date(
                              reviewType.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(reviewType)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                        onClick={() => setDeleteId(reviewType.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mb-4">
              <ClipboardList className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No review types yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first review type to get started.
            </p>
          </div>
        )}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Review Type</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this review type? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-end gap-2">
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void handleDelete();
                }}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </QueryStatePanel>
  );
}
