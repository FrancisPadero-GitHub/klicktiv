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

import { useFetchProfiles } from "@/hooks/auth/useFetchProfiles";
import { QueryStatePanel } from "@/components/misc/query-state-panel";
import { CreateLoginCredentials } from "@/components/dashboard/settings/create-va";

function RoleBadge({ role }: { role: string | null }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        isAdmin
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground",
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
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5" />
              VA Accounts
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
          <div className="max-h-150 rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 dark:bg-card/50 hover:bg-muted/50 dark:hover:bg-card/50">
                  <TableHead className="font-semibold text-foreground">
                    Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Username
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Role
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-foreground text-right">
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
                    : "-";

                  return (
                    <TableRow key={profile.id} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {fullName || (
                          <span className="text-muted-foreground/50 italic">
                            No name set
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.username ? (
                          <span className="font-mono text-sm">
                            @{profile.username}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 italic">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={profile.role} />
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={profile.email} />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {updatedAt}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/50">
            <Users className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No profiles found</p>
            <p className="text-xs mt-1">
              Created VA Accounts will appear here.
            </p>
          </div>
        )}
      </div>
    </QueryStatePanel>
  );
}
