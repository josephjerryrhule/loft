"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface UserLinkProps {
  userId?: string | null;
  userName?: string | null;
  viewerRole?: string | null;
  viewerId?: string | null;
  status?: string | null;
  className?: string;
  children?: React.ReactNode;
}

export function UserLink({
  userId,
  userName,
  viewerRole: propViewerRole,
  viewerId: propViewerId,
  status,
  className,
  children,
}: UserLinkProps) {
  const { data: session } = useSession();

  const viewerRole = propViewerRole || (session?.user as any)?.role;
  const viewerId = propViewerId || session?.user?.id;

  const isStaff = ["ADMIN", "OPERATIONS_MANAGER", "FINANCE"].includes(viewerRole || "");
  const isSelf = Boolean(viewerId && userId && viewerId === userId);

  const displayName = userName || "Unknown User";
  const content = children || displayName;

  // Gracefully handle deleted / deactivated / missing users
  const isDeactivatedOrDeleted = status === "DEACTIVATED" || status === "DELETED" || !userId;

  if (isDeactivatedOrDeleted) {
    return (
      <span className={cn("text-slate-400 font-medium italic", className)}>
        {displayName} {status ? `(${status.toLowerCase()})` : ""}
      </span>
    );
  }

  // Determine path based on role and relationship
  if (isStaff) {
    return (
      <Link
        href={`/admin/users/${userId}`}
        className={cn(
          "font-black text-slate-900 dark:text-white hover:text-[#E87154] hover:underline transition-all cursor-pointer",
          className
        )}
      >
        {content}
      </Link>
    );
  } else if (isSelf) {
    return (
      <Link
        href={`/leaderboard/${userId}`}
        className={cn(
          "font-black text-[#E87154] hover:underline transition-all cursor-pointer",
          className
        )}
      >
        {content}
      </Link>
    );
  } else {
    // Non-staff can't view others, so they get static text
    return (
      <span className={cn("text-slate-900 dark:text-white font-medium", className)}>
        {content}
      </span>
    );
  }
}
