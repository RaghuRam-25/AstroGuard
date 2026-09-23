"use client";

import { useEffect, useState } from "react";
import { Heart, Droplet, Moon, Activity, Thermometer, Radio } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LATEST_SNAPSHOT, SNAPSHOT_UNITS } from "@/lib/analysisChat";
import { getLatestHealth } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function LatestDataSummary() {
  const { user } = useAuth();
  const [data, setData] = useState({
    heartRate: LATEST_SNAPSHOT.heartRate,
    spo2: LATEST_SNAPSHOT.spo2,
    sleep: LATEST_SNAPSHOT.sleep,
    activity: LATEST_SNAPSHOT.activity,
    bodyTemp: 36.8,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getLatestHealth(user?.astronautId || "AST-001");
        if (active && res.success && res.data) {
          const d = res.data as any;
          setData({
            heartRate: d.heartRate ?? LATEST_SNAPSHOT.heartRate,
            spo2: d.spo2 ?? LATEST_SNAPSHOT.spo2,
            sleep: d.sleep ?? LATEST_SNAPSHOT.sleep,
            activity: d.activity ?? LATEST_SNAPSHOT.activity,
            bodyTemp: d.coreTemperatureC ?? d.bodyTemp ?? 36.8,
          });
        }
      } catch {
        // Fallback default snapshot
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.astronautId]);

  const rows: { label: string; icon: LucideIcon; accent: string; value: number | string; unit: string }[] = [
    { label: "Heart Rate", icon: Heart, accent: "text-rose-400", value: data.heartRate, unit: "BPM" },
    { label: "SpO₂", icon: Droplet, accent: "text-sky-400", value: data.spo2, unit: "%" },
    { label: "Sleep Duration", icon: Moon, accent: "text-indigo-400", value: data.sleep, unit: "hrs" },
    { label: "Activity Index", icon: Activity, accent: "text-cyan-400", value: data.activity, unit: "%" },
    { label: "Core Temp", icon: Thermometer, accent: "text-amber-400", value: data.bodyTemp, unit: "°C" },
  ];

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between border-b border-sky-400/10 pb-3.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-white">Live Telemetry Snapshot</h3>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
          <Radio className="h-3 w-3 animate-pulse" /> 100 Hz Sync
        </span>
      </div>

      <div className="mt-3.5 space-y-2.5">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5"
            >
              <span className="flex items-center gap-2.5 text-xs font-semibold text-slate-300">
                <Icon className={cn("h-4 w-4", row.accent)} />
                {row.label}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">
                  {row.value}
                  <span className="ml-0.5 text-[10px] font-medium text-slate-500">
                    {row.unit}
                  </span>
                </span>
                <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase text-success">
                  Nominal
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}