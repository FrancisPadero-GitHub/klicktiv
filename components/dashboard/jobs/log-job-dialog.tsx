"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Zustand store
import {
  useJobStore,
  type JobFormValues,
} from "@/features/store/jobs/useFormJobStore";

// Hooks
import { useAddJob } from "@/hooks/jobs/useAddJobs";
import { useEditJob } from "@/hooks/jobs/useEditJob";
import { useFetchTechnicians } from "@/hooks/technicians/useFetchTechnicians";
import { useFetchPaymentMethods } from "@/hooks/payment-methods/useFetchPaymentMethods";

const JOB_STATUSES = ["pending", "done", "cancelled"] as const;

interface LogJobDialogProps {
  showTrigger?: boolean;
}

export function LogJobDialog({ showTrigger = true }: LogJobDialogProps) {
  // Zustand store
  const {
    form,
    mode,
    isDialogOpen,
    isSubmitting,
    openAdd,
    resetForm,
    closeDialog,
    setIsSubmitting,
  } = useJobStore();

  const isEdit = mode === "edit";

  // TanStack Query data
  const { data: technicians = [] } = useFetchTechnicians();
  const { data: paymentMethods = [] } = useFetchPaymentMethods();
  const activeTechnicians = technicians.filter(
    (technician) => technician.deleted_at === null,
  );

  // TanStack Query mutations
  const {
    mutate: addJob,
    isPending: isAddPending,
    reset: resetAddMutation,
  } = useAddJob();

  const {
    mutate: editJob,
    isPending: isEditPending,
    reset: resetEditMutation,
  } = useEditJob();

  const isPending = isEdit ? isEditPending : isAddPending;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<JobFormValues>({
    defaultValues: form,
    shouldFocusError: false,
  });

  // Sync form when dialog opens; resolve payment_method_id from name when editing
  useEffect(() => {
    if (!isDialogOpen) return;

    let resolvedPaymentMethodId = form.payment_method_id ?? "";

    // In edit mode v_jobs only supplies the payment method name, not the id.
    // Resolve it once payment methods are loaded.
    if (isEdit && !resolvedPaymentMethodId && form.payment_method) {
      const match = paymentMethods.find(
        (pm) =>
          pm.name.toLowerCase() === (form.payment_method ?? "").toLowerCase(),
      );
      if (match) resolvedPaymentMethodId = match.id;
    }

    reset({ ...form, payment_method_id: resolvedPaymentMethodId });
  }, [isDialogOpen, paymentMethods.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (data: JobFormValues) => {
    setIsSubmitting(true);

    const workOrder = {
      work_title: data.work_title,
      work_order_date: data.work_order_date,
      technician_id: data.technician_id,
      address: data.address || null,
      category: data.category || null,
      description: data.description || null,
      notes: data.notes || null,
      region: data.region || null,
      contact_no: data.contact_no || null,
      contact_email: data.contact_email || null,
    };

    const promotedAt =
      data.status === "done" && form.status !== "done"
        ? new Date().toISOString()
        : undefined;

    const job = {
      subtotal: Number(data.subtotal),
      parts_total_cost: Number(data.parts_total_cost) || 0,
      payment_method_id: data.payment_method_id || null,
      status: data.status,
      tip_amount: Number(data.tip_amount) || 0,
      promoted_at: promotedAt,
    };

    if (isEdit) {
      editJob(
        { workOrderId: form.work_order_id!, workOrder, job },
        {
          onSuccess: () => {
            closeDialog();
            setTimeout(() => {
              resetEditMutation?.();
              resetForm();
              reset();
              setIsSubmitting(false);
            }, 300);
          },
          onError: () => {
            setIsSubmitting(false);
          },
        },
      );
    } else {
      addJob(
        { workOrder, job },
        {
          onSuccess: () => {
            closeDialog();
            setTimeout(() => {
              resetAddMutation?.();
              resetForm();
              reset();
              setIsSubmitting(false);
            }, 300);
          },
          onError: () => {
            setIsSubmitting(false);
          },
        },
      );
    }
  };

  return (
    <>
      <Dialog
        modal
        open={isDialogOpen}
        onOpenChange={(newOpen) => {
          if (newOpen) {
            resetAddMutation?.();
            resetEditMutation?.();
            openAdd();
          } else {
            closeDialog();
          }
        }}
      >
        {showTrigger ? (
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Briefcase className="mr-2 h-4 w-4" />
              Log Job
            </Button>
          </DialogTrigger>
        ) : null}

        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          onCloseAutoFocus={(event) => {
            // Prevent auto-focus on close to avoid scroll jump
            event.preventDefault();
          }}
          // onPointerDownOutside={(e) => {
          //   // Prevent scroll jump when clicking outside
          //   e.preventDefault();
          //   if (!isSubmitting && !isPending) {
          //     closeDialog();
          //   }
          // }}
        >
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Job" : "Log New Job"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the work order and job details below."
                : "Fill in the work order and job details below."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="overflow-y-auto flex-1 grid gap-6 py-2 pl-2 pr-1">
              {/* ── Work Order Section ─────────────────────────── */}
              <div className="grid gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Work Order
                </h3>

                {/* Work Title */}
                <div className="space-y-2">
                  <Label htmlFor="job-work-title">
                    Work Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="job-work-title"
                    placeholder="e.g. HVAC Installation"
                    disabled={isPending}
                    {...register("work_title", {
                      required: "Work title is required",
                    })}
                  />
                  {errors.work_title && (
                    <p className="text-xs text-red-500">
                      {errors.work_title.message}
                    </p>
                  )}
                </div>

                {/* Date & Technician */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-date">
                      Work Order Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="job-date"
                      type="date"
                      disabled={isPending}
                      {...register("work_order_date", {
                        required: "Date is required",
                      })}
                    />
                    {errors.work_order_date && (
                      <p className="text-xs text-red-500">
                        {errors.work_order_date.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-technician">
                      Technician <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      disabled={isPending || activeTechnicians.length === 0}
                      value={watch("technician_id")}
                      onValueChange={(v) =>
                        setValue("technician_id", v, { shouldDirty: true })
                      }
                    >
                      <SelectTrigger id="job-technician" className="w-full">
                        <SelectValue
                          placeholder={
                            activeTechnicians.length === 0
                              ? "No technician available"
                              : "Select technician"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTechnicians.length > 0 ? (
                          activeTechnicians.map((t) => (
                            <SelectItem key={t.id} value={t.id ?? ""}>
                              {t.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="__no_technician__" disabled>
                            No technician available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      {...register("technician_id", {
                        required: "Technician is required",
                      })}
                    />
                    {errors.technician_id && (
                      <p className="text-xs text-red-500">
                        {errors.technician_id.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Category & Region */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-category">
                      Category{" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-category"
                      placeholder="e.g. HVAC"
                      disabled={isPending}
                      {...register("category")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-region">
                      Region{" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-region"
                      placeholder="e.g. North"
                      disabled={isPending}
                      {...register("region")}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="job-address">
                    Address{" "}
                    <span className="text-zinc-400 text-xs">(optional)</span>
                  </Label>
                  <Input
                    id="job-address"
                    placeholder="123 Main St"
                    disabled={isPending}
                    {...register("address")}
                  />
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-contact-no">
                      Contact Number{" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-contact-no"
                      placeholder="e.g. +1 555 123 4567"
                      disabled={isPending}
                      {...register("contact_no")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-contact-email">
                      Contact Email{" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-contact-email"
                      type="email"
                      placeholder="customer@example.com"
                      disabled={isPending}
                      {...register("contact_email")}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="job-description">
                    Description{" "}
                    <span className="text-zinc-400 text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="job-description"
                    placeholder="Describe the work performed..."
                    disabled={isPending}
                    {...register("description")}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="job-notes">
                    Notes{" "}
                    <span className="text-zinc-400 text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="job-notes"
                    placeholder="Any additional notes..."
                    disabled={isPending}
                    {...register("notes")}
                  />
                </div>
              </div>

              {/* ── Job Financials Section ─────────────────────── */}
              <div className="grid gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Job Financials
                </h3>

                {/* Subtotal & Parts Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-subtotal">
                      Subtotal ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="job-subtotal"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isPending}
                      {...register("subtotal", {
                        required: "Subtotal is required",
                        min: { value: 0, message: "Subtotal must be ≥ 0" },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.subtotal && (
                      <p className="text-xs text-red-500">
                        {errors.subtotal.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-parts-cost">
                      Parts Cost ($){" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-parts-cost"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isPending}
                      {...register("parts_total_cost", {
                        min: { value: 0, message: "Parts cost must be ≥ 0" },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.parts_total_cost && (
                      <p className="text-xs text-red-500">
                        {errors.parts_total_cost.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tip & Payment Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="job-tip">
                      Tip ($){" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="job-tip"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isPending}
                      {...register("tip_amount", {
                        min: { value: 0, message: "Tip must be ≥ 0" },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.tip_amount && (
                      <p className="text-xs text-red-500">
                        {errors.tip_amount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="job-payment-method">
                      Payment Method{" "}
                      <span className="text-zinc-400 text-xs">(optional)</span>
                    </Label>
                    <Select
                      disabled={isPending}
                      value={watch("payment_method_id")}
                      onValueChange={(v) =>
                        setValue("payment_method_id", v, {
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger id="job-payment-method" className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="job-status">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    disabled={isPending}
                    value={watch("status")}
                    onValueChange={(v) =>
                      setValue("status", v as (typeof JOB_STATUSES)[number], {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="job-status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-5">
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || isPending}
                  onClick={() => {
                    closeDialog();
                    resetForm();
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending || !isDirty}
                >
                  {isSubmitting || isPending
                    ? isEdit
                      ? "Saving..."
                      : "Logging..."
                    : isEdit
                      ? "Save Changes"
                      : "Log Job"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
