"use client";

import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-4 text-center font-sans antialiased dark:bg-zinc-950">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30">
          <ShieldAlert className="h-7 w-7 text-red-500 dark:text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Critical error
          </h2>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            A critical application error occurred. Please refresh the page.
          </p>
          {error.digest && (
            <p className="mt-3 inline-block rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-600">
              ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action — no shadcn Button here since global-error has no providers */}
        <button
          onClick={reset}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Try again
        </button>
      </body>
    </html>
  );
}
