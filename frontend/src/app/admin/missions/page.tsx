"use client";

import { useEffect, useState } from "react";
import { getAdminMissions, createAdminMission } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import { Rocket, Plus, X, RefreshCw } from "lucide-react";

interface Mission {
  _id?: string;
  missionId: string;
  name: string;
  status?: string;
  missionDay?: number;
  astronautIds?: string[];
}

export default function AdminMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [newMission, setNewMission] = useState({
    missionId: "",
    name: "",
    status: "Active",
    missionDay: 1,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminMissions();
      if (res.success && res.data) {
        const data = res.data as { missions?: Mission[] } | Mission[];
        setMissions(Array.isArray(data) ? data : data.missions || []);
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

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createAdminMission(newMission);
      if (res.success) {
        setModalOpen(false);
        setNewMission({ missionId: "", name: "", status: "Active", missionDay: 1 });
        await fetchMissions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Connecting to spaceflight mission registry..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMissions} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
            Operations Planning
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Mission Fleet Management
          </h1>
          <p className="text-sm text-slate-400">
            Define spaceflight missions, designate crew assignments, and track mission milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Mission
          </button>
          <button
            onClick={fetchMissions}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {missions.length === 0 ? (
        <EmptyState title="No Missions Defined" message="Create your first spaceflight mission to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m) => (
            <div
              key={m._id || m.missionId}
              className="p-6 rounded-2xl border border-white/5 bg-[#140e02] space-y-4 shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{m.name}</h3>
                    <span className="font-mono text-xs text-amber-300">{m.missionId}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {m.status || "Active"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2.5 px-3.5 rounded-xl bg-black/30 border border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Flight Day</span>
                  <span className="font-mono text-white font-bold">Day {m.missionDay || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Crew Assigned</span>
                  <span className="font-mono text-amber-300 font-bold">{m.astronautIds?.length || 4} Astronauts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#150f02] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" />
                Define New Mission
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMission} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Mission Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARTEMIS-03"
                  value={newMission.missionId}
                  onChange={(e) => setNewMission({ ...newMission, missionId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Mission Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artemis Lunar Base Delta"
                  value={newMission.name}
                  onChange={(e) => setNewMission({ ...newMission, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Current Mission Day</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newMission.missionDay}
                  onChange={(e) => setNewMission({ ...newMission, missionDay: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Mission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
