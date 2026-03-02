"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// hooks
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useAddEstimate } from "@/hooks/estimates/useAddEstimate";
import { useEditEstimate } from "@/hooks/estimates/useEditEstimate";
import { useDelEstimate } from "@/hooks/estimates/useDelEstimate";
import { usePromoteEstimateToJob } from "@/hooks/estimates/usePromoteEstimateToJob";
import { useFetchViewJobRow } from "@/hooks/jobs/useFetchJobTable";

// components
import {
  PromoteEstimateDialog,
  type PromoteEstimateFormValues,
} from "@/components/dashboard/estimates/promote-estimate-dialog";

// types
import type { Database } from "@/database.types";
import type { EstimatesRow } from "@/hooks/estimates/useFetchEstimates";

type EstimateWithNotes = EstimatesRow & {
  notes?: string | null;
};

type statusEnum = Database["public"]["Enums"]["estimate_status_enum"];

interface EstimateFormTypes {
  // work order fields types
  technician_id: string;
  work_title: string;
  description: string;
  category: string;
  region: string;
  address: string;
  work_order_date: string;
  notes: string;

  // estimate spedific fields
  work_order_id?: string;
  estimated_amount: number;
  handled_by: string;
  status: statusEnum;
}

interface PendingPromotionState {
  workOrderId?: string;
  estimateFormData: EstimateFormTypes;
}

const form: EstimateFormTypes = {
  // work order fields default values
  technician_id: "",
  work_title: "",
  description: "",
  category: "",
  region: "",
  address: "",
  work_order_date: "",
  notes: "",
  // estimate fields default values
  estimated_amount: 0,
  handled_by: "",
  status: "follow_up",
};

const mapEstimateToForm = (estimate: EstimateWithNotes): EstimateFormTypes => ({
  work_order_id: estimate.work_order_id ?? undefined,
  technician_id: estimate.technician_id ?? "",
  work_title: estimate.work_title ?? "",
  description: estimate.description ?? "",
  category: estimate.category ?? "",
  region: estimate.region ?? "",
  address: estimate.address ?? "",
  work_order_date: estimate.work_order_date ?? "",
  notes: estimate.notes ?? "",
  estimated_amount: Number(estimate.estimated_amount ?? 0),
  handled_by: estimate.handled_by ?? "",
  status: estimate.estimate_status ?? "follow_up",
});

