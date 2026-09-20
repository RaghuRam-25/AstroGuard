"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getMyAlerts } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, Clock, RefreshCw } from "lucide-react";

export default function AstronautAlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const astronautId = user?.astronautId || "AST-001";

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAlerts(astronautId);
      if (res.success && res.data) {
        setAlerts(res.data.alerts || res.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [astronautId]);

  if (loading) return <LoadingState message="Fetching personalized biometric alert stream..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAlerts} />;

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-400">
            Biometric Security Monitoring
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Personal Alerts</h1>
          <p className="text-sm text-slate-400">
            Direct notifications and cautionary alerts registered for astronaut{" "}
            <span className="font-mono text-blue-400">{astronautId}</span>.
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary Chips */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 bg-[#071322] text-xs">
          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-slate-400">Active Unresolved:</span>
          <span className="font-bold text-white">{unresolvedAlerts.length}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/5 bg-[#071322] text-xs">
          <span className="h-2 w-2 rounded-full bg-slate-500" />
          <span className="text-slate-400">Resolved History:</span>
          <span className="font-bold text-white">{resolvedAlerts.length}</span>
        </div>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <EmptyState
          title="No Active Alerts"
          message="Telemetry systems report all your physiological vitals are well within nominal parameters."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => {
            const isCritical = alert.severity === "Critical";
            const isWarning = alert.severity === "Warning";
            const dateStr = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Just now";

            return (
              <div
                key={alert._id || alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.resolved
                    ? "border-white/5 bg-white/[0.01] opacity-70"
                    : isCritical
                    ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-950/30"
                    : isWarning
                    ? "border-amber-500/30 bg-amber-950/15"
                    : "border-blue-500/20 bg-[#071322]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        alert.resolved
                          ? "bg-slate-800 text-slate-400"
                          : isCritical
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {alert.resolved ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{alert.type || "Anomaly Alert"}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            alert.resolved
                              ? "bg-slate-800 text-slate-400"
                              : isCritical
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {alert.severity || "Warning"}
                        </span>
                        {alert.resolved && (
                          <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
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
