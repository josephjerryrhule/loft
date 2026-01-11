"use client";

import { memo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface RevenueChartProps {
  data: { name: string; total: number }[];
}

export const RevenueChart = memo(function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `GHS ${value}`} />
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <Tooltip 
          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
          formatter={(value) => [`GHS ${typeof value === 'number' ? value.toFixed(2) : 0}`, "Revenue"]}
        />
        <Area type="monotone" dataKey="total" stroke="#22c55e" fillOpacity={1} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
});
