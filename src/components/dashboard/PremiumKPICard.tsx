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
    primary: "bg-[#FFFAF5] text-slate-900 border border-[#E87154]/20",
    success: "bg-[#F5F8F5] text-slate-900 border border-[#7C9070]/20",
    warning: "bg-amber-50 text-slate-900 border border-amber-200",
    info: "bg-slate-50 text-slate-900 border border-slate-200",
    white: "bg-white text-slate-900 border border-stone-100 shadow-sm",
  };

  const isThemed = theme !== "white";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-md group rounded-3xl",
        themes[theme],
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "absolute top-0 right-0 p-6 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform",
            theme === "primary" ? "text-[#E87154]" :
            theme === "success" ? "text-[#7C9070]" :
            theme === "warning" ? "text-amber-500" :
            "text-slate-500"
          )}
        >
          <Icon size={80} />
        </div>
      )}
      <CardHeader className="pb-3 pt-6 px-6">
        <CardTitle className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em]", 
            theme === "primary" ? "text-[#E87154]" :
            theme === "success" ? "text-[#7C9070]" :
            theme === "warning" ? "text-amber-600" :
            "text-slate-400"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 relative z-10">
        <div className="text-3xl font-black tracking-tighter text-slate-900">{value}</div>
        {description && (
          <p className="text-[11px] mt-1.5 font-bold uppercase tracking-widest text-slate-500">
            {description}
          </p>
        )}
        {trend && (
          <div
            className={cn(
              "mt-4 flex items-center text-[10px] font-black uppercase tracking-widest w-fit px-3 py-1.5 rounded-lg shadow-sm transition-all border",
              theme === "primary" ? "bg-white text-[#E87154] border-[#E87154]/20" :
              theme === "success" ? "bg-white text-[#7C9070] border-[#7C9070]/20" :
              "bg-white text-slate-500 border-slate-200"
            )}
          >
            <span className={cn("mr-1.5", trend.type === "up" ? "text-emerald-500" : trend.type === "down" ? "text-red-500" : "")}>{trend.value}</span>
            <span className="opacity-70">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
