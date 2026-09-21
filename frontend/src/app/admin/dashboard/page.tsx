"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSystemStatus, getAuditLogs } from "../../../lib/api";
import { LoadingState, ErrorState } from "../../../components/shared/LoadingState";
import {
  ShieldCheck,
  Users,
  Rocket,
  AlertTriangle,
  Server,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface AuditLog {
  _id?: string;
  id?: string;
  action: string;
  userEmail?: string;
  resource: string;
  resourceId?: string;
  createdAt?: string;
}

interface SystemStatus {
  users?: { total?: number; byRole?: Record<string, number> };
  missions?: { total?: number };
  alerts?: { unresolved?: number };
  system?: { nodeVersion?: string };
}

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, logsRes] = await Promise.all([
        getSystemStatus(),
        getAuditLogs({ limit: 6 }),
      ]);

      if (statusRes.success && statusRes.data) {
        setStatus(statusRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setRecentLogs((logsRes.data as { logs?: AuditLog[] }).logs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load administrative telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchData());
  }, []);

  if (loading) return <LoadingState message="Polling platform telemetry & security subsystems..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const usersCount = status?.users?.total ?? 8;
  const byRole = status?.users?.byRole || { astronaut: 4, medical_officer: 2, mission_control: 2, admin: 1 };
  const missionsCount = status?.missions?.total ?? 2;
  const activeAlerts = status?.alerts?.unresolved ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Central System Governance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Platform Administration Console
          </h1>
          <p className="text-sm text-slate-400">
            Enterprise user management, role boundaries, mission registries, and security auditing.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Telemetry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/5 bg-[#140e02] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{usersCount}</div>
          <div className="text-xs text-slate-400">4 Active Role Tiers</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#140e02] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Missions</span>
            <Rocket className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{missionsCount}</div>
          <div className="text-xs text-emerald-400">Active Flight Operations</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#140e02] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 font-mono">{activeAlerts}</div>
          <div className="text-xs text-slate-400">Across All Missions</div>
        </div>

        <div className="p-5 rounded-2xl border border-white/5 bg-[#140e02] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Core Status</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </div>
          <div className="text-xs text-slate-400 font-mono">Node {status?.system?.nodeVersion || "v20.x"}</div>
        </div>
      </div>

      {/* Role Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Role Distribution */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#140e02] space-y-4">
          <h3 className="text-base font-semibold text-white">Role Clearance Breakdown</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-blue-500/20 text-xs">
              <span className="text-blue-300 font-semibold">Astronauts</span>
              <span className="font-mono font-bold text-white">{byRole.astronaut} Accounts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-emerald-500/20 text-xs">
              <span className="text-emerald-300 font-semibold">Medical Officers</span>
              <span className="font-mono font-bold text-white">{byRole.medical_officer} Accounts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-purple-500/20 text-xs">
              <span className="text-purple-300 font-semibold">Mission Control</span>
              <span className="font-mono font-bold text-white">{byRole.mission_control} Accounts</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-amber-500/20 text-xs">
              <span className="text-amber-300 font-semibold">Administrators</span>
              <span className="font-mono font-bold text-white">{byRole.admin} Accounts</span>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            Manage User Permissions <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Audit Log Stream */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#140e02] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Security & Audit Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">Immutable tracking of administrative actions</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              All Logs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">No recent audit logs recorded.</div>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <div
                  key={log._id || log.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {log.action}
                    </span>
                    <span className="text-slate-300">{log.userEmail || "system"}</span>
                    <span className="text-slate-500 text-[11px] hidden sm:inline">
                      {log.resource} {log.resourceId ? `(${log.resourceId})` : ""}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "Recent"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
