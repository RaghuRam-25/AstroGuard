"use client";

import { useEffect, useState } from "react";
import { getAuditLogs } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { RefreshCw } from "lucide-react";

interface AuditLog {
  _id?: string;
  action: string;
  userEmail?: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt?: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuditLogs({ limit: 100 });
      if (res.success && res.data) {
        setLogs((res.data as { logs?: AuditLog[] }).logs || []);
      } else {
        setError(res.message || "Failed to load audit logs.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchLogs());
  }, []);

  if (loading) return <LoadingState message="Accessing cryptographically sealed audit trail..." />;
  if (error) return <ErrorState message={error} onRetry={fetchLogs} />;

  const filtered = logs.filter(
    (l) => actionFilter === "all" || l.action.toLowerCase().includes(actionFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
            Compliance & Verification
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            System Security Audit Trail
          </h1>
          <p className="text-sm text-slate-400">
            Immutable log of administrative events, privilege changes, and operational dispatch commands.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Audit Records" message="No audit logs currently recorded in the database." />
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#140e02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Action Code</th>
                  <th className="px-4 py-3.5">Actor Identity</th>
                  <th className="px-4 py-3.5">Target Resource</th>
                  <th className="px-4 py-3.5">Network IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {filtered.map((log, idx) => {
                  const dateStr = log.createdAt ? new Date(log.createdAt).toLocaleString() : "Just now";
                  return (
                    <tr key={log._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-slate-500">{dateStr}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white font-sans">{log.userEmail || "System Daemon"}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {log.resource} {log.resourceId ? `(${log.resourceId})` : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{log.ipAddress || "127.0.0.1"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
