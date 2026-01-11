"use client";

import { useState, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";

interface Activity {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  status?: string;
}

interface ActivityTableProps {
  activities: Activity[];
}

export const ActivityTable = memo(function ActivityTable({ activities }: ActivityTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedActivities = activities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No recent activities.
                </TableCell>
              </TableRow>
            ) : (
              paginatedActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">{activity.action}</TableCell>
                  <TableCell className="truncate max-w-xs">{activity.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {activity.status && (
                      <Badge 
                        variant={
                          activity.status === "COMPLETED" || activity.status === "PAID" || activity.status === "ACTIVE" ? "default" : 
                          activity.status === "APPROVED" ? "secondary" : 
                          activity.status === "PENDING" ? "outline" : 
                          "secondary"
                        }
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
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
});
