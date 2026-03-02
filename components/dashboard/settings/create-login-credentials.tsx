"use client";

import { useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useCreateUser } from "@/hooks/auth/useCreateCredentials";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "user" | "admin";

type FormState = {
  email: string;
  password: string;
  role: Role;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  role: "user",
};

export function CreateLoginCredentials() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const createUserMutation = useCreateUser();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      toast.success("Login credentials created successfully");
      setForm(initialFormState);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create login credentials",
      );
    }
  };

  return (
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
      <CardHeader>
        <CardTitle className="text-xl text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Login Credentials
        </CardTitle>
        <CardDescription>
          Create user or admin login credentials through Supabase Edge
          Functions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="credentials-password">Password</Label>
              <Input
                id="credentials-password"
                type="password"
                placeholder="Enter temporary password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                disabled={createUserMutation.isPending}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
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
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            Credentials are created through Supabase Edge Functions.
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm(initialFormState)}
              disabled={createUserMutation.isPending}
            >
              Reset
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending
                ? "Creating..."
                : "Create Credentials"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
