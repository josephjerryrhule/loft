import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumKPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    label: string;
    type: "up" | "down" | "neutral";
  };
  theme?: "primary" | "success" | "warning" | "info" | "white";
  className?: string;
}

export function PremiumKPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  theme = "white",
  className,
}: PremiumKPICardProps) {
  const themes = {
    primary: "from-[#E87154] to-[#f09c86] text-white",
    success: "from-emerald-500 to-teal-400 text-white",
    warning: "from-amber-500 to-orange-400 text-white",
    info: "from-blue-500 to-indigo-400 text-white",
    white: "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-none shadow-md",
  };

  const isGradient = theme !== "white";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg group",
        isGradient ? cn("bg-gradient-to-br border-none shadow-xl", themes[theme]) : themes[theme],
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform",
            isGradient ? "text-white" : "text-slate-900 dark:text-white"
          )}
        >
          <Icon size={80} />
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-sm font-medium", isGradient ? "opacity-90" : "text-slate-500 dark:text-slate-400")}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black">{value}</div>
        {description && (
          <p className={cn("text-xs mt-1", isGradient ? "opacity-80" : "text-slate-400")}>
            {description}
          </p>
        )}
        {trend && (
          <div
            className={cn(
              "mt-2 flex items-center text-xs font-medium w-fit px-2 py-0.5 rounded-full",
              isGradient ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800"
            )}
          >
            <span className="mr-1">{trend.value}</span>
            <span className={isGradient ? "opacity-80" : "text-slate-500"}>{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
