"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Plus, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateCompany } from "@/hooks/super-admin/useCreateCredCompany";

interface FormValues {
  company_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

export function AddCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { mutate: createCompany, isPending } = useCreateCompany();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>();

  const passwordValue = useWatch({ control, name: "password" });

  function onSubmit(values: FormValues) {
    createCompany(
      {
        company_name: values.company_name.trim(),
        email: values.email.trim(),
        password: values.password,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Company
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Company</DialogTitle>
            <DialogDescription>
              Add a new tenant company to the platform.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                placeholder="Acme Field Services"
                {...register("company_name", {
                  required: "Company name is required",
                  minLength: { value: 2, message: "Name is too short" },
                })}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@acme.com"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="pr-10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  className="pr-10"
                  {...register("confirm_password", {
                    required: "Please confirm the password",
                    validate: (value) =>
                      value === passwordValue || "Passwords do not match",
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
