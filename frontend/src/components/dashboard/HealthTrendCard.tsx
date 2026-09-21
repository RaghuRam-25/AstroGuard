"use client";

import { TrendingUp, TrendingDown, Heart, Droplet, Moon, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Card } from "@/components/shared/Card";
import { cn } from "@/lib/utils";
import { healthTrendSparklines } from "@/data/mockData";

const TRENDS = [
  {
    id: "heartRate",
    label: "Heart Rate",
    value: "72",
    unit: "BPM",
    change: "+2.1%",
    up: true,
    icon: Heart,
    text: "text-rose-400",
    stroke: "#FB7185",
  },
  {
    id: "spo2",
    label: "SpO₂",
    value: "98",
    unit: "%",
    change: "+0.4%",
    up: true,
    icon: Droplet,
    text: "text-sky-400",
    stroke: "#38BDF8",
  },
  {
    id: "sleep",
    label: "Sleep",
    value: "7.4",
    unit: "hrs",
    change: "-5.2%",
    up: false,
    icon: Moon,
    text: "text-indigo-400",
    stroke: "#818CF8",
  },
  {
    id: "activity",
    label: "Activity",
    value: "68",
    unit: "%",
    change: "+3.1%",
    up: true,
    icon: Activity,
    text: "text-cyan-400",
    stroke: "#22D3EE",
  },
];

export default function HealthTrendCard() {
  return (
    <Card title="Health Trends" className="h-full">
      <div className="-mx-5 -mt-1 grid grid-cols-1 divide-y divide-sky-400/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-y-0 px-1">
        {TRENDS.map((trend) => {
          const Icon = trend.icon;
          const points = healthTrendSparklines[trend.id] ?? [];
          const data = points.map((v) => ({ v }));
          const ChangeIcon = trend.up ? TrendingUp : TrendingDown;
          return (
            <div key={trend.id} className="flex items-center gap-3 py-3.5 sm:px-4 sm:first:pl-0 sm:last:pr-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Icon className={cn("h-3.5 w-3.5", trend.text)} />
                  {trend.label}
                </p>
                <p className="mt-1 text-xl font-bold tracking-tight text-white">
                  {trend.value}
                  <span className="ml-1 text-xs font-medium text-slate-400">{trend.unit}</span>
                </p>
                <p className={cn("mt-0.5 flex items-center gap-1 text-[11px] font-semibold", trend.up ? "text-success" : "text-warning")}>
                  <ChangeIcon className="h-3 w-3" />
                  {trend.change}
                </p>
              </div>
              <div className="h-12 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <defs>
                      <linearGradient id={`spark-${trend.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={trend.stroke} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={trend.stroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={trend.stroke}
                      strokeWidth={2}
                      fill={`url(#spark-${trend.id})`}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}