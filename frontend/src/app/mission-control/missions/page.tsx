"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAssignedMissions } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Rocket, ChevronRight, RefreshCw } from "lucide-react";

interface Mission {
  _id?: string;
  missionId?: string;
  name: string;
  status?: string;
  missionDay?: number;
  astronautIds?: string[];
}

export default function MissionControlMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAssignedMissions();
      if (res.success && res.data) {
        setMissions((res.data as { missions?: Mission[] }).missions || []);
      } else {
        setError(res.message || "Failed to load missions.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchMissions());
  }, []);

  if (loading) return <LoadingState message="Accessing active spaceflight registry..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMissions} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">
            Spaceflight Operations Registry
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Active Spaceflight Missions
          </h1>
          <p className="text-sm text-slate-400">
            Missions assigned to your Mission Control operational console.
          </p>
        </div>
        <button
          onClick={fetchMissions}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/10 text-xs font-medium text-purple-300 hover:bg-purple-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {missions.length === 0 ? (
        <EmptyState title="No Missions Assigned" message="No spaceflight missions are currently assigned to your console." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {missions.map((mission) => {
            const mId = mission.missionId || mission.name;
            const crewCount = mission.astronautIds?.length || 4;

            return (
              <div
                key={mission._id || mId}
                className="p-6 rounded-2xl border border-white/5 bg-[#0e061c] hover:border-purple-500/30 transition-all space-y-4 shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{mission.name}</h3>
                      <span className="text-xs font-mono text-purple-300">{mission.missionId || "ARES-01"}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {mission.status || "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-xl bg-black/30 border border-white/5 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Flight Day</span>
                    <span className="font-mono font-bold text-white">Day {mission.missionDay || 45}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Crew Size</span>
                    <span className="font-mono font-bold text-purple-300">{crewCount} Crew</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Comms Status</span>
                    <span className="font-mono font-bold text-emerald-400">Online</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-slate-500">Deep Space Network Locked</span>
                  <Link
                    href={`/mission-control/missions/${encodeURIComponent(mId)}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Enter Mission Console
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
