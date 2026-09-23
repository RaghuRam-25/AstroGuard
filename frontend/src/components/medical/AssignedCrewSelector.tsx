"use client";

import { HeartPulse, ShieldAlert, UserCheck, Waves } from "lucide-react";
import { CrewMember, TriageLevel, triageFromRisk } from "./types";

interface Props {
  crew: CrewMember[];
  selectedId: string;
  onSelect: (astronautId: string) => void;
}

const triageStyles: Record<TriageLevel, { badge: string; ring: string }> = {
  CRITICAL: { badge: "bg-rose-500/90 text-white", ring: "border-rose-400/60" },
  WARNING: { badge: "bg-amber-400/90 text-[#261500]", ring: "border-amber-400/50" },
  NOMINAL: { badge: "bg-emerald-400/90 text-[#01261c]", ring: "border-emerald-400/40" },
};

export default function AssignedCrewSelector({ crew, selectedId, onSelect }: Props) {
  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-[#0a141f]/80 p-4 shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-cyan-400/10 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <UserCheck className="h-4 w-4 text-emerald-300" /> Assigned Astronaut Roster
        </h2>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
          {crew.length} ASSIGNED · STRICT SCOPE
        </span>
      </div>

      {crew.length === 0 ? (
        <p className="py-10 text-center text-xs text-slate-500">
          No astronauts are assigned to your roster yet. Mission Control must link a crew member before you can review
          their telemetry.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {crew.map((member) => {
            const level = triageFromRisk(member.latestAnalysis?.riskLevel);
            const styles = triageStyles[level];
            const active = member.astronautId === selectedId;
            const health = member.latestHealth;
            return (
              <button
                key={member.astronautId}
                onClick={() => onSelect(member.astronautId)}
                className={`group relative rounded-xl border p-3 text-left transition ${active ? `${styles.ring} bg-[#0d2233] shadow-[0_0_20px_rgba(6,182,212,0.12)]` : "border-white/5 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-[#0c1a28]"} `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{member.name}</p>
                    <p className="font-mono text-[10px] text-cyan-300/80">{member.astronautId}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-black tracking-wider ${styles.badge}`}>
                    {level}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-2.5 font-mono">
                  <div>
                    <HeartPulse className="mx-auto h-3.5 w-3.5 text-rose-300" />
                    <p className="mt-0.5 text-center text-xs font-bold text-white">{health?.heartRate ?? "—"}</p>
                    <p className="text-center text-[8px] text-slate-500">BPM</p>
                  </div>
                  <div>
                    <Waves className="mx-auto h-3.5 w-3.5 text-cyan-300" />
                    <p className="mt-0.5 text-center text-xs font-bold text-white">{health?.spo2 !== undefined ? `${health.spo2}%` : "—"}</p>
                    <p className="text-center text-[8px] text-slate-500">SpO₂</p>
                  </div>
                  <div>
                    <ShieldAlert className={`mx-auto h-3.5 w-3.5 ${member.unresolvedAlerts > 0 ? "text-amber-300" : "text-slate-600"}`} />
                    <p className="mt-0.5 text-center text-xs font-bold text-white">{member.unresolvedAlerts}</p>
                    <p className="text-center text-[8px] text-slate-500">Alerts</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}