"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Search, RefreshCw } from "lucide-react";

interface Astronaut {
  _id?: string;
  astronautId: string;
  name: string;
  role?: string;
  status?: string;
  mission?: string;
  missionDay?: number;
  missionPhase?: string;
}

export default function AdminAstronautsPage() {
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchAstronauts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest("/api/astronauts");
      if (res.success && res.data) {
        const data = res.data as { astronauts?: Astronaut[] } | Astronaut[];
        setAstronauts(Array.isArray(data) ? data : data.astronauts || []);
      } else {
        setError(res.message || "Failed to load astronauts.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchAstronauts());
  }, []);

  if (loading) return <LoadingState message="Loading astronaut personnel master list..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAstronauts} />;

  const filtered = astronauts.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.astronautId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
            Crew Master Registry
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Active Astronaut Personnel
          </h1>
          <p className="text-sm text-slate-400">
            Platform-wide roster of flight crew subjects across all active missions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search astronauts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/10 bg-[#140e02] text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchAstronauts}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No Astronauts Found" message="No astronauts registered in the database." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filtered.map((ast) => (
            <div
              key={ast._id || ast.astronautId}
              className="p-5 rounded-2xl border border-white/5 bg-[#140e02] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-mono font-bold text-amber-300 text-xs">
                    {ast.astronautId}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{ast.name}</h3>
                    <span className="text-xs text-slate-400">{ast.role}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {ast.status || "Active"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-black/30 border border-white/5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Mission</span>
                  <span className="font-semibold text-slate-300">{ast.mission || "Ares 01"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Flight Day</span>
                  <span className="font-mono text-white">Day {ast.missionDay || 45}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Phase</span>
                  <span className="text-amber-300">{ast.missionPhase || "Transit"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
