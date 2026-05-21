"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatActivityDetails, getActionTypeLabel } from "@/lib/activity-formatter";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: string;
  actionType: string;
  actionDetails: string | null;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
  } | null;
}

interface RecentActivityTableProps {
  activities: ActivityLog[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="border-none rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="pl-6">User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right pr-6">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedActivities.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                  No recent activity logged.
                </TableCell>
              </TableRow>
            )}
            {paginatedActivities.map((log) => (
              <TableRow key={log.id} className="group transition-colors">
                <TableCell className="pl-6 font-bold text-sm text-slate-900 dark:text-white">
                    {log.user ? (
                      <Link href={`/admin/users/${log.user.id}`} className="hover:underline cursor-pointer">
                        {log.user.email}
                      </Link>
                    ) : (
                      "System"
                    )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border-none">
                    {getActionTypeLabel(log.actionType)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-slate-500">
                    {formatActivityDetails(log.actionType, log.actionDetails || "")}
                </TableCell>
                <TableCell className="text-right pr-6 text-xs text-slate-400 font-medium">
                  {isMounted ? new Date(log.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {activities.length > 0 && (
        <div className="px-2">
            <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={activities.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(1);
            }}
            />
        </div>
      )}
    </div>
  );
}
