"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getMyHealth, getMyLatestHealth } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Heart, Droplet, Moon, Activity, Calendar, Clock, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function AstronautHealthPage() {
  const { user } = useAuth();
  const [healthLogs, setHealthLogs] = useState<any[]>([]);
  const [latestVitals, setLatestVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const astronautId = user?.astronautId || "AST-001";

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, latestRes] = await Promise.all([
        getMyHealth(astronautId, { limit: 30 }),
        getMyLatestHealth(astronautId),
      ]);

      if (historyRes.success && historyRes.data) {
        setHealthLogs(historyRes.data.healthData || historyRes.data || []);
      }
      if (latestRes.success && latestRes.data) {
        setLatestVitals(latestRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load telemetry data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [astronautId]);

  if (loading) return <LoadingState message="Connecting to biometric telemetry stream..." />;
  if (error) return <ErrorState message={error} onRetry={fetchHealthData} />;

  const hr = latestVitals?.heartRate ?? 74;
  const spo2 = latestVitals?.spo2 ?? 98;
  const sleep = latestVitals?.sleep ?? 7.2;
  const act = latestVitals?.activity ?? 75;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-400">
            Personal Telemetry Stream
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Biometric Telemetry History</h1>
          <p className="text-sm text-slate-400">
            Real-time sensory tracking and recorded telemetry for astronaut{" "}
            <span className="font-mono text-blue-400">{astronautId}</span>.
          </p>
        </div>
        <button
          onClick={fetchHealthData}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stream
        </button>
      </div>

      {/* Real-time Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-red-500/20 bg-[#071322] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Heart Rate</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{hr}</span>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
          <div className="text-[11px] text-slate-400">Target Range: 60 - 100 BPM</div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#071322] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Blood Oxygen (SpO₂)</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{spo2}%</span>
            <span className="text-xs text-slate-400">Sat</span>
          </div>
          <div className="text-[11px] text-slate-400">Target: &gt; 95%</div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#071322] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Sleep Duration</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{sleep}</span>
            <span className="text-xs text-slate-400">Hours</span>
          </div>
          <div className="text-[11px] text-slate-400">Rest Requirement: 7.0 - 8.5 hrs</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-[#071322] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Activity Level</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{act}%</span>
            <span className="text-xs text-slate-400">Index</span>
          </div>
          <div className="text-[11px] text-slate-400">EVA & Exercise Protocol</div>
        </div>
      </div>

      {/* Telemetry Log Table */}
      <div className="rounded-xl border border-white/5 bg-[#071322] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Recorded Telemetry Logs</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sequential records transmitted from onboard telemetry pack</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{healthLogs.length} Records</span>
        </div>

        {healthLogs.length === 0 ? (
          <EmptyState
            title="No Telemetry Records"
            message="No historical health logs have been registered for this astronaut."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] text-slate-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">SpO₂</th>
                  <th className="px-4 py-3">Sleep</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Transmission Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {healthLogs.map((log: any, idx: number) => {
                  const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : "Live Stream";
                  return (
                    <tr key={log._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-400">{dateStr}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${log.heartRate > 100 || log.heartRate < 55 ? "text-red-400" : "text-white"}`}>
                          {log.heartRate} BPM
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${log.spo2 < 95 ? "text-amber-400" : "text-cyan-300"}`}>
                          {log.spo2}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white">{log.sleep} hrs</td>
                      <td className="px-4 py-3 text-white">{log.activity}%</td>
                      <td className="px-4 py-3 text-slate-400 font-sans">{log.source || "Suit Sensor v3.2"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
