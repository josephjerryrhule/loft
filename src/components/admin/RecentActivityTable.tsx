"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatActivityDetails, getActionTypeLabel } from "@/lib/activity-formatter";

interface ActivityLog {
  id: string;
  actionType: string;
  actionDetails: string;
  createdAt: Date;
  user?: {
    email: string;
  } | null;
}

interface RecentActivityTableProps {
  activities: ActivityLog[];
}

export function RecentActivityTable({ activities }: RecentActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedActivities.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                No recent activity logged.
              </TableCell>
            </TableRow>
          )}
          {paginatedActivities.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.user?.email || "System"}</TableCell>
              <TableCell>
                <Badge variant="outline">{getActionTypeLabel(log.actionType)}</Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">{formatActivityDetails(log.actionType, log.actionDetails)}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {activities.length > 0 && (
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
      )}
    </div>
  );
}
