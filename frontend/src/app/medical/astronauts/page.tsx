"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMedicalCrew } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Users, Search, Eye, Activity, Heart, Droplet, Moon, RefreshCw, ChevronRight } from "lucide-react";

export default function MedicalAstronautsPage() {
  const [crew, setCrew] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchCrew = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMedicalCrew();
      if (res.success && res.data) {
        setCrew(res.data.crew || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load astronaut roster.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrew();
  }, []);

  if (loading) return <LoadingState message="Retrieving clinical medical records..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCrew} />;

  const filtered = crew.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.astronautId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
            Clinical Patient Roster
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Assigned Astronaut Records
          </h1>
          <p className="text-sm text-slate-400">
            Comprehensive directory of astronauts under direct medical officer supervision.
          </p>
        </div>
        <button
          onClick={fetchCrew}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Roster
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Filter by name or callsig ID (e.g. AST-001)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-[#051c14] text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Grid of Astronaut Patient Cards */}
      {filtered.length === 0 ? (
        <EmptyState title="No Records" message="No astronauts found matching your search." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filtered.map((member) => {
            const risk = member.latestAnalysis?.riskLevel || "Low";
            const isHighRisk = risk === "Critical" || risk === "Warning";
            const isWatch = risk === "Watch";

            return (
              <div
                key={member.astronautId}
                className="p-6 rounded-2xl border border-white/5 bg-[#051c14] space-y-5 hover:border-emerald-500/30 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                      {member.astronautId}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{member.name}</h3>
                      <span className="text-xs text-slate-400">
                        {member.role || "Flight Specialist"} • {member.mission || "Ares Mission 01"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      isHighRisk
                        ? "bg-red-500/20 text-red-300 border-red-500/30"
                        : isWatch
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {risk} Risk
                  </span>
                </div>

                {/* Vitals summary */}
                <div className="grid grid-cols-4 gap-2 py-3 px-4 rounded-xl bg-black/30 border border-white/5 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">HR</span>
                    <span className="font-mono text-xs font-bold text-white">
                      {member.latestHealth?.heartRate ?? 72}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SpO₂</span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {member.latestHealth?.spo2 ?? 98}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Sleep</span>
                    <span className="font-mono text-xs font-bold text-indigo-300">
                      {member.latestHealth?.sleep ?? 7.2}h
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Activity</span>
                    <span className="font-mono text-xs font-bold text-emerald-300">
                      {member.latestHealth?.activity ?? 65}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="text-xs text-slate-400">
                    Active Alerts:{" "}
                    <span className={member.unresolvedAlerts > 0 ? "font-bold text-red-400" : "font-mono text-slate-400"}>
                      {member.unresolvedAlerts}
                    </span>
                  </div>

                  <Link
                    href={`/medical/astronauts/${member.astronautId}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Clinical Details
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
