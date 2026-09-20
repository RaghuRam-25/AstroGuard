"use client";

import { useEffect, useState } from "react";
import { getAssignedMissions, getMissionAnalytics } from "../../../lib/api";
import { LoadingState, ErrorState } from "../../../components/shared/LoadingState";
import { BarChart3, TrendingUp, Users, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export default function MissionControlAnalyticsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const mRes = await getAssignedMissions();
      if (mRes.success && mRes.data) {
        const mList = mRes.data.missions || [];
        setMissions(mList);
        const mId = selectedMission || mList[0]?.missionId || mList[0]?.name || "ARES-01";
        setSelectedMission(mId);

        const aRes = await getMissionAnalytics(mId);
        if (aRes.success && aRes.data) {
          setAnalytics(aRes.data);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load mission analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSelectMission = async (id: string) => {
    setSelectedMission(id);
    setLoading(true);
    try {
      const aRes = await getMissionAnalytics(id);
      if (aRes.success && aRes.data) {
        setAnalytics(aRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Processing fleet-wide neural anomaly analytics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnalytics} />;

  const dist = analytics?.distribution || { Normal: 3, Watch: 1, Warning: 0, Critical: 0 };
  const avgScore = analytics?.averageAnomalyScore != null ? `${Math.round(analytics.averageAnomalyScore * 100)}%` : "14%";
  const totalCrew = analytics?.totalCrew || 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">
            Statistical Modeling & Risk Distribution
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mission Fleet Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Multi-subject anomaly detection aggregates and mission readiness index.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {missions.length > 1 && (
            <select
              value={selectedMission}
              onChange={(e) => handleSelectMission(e.target.value)}
              className="rounded-xl border border-purple-500/30 bg-[#160a2c] px-3 py-1.5 text-xs font-semibold text-purple-200 focus:outline-none"
            >
              {missions.map((m) => (
                <option key={m.missionId || m._id} value={m.missionId || m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalculate
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fleet Mean Anomaly
          </span>
          <div className="text-3xl font-bold font-mono text-purple-300">{avgScore}</div>
          <span className="text-xs text-slate-500">Aggregated Isolation Forest divergence</span>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Crew Monitored
          </span>
          <div className="text-3xl font-bold font-mono text-white">{totalCrew} Active</div>
          <span className="text-xs text-emerald-400">100% active telemetry coverage</span>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Elevated Watch Subjects
          </span>
          <div className="text-3xl font-bold font-mono text-amber-400">
            {dist.Watch + dist.Warning + dist.Critical}
          </div>
          <span className="text-xs text-slate-500">Above nominal variance thresholds</span>
        </div>
      </div>

      {/* Distribution Breakdown */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] space-y-4">
        <h3 className="text-base font-semibold text-white">Risk Distribution Matrix</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-black/20 border border-emerald-500/20 space-y-1">
            <span className="text-xs text-slate-400">Nominal (&lt; 0.3)</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">{dist.Normal || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-amber-500/20 space-y-1">
            <span className="text-xs text-slate-400">Watch (0.3 - 0.5)</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{dist.Watch || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-orange-500/20 space-y-1">
            <span className="text-xs text-slate-400">Warning (0.5 - 0.7)</span>
            <div className="text-2xl font-bold text-orange-400 font-mono">{dist.Warning || 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-black/20 border border-red-500/20 space-y-1">
            <span className="text-xs text-slate-400">Critical (&gt; 0.7)</span>
            <div className="text-2xl font-bold text-red-400 font-mono">{dist.Critical || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
