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
    <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 backdrop-blur-md p-5 space-y-3">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2.5">
        <Clock className="h-4 w-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Analysis History</h3>
      </div>

      <div className="space-y-2.5">
        {analysisHistory.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3 transition-colors hover:border-sky-400/25"
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