"use client";

import { LayoutGrid } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { healthMetrics, healthTrendSparklines } from "@/data/mockData";
import Sparkline from "./Sparkline";

const COLORS: Record<string, string> = {
  heartRate: "#FB7185",
  spo2: "#38BDF8",
  sleep: "#A78BFA",
  activity: "#22D3EE",
};

const STATUS_STYLES: Record<string, string> = {
  Normal: "border-success/20 bg-success/10 text-success",
  Good: "border-primary/20 bg-primary/10 text-primary",
};

export default function HealthMetricsBreakdown() {
  return (
    <Card
      icon={LayoutGrid}
      title="Health Metrics Breakdown"
      subtitle="Detailed view of your current health metrics."
      className="h-full"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {healthMetrics.map((metric) => {
          const color = COLORS[metric.id] ?? COLORS.activity;
          const sparkData = healthTrendSparklines[metric.id] ?? [];
          return (
            <div
              key={metric.id}
              className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3.5 transition-colors hover:border-primary/20"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-400">{metric.label}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[metric.status] ?? STATUS_STYLES.Normal}`}
                >
                  {metric.status}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">
                  {metric.value}
                </span>
                <span className="text-xs font-medium text-slate-400">{metric.unit}</span>
              </div>
              <div className="mt-2 h-9 w-full">
                <Sparkline data={sparkData} color={color} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}