export function NewEstimateDialog({
  open,
  mode,
  selectedEstimate,
  onOpenChange,
}: {
  open: boolean;
  mode: "add" | "edit";
  selectedEstimate: EstimateWithNotes | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: technicians = [] } = useFetchTechnicians(); // for the dropdown select
  const activeTechnicians = technicians.filter(
    (technician) => technician.deleted_at === null,
  );
  const { data: jobs = [] } = useFetchViewJobRow();
  const {
    mutate: addEstimate,
    isPending: isAdding,
    isSuccess: isAddSuccess,
    isError: isAddError,
    error: addError,
    reset: resetAddMutation,
  } = useAddEstimate();
  const {
    mutate: editEstimate,
    isPending: isEditing,
    isSuccess: isEditSuccess,
    isError: isEditError,
    error: editError,
    reset: resetEditMutation,
  } = useEditEstimate();
  const {
    mutate: promoteEstimateToJob,
    isPending: isPromoting,
    isError: isPromoteError,
    error: promoteError,
    reset: resetPromoteMutation,
  } = usePromoteEstimateToJob();
  const {
    mutate: deleteEstimate,
    isPending: isDeletePending,
    isSuccess: isDeleteSuccess,
    isError: isDeleteError,
    error: deleteError,
    reset: resetDeleteMutation,
  } = useDelEstimate();

  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [pendingPromotion, setPendingPromotion] =
    useState<PendingPromotionState | null>(null);

  const promotedWorkOrderIds = useMemo(
    () => new Set(jobs.map((job) => job.work_order_id).filter(Boolean)),
    [jobs],
  );

  const isAlreadyPromoted =
    mode === "edit" &&
    !!selectedEstimate?.work_order_id &&
    promotedWorkOrderIds.has(selectedEstimate.work_order_id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<EstimateFormTypes>({
    defaultValues: form,
  });

  useEffect(() => {
    if (!open) return;

    resetAddMutation();
    resetEditMutation();
    resetPromoteMutation();
    resetDeleteMutation();
    setIsPromoteDialogOpen(false);
    setIsConfirmDeleteOpen(false);
    setPendingPromotion(null);

    if (mode === "edit" && selectedEstimate) {
      reset(mapEstimateToForm(selectedEstimate));
      return;
    }

    reset(form);
  }, [
    open,
    mode,
    selectedEstimate,
    reset,
    resetAddMutation,
    resetEditMutation,
    resetPromoteMutation,
    resetDeleteMutation,
  ]);

  const closeDialog = () => {
    setIsConfirmDeleteOpen(false);
    setIsPromoteDialogOpen(false);
    setPendingPromotion(null);
    onOpenChange(false);
  };

  const handleDelete = () => {
    const workOrderId = selectedEstimate?.work_order_id;
    if (!workOrderId) return;

    deleteEstimate(workOrderId, {
      onSuccess: () => {
        setIsConfirmDeleteOpen(false);
        closeDialog();
      },
    });
  };

  const onSubmit = (data: EstimateFormTypes) => {
    const isEditMode = mode === "edit";
    const workOrderId = data.work_order_id || selectedEstimate?.work_order_id;
    const shouldOpenPromoteDialog =
      data.status === "approved" &&
      !isAlreadyPromoted &&
      (isEditMode
        ? !!workOrderId && selectedEstimate?.estimate_status !== "approved"
        : true);

    if (shouldOpenPromoteDialog) {
      setPendingPromotion({
        workOrderId: workOrderId || undefined,
        estimateFormData: data,
      });
      setIsPromoteDialogOpen(true);
      return;
    }

    if (isEditMode && workOrderId) {
      editEstimate(
        {
          estimateId: workOrderId,
          estimateUpdates: {
            estimated_amount: Number(data.estimated_amount),
            handled_by: data.handled_by.trim() || null,
            status: data.status,
          },
          workOrderUpdates: {
            technician_id: data.technician_id,
            work_title: data.work_title,
            description: data.description || null,
            category: data.category || null,
            region: data.region || null,
            address: data.address || null,
            work_order_date: data.work_order_date,
            notes: data.notes || null,
          },
        },
        {
          onSuccess: () => {
            closeDialog();
          },
        },
      );
      return;
    }

    addEstimate(
      {
        workOrder: {
          technician_id: data.technician_id,
          work_title: data.work_title,
          description: data.description || null,
          category: data.category || null,
          region: data.region || null,
          address: data.address || null,
          work_order_date: data.work_order_date,
          notes: data.notes || null,
        },
        estimate: {
          estimated_amount: Number(data.estimated_amount),
          handled_by: data.handled_by.trim() || null,
          status: data.status,
        },
      },
      {
        onSuccess: () => {
          closeDialog();
        },
      },
    );
  };

  const handleSubmitPromotion = (jobValues: PromoteEstimateFormValues) => {
    if (!pendingPromotion) return;

    const { workOrderId, estimateFormData } = pendingPromotion;

    const workOrderData = {
      technician_id: estimateFormData.technician_id,
      work_title: estimateFormData.work_title,
      description: estimateFormData.description || null,
      category: estimateFormData.category || null,
      region: estimateFormData.region || null,
      address: estimateFormData.address || null,
      work_order_date: estimateFormData.work_order_date,
      notes: estimateFormData.notes || null,
    };

    const estimateData = {
      estimated_amount: Number(estimateFormData.estimated_amount),
      handled_by: estimateFormData.handled_by.trim() || null,
      status: "approved" as statusEnum,
    };

    const jobData = {
      subtotal: Number(jobValues.subtotal),
      parts_total_cost: Number(jobValues.parts_total_cost) || 0,
      tip_amount: Number(jobValues.tip_amount) || 0,
      payment_method_id: jobValues.payment_method_id || null,
      status: jobValues.status,
    };

    if (workOrderId) {
      // Edit mode: estimate already exists, just promote
      promoteEstimateToJob(
        {
          workOrderId,
          workOrderUpdates: workOrderData,
          estimateUpdates: estimateData,
          job: jobData,
        },
        {
          onSuccess: () => {
            setIsPromoteDialogOpen(false);
            setPendingPromotion(null);
            closeDialog();
          },
        },
      );
    } else {
      // Add mode: create the estimate first, then promote to job
      addEstimate(
        {
          workOrder: workOrderData,
          estimate: estimateData,
        },
        {
          onSuccess: (result) => {
            promoteEstimateToJob(
              {
                workOrderId: result.workOrder.id,
                estimateUpdates: { status: "approved" },
                job: jobData,
              },
              {
                onSuccess: () => {
                  setIsPromoteDialogOpen(false);
                  setPendingPromotion(null);
                  closeDialog();
                },
              },
            );
          },
        },
      );
    }
  };

  const isPending = isAdding || isEditing || isPromoting || isDeletePending;
  const isSuccess = isAddSuccess || isEditSuccess || isDeleteSuccess;
  const isError = isAddError || isEditError || isPromoteError || isDeleteError;
  const errorMessage =
    addError?.message ||
    editError?.message ||
    promoteError?.message ||
    deleteError?.message;
  const title = mode === "edit" ? "Edit Estimate" : "New Estimate";
  const description =
    mode === "edit"
      ? "Review and update the selected estimate details."
      : "Create a new estimate for a customer.";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onCloseAutoFocus={(event) => {
            // Prevent auto-focus on close to avoid scroll jump
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            isDeleteSuccess ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300">
                Estimate hidden successfully.
              </div>
            ) : (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300">
                Estimate saved successfully.
              </div>
            )
          ) : isError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage ?? "Failed to save estimate."}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 grid gap-4 py-2 pl-2 pr-1">
                <div className="grid gap-2">
                  <Label htmlFor="work_title">
                    Work Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="work_title"
                    placeholder="e.g. HVAC System Inspection"
                    {...register("work_title", {
                      required: "Work title is required",
                    })}
                  />
                  {errors.work_title ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.work_title.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="technician_id">
                    Technician <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="technician_id"
                    control={control}
                    rules={{ required: "Technician is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending || activeTechnicians.length === 0}
                      >
                        <SelectTrigger id="technician_id">
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeTechnicians.length > 0 ? (
                            activeTechnicians.map((technician) => (
                              <SelectItem
                                key={technician.id}
                                value={technician.id}
                              >
                                {technician.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_technician__" disabled>
                              No technician available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.technician_id ? (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {errors.technician_id.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="work_order_date">
                      Work Order Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="work_order_date"
                      type="date"
                      {...register("work_order_date", {
                        required: "Work order date is required",
                      })}
                    />
                    {errors.work_order_date ? (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {errors.work_order_date.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="estimated_amount">
                      Estimated Amount <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="estimated_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("estimated_amount", {
                        valueAsNumber: true,
                        required: "Estimated amount is required",
                        min: { value: 0, message: "Must be 0 or higher" },
                      })}
                    />
                    {errors.estimated_amount ? (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {errors.estimated_amount.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g. HVAC, Plumbing"
                      {...register("category")}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="region">Region</Label>
                    <Input
                      id="region"
                      placeholder="e.g. North, Downtown"
                      {...register("region")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g. 123 Main St, Suite 4"
                    {...register("address")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Describe the scope of work for this estimate..."
                    {...register("description")}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            isPending ||
                            (isAlreadyPromoted && field.value === "approved")
                          }
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem
                              value="approved"
                              disabled={isAlreadyPromoted}
                            >
                              Approved
                            </SelectItem>
                            <SelectItem value="denied">Denied</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {isAlreadyPromoted ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        This estimate is already promoted to a job.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="handled_by">Handled By</Label>
                    <Input
                      id="handled_by"
                      placeholder="e.g. John Doe"
                      {...register("handled_by")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Jot down important note here"
                    rows={2}
                    {...register("notes")}
                  />
                </div>
              </div>

              <DialogFooter className="flex-row items-center justify-between sm:justify-between pt-5">
                {mode === "edit" ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setIsConfirmDeleteOpen(true)}
                    disabled={isPending || !selectedEstimate?.work_order_id}
                  >
                    <Trash2 className="mr-2 h-4 w-4 " />
                    Delete
                  </Button>
                ) : null}
                <div className="ml-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      closeDialog();
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || !isDirty}>
                    {isPending
                      ? "Saving..."
                      : mode === "edit"
                        ? "Update Estimate"
                        : "Save Estimate"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide this estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This estimate will be hidden from all views and reports but{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                not permanently deleted
              </span>
              .
              {isAlreadyPromoted ? (
                <>
                  {" "}
                  This estimate was promoted to approved, so its related record
                  in the jobs table will also be hidden.
                </>
              ) : null}{" "}
              Related records remain in the database and can be restored if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeletePending || !selectedEstimate?.work_order_id}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-700 dark:text-zinc-300 dark:hover:bg-red-800"
            >
              {isDeletePending ? "Hiding..." : "Yes, hide estimate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PromoteEstimateDialog
        open={isPromoteDialogOpen}
        onOpenChange={setIsPromoteDialogOpen}
        estimatedAmount={Number(
          pendingPromotion?.estimateFormData.estimated_amount ?? 0,
        )}
        isSubmitting={isPromoting}
        errorMessage={promoteError?.message}
        onSubmit={handleSubmitPromotion}
      />
    </>
  );
}
