"use client";

import { Activity, Gauge, TrendingUp, TrendingDown, Minus, ListOrdered, MessageSquare, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResponse, BaselineMetric, KeyFinding, RiskStatus } from "@/lib/analysisChat";

const STATUS_TONE: Record<RiskStatus, string> = {
  NORMAL: "border-success/25 bg-success/10 text-success",
  LOW: "border-success/25 bg-success/10 text-success",
  WATCH: "border-warning/25 bg-warning/10 text-warning",
  WARNING: "border-danger/25 bg-danger/10 text-danger",
};

const SEVERITY_TONE: Record<KeyFinding["severity"], string> = {
  Normal: "bg-success",
  Watch: "bg-warning",
  Elevated: "bg-danger",
};

export default function AnalysisResponseCard({ analysis }: { analysis: AnalysisResponse }) {
  return (
    <div className="rounded-2xl border border-sky-400/10 bg-card-secondary/30 p-4 sm:p-5">
      {/* Status + model */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              STATUS_TONE[analysis.status]
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", analysis.status === "WATCH" ? "bg-warning" : analysis.status === "WARNING" ? "bg-danger" : "bg-success")}
            />
            {analysis.statusLabel}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Model: {analysis.model}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">{analysis.createdAt}</span>
      </div>

      {/* Key stats */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <StatTile
          icon={Activity}
          label="Overall Health Status"
          value={analysis.statusLabel}
          accent="text-emerald-400"
          tile="border-success/20 bg-success/10"
        />
        <StatTile
          icon={Gauge}
          label="Anomaly Score"
          value={`${analysis.anomalyScore}/100`}
          accent="text-primary"
          tile="border-primary/20 bg-primary/10"
        />
        <StatTile
          icon={Brain}
          label="Confidence"
          value={`${analysis.confidence}%`}
          accent="text-cyan-300"
          tile="border-cyan-400/20 bg-cyan-400/10"
        />
      </div>

      {/* Key findings */}
      <div className="mt-5">
        <SectionLabel icon={ListOrdered} title="Key Findings" />
        <ul className="mt-2.5 space-y-2">
          {analysis.keyFindings.map((finding) => (
            <li
              key={finding.metric}
              className="flex items-start gap-3 rounded-xl border border-sky-400/10 bg-background/40 px-3.5 py-2.5"
            >
              <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_TONE[finding.severity])} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-white">{finding.label}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    {finding.value}
                    <span className="text-slate-600"> · {finding.range}</span>
                  </p>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{finding.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Baselines */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BaselineBlock title="Personal Baseline" entries={analysis.personalBaseline} />
        <BaselineBlock title="Mission Baseline" entries={analysis.missionBaseline} />
      </div>

      {/* Explanation */}
      <div className="mt-5">
        <SectionLabel icon={Gauge} title="AI Explanation" />
        <p className="mt-2.5 rounded-xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-xs leading-relaxed text-slate-300">
          {analysis.explanation}
        </p>
      </div>

      {/* Recommendations */}
      <div className="mt-5">
        <SectionLabel icon={MessageSquare} title="Recommended Next Steps" />
        <ul className="mt-2.5 space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <li key={rec.title} className="flex items-start gap-3 rounded-xl border border-sky-400/10 bg-background/40 px-3.5 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[11px] font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-bold text-white">{rec.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{rec.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
  tile,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
  tile: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-400/10 bg-background/40 px-3.5 py-3">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", tile)}>
        <Icon className={cn("h-4 w-4", accent)} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {title}
    </p>
  );
}

function BaselineBlock({
  title,
  entries,
}: {
  title: string;
  entries: BaselineMetric[];
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="mt-2 space-y-1.5">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-2 rounded-lg border border-sky-400/10 bg-background/40 px-3 py-2"
          >
            <span className="text-[11px] font-semibold text-slate-300">{entry.name}</span>
            <span className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-white">{entry.current}</span>
              <span className="text-slate-600">vs</span>
              <span className="text-slate-400">{entry.baseline}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-bold",
                  entry.direction === "up"
                    ? "text-emerald-400"
                    : entry.direction === "down"
                      ? "text-amber-400"
                      : "text-slate-500"
                )}
              >
                {entry.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : entry.direction === "down" ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {entry.delta}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}