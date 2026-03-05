"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { Database } from "@/database.types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchPaymentMethods } from "@/hooks/payment-methods/useFetchPaymentMethods";

type JobStatusEnum = Database["public"]["Enums"]["job_status_enum"];

export interface PromoteEstimateFormValues {
  subtotal: number;
  parts_total_cost: number;
  tip_amount: number;
  payment_method_id: string;
  status: JobStatusEnum;
}

interface PromoteEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedAmount: number;
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (values: PromoteEstimateFormValues) => void;
}

export function PromoteEstimateDialog({
  open,
  onOpenChange,
  estimatedAmount,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: PromoteEstimateDialogProps) {
  const { data: paymentMethods = [] } = useFetchPaymentMethods();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<PromoteEstimateFormValues | null>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setIsConfirmOpen(false);
      setPendingValues(null);
    }
  }

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PromoteEstimateFormValues>({
    defaultValues: {
      subtotal: Number(estimatedAmount || 0),
      parts_total_cost: 0,
      tip_amount: 0,
      payment_method_id: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      subtotal: Number(estimatedAmount || 0),
      parts_total_cost: 0,
      tip_amount: 0,
      payment_method_id: "",
      status: "pending",
    });
  }, [open, estimatedAmount, reset]);

  const watchedStatus = useWatch({
    control,
    name: "status",
  });

  const watchedPaymentMethodId = useWatch({
    control,
    name: "payment_method_id",
  });

  const openConfirm = (values: PromoteEstimateFormValues) => {
    setPendingValues(values);
    setIsConfirmOpen(true);
  };

  const confirmPromotion = () => {
    if (!pendingValues) return;
    onSubmit(pendingValues);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Promote Estimate to Job</DialogTitle>
            <DialogDescription>
              Fill out job details to promote this approved estimate. Subtotal
              is prefilled from the estimate amount.
            </DialogDescription>
          </DialogHeader>

          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <form
            onSubmit={(e) => void handleSubmit(openConfirm)(e)}
            className="grid gap-4 py-2"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="promote-subtotal">Subtotal ($)</Label>
                <Input
                  id="promote-subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("subtotal", {
                    valueAsNumber: true,
                    required: "Subtotal is required",
                    min: { value: 0, message: "Subtotal must be 0 or higher" },
                  })}
                />
                {errors.subtotal ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.subtotal.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="promote-parts">Parts Cost ($)</Label>
                <Input
                  id="promote-parts"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("parts_total_cost", {
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Parts cost must be 0 or higher",
                    },
                  })}
                />
                {errors.parts_total_cost ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.parts_total_cost.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="promote-tip">Tip Amount ($)</Label>
                <Input
                  id="promote-tip"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("tip_amount", {
                    valueAsNumber: true,
                    min: { value: 0, message: "Tip must be 0 or higher" },
                  })}
                />
                {errors.tip_amount ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.tip_amount.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="promote-status">Job Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(value) =>
                    setValue("status", value as JobStatusEnum, {
                      shouldDirty: true,
                    })
                  }
                >
                  <SelectTrigger id="promote-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promote-payment">Payment Method</Label>
              <Select
                value={watchedPaymentMethodId || ""}
                onValueChange={(value) =>
                  setValue("payment_method_id", value, {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger id="promote-payment">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((paymentMethod) => (
                    <SelectItem key={paymentMethod.id} value={paymentMethod.id}>
                      {paymentMethod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Promoting..." : "Promote to Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              Promoting this estimate will create or update a job record. After
              promotion, changes should be managed from Jobs and may no longer
              be modified from the estimate table or estimate dialog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPromotion}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Promoting..." : "Yes, promote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
