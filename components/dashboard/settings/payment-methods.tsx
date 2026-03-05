"use client";

import { useState } from "react";
import { useFetchPaymentMethods } from "@/hooks/payment-methods/useFetchPaymentMethods";
import { useAddPaymentMethod } from "@/hooks/payment-methods/useAddPaymentMethod";
import { useEditPaymentMethod } from "@/hooks/payment-methods/useEditPaymentMethod";
import { useDelPaymentMethod } from "@/hooks/payment-methods/useDelPaymentMethod";
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
import {
  CreditCard,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { QueryStatePanel } from "@/components/misc/query-state-panel";

type PaymentMethodRow = Database["public"]["Tables"]["payment_methods"]["Row"];

export function PaymentMethodsTable() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: methods, isLoading, isError } = useFetchPaymentMethods();
  const addMutation = useAddPaymentMethod();
  const editMutation = useEditPaymentMethod();
  const deleteMutation = useDelPaymentMethod();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingId(null);
      setFormData({ name: "" });
    }
  };

  const handleSubmit = async (event: React.SubmitEvent) => {
    event.preventDefault();

    if (!formData.name.trim() || isDuplicate) {
      return;
    }

    if (editingId) {
      await editMutation.mutateAsync({
        id: editingId,
        data: { name: formData.name },
      });
    } else {
      await addMutation.mutateAsync({ name: formData.name });
    }

    setFormData({ name: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleEdit = (method: PaymentMethodRow) => {
    setEditingId(method.id);
    setFormData({ name: method.name });
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const isSubmitting = addMutation.isPending || editMutation.isPending;

  const isDuplicate =
    formData.name.trim() !== "" &&
    (methods ?? []).some(
      (m) =>
        m.name.toLowerCase() === formData.name.trim().toLowerCase() &&
        m.id !== editingId,
    );

  if (isLoading) return <Spinner />;

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load payment methods"
      loadingMessage="Loading payment methods..."
      className="min-h-80"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Payment Methods
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {methods?.length ?? 0} method
              {(methods?.length ?? 0) !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingId(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit" : "Add"} Payment Method
                </DialogTitle>
                <DialogDescription>
                  {editingId
                    ? "Update the payment method name"
                    : "Create a new payment method"}
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
                    placeholder="e.g., Credit Card, Cash, Check"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    disabled={isSubmitting}
                    required
                    className={
                      isDuplicate
                        ? "border-amber-400 focus-visible:ring-amber-400"
                        : ""
                    }
                  />
                  {isDuplicate && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />A
                      payment method with this name already exists.
                    </p>
                  )}
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
                  <Button type="submit" disabled={isSubmitting || isDuplicate}>
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
        {methods && methods.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map((method) => (
              <Card
                key={method.id}
                className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <CreditCard className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                          {method.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Added{" "}
                          {new Date(method.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(method)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setDeleteId(method.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <CreditCard className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              No payment methods yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first payment method to get started.
            </p>
          </div>
        )}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this payment method? This action
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
                className="bg-red-500 hover:bg-red-600"
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
