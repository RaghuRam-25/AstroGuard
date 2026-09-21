"use client";

import { HeartPulse, Wind, Moon, Footprints, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthMetric } from "@/data/mockData";
import { healthTrendSparklines } from "@/data/mockData";
import Sparkline from "./Sparkline";

const ICONS = {
  heart: HeartPulse,
  droplet: Wind,
  moon: Moon,
  activity: Footprints,
} as const;

const KEYS = {
  heart: "heartRate",
  droplet: "spo2",
  moon: "sleep",
  activity: "activity",
} as const;

const COLORS = {
  heart: "#FB7185",
  droplet: "#38BDF8",
  moon: "#A78BFA",
  activity: "#22D3EE",
} as const;

const ACCENT: Record<string, string> = {
  heart: "text-rose-400",
  droplet: "text-sky-400",
  moon: "text-indigo-400",
  activity: "text-cyan-400",
};

const ICON_BG: Record<string, string> = {
  heart: "border-rose-400/20 bg-rose-400/10",
  droplet: "border-sky-400/20 bg-sky-400/10",
  moon: "border-indigo-400/20 bg-indigo-400/10",
  activity: "border-cyan-400/20 bg-cyan-400/10",
};

const STATUS_STYLES: Record<string, string> = {
  Normal: "border-success/20 bg-success/10 text-success",
  Good: "border-primary/20 bg-primary/10 text-primary",
};

interface HealthMetricCardProps {
  metric: HealthMetric;
  className?: string;
}

export default function HealthMetricCard({ metric, className }: HealthMetricCardProps) {
  const Icon = ICONS[metric.icon as keyof typeof ICONS] ?? HeartPulse;
  const key = KEYS[metric.icon as keyof typeof KEYS] ?? "heartRate";
  const color = COLORS[key as keyof typeof COLORS] ?? COLORS.heart;
  const isUp = metric.changeDirection === "up";
  const ChangeIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "glass-card group flex h-full flex-col gap-3 overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_50px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-105",
              ICON_BG[metric.icon] ?? ICON_BG.activity
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", ACCENT[metric.icon] ?? ACCENT.activity)} />
          </span>
          <span className="text-xs font-medium text-slate-400">{metric.label}</span>
        </div>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            STATUS_STYLES[metric.status] ?? STATUS_STYLES.Normal
          )}
        >
          {metric.status}
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{metric.value}</span>
        <span className="text-sm font-medium text-slate-400">{metric.unit}</span>
        <span className="ml-auto text-[11px] font-medium text-slate-500">
          Ref {metric.range}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs">
        <span
          className={cn(
            "flex items-center gap-1 font-semibold",
            isUp ? "text-success" : "text-warning"
          )}
        >
          <ChangeIcon className="h-3.5 w-3.5" />
          {metric.change}
        </span>
        <span className="text-slate-500">vs. baseline</span>
      </div>

      <div className="mt-auto h-10 w-full">
        <Sparkline data={healthTrendSparklines[key] ?? []} color={color} />
      </div>
    </div>
  );
}