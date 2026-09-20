"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAstronautHealth } from "../../../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../../../components/shared/LoadingState";
import { ArrowLeft, RefreshCw, Activity, Calendar } from "lucide-react";

export default function MedicalAstronautHealthPage() {
  const params = useParams();
  const astronautId = params?.id as string;

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!astronautId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAstronautHealth(astronautId, { limit: 50 });
      if (res.success && res.data) {
        setRecords(res.data.records || []);
      } else {
        setError(res.message || "Failed to load telemetry history.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [astronautId]);

  if (loading) return <LoadingState message={`Fetching telemetry logs for ${astronautId}...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchRecords} />;

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
              Biometric Telemetry Archive
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              Historical Vital Records ({astronautId})
            </h1>
            <p className="text-sm text-slate-400">
              Audit log of sensor transmissions, vitals, and physiological deviations.
            </p>
          </div>
          <button
            onClick={fetchRecords}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <EmptyState title="No Records" message="No telemetry records found for this astronaut." />
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#051c14] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">Oxygen (SpO₂)</th>
                  <th className="px-4 py-3">Sleep</th>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Telemetry Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {records.map((log: any, idx: number) => (
                  <tr key={log._id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {log.createdAt || log.timestamp ? new Date(log.createdAt || log.timestamp).toLocaleString() : "Live"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={log.heartRate > 100 || log.heartRate < 55 ? "text-red-400 font-bold" : "text-white"}>
                        {log.heartRate} BPM
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={log.spo2 < 95 ? "text-amber-400 font-bold" : "text-cyan-300"}>
                        {log.spo2}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{log.sleep} hrs</td>
                    <td className="px-4 py-3 text-white">{log.activity}%</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">{log.source || "Suit Sensor"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
