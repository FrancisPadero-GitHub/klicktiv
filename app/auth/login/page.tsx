"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { WalletMinimal, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLogin } from "@/hooks/auth/useLogin";
import type { LoginFormValues } from "@/types/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  const serverError = loginMutation.error
    ? loginMutation.error instanceof Error
      ? loginMutation.error.message
      : "Something went wrong."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <WalletMinimal className="h-8 w-8 text-zinc-900 dark:text-zinc-50" />
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Klicktiv
            </span>
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Log in to your account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {justRegistered && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400">
              Account created! Please log in.
            </div>
          )}

          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form
            onSubmit={(e) => void handleSubmit(onSubmit)(e)}
            noValidate
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all",
                  "focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1",
                  "dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-zinc-400",
                  errors.email
                    ? "border-red-400 dark:border-red-600"
                    : "border-zinc-200 dark:border-zinc-700",
                )}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all",
                    "focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1",
                    "dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:ring-zinc-400",
                    errors.password
                      ? "border-red-400 dark:border-red-600"
                      : "border-zinc-200 dark:border-zinc-700",
                  )}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log in"
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="https://advancedvirtualstaff.com/booking"
            className="font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-50"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
