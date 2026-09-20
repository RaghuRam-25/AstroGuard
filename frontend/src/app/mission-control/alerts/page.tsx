"use client";

import { useEffect, useState } from "react";
import { getAssignedMissions, getMissionAlerts } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

export default function MissionControlAlertsPage() {
  const [missions, setMissions] = useState<any[]>([]);
  const [selectedMission, setSelectedMission] = useState<string>("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const mRes = await getAssignedMissions();
      if (mRes.success && mRes.data) {
        const mList = mRes.data.missions || [];
        setMissions(mList);
        const mId = selectedMission || mList[0]?.missionId || mList[0]?.name || "ARES-01";
        setSelectedMission(mId);

        const aRes = await getMissionAlerts(mId);
        if (aRes.success && aRes.data) {
          setAlerts(aRes.data.alerts || aRes.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load mission alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleSelectMission = async (id: string) => {
    setSelectedMission(id);
    setLoading(true);
    try {
      const aRes = await getMissionAlerts(id);
      if (aRes.success && aRes.data) {
        setAlerts(aRes.data.alerts || aRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Querying flight anomaly telemetry logs..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAlerts} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">
            Operational Anomaly Watch
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mission Flight Alerts
          </h1>
          <p className="text-sm text-slate-400">
            Real-time warnings, EVA alarms, and crew biometric deviations.
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
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="Flight Systems Nominal" message="No operational alerts active for this mission." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a: any) => {
            const isCritical = a.severity === "Critical";
            return (
              <div
                key={a._id || a.id}
                className={`p-5 rounded-2xl border transition-all ${
                  a.resolved
                    ? "border-white/5 bg-[#0e061c]/50 opacity-60"
                    : isCritical
                    ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-950/30"
                    : "border-amber-500/25 bg-[#0e061c]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        a.resolved ? "bg-slate-800 text-slate-400" : isCritical ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {a.resolved ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                          {a.astronautId}
                        </span>
                        <span className="text-sm font-bold text-white">{a.type}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isCritical ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {a.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{a.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : "Live"}</span>
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
