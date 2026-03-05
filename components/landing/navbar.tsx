"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/kt_logo_name.png"
            title="Go to Klicktiv"
            alt="Klicktiv Logo"
            width={160}
            height={48}
            className="h-12 w-auto dark:brightness-0 dark:invert"
            priority
          />
        </Link>

        {/* Desktop nav — centered */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            How It Works
          </Link>
          <Link
            href="#stats"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Why Us
          </Link>
        </nav>

        {/* Right side: CTA (desktop) + theme toggle + hamburger (mobile) */}
        <div className="flex items-center gap-2">
          {/* Desktop-only CTAs */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              title="Temporary, will remove it till auth is ready"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>

          <ModeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          <Link
            href="#features"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            How It Works
          </Link>
          <Link
            href="#stats"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Why Us
          </Link>
          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-center text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
            >
              Log In
            </Link>
            <Link
              href="/dashboard"
              title="Temporary"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
