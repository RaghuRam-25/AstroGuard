"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAstronautAlerts } from "../../../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../../../components/shared/LoadingState";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

interface MedicalAlert {
  _id?: string;
  id?: string;
  astronautId: string;
  type: string;
  message: string;
  severity: string;
  resolved?: boolean;
  createdAt?: string;
}

export default function MedicalAstronautAlertsPage() {
  const params = useParams();
  const astronautId = params?.id as string;

  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!astronautId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAstronautAlerts(astronautId);
      if (res.success && res.data) {
        setAlerts((res.data || []) as MedicalAlert[]);
      } else {
        setError(res.message || "Failed to load clinical alerts.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [astronautId]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchAlerts());
  }, [astronautId, fetchAlerts]);

  if (loading) return <LoadingState message={`Reviewing alert history for ${astronautId}...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchAlerts} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href={`/medical/astronauts/${astronautId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
              Patient Alert Archive
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Physiological Alerts ({astronautId})
            </h1>
            <p className="text-sm text-slate-400">
              Active warnings, thresholds crossed, and resolved anomalies.
            </p>
          </div>
          <button
            onClick={fetchAlerts}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="No Active Alerts" message="No alerts registered for this astronaut." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = alert.severity === "Critical";
            const dateStr = alert.createdAt ? new Date(alert.createdAt).toLocaleString() : "Just now";

            return (
              <div
                key={alert._id || alert.id}
                className={`p-4 rounded-xl border ${
                  alert.resolved
                    ? "border-white/5 bg-[#051c14]/50 opacity-70"
                    : isCritical
                    ? "border-red-500/30 bg-red-950/20"
                    : "border-amber-500/20 bg-amber-950/15"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        alert.resolved
                          ? "bg-slate-800 text-slate-400"
                          : isCritical
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {alert.resolved ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{alert.type}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCritical ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.resolved && (
                          <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono shrink-0">
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
