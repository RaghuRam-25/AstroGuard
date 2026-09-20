"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMissionCrew, getMissionAlerts } from "../../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../../components/shared/LoadingState";
import { ArrowLeft, Rocket, Users, ShieldAlert, Activity, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";

export default function MissionControlMissionDetailPage() {
  const params = useParams();
  const missionId = decodeURIComponent((params?.id as string) || "");

  const [crew, setCrew] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [missionInfo, setMissionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!missionId) return;
    setLoading(true);
    setError(null);
    try {
      const [crewRes, alertsRes] = await Promise.all([
        getMissionCrew(missionId),
        getMissionAlerts(missionId),
      ]);

      if (crewRes.success && crewRes.data) {
        setCrew(crewRes.data.crew || []);
        setMissionInfo(crewRes.data.mission);
      }
      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data.alerts || alertsRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load mission operations console.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [missionId]);

  if (loading) return <LoadingState message={`Uplinking to ${missionId} operational deck...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href="/mission-control/missions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-purple-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Missions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">
              Flight Operations Command
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              {missionInfo?.name || missionId} Console
            </h1>
            <p className="text-sm text-slate-400">
              Live status, crew vitals, and alert monitoring for {missionId}.
            </p>
          </div>
          <button
            onClick={fetchDetail}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Crew Complement Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Onboard Crew Telemetry ({crew.length} Astronauts)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crew.map((member) => {
            const risk = member.latestAnalysis?.riskLevel || "Low";
            const isHighRisk = risk === "Critical" || risk === "Warning";
            const isWatch = risk === "Watch";

            return (
              <div
                key={member.astronautId}
                className="p-5 rounded-2xl border border-white/5 bg-[#0e061c] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-purple-300 text-xs">
                      {member.astronautId}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{member.name}</h3>
                      <span className="text-xs text-slate-400">{member.role}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      isHighRisk
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : isWatch
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {risk}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-black/30 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">HR</span>
                    <span className="text-white font-bold">{member.latestHealth?.heartRate ?? 72} BPM</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO₂</span>
                    <span className="text-cyan-300 font-bold">{member.latestHealth?.spo2 ?? 98}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Activity</span>
                    <span className="text-emerald-300 font-bold">{member.latestHealth?.activity ?? 65}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mission Alerts */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          Mission Specific Alerts ({alerts.length})
        </h2>

        {alerts.length === 0 ? (
          <EmptyState title="All Nominal" message="No operational alerts flagged for this flight mission." />
        ) : (
          <div className="space-y-2">
            {alerts.map((a: any) => (
              <div
                key={a._id || a.id}
                className="p-4 rounded-xl border border-white/5 bg-[#0e061c] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-purple-300">{a.astronautId}</span>
                  <span className="font-semibold text-white">{a.type}</span>
                  <span className="text-slate-400">{a.message}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase text-[10px]">
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
