"use client";

import { useMemo, useState } from "react";
import { Activity, BrainCircuit, Check, Flag, Phone, ShieldAlert, Zap } from "lucide-react";
import { MedicalAlert, TriageLevel, triageFromSeverity } from "./types";
import { CrewMember } from "./types";

export interface ClinicalTriageHubProps {
  astronaut: CrewMember | null;
  alerts: MedicalAlert[];
  loading: boolean;
  flaggedIds: string[];
  onVoiceCall: (alert: MedicalAlert) => void;
  onAiPrescription: (alert: MedicalAlert) => void;
  onFlagMissionControl: (alert: MedicalAlert) => void;
}

const levelStyles: Record<TriageLevel, { bar: string; badge: string; icon: string; label: string }> = {
  CRITICAL: { bar: "from-rose-500 to-red-400", badge: "bg-rose-500/15 text-rose-300 border-rose-400/30", icon: "bg-rose-500/20 text-rose-300", label: "CRITICAL" },
  WARNING: { bar: "from-amber-400 to-orange-400", badge: "bg-amber-400/15 text-amber-200 border-amber-400/30", icon: "bg-amber-400/20 text-amber-300", label: "WARNING" },
  NOMINAL: { bar: "from-emerald-400 to-cyan-400", badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30", icon: "bg-emerald-400/20 text-emerald-300", label: "NOMINAL" },
};

const filters: Array<TriageLevel | "All"> = ["All", "CRITICAL", "WARNING", "NOMINAL"];

function timeAgo(value?: string): string {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ClinicalTriageHub({
  astronaut,
  alerts,
  loading,
  flaggedIds,
  onVoiceCall,
  onAiPrescription,
  onFlagMissionControl,
}: ClinicalTriageHubProps) {
  const [filter, setFilter] = useState<TriageLevel | "All">("All");

  const counts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let nominal = 0;
    alerts.forEach((alert) => {
      const level = triageFromSeverity(alert.severity);
      if (level === "CRITICAL") critical += 1;
      else if (level === "WARNING") warning += 1;
      else nominal += 1;
    });
    return { critical, warning, nominal };
  }, [alerts]);

  const visible = useMemo(
    () => (filter === "All" ? alerts : alerts.filter((alert) => triageFromSeverity(alert.severity) === filter)),
    [alerts, filter]
  );

  return (
    <section className="flex min-h-[320px] flex-col rounded-2xl border border-cyan-400/20 bg-[#0a141f]/85 shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-cyan-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-white">
            <ShieldAlert className="h-4 w-4 text-cyan-300" /> Clinical Triage & Anomaly Tracker
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {astronaut ? `Showing anomalies for ${astronaut.name} (${astronaut.astronautId})` : "Select an assigned astronaut to review their anomaly feed"}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl border border-white/10 bg-black/20 p-1 text-[10px] font-bold">
          {filters.map((item) => {
            const label =
              item === "All" ? `ALL · ${alerts.length}` : `${item} · ${item === "CRITICAL" ? counts.critical : item === "WARNING" ? counts.warning : counts.nominal}`;
            return (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-2.5 py-1.5 transition ${filter === item ? (item === "CRITICAL" ? "bg-rose-500 text-white" : item === "WARNING" ? "bg-amber-400 text-[#241400]" : item === "NOMINAL" ? "bg-emerald-400 text-[#01261c]" : "bg-cyan-400 text-[#02303f]") : "text-slate-400 hover:text-white"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {loading ? (
          <p className="py-10 text-center text-xs text-slate-500">Loading anomaly telemetry…</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
              <Zap className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-bold text-white">No active anomalies</p>
            <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-500">
              {astronaut ? `${astronaut.name}'s biomedical stream is within nominal range.` : "No roster member selected yet."}
            </p>
          </div>
        ) : (
          visible.map((alert) => {
            const level = triageFromSeverity(alert.severity);
            const styles = levelStyles[level];
            const flagged = flaggedIds.includes(alert._id || alert.id || `${alert.astronautId}-${alert.title}`);
            return (
              <article key={alert._id || alert.id || `${alert.astronautId}-${alert.title}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${styles.icon}`}>
                      {level === "CRITICAL" ? <ShieldAlert className="h-4 w-4" /> : level === "WARNING" ? <Activity className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black tracking-wider ${styles.badge}`}>{styles.label}</span>
                        {flagged && (
                          <span className="flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">
                            <Check className="h-2.5 w-2.5" /> FLAGGED TO MISSION CONTROL
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 truncate text-xs font-bold text-white">{alert.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-400">{alert.description}</p>
                      {(alert.signal || alert.value !== undefined) && (
                        <p className="mt-1.5 font-mono text-[10px] text-cyan-200/80">
                          {alert.signal || "signal"} <span className="text-white">{alert.value}</span>
                          {alert.baseline !== undefined && <span className="text-slate-500"> / baseline {alert.baseline}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-[9px] text-slate-500">{timeAgo(alert.createdAt)}</span>
                </div>

                <div className={`mt-3 h-0.5 w-full rounded-full bg-gradient-to-r ${styles.bar} opacity-70`} />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onVoiceCall(alert)}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
                  >
                    <Phone className="h-3 w-3" /> Voice Call
                  </button>
                  <button
                    onClick={() => onAiPrescription(alert)}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
                  >
                    <BrainCircuit className="h-3 w-3" /> AI Prescription Guidance
                  </button>
                  {flagged ? (
                    <span className="flex items-center gap-1.5 rounded-lg bg-sky-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-sky-300">
                      <Check className="h-3 w-3" /> Flagged
                    </span>
                  ) : (
                    <button
                      onClick={() => onFlagMissionControl(alert)}
                      className="flex items-center gap-1.5 rounded-lg border border-rose-400/25 bg-rose-400/10 px-2.5 py-1.5 text-[10px] font-semibold text-rose-300 transition hover:bg-rose-400/20"
                    >
                      <Flag className="h-3 w-3" /> Flag Mission Control
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}