"use client";

import { Heart, Droplet, Moon, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LATEST_SNAPSHOT, SNAPSHOT_UNITS } from "@/lib/analysisChat";

const ROWS: { key: keyof typeof LATEST_SNAPSHOT; label: string; icon: LucideIcon; accent: string }[] = [
  { key: "heartRate", label: "Heart Rate", icon: Heart, accent: "text-rose-400" },
  { key: "spo2", label: "SpO₂", icon: Droplet, accent: "text-sky-400" },
  { key: "sleep", label: "Sleep", icon: Moon, accent: "text-indigo-400" },
  { key: "activity", label: "Activity Level", icon: Activity, accent: "text-cyan-400" },
];

export default function LatestDataSummary() {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-white">Latest Data Summary</h3>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {ROWS.map((row) => {
          const Icon = row.icon;
          const value = LATEST_SNAPSHOT[row.key];
          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <Icon className={cn("h-4 w-4", row.accent)} />
                {row.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {value}
                  <span className="ml-0.5 text-[10px] font-medium text-slate-500">
                    {SNAPSHOT_UNITS[row.key]}
                  </span>
                </span>
                <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase text-success">
                  Normal
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}