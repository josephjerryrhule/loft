"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

export function TablePagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
}: TablePaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Show</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => onItemsPerPageChange(Number(value))}
        >
          <SelectTrigger className="h-8 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="24">24</SelectItem>
            <SelectItem value="48">48</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs sm:text-sm">
          <span className="hidden sm:inline">items per page · </span>
          Showing {startItem} to {endItem} of {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 px-2 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Previous</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages > 3 ? 3 : totalPages, totalPages) }, (_, i) => {
            let pageNum: number;
            // Simplified for mobile, show fewer pages if many
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage <= 2) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 1) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = currentPage - 1 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 px-2 sm:px-3"
        >
          <span className="hidden sm:inline mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
