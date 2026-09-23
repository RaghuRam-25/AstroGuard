"use client";

import { useEffect, useState } from "react";
import {
  Rocket,
  Users,
  UserCheck,
  CircleCheckBig,
  Plus,
  X,
  Clock,
  Flag,
  Orbit,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  Types & Mock State — standalone demo, no backend required.
// ─────────────────────────────────────────────────────────────

type RiskLevel = "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";

type MissionStatus = "In Progress" | "Pending Assignment" | "Completed";

interface Mission {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  duration: string;
  status: MissionStatus;
  assignedAstronautIds: string[];
}

interface CrewMember {
  name: string;
  online: boolean;
}

const CREW: Record<string, CrewMember> = {
  "AST-001": { name: "Maya Chen", online: true },
  "AST-002": { name: "Leo Park", online: true },
  "AST-003": { name: "Amara Okafor", online: false },
  "AST-004": { name: "Nikolai Volkov", online: true },
  "AST-005": { name: "Priya Nair", online: true },
  "AST-006": { name: "Jonas Weber", online: false },
};

const INITIAL_MISSIONS: Mission[] = [
  {
    id: "M-001",
    title: "EVA Space Walk & Solar Panel Maintenance",
    riskLevel: "MEDIUM RISK",
    duration: "6h 30m",
    status: "In Progress",
    assignedAstronautIds: ["AST-001", "AST-002"],
  },
  {
    id: "M-002",
    title: "Bio-Lab Botanical Experiment #4",
    riskLevel: "LOW RISK",
    duration: "24h 00m",
    status: "Pending Assignment",
    assignedAstronautIds: [],
  },
  {
    id: "M-003",
    title: "Life Support Filter Replacement",
    riskLevel: "HIGH RISK",
    duration: "3h 15m",
    status: "Pending Assignment",
    assignedAstronautIds: ["AST-004"],
  },
  {
    id: "M-004",
    title: "Orbital Navigation Calibration",
    riskLevel: "LOW RISK",
    duration: "8h 00m",
    status: "Completed",
    assignedAstronautIds: ["AST-005"],
  },
];

const riskLevelStyles: Record<RiskLevel, string> = {
  "LOW RISK": "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  "MEDIUM RISK": "border-amber-400/40 bg-amber-500/15 text-amber-200",
  "HIGH RISK": "border-rose-400/40 bg-rose-500/15 text-rose-200",
};

const statusStyles: Record<MissionStatus, string> = {
  "In Progress": "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  "Pending Assignment": "border-amber-400/40 bg-amber-500/15 text-amber-200",
  Completed: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter((word) => word.length > 1)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MissionCardGrid() {
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    riskLevel: "LOW RISK" as RiskLevel,
    duration: "",
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleCreateMission = () => {
    if (!newMission.title.trim()) return;
    const id = `M-${String(missions.length + 1).padStart(3, "0")}`;
    const mission: Mission = {
      id,
      title: newMission.title.trim(),
      riskLevel: newMission.riskLevel,
      duration: newMission.duration.trim() || "TBD",
      status: "Pending Assignment",
      assignedAstronautIds: [],
    };
    setMissions((prev) => [...prev, mission]);
    setShowCreationModal(false);
    setNewMission({ title: "", riskLevel: "LOW RISK", duration: "" });
    setToast(`Mission ${mission.title} created successfully.`);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header row + create button */}
      <div className="flex flex-col justify-between gap-3 border-b border-cyan-400/10 pb-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
            <Rocket className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-bold text-white">Mission Control Cards</h2>
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
            {missions.filter((m) => m.status !== "Completed").length} OPERATIONAL
          </span>
        </div>
        <button
          onClick={() => setShowCreationModal(true)}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold text-emerald-300 transition hover:border-emerald-400/60 hover:bg-emerald-500/20"
        >
          <Plus className="h-4 w-4" /> Create New Mission
        </button>
      </div>

      {/* Mission cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {missions.map((mission, index) => (
          <MissionCard key={mission.id} mission={mission} index={index} />
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-[#0a1f1a]/95 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <CircleCheckBig className="h-4 w-4 shrink-0 text-emerald-300" />
          {toast}
        </div>
      )}

      {/* Create New Mission modal */}
      {showCreationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-[#0a141f] p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Plus className="h-4 w-4 text-cyan-300" /> Create New Mission
              </h3>
              <button
                onClick={() => setShowCreationModal(false)}
                aria-label="Close mission modal"
                className="rounded-lg border border-white/10 bg-black/30 p-1.5 text-slate-400 transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Mission Title
                </span>
                <input
                  value={newMission.title}
                  onChange={(event) => setNewMission((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="e.g. EVA Space Walk & Solar Panel Maintenance"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Risk Level
                </span>
                <select
                  value={newMission.riskLevel}
                  onChange={(event) =>
                    setNewMission((prev) => ({ ...prev, riskLevel: event.target.value as RiskLevel }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
                >
                  <option>LOW RISK</option>
                  <option>MEDIUM RISK</option>
                  <option>HIGH RISK</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Duration
                </span>
                <input
                  value={newMission.duration}
                  onChange={(event) => setNewMission((prev) => ({ ...prev, duration: event.target.value }))}
                  placeholder="e.g. 6h 30m"
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreationModal(false)}
                className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-[11px] font-semibold text-slate-400 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMission}
                disabled={!newMission.title.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-[11px] font-black text-[#03142c] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CircleCheckBig className="h-3.5 w-3.5" /> Create Mission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mission card ────────────────────────────────────────────

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const crew = mission.assignedAstronautIds
    .map((id) => ({ id, ...CREW[id] }))
    .filter((entry) => entry.name);
  const base =
    index === 0 ? "border-l-cyan-400/70" : index === 1 ? "border-l-emerald-400/70" : "border-l-violet-400/60";
  const r = Math.floor(6 * 182 + 137 * index) % 181;
  const g = Math.floor(6 * 212 + 107 * index) % 200;
  const b = Math.floor(4 * 212 + 91 * index) % 256;

  return (
    <article
      className={`animate-fade-in-up relative overflow-hidden rounded-2xl border border-white/10 border-l-2 bg-[#0a141f]/90 p-4 ${base} transition hover:border-cyan-400/30`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(${r}, ${g}, ${b}, 0.06), transparent 55%)`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
            <Rocket className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-black leading-tight text-white">{mission.title}</h3>
            <span className="font-mono text-[10px] text-cyan-300/70">{mission.id}</span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 font-mono text-[9px] font-black tracking-wider ${statusStyles[mission.status]}`}
        >
          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle" />
          {mission.status.toUpperCase()}
        </span>
      </div>

      <span
        className={`mt-3 inline-block rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${riskLevelStyles[mission.riskLevel]}`}
      >
        {mission.riskLevel}
      </span>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
          <Clock className="h-3 w-3 text-cyan-300" /> {mission.duration}
        </span>
        {crew.length > 0 ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
            <Users className="h-3 w-3 text-emerald-300" /> {crew.length} assigned
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 font-bold text-amber-300">
            <Flag className="h-3 w-3" /> Pending crew
          </span>
        )}
      </div>

      {crew.length > 0 ? (
        <div className="mt-3 border-t border-white/5 pt-3">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
            <UserCheck className="h-3 w-3 text-cyan-300" /> Assigned Crew
          </p>
          <div className="flex -space-x-2">
            {crew.map(({ id, name, online }) => (
              <span
                key={id}
                title={name}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a141f] font-mono text-[9px] font-black transition hover:z-10 ${
                  online
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                    : "border-slate-400/30 bg-slate-500/20 text-slate-300"
                }`}
              >
                {initials(name)}
              </span>
            ))}
            {crew.length > 3 && (
              <span
                aria-hidden
                className="z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#0a141f] bg-slate-800 font-mono text-[9px] font-black text-slate-300"
              >
                +{crew.length - 3}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-amber-400/25 bg-amber-500/5 px-3 py-2.5 text-[11px] text-amber-200/80">
          <Orbit className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          No crew deployed yet — assign one from the Astronaut Matrix.
        </div>
      )}
    </article>
  );
}