"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import { getMedicalCrew, getAllMedicalAlerts } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import {
  Users,
  ShieldAlert,
  HeartPulse,
  Activity,
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function MedicalDashboardPage() {
  const { user } = useAuth();
  const [crew, setCrew] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [crewRes, alertsRes] = await Promise.all([
        getMedicalCrew(),
        getAllMedicalAlerts(),
      ]);

      if (crewRes.success && crewRes.data) {
        setCrew(crewRes.data.crew || []);
      }
      if (alertsRes.success && alertsRes.data) {
        setAlerts(alertsRes.data || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load medical dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState message="Connecting to crew clinical bio-telemetry..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Filter crew
  const filteredCrew = crew.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.astronautId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const risk = member.latestAnalysis?.riskLevel || "Low";
    const matchesRisk =
      selectedRiskFilter === "all" ||
      (selectedRiskFilter === "critical" && (risk === "Critical" || risk === "Warning")) ||
      (selectedRiskFilter === "watch" && risk === "Watch") ||
      (selectedRiskFilter === "normal" && (risk === "Low" || risk === "Normal"));

    return matchesSearch && matchesRisk;
  });

  const totalCrew = crew.length;
  const criticalCount = crew.filter(
    (c) => c.latestAnalysis?.riskLevel === "Critical" || c.latestAnalysis?.riskLevel === "Warning"
  ).length;
  const watchCount = crew.filter((c) => c.latestAnalysis?.riskLevel === "Watch").length;
  const nominalCount = totalCrew - criticalCount - watchCount;
  const activeAlerts = alerts.filter((a) => !a.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
            <Stethoscope className="w-3.5 h-3.5" />
            Clinical Health Monitoring
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Medical Control Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time physiological surveillance for assigned flight crew ({user?.name || "Medical Officer"}).
          </p>
        </div>
        <button
          onClick={fetchData}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Clinical Data
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/5 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Roster</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-white font-mono">{totalCrew}</div>
          <div className="text-xs text-emerald-400">All crew members tracked</div>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Nominal Vitals</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 font-mono">{nominalCount}</div>
          <div className="text-xs text-slate-400">Normal baselines</div>
        </div>

        <div className="p-5 rounded-2xl border border-amber-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Watch Status</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 font-mono">{watchCount}</div>
          <div className="text-xs text-slate-400">Elevated monitoring</div>
        </div>

        <div className="p-5 rounded-2xl border border-red-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical / Alerts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 font-mono">{activeAlerts}</div>
          <div className="text-xs text-red-300">Requires medical triage</div>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="rounded-2xl border border-white/5 bg-[#051c14] overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Assigned Flight Crew Telemetry</h2>
            <p className="text-xs text-slate-400 mt-0.5">Continuous clinical biometric streams and anomaly evaluations</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search astronaut ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none w-56"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/40 p-1 text-xs">
              <button
                onClick={() => setSelectedRiskFilter("all")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedRiskFilter === "all" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRiskFilter("critical")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedRiskFilter === "critical" ? "bg-red-500/20 text-red-300 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                High Risk
              </button>
              <button
                onClick={() => setSelectedRiskFilter("watch")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedRiskFilter === "watch" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Watch
              </button>
              <button
                onClick={() => setSelectedRiskFilter("normal")}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  selectedRiskFilter === "normal" ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Nominal
              </button>
            </div>
          </div>
        </div>

        {filteredCrew.length === 0 ? (
          <EmptyState
            title="No Astronauts Found"
            message="No assigned astronauts match the current filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Astronaut</th>
                  <th className="px-4 py-3">Mission Role</th>
                  <th className="px-4 py-3">Heart Rate</th>
                  <th className="px-4 py-3">SpO₂</th>
                  <th className="px-4 py-3">Sleep</th>
                  <th className="px-4 py-3">AI Risk Status</th>
                  <th className="px-4 py-3">Alerts</th>
                  <th className="px-4 py-3 text-right">Clinical Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredCrew.map((member) => {
                  const risk = member.latestAnalysis?.riskLevel || "Low";
                  const score = member.latestAnalysis?.anomalyScore != null
                    ? `${Math.round(member.latestAnalysis.anomalyScore * 100)}%`
                    : "Nominal";
                  const isHighRisk = risk === "Critical" || risk === "Warning";
                  const isWatch = risk === "Watch";

                  return (
                    <tr key={member.astronautId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                            {member.astronautId.slice(-3)}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{member.name}</span>
                            <span className="font-mono text-[11px] text-slate-400">{member.astronautId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{member.role || "Specialist"}</td>
                      <td className="px-4 py-3 font-mono">
                        {member.latestHealth ? (
                          <span className={member.latestHealth.heartRate > 100 || member.latestHealth.heartRate < 55 ? "text-red-400 font-bold" : "text-white"}>
                            {member.latestHealth.heartRate} BPM
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {member.latestHealth ? (
                          <span className={member.latestHealth.spo2 < 95 ? "text-amber-400 font-bold" : "text-cyan-300"}>
                            {member.latestHealth.spo2}%
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {member.latestHealth ? `${member.latestHealth.sleep}h` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isHighRisk
                              ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : isWatch
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isHighRisk ? "bg-red-400 animate-pulse" : isWatch ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                          {risk} ({score})
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {member.unresolvedAlerts > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono font-bold text-[11px]">
                            {member.unresolvedAlerts} Active
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/medical/astronauts/${member.astronautId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-white transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Patient
                        </Link>
                      </td>
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
