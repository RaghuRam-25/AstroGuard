"use client";

import { useEffect } from "react";
import {
  Brain,
  Clock,
  Gauge,
  HeartPulse,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Volume2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthAlert } from "@/data/mockData";
import AlertSeverityBadge from "./AlertSeverityBadge";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";

export default function AlertDetailsPanel({
  alert,
  className,
}: {
  alert: HealthAlert;
  className?: string;
}) {
  const playback = useSpeechPlayback();
  const speaking = playback.isSpeaking(`alert-${alert.id}`);
  const devUp = alert.deviation.startsWith("+");

  const readout = `${alert.title}. ${alert.explanation}. Recommended next steps: ${alert.recommendations.join(". ")}.`;

  useEffect(() => {
    playback.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alert.id]);

  return (
    <section className={cn("glass-card rounded-2xl", className)}>
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-sky-400/10 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_16px_rgba(56,189,248,0.2)]">
            <HeartPulse className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-[13px] font-bold leading-snug text-white">{alert.title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <Clock className="h-3 w-3" />
              {alert.time} · {alert.signal}
            </p>
          </div>
        </div>
        <AlertSeverityBadge severity={alert.severity} />
      </header>

      <div className="space-y-2 p-3 sm:p-3.5">
        {/* What changed — current vs baseline */}
        <div className="grid grid-cols-3 gap-1.5">
          <StatTile label="Current" value={alert.currentValue} accent="text-white" />
          <StatTile label="Baseline" value={alert.baseline} accent="text-slate-300" />
          <div className="rounded-lg border border-sky-400/10 bg-card-secondary/40 px-2 py-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Deviation
            </p>
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 font-mono text-xs font-bold",
                devUp ? "text-cyan-300" : "text-slate-200"
              )}
            >
              {devUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {alert.deviation}
            </p>
          </div>
        </div>

        {/* Related metrics */}
        <div>
          <SectionLabel icon={Gauge} label="Related Metrics" />
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {alert.relatedMetrics.map((metric) => {
              const isNormal = metric.status.toLowerCase() === "normal";
              return (
                <div
                  key={metric.label}
                  className="rounded-lg border border-sky-400/10 bg-card-secondary/40 px-1.5 py-1.5 text-center"
                >
                  <p className="truncate text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] font-bold text-white">{metric.value}</p>
                  <span
                    className={cn(
                      "mt-1 inline-block max-w-full truncate rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-wide",
                      isNormal
                        ? "border-success/25 bg-success/10 text-success"
                        : "border-warning/25 bg-warning/10 text-warning"
                    )}
                  >
                    {metric.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explanation */}
        <div>
          <SectionLabel icon={MessageSquareText} label="Why" />
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{alert.explanation}</p>
        </div>

        <div>
          <SectionLabel icon={Brain} label="AI Analysis" />
          <div className="mt-1.5 rounded-xl border border-sky-400/10 bg-primary/[0.05] px-2.5 py-1.5">
            <p className="text-[11px] leading-relaxed text-slate-300">
              {alert.title} observed from {alert.currentValue} against a personal baseline of{" "}
              {alert.baseline} ({alert.deviation}). Flagged as{" "}
              <span className="font-bold text-sky-300">{alert.severity}</span> —{" "}
              {alert.severity === "Normal"
                ? "no intervention required, continue nominal monitoring."
                : "tracked for review ahead of the next mission watch."}
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-500">
              <ShieldCheck className="h-3 w-3 text-primary" />
              AI-generated. Not a medical diagnosis.
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <SectionLabel icon={ListChecks} label="Next Steps" />
          <ol className="mt-1.5 space-y-1">
            {alert.recommendations.map((recommendation, i) => (
              <li
                key={recommendation}
                className="flex items-start gap-2.5 rounded-lg border border-sky-400/10 bg-card-secondary/40 px-2.5 py-1"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[9px] font-bold text-primary">
                  {i + 1}
                </span>
                <span className="text-[11px] leading-relaxed text-slate-300">{recommendation}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Listen to AI analysis */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() =>
              speaking ? playback.stop() : playback.speak(`alert-${alert.id}`, readout)
            }
            disabled={!playback.supported}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-bold transition-all duration-200",
              speaking
                ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                : "border-primary/30 bg-gradient-to-r from-primary/15 to-cyan-500/10 text-sky-300 hover:border-primary/50 hover:text-white hover:shadow-[0_0_16px_rgba(56,189,248,0.22)]",
              !playback.supported && "cursor-not-allowed opacity-50"
            )}
          >
            <Volume2 className={cn("h-3 w-3", speaking && "animate-pulse")} />
            {speaking ? "Stop AI Analysis" : "Listen to AI Analysis"}
          </button>
        </div>
        {!playback.supported && (
          <p className="text-center text-[10px] text-slate-500">
            Voice playback is not supported on this browser.
          </p>
        )}
      </div>
    </section>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg border border-sky-400/10 bg-card-secondary/40 px-2 py-1">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={cn("mt-0.5 font-mono text-xs font-bold", accent)}>{value}</p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {label}
    </h3>
  );
}