"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// hooks

import { useCreateUser } from "@/hooks/auth/useCreateCredentials";
import { allProfilesQueryKey } from "@/hooks/auth/useFetchRole";

type Role = "user" | "admin";

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
  fname: string;
  lname: string;
  username: string;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  confirmPassword: "",
  role: "user",
  fname: "",
  lname: "",
  username: "",
};

export function CreateLoginCredentials() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUserMutation = useCreateUser();
  const queryClient = useQueryClient();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setForm(initialFormState);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.email.trim() ||
      !form.password.trim() ||
      !form.confirmPassword.trim() ||
      !form.fname.trim() ||
      !form.lname.trim()
    ) {
      toast.error("Please complete all required fields");
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.username.trim() && form.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        f_name: form.fname.trim(),
        l_name: form.lname.trim(),
        username: form.username.trim() || undefined,
      });

      await queryClient.invalidateQueries({ queryKey: allProfilesQueryKey });
      toast.success("Login credentials created successfully");
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create login credentials",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Create Credentials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Login Credentials
          </DialogTitle>
          <DialogDescription>Create VA's login credentials.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="credentials-fname">First Name</Label>
              <Input
                id="credentials-fname"
                type="text"
                placeholder="First name"
                value={form.fname}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, fname: e.target.value }))
                }
                disabled={createUserMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentials-lname">Last Name</Label>
              <Input
                id="credentials-lname"
                type="text"
                placeholder="Last name"
                value={form.lname}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lname: e.target.value }))
                }
                disabled={createUserMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="credentials-email">Email</Label>
              <Input
                id="credentials-email"
                type="email"
                placeholder="user@company.com"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={createUserMutation.isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credentials-username">Username (optional)</Label>
              <Input
                id="credentials-username"
                type="text"
                placeholder="username"
                value={form.username}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, username: e.target.value }))
                }
                disabled={createUserMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentials-password">Password</Label>
            <div className="relative">
              <Input
                id="credentials-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter temporary password"
                className="pr-10"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                disabled={createUserMutation.isPending}
                required
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentials-confirm-password">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="credentials-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="pr-10"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                disabled={createUserMutation.isPending}
                required
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
          </div>

          {/* <div className="space-y-2">
            REMOVED ROLE SELECTION FOR NOW - ALL NEW USERS WILL BE CREATED AS "USER" ROLE
            <Label htmlFor="credentials-role">Role</Label>
            <Select
              value={form.role}
              onValueChange={(value: Role) =>
                setForm((prev) => ({ ...prev, role: value }))
              }
              disabled={createUserMutation.isPending}
            >
              <SelectTrigger id="credentials-role" className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            Credentials are created through Supabase Edge Functions.
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
