"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllMedicalAlerts } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, Clock, RefreshCw, Eye } from "lucide-react";

export default function MedicalAlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAllMedicalAlerts();
      if (res.success && res.data) {
        setAlerts(res.data || []);
      } else {
        setError(res.message || "Failed to load clinical alerts.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) return <LoadingState message="Connecting to crew alert dispatch stream..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAlerts} />;

  const filtered = alerts.filter((a) => {
    if (filter === "unresolved") return !a.resolved;
    if (filter === "resolved") return a.resolved;
    if (filter === "critical") return a.severity === "Critical" && !a.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
            Emergency & Anomaly Dispatch
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Crew Medical Alerts
          </h1>
          <p className="text-sm text-slate-400">
            Consolidated log of biometric anomalies and alert triggers across all assigned crew members.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stream
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === "all" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-[#051c14] text-slate-400 border border-white/5 hover:text-white"
          }`}
        >
          All Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setFilter("unresolved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === "unresolved" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-[#051c14] text-slate-400 border border-white/5 hover:text-white"
          }`}
        >
          Active Unresolved ({alerts.filter((a) => !a.resolved).length})
        </button>
        <button
          onClick={() => setFilter("critical")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === "critical" ? "bg-red-600/30 text-red-200 border border-red-500/50" : "bg-[#051c14] text-slate-400 border border-white/5 hover:text-white"
          }`}
        >
          Critical Only
        </button>
        <button
          onClick={() => setFilter("resolved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === "resolved" ? "bg-white/10 text-white border border-white/20" : "bg-[#051c14] text-slate-400 border border-white/5 hover:text-white"
          }`}
        >
          Resolved Archive ({alerts.filter((a) => a.resolved).length})
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="No Alerts" message="No alerts match the selected criteria." />
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const isCritical = alert.severity === "Critical";
            const isWarning = alert.severity === "Warning";
            const dateStr = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Just now";

            return (
              <div
                key={alert._id || alert.id}
                className={`p-5 rounded-2xl border transition-all ${
                  alert.resolved
                    ? "border-white/5 bg-[#051c14]/60 opacity-70"
                    : isCritical
                    ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-950/20"
                    : "border-amber-500/25 bg-[#051c14]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        alert.resolved
                          ? "bg-slate-800 text-slate-400"
                          : isCritical
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {alert.resolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {alert.astronautId}
                        </span>
                        <span className="text-sm font-bold text-white">{alert.type}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isCritical ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] text-slate-400 font-mono">{dateStr}</span>
                    <Link
                      href={`/medical/astronauts/${alert.astronautId}`}
                      className="p-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                      title="Inspect Patient"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
