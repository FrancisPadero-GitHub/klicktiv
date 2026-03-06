"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  useFetchCompany,
  companyQueryKey,
} from "@/hooks/company/useFetchCompany";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  Mail,
  Lock,
  Building2,
  Pencil,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function InfoRow({
  icon: Icon,
  label,
  value,
  masked,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  masked?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
          {masked ? "••••••••••••" : value}
        </p>
      </div>
    </div>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const colorClass =
    type === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <p className={`flex items-center gap-1.5 text-xs ${colorClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function UpdateCompanyDialog({
  companyId,
  currentName,
}: {
  companyId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setName(currentName);
      setStatus(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === currentName) return;

    setLoading(true);
    setStatus(null);

    const { error } = await supabase
      .from("companies")
      .update({ name: name.trim() })
      .eq("id", companyId);

    setLoading(false);

    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Company name updated successfully." });
      await queryClient.invalidateQueries({
        queryKey: companyQueryKey(companyId),
      });
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Company Name</DialogTitle>
          <DialogDescription>
            Change the name of your company.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          {status && <StatusMessage type={status.type} message={status.msg} />}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || name === currentName}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Name
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Password Dialog ───────────────────────────────────────────────────────────

function UpdatePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || mismatch) return;

    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setStatus({ type: "error", msg: error.message });
    } else {
      setStatus({ type: "success", msg: "Password updated successfully." });
      setPassword("");
      setConfirm("");
    }
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setPassword("");
      setConfirm("");
      setStatus(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Change
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Choose a strong password of at least 8 characters.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              required
              className={
                mismatch ? "border-red-400 focus-visible:ring-red-400" : ""
              }
            />
            {mismatch && (
              <StatusMessage type="error" message="Passwords do not match." />
            )}
          </div>
          {status && <StatusMessage type={status.type} message={status.msg} />}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !password || mismatch}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function UpdateInformation() {
  const { user, company_id } = useAuth();
  const { data: company } = useFetchCompany(company_id ?? undefined);

  const currentEmail = user?.email ?? "—";
  const companyName = company?.name ?? "—";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Login Information
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and update your account credentials.
        </p>
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none">
        <CardContent className="p-0">
          {/* Company Name */}
          <div className="flex items-center gap-4 px-5">
            <div className="flex-1">
              <InfoRow icon={Building2} label="Company" value={companyName} />
            </div>
            {company_id && (
              <UpdateCompanyDialog
                companyId={company_id}
                currentName={companyName}
              />
            )}
          </div>

          <div className="border-b border-zinc-100 dark:border-zinc-800 mx-5" />

          {/* Email */}
          <div className="flex items-center gap-4 px-5">
            <InfoRow icon={Mail} label="Email Address" value={currentEmail} />
          </div>

          <div className="border-b border-zinc-100 dark:border-zinc-800 mx-5" />

          {/* Password */}
          <div className="flex items-center gap-4 px-5">
            <div className="flex-1">
              <InfoRow icon={Lock} label="Password" value="" masked />
            </div>
            <UpdatePasswordDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UpdateInformation;
