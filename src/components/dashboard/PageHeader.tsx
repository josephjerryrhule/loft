import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string | React.ReactNode;
  showGreeting?: boolean;
  userName?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showGreeting,
  userName,
  actions,
  className,
}: PageHeaderProps) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const finalTitle = showGreeting ? `${greeting()}, ${userName?.split(' ')[0] || "Admin"}` : title;

  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          {finalTitle}
        </h1>
        {subtitle ? (
          <div className="text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </div>
        ) : showGreeting ? (
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Clock size={14} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        ) : null}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
