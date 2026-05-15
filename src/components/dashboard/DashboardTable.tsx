import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DashboardTableProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function DashboardTable({
  title,
  description,
  actions,
  children,
  className,
  icon,
}: DashboardTableProps) {
  return (
    <Card className={cn("border-none shadow-md overflow-hidden bg-white dark:bg-slate-900", className)}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
