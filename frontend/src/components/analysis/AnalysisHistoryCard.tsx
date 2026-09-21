"use client";

import { Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { analysisHistory } from "@/data/mockData";
import type { AnalysisHistoryEntry } from "@/data/mockData";

const STATUS_TONE: Record<AnalysisHistoryEntry["status"], string> = {
  NORMAL: "border-success/25 bg-success/10 text-success",
  LOW: "border-success/25 bg-success/10 text-success",
  WATCH: "border-warning/25 bg-warning/10 text-warning",
  WARNING: "border-danger/25 bg-danger/10 text-danger",
};

export default function AnalysisHistoryCard() {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-white">AI Analysis History</h3>
      </div>

      <div className="mt-3.5 space-y-3">
        {analysisHistory.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3.5 transition-colors hover:border-primary/25"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-semibold text-slate-300">{entry.timestamp}</p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                  STATUS_TONE[entry.status]
                )}
              >
                {entry.status}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-white">{entry.anomalyScore}/100</span>
              <span>·</span>
              <span>{entry.model}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{entry.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}