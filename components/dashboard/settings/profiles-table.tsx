"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

import { useFetchProfiles } from "@/hooks/auth/useFetchRole";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { CreateLoginCredentials } from "@/components/dashboard/settings/create-va";

function RoleBadge({ role }: { role: string | null }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isAdmin
          ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      )}
    >
      {role ?? "user"}
    </span>
  );
}

export function ProfilesTable() {
  const { data: profiles, isLoading, isError } = useFetchProfiles();

  return (
    <QueryStatePanel
      isLoading={isLoading}
      isError={isError}
      errorMessage="Failed to load profiles"
      loadingMessage="Loading profiles..."
      className="min-h-80"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Profiles
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profiles?.length ?? 0} profile
              {(profiles?.length ?? 0) !== 1 ? "s" : ""} registered
            </p>
          </div>
          <CreateLoginCredentials />
        </div>

        {/* Table */}
        {profiles && profiles.length > 0 ? (
          <div className="max-h-150 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Username
                  </TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300 text-right">
                    Last Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => {
                  const fullName = [profile.f_name, profile.l_name]
                    .filter(Boolean)
                    .join(" ");
                  const updatedAt = profile.updated_at
                    ? new Date(profile.updated_at).toLocaleDateString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )
                    : "—";

                  return (
                    <TableRow
                      key={profile.id}
                      className="border-zinc-200 dark:border-zinc-800"
                    >
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-50">
                        {fullName || (
                          <span className="text-zinc-400 italic">
                            No name set
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-600 dark:text-zinc-400">
                        {profile.username ? (
                          <span className="font-mono text-sm">
                            @{profile.username}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RoleBadge
                          role={profile.role === "user" ? "VA" : "—"}
                        />
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={profile.email} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-zinc-500 dark:text-zinc-400">
                        {updatedAt}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 dark:text-zinc-600">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No profiles found</p>
            <p className="text-xs mt-1">
              Created user profiles will appear here.
            </p>
          </div>
        )}
      </div>
    </QueryStatePanel>
  );
}
