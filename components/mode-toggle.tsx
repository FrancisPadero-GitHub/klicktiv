"use client";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Sun, Moon, Coffee, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  // { value: "caffeine_light", label: "Caffeine Light", icon: Coffee },
  // { value: "caffeine_dark", label: "Caffeine Dark", icon: Coffee },
] as const;

// type ThemeValue = (typeof THEMES)[number]["value"];

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const current = THEMES.find((t) => t.value === theme) ?? THEMES[0];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-foreground transition-colors hover:bg-secondary",
            className,
          )}
          aria-label="Select theme"
        >
          <CurrentIcon className="h-4 w-4" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex cursor-pointer items-center gap-2",
              theme === value && "font-semibold",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
