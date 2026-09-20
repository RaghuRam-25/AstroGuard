"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMedicalCrewMember } from "../../../../lib/api";
import { LoadingState, ErrorState } from "../../../../components/shared/LoadingState";
import {
  Heart,
  Droplet,
  Moon,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Bell,
  Clock,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function MedicalAstronautDetailPage() {
  const params = useParams();
  const astronautId = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!astronautId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMedicalCrewMember(astronautId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Failed to retrieve astronaut clinical profile.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [astronautId]);

  if (loading) return <LoadingState message={`Accessing medical record for ${astronautId}...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;

  const { astronaut, latestHealth, latestAnalysis, unresolvedAlerts } = data || {};
  const risk = latestAnalysis?.riskLevel || "Low";
  const isHighRisk = risk === "Critical" || risk === "Warning";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Header */}
      <div>
        <Link
          href="/medical/astronauts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Roster
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-base">
              {astronaut?.astronautId || astronautId}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">{astronaut?.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isHighRisk
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {risk} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {astronaut?.role || "Mission Specialist"} • {astronaut?.mission || "Ares Mission 01"} • Day {astronaut?.missionDay || 45}
              </p>
            </div>
          </div>
          <button
            onClick={fetchDetail}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Record
          </button>
        </div>
      </div>

      {/* Quick Nav Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        <Link
          href={`/medical/astronauts/${astronautId}`}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold"
        >
          Clinical Overview
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/health`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors"
        >
          Telemetry History
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/analysis`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors"
        >
          AI Diagnostics
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/alerts`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          Alerts
          {unresolvedAlerts > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          )}
        </Link>
      </div>

      {/* Latest Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-red-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{latestHealth?.heartRate ?? 72}</span>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oxygenation</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-300 font-mono">{latestHealth?.spo2 ?? 98}%</span>
            <span className="text-xs text-slate-400">SpO₂</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sleep Duration</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-300 font-mono">{latestHealth?.sleep ?? 7.2}</span>
            <span className="text-xs text-slate-400">Hours</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Physical Activity</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300 font-mono">{latestHealth?.activity ?? 65}%</span>
            <span className="text-xs text-slate-400">Index</span>
          </div>
        </div>
      </div>

      {/* AI Clinical Assessment */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#051c14] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            AI Diagnostic Assessment
          </div>
          <span className="text-xs font-mono text-slate-400">
            Score: {latestAnalysis?.anomalyScore != null ? `${Math.round(latestAnalysis.anomalyScore * 100)}%` : "Nominal"}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white">
          {latestAnalysis?.explanation?.headline || "Nominal Physiological Stability"}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {latestAnalysis?.explanation?.summary ||
            "All vital parameters remain concordant with standard baseline expectations. No microgravity cardiovascular deconditioning detected."}
        </p>

        {latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0 && (
          <div className="pt-3 border-t border-white/5 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Clinical Guidance</span>
            {latestAnalysis.recommendations.map((rec: string, i: number) => (
              <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span>{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
