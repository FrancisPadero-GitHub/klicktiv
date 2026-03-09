"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Users } from "lucide-react";
import { toast } from "sonner";
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

// Zustand store
import { useTechnicianStore } from "@/features/store/technician/useFormTechnicianStore";

// Db types from supabase generted types
import type { Database } from "@/database.types";

// Hooks
import { useAddTechnician } from "@/hooks/technicians/useAddTechnician";
import { useEditTechnician } from "@/hooks/technicians/useEditTechnician";

type TechnicianFormValues =
  Database["public"]["Tables"]["technicians"]["Insert"];

export function AddTechnicianDialog() {
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
  } = useTechnicianStore();

  // TanStack Query mutations
  const {
    mutate: addTechnician,
    isPending: isAddPending,
    reset: resetAddMutation,
  } = useAddTechnician();

  const {
    mutate: editTechnician,
    isPending: isEditPending,
    reset: resetEditMutation,
  } = useEditTechnician();

  const isEdit = mode === "edit";
  const isPending = isEdit ? isEditPending : isAddPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<TechnicianFormValues>({
    defaultValues: {
      name: "",
      email: "",
      commission: 0,
      hired_date: new Date().toISOString().slice(0, 10),
    },
  });

  const commission = useWatch({
    control,
    name: "commission",
  });

  // When the dialog opens, reset form with the current store values
  useEffect(() => {
    if (!isDialogOpen) return;

    reset({
      name: form.name || "",
      email: form.email || "",
      commission: form.commission || 0,
      hired_date: form.hired_date || new Date().toISOString().slice(0, 10),
      id: form.id,
    });
  }, [
    isDialogOpen,
    form.name,
    form.email,
    form.commission,
    form.hired_date,
    form.id,
    reset,
  ]);

  const onSubmit = (data: TechnicianFormValues) => {
    const { id: _id, created_at: _created_at, ...rest } = data;

    const payload = { ...rest };

    setIsSubmitting(true);

    if (isEdit) {
      editTechnician(
        { ...payload, id: form.id },
        {
          onSuccess: () => {
            toast.success("Technician updated successfully!");
            closeDialog();
            setTimeout(() => {
              resetEditMutation();
              resetForm();
              reset();
              setIsSubmitting(false);
            }, 300);
          },
          onError: (err) => {
            const message =
              err instanceof Error ? err.message : "Error updating technician";
            toast.error(message);
            console.error("Error editing technician:", err);
            setIsSubmitting(false);
          },
        },
      );
    } else {
      addTechnician(payload, {
        onSuccess: () => {
          toast.success("Technician added successfully!");
          closeDialog();
          setTimeout(() => {
            resetAddMutation();
            resetForm();
            reset();
            setIsSubmitting(false);
          }, 300);
        },
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : "Error adding technician";
          toast.error(message);
          console.error("Error adding technician:", err);
          setIsSubmitting(false);
        },
      });
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          resetAddMutation();
          resetEditMutation();
          openAdd();
        } else {
          closeDialog();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button onClick={openAdd}>
          <Users className="mr-2 h-4 w-4" />
          Add Technician
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-md"
        onCloseAutoFocus={(event) => {
          // Prevent auto-focus on close to avoid scroll jump
          event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Technician" : "Add New Technician"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update technician details."
              : "Register a new technician or sub-contractor."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="grid gap-4 py-2"
        >
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="tech-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tech-name"
              placeholder="Full name"
              disabled={isPending}
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="tech-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="tech-email"
              type="email"
              placeholder="tech@example.com"
              disabled={isPending}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Commission Rate & Hire Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* commission rate */}
            <div className="space-y-2">
              <Label htmlFor="tech-commission">
                Commission Rate % <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tech-commission"
                type="number"
                inputMode="numeric"
                min="0"
                max="100"
                placeholder="e.g. 75"
                disabled={isPending}
                {...register("commission", {
                  required: "Commission rate is required",
                  min: {
                    value: 0,
                    message: "Commission rate must be at least 0",
                  },
                  max: {
                    value: 100,
                    message: "Commission rate must be no more than 100",
                  },
                })}
              />
              {errors.commission && (
                <p className="text-xs text-red-500">
                  {errors.commission.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Business keeps{" "}
                {(() => {
                  const result = Math.round(
                    100 - parseFloat(commission?.toString() ?? "0"),
                  );
                  return isNaN(result) ? "" : `${result}%`;
                })()}
              </p>
            </div>

            {/* Hire Date */}
            <div className="space-y-2">
              <Label htmlFor="tech-hired">
                Hire Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tech-hired"
                type="date"
                disabled={isPending}
                {...register("hired_date", {
                  required: "Hire date is required",
                })}
              />
              {errors.hired_date && (
                <p className="text-xs text-red-500">
                  {errors.hired_date.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row items-center justify-end">
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
                    : "Adding..."
                  : isEdit
                    ? "Save Changes"
                    : "Add Technician"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
