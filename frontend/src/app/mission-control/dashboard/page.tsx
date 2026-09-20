"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getAssignedMissions, getMissionOverview } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import {
  Rocket,
  Radio,
  Users,
  ShieldAlert,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Compass,
} from "lucide-react";

export default function MissionControlDashboardPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAssignedMissions();
      if (res.success && res.data) {
        const list = res.data.missions || [];
        setMissions(list);
        if (list.length > 0) {
          const initialId = list[0].missionId || list[0].name;
          setSelectedMissionId(initialId);
          await loadMissionOverview(initialId);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load missions.");
    } finally {
      setLoading(false);
    }
  };

  const loadMissionOverview = async (mId: string) => {
    try {
      const res = await getMissionOverview(mId);
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error("Failed to load mission overview:", err);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleSelectMission = async (id: string) => {
    setSelectedMissionId(id);
    await loadMissionOverview(id);
  };

  if (loading) return <LoadingState message="Establishing telemetry link with Mission Operations Center..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMissions} />;

  const dist = overview?.distribution || { Normal: 0, Watch: 0, Warning: 0, Critical: 0 };
  const missionInfo = overview?.mission || missions.find((m) => (m.missionId || m.name) === selectedMissionId);
  const totalCrew = overview?.crewSize ?? missionInfo?.astronautIds?.length ?? 4;
  const activeAlerts = overview?.activeAlerts ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-widest">
            <Radio className="w-3.5 h-3.5 animate-pulse text-purple-400" />
            Flight Dynamics & Operations Telemetry
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mission Operations Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time orbital tracking, tactical readiness, and fleet health telemetry.
          </p>
        </div>

        {/* Mission Switcher */}
        <div className="flex items-center gap-3">
          {missions.length > 1 && (
            <select
              value={selectedMissionId}
              onChange={(e) => handleSelectMission(e.target.value)}
              className="rounded-xl border border-purple-500/30 bg-[#160a2c] px-3 py-1.5 text-xs font-semibold text-purple-200 focus:outline-none"
            >
              {missions.map((m) => (
                <option key={m.missionId || m._id} value={m.missionId || m.name}>
                  {m.name} ({m.missionId})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => loadMissionOverview(selectedMissionId)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Ops
          </button>
        </div>
      </div>

      {/* Mission Quick Status Banner */}
      <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#120726] via-[#1a0c36] to-[#0d051c] relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                ACTIVE FLIGHT
              </span>
              <h2 className="text-2xl font-bold text-white">{missionInfo?.name || "Ares Mission 01"}</h2>
            </div>
            <p className="text-xs text-slate-400">
              Identifier: <span className="font-mono text-purple-300">{missionInfo?.missionId || "ARES-01"}</span> • 
              Status: <span className="text-emerald-400 font-semibold">{missionInfo?.status || "Active"}</span> • 
              Flight Elapsed Time: <span className="font-mono text-white">Day {missionInfo?.missionDay || 45}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Crew Complement</span>
              <span className="text-xl font-bold text-white font-mono">{totalCrew} Astronauts</span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Alerts</span>
              <span className={`text-xl font-bold font-mono ${activeAlerts > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {activeAlerts}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center min-w-[100px]">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Orbital Phase</span>
              <span className="text-xl font-bold text-purple-300">Transit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#0e061c] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Crew Risk Stratification</h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of flight crew health status</p>
            </div>
            <Link
              href="/mission-control/analytics"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-1">
              <span className="text-xs text-slate-400">Nominal</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{dist.Normal || 0}</div>
              <div className="text-[11px] text-slate-500">Normal Baseline</div>
            </div>

            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/10 space-y-1">
              <span className="text-xs text-slate-400">Watch</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">{dist.Watch || 0}</div>
              <div className="text-[11px] text-slate-500">Minor Drift</div>
            </div>

            <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-950/10 space-y-1">
              <span className="text-xs text-slate-400">Warning</span>
              <div className="text-2xl font-bold text-orange-400 font-mono">{dist.Warning || 0}</div>
              <div className="text-[11px] text-slate-500">Moderate Risk</div>
            </div>

            <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 space-y-1">
              <span className="text-xs text-slate-400">Critical</span>
              <div className="text-2xl font-bold text-red-400 font-mono">{dist.Critical || 0}</div>
              <div className="text-[11px] text-slate-500">Urgent Intervention</div>
            </div>
          </div>

          {/* Graphical Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="h-3 rounded-full bg-black/40 overflow-hidden flex border border-white/5">
              <div style={{ width: `${((dist.Normal || 0) / totalCrew) * 100}%` }} className="bg-emerald-500 transition-all" />
              <div style={{ width: `${((dist.Watch || 0) / totalCrew) * 100}%` }} className="bg-amber-500 transition-all" />
              <div style={{ width: `${((dist.Warning || 0) / totalCrew) * 100}%` }} className="bg-orange-500 transition-all" />
              <div style={{ width: `${((dist.Critical || 0) / totalCrew) * 100}%` }} className="bg-red-500 transition-all" />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% Nominal</span>
              <span>100% Fleet Capacity</span>
            </div>
          </div>
        </div>

        {/* Quick Operations Links */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Tactical Flight Actions</h3>
            <p className="text-xs text-slate-400">Direct operational protocols for mission coordinators.</p>

            <div className="space-y-2 pt-2">
              <Link
                href="/mission-control/missions"
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Rocket className="w-4 h-4 text-purple-400" />
                  <span>Inspect Mission Fleet</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/mission-control/alerts"
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Review Active Alerts ({activeAlerts})</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/mission-control/analytics"
                className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold text-white transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Fleet Anomaly Models</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-[11px] text-purple-300">
            Comms Uplink: <span className="font-semibold text-emerald-400">Continuous DSN Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
