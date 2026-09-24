"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Rocket,
  Target,
  Users,
  UserCheck,
  ShieldAlert,
  CircleCheckBig,
  ArrowRightLeft,
  TriangleAlert,
  Plus,
  X,
  Stethoscope,
  Radio,
  Orbit,
  Clock,
  Flag,
  CircleDot,
} from "lucide-react";
import {
  assignMissionControlDoctor,
  assignMissionControlMission,
  createMission,
  getAssignedMissions,
  getMissionControlDashboard,
} from "@/lib/api";

export type RiskLevel = "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";

export type MissionStatus = "In Progress" | "Pending Assignment" | "Completed";

export interface Mission {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  duration: string;
  status: MissionStatus;
  assignedAstronautIds: string[];
}

export interface Astronaut {
  id: string;
  name: string;
  avatar?: string;
  assignedDoctorId: string | null;
  assignedMissionId: string | null;
  online: boolean;
  status: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  onDuty: boolean;
  facility: string;
  shift: "Day" | "Night" | "Rotational";
  yearsExperience: number;
}

export interface Alert {
  id: string;
  astronautId: string;
  severity: "CRITICAL" | "WARNING";
  message: string;
  timestamp: string;
  assignedDoctorId: string | null;
  assignedDoctorName: string | null;
}

interface DashboardPayload {
  astronauts?: Array<{
    astronautId: string;
    name: string;
    avatar?: string;
    assignedDoctorId?: string | null;
    mission?: string;
    online?: boolean;
    status?: string;
    unresolvedAlerts?: number;
  }>;
  doctors?: Array<{
    id: string;
    name: string;
    email?: string;
    isActive?: boolean;
    assignedCount?: number;
  }>;
  alerts?: Array<{
    id: string;
    astronautId: string;
    severity: string;
    title?: string;
    description?: string;
    createdAt?: string;
    assignedDoctorName?: string | null;
  }>;
}

const severityStyles: Record<Alert["severity"], { badge: string; dot: string; bar: string }> = {
  CRITICAL: {
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    dot: "bg-rose-400",
    bar: "from-rose-400/70 via-rose-400/25 to-transparent",
  },
  WARNING: {
    badge: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    dot: "bg-amber-400",
    bar: "from-amber-400/70 via-amber-400/25 to-transparent",
  },
};

function initials(name: string): string {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(" ")
    .filter((word) => word.length > 1)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function doctorShortName(name: string): string {
  return name.split(" ").slice(0, 2).join(" ");
}

function normalizeMissionStatus(status?: string): MissionStatus {
  if (status === "Completed") return "Completed";
  if (status === "Active") return "In Progress";
  return "Pending Assignment";
}

function normalizeRiskLevel(status?: string): RiskLevel {
  if (status === "Aborted") return "HIGH RISK";
  if (status === "Active") return "MEDIUM RISK";
  return "LOW RISK";
}

function relativeTime(value?: string): string {
  if (!value) return "Just now";
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff) || diff < 60_000) return "Just now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function MissionControlDashboard() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [newMission, setNewMission] = useState({
    title: "",
    riskLevel: "LOW RISK" as RiskLevel,
    duration: "",
    status: "Pending Assignment" as MissionStatus,
  });

  const [doctorDrafts, setDoctorDrafts] = useState<Record<string, string>>({});
  const [missionDrafts, setMissionDrafts] = useState<Record<string, string>>({});
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "CRITICAL" | "WARNING">("ALL");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [dashboardRes, missionsRes] = await Promise.all([getMissionControlDashboard(), getAssignedMissions()]);

    if (!dashboardRes.success) {
      setLoadError(dashboardRes.message || "Mission Control dashboard could not be loaded.");
      setLoading(false);
      return;
    }

    const dashboard = (dashboardRes.data || {}) as DashboardPayload;
    const missionRows = ((missionsRes.data as { missions?: Array<Record<string, unknown>> } | undefined)?.missions || []).map((mission) => {
      const name = String(mission.name || mission.missionId || "Unnamed Mission");
      const id = String(mission.missionId || mission.name || name);
      return {
        id,
        title: name,
        riskLevel: normalizeRiskLevel(String(mission.status || "")),
        duration: mission.startDate ? `Started ${new Date(String(mission.startDate)).toLocaleDateString()}` : "TBD",
        status: normalizeMissionStatus(String(mission.status || "")),
        assignedAstronautIds: Array.isArray(mission.astronautIds) ? mission.astronautIds.map(String) : [],
      };
    });

    setMissions(missionRows);
    setAstronauts((dashboard.astronauts || []).map((item) => {
      const matchingMission = missionRows.find((mission) => mission.title === item.mission || mission.id === item.mission);
      return {
        id: item.astronautId,
        name: item.name,
        avatar: item.avatar,
        assignedDoctorId: item.assignedDoctorId || null,
        assignedMissionId: matchingMission?.id || item.mission || null,
        online: Boolean(item.online),
        status: item.status || "Registered",
      };
    }));
    setDoctors((dashboard.doctors || []).map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      specialty: "Space Medicine",
      onDuty: doctor.isActive !== false,
      facility: "Mission Medical Bay",
      shift: "Rotational",
      yearsExperience: 0,
    })));
    setAlerts((dashboard.alerts || []).map((alert) => ({
      id: alert.id,
      astronautId: alert.astronautId,
      severity: alert.severity === "Critical" || alert.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
      message: alert.title || alert.description || "Biosensor alert",
      timestamp: relativeTime(alert.createdAt),
      assignedDoctorId: null,
      assignedDoctorName: alert.assignedDoctorName || null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadDashboard(); }, 0);
    const interval = window.setInterval(() => { void loadDashboard(); }, 30000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const astronautMap = useMemo(() => {
    const map: Record<string, Astronaut> = {};
    astronauts.forEach((a) => (map[a.id] = a));
    return map;
  }, [astronauts]);

  const missionMap = useMemo(() => {
    const map: Record<string, Mission> = {};
    missions.forEach((m) => (map[m.id] = m));
    return map;
  }, [missions]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === "ALL") return alerts;
    return alerts.filter((alert) => alert.severity === severityFilter);
  }, [alerts, severityFilter]);

  const totalActiveAstronauts = astronauts.length;
  const totalActiveMissions = missions.filter((m) => m.status !== "Completed").length;
  const totalOnDutyMedicalOfficers = doctors.filter((d) => d.onDuty).length;
  const highPriorityAlertsCount = alerts.filter((a) => a.severity === "CRITICAL").length;

  const handleCreateMission = async () => {
    if (!newMission.title.trim()) return;
    const response = await createMission({
      name: newMission.title.trim(),
      status: newMission.status === "In Progress" ? "Active" : newMission.status === "Completed" ? "Completed" : "Planned",
      description: newMission.duration.trim() ? `Planned duration: ${newMission.duration.trim()}` : undefined,
    });
    if (!response.success) {
      setToast(response.message || "Mission could not be created.");
      return;
    }
    setShowMissionModal(false);
    setNewMission({ title: "", riskLevel: "LOW RISK", duration: "", status: "Pending Assignment" });
    setToast(`Mission ${newMission.title.trim()} created successfully.`);
    await loadDashboard();
  };

  const saveDoctorAssignment = async (astronaut: Astronaut) => {
    const doctorId = doctorDrafts[astronaut.id];
    if (!doctorId) return;
    const doctor = doctors.find((d) => d.id === doctorId);
    const response = await assignMissionControlDoctor(astronaut.id, doctorId);
    if (!response.success) {
      setToast(response.message || "Doctor assignment failed.");
      return;
    }
    setDoctorDrafts((current) => {
      const next = { ...current };
      delete next[astronaut.id];
      return next;
    });
    setToast(`Astronaut ${astronaut.id} assigned to ${doctor?.name || "Medical Officer"}.`);
    await loadDashboard();
  };

  const saveMissionAssignment = async (astronaut: Astronaut) => {
    const missionId = missionDrafts[astronaut.id];
    if (!missionId) return;
    const mission = missionMap[missionId];
    const response = await assignMissionControlMission(astronaut.id, missionId);
    if (!response.success) {
      setToast(response.message || "Mission assignment failed.");
      return;
    }

    setMissionDrafts((current) => {
      const next = { ...current };
      delete next[astronaut.id];
      return next;
    });
    setToast(`Astronaut ${astronaut.id} assigned to ${mission?.title || "Mission"}.`);
    await loadDashboard();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-[#080C14]/95 via-[#0c2233] to-[#080C14]/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
            <Radio className="h-4 w-4 animate-pulse" /> Mission Control · Command &amp; Response Console
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-black text-white">
            <Rocket className="h-6 w-6 text-cyan-300" /> Mission Operations Dashboard
          </h1>
          <p className="mt-1 text-xs text-cyan-200/80">
            Active mission cards, crew assignment matrix, and cross-fleet biosensor alert monitor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 font-mono text-[10px] font-bold text-cyan-200">
            {totalActiveAstronauts} ACTIVE ASTRONAUTS · {totalOnDutyMedicalOfficers} ON-DUTY SURGEONS
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE BACKEND DATALINK
          </span>
        </div>
      </header>

      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-[#0a1f1a]/95 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <CircleCheckBig className="h-4 w-4 shrink-0 text-emerald-300" />
          {toast}
        </div>
      )}

      {/* ── 1 · Executive Summary Bar ──────────────────────── */}
      {loadError && (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm font-semibold text-rose-100">
          {loadError}
        </div>
      )}

      {loading && !astronauts.length && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl border border-cyan-400/10 bg-white/[0.03]" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Active Astronauts"
          value={String(totalActiveAstronauts)}
          sub="Crew roster across all missions"
          tone="cyan"
        />
        <StatCard
          icon={Target}
          label="Total Active Missions"
          value={String(totalActiveMissions)}
          sub="Across the fleet"
          tone="emerald"
        />
        <StatCard
          icon={UserCheck}
          label="On-Duty Medical Officers"
          value={String(totalOnDutyMedicalOfficers)}
          sub="Flight surgeons available"
          tone="cyan"
        />
        <StatCard
          icon={ShieldAlert}
          label="High-Priority Alerts"
          value={String(highPriorityAlertsCount)}
          sub="Critical biosensor alerts"
          tone="amber"
        />
      </div>
      {/* ── 3 · Astronaut / Crew Dual Assignment Matrix ─────── */}
      <section className="rounded-2xl border border-emerald-400/20 bg-[#0a141f]/80 p-4 shadow-[0_0_30px_rgba(34,197,94,0.05)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-3 border-b border-emerald-400/10 pb-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <ArrowRightLeft className="h-4 w-4 text-emerald-300" /> Astronaut Assignment Matrix
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Assign a flight surgeon or re-assign an astronaut to any active mission — live roster, instant updates.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {astronauts.length} ASTRONAUTS · {doctors.length} DOCTORS · {missions.length} MISSIONS
          </span>
        </div>

        <div className="mt-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            <Users className="h-3.5 w-3.5 text-cyan-300" /> Astronaut Roster
          </p>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {astronauts.length === 0 ? (
              <p className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-8 text-center text-xs text-slate-500 sm:col-span-2 lg:col-span-3">
                <Users className="h-4 w-4 text-cyan-300" /> No registered astronauts yet — sign-ups appear here as they are approved.
              </p>
            ) : (
              astronauts.map((astronaut) => (
                <AstronautCard
                  key={astronaut.id}
                  astronaut={astronaut}
                  doctors={doctors}
                  missions={missions}
                  doctorDraft={doctorDrafts[astronaut.id] ?? astronaut.assignedDoctorId ?? ""}
                  missionDraft={missionDrafts[astronaut.id] ?? astronaut.assignedMissionId ?? ""}
                  onDoctorDraftChange={(value) =>
                    setDoctorDrafts((current) => ({ ...current, [astronaut.id]: value }))
                  }
                  onMissionDraftChange={(value) =>
                    setMissionDrafts((current) => ({ ...current, [astronaut.id]: value }))
                  }
                  onSaveDoctor={() => saveDoctorAssignment(astronaut)}
                  onSaveMission={() => saveMissionAssignment(astronaut)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Flight Surgeon Roster */}
      <section className="rounded-2xl border border-emerald-400/20 bg-[#0a141f]/80 p-4 shadow-[0_0_30px_rgba(34,197,94,0.05)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-3 border-b border-emerald-400/10 pb-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Stethoscope className="h-4 w-4 text-emerald-300" /> Flight Surgeon Roster
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              On-duty medical officers, patient caseloads, and biosensor alerts currently in review.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            {totalOnDutyMedicalOfficers} ON DUTY · {doctors.length} TOTAL
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.length === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-8 text-center text-xs text-slate-500 sm:col-span-2 xl:col-span-3">
              <Stethoscope className="h-4 w-4 text-emerald-300" /> No medical officers on duty yet — registered doctors appear here.
            </p>
          ) : (
            doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                assignedAstronauts={astronauts.filter((a) => a.assignedDoctorId === doctor.id)}
                handledAlerts={alerts.filter((a) => a.assignedDoctorId === doctor.id)}
              />
            ))
          )}
        </div>
      </section>

      {/* ── 4 · High-Level Alert Feed ──────────────────────── */}
      <section className="rounded-2xl border border-amber-400/20 bg-[#0a141f]/80 p-4 shadow-[0_0_30px_rgba(251,191,36,0.05)] backdrop-blur-xl">
        <div className="flex flex-col justify-between gap-3 border-b border-amber-400/10 pb-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <TriangleAlert className="h-4 w-4 text-amber-300" /> Cross-Fleet Alert Monitor
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Active health &amp; biosensor alerts across all astronauts and their assigned doctor handling status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</span>
            {(["ALL", "CRITICAL", "WARNING"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSeverityFilter(option)}
                className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${
                  severityFilter === option
                    ? "border-cyan-300/60 bg-cyan-400/90 text-[#03142c] shadow-[0_0_14px_rgba(34,211,238,0.2)]"
                    : "border-white/10 bg-black/20 text-slate-400 hover:text-white"
                }`}
              >
                {option === "ALL" ? "All" : option.charAt(0) + option.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {filteredAlerts.length === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/20 px-4 py-8 text-center text-xs text-slate-500 sm:col-span-2 xl:col-span-4">
              <CircleCheckBig className="h-4 w-4 text-emerald-400" /> No active alerts for this severity filter.
            </p>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} astronaut={astronautMap[alert.astronautId]} />
            ))
          )}
        </div>
      </section>

      {/* ── Create New Mission Modal ───────────────────────── */}
      {showMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-cyan-400/25 bg-[#0a141f] p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Plus className="h-4 w-4 text-cyan-300" /> Create New Mission
              </h3>
              <button
                onClick={() => setShowMissionModal(false)}
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
                onClick={() => setShowMissionModal(false)}
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

// ── Astronaut card ──────────────────────────────────────────

interface AstronautCardProps {
  astronaut: Astronaut;
  doctors: Doctor[];
  missions: Mission[];
  doctorDraft: string;
  missionDraft: string;
  onDoctorDraftChange: (value: string) => void;
  onMissionDraftChange: (value: string) => void;
  onSaveDoctor: () => void;
  onSaveMission: () => void;
}

function AstronautCard({
  astronaut,
  doctors,
  missions,
  doctorDraft,
  missionDraft,
  onDoctorDraftChange,
  onMissionDraftChange,
  onSaveDoctor,
  onSaveMission,
}: AstronautCardProps) {
  const doctorChanged = doctorDraft !== "" && doctorDraft !== (astronaut.assignedDoctorId ?? "");
  const missionChanged = missionDraft !== "" && missionDraft !== (astronaut.assignedMissionId ?? "");
  const assignedMission = missions.find((m) => m.id === astronaut.assignedMissionId);
  const assignedDoctor = doctors.find((d) => d.id === astronaut.assignedDoctorId);

  return (
    <article
      className={`group relative flex flex-col rounded-2xl border p-4 transition ${
        astronaut.online
          ? "border-cyan-400/15 bg-white/[0.02] hover:border-cyan-400/40 hover:bg-[#0c1a28]"
          : "border-white/8 bg-slate-950/40"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-mono text-xs font-black ${
              astronaut.online
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-400/30 bg-slate-500/10 text-slate-400"
            }`}
          >
            {initials(astronaut.name)}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a141f] ${
                astronaut.online ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{astronaut.name}</p>
            <span className="mt-1 inline-block rounded-md border border-cyan-400/20 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-cyan-300">
              {astronaut.id}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${
            astronaut.online
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-slate-500/25 bg-slate-500/10 text-slate-400"
          }`}
        >
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
          {astronaut.online ? "ONLINE" : "OFFLINE"}
        </span>
      </div>

      {/* Mission + doctor snapshot */}
      <div className="mt-3 space-y-1.5">
        {assignedMission ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-200">
            <Target className="h-3 w-3 shrink-0 text-cyan-300" />
            <span className="truncate">{assignedMission.title}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">
            <Flag className="h-3 w-3 shrink-0" /> Unassigned to mission
          </span>
        )}
        {assignedDoctor ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
            <Stethoscope className="h-3 w-3 shrink-0" /> {assignedDoctor.name}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300">
            <ShieldAlert className="h-3 w-3 shrink-0" /> Unassigned doctor
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate text-[10px] text-slate-500">Status · {astronaut.status}</p>

      {/* Dual assignment controls */}
      <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
        {/* Flight surgeon */}
        <div className="flex items-center gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <select
              value={missionDraft}
              onChange={(event) => onMissionDraftChange(event.target.value)}
              aria-label={`Assign ${astronaut.name} to a mission`}
              className={`w-full rounded-lg border bg-black/30 px-2 py-2 text-[11px] font-semibold text-white focus:outline-none ${
                missionChanged ? "border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]" : "border-white/10"
              }`}
            >
              <option value="">Assign mission…</option>
              {missions
                .filter((m) => m.status !== "Completed")
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
            <button
              onClick={onSaveMission}
              disabled={!missionChanged}
              aria-label="Confirm mission assignment"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {missionChanged ? <CircleDot className="h-3 w-3" /> : <CircleCheckBig className="h-3 w-3 opacity-60" />}
              Go
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">1 · Flight Surgeon</p>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <select
              value={doctorDraft}
              onChange={(event) => onDoctorDraftChange(event.target.value)}
              aria-label={`Assign ${astronaut.name} a flight surgeon`}
              className={`w-full rounded-lg border bg-black/30 px-2 py-2 text-[11px] font-semibold text-white focus:outline-none ${
                doctorChanged ? "border-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.15)]" : "border-white/10"
              }`}
            >
              <option value="">Assign doctor…</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
            <button
              onClick={onSaveDoctor}
              disabled={!doctorChanged}
              aria-label="Confirm flight surgeon assignment"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-[10px] font-bold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {doctorChanged ? <CircleDot className="h-3 w-3" /> : <CircleCheckBig className="h-3 w-3 opacity-60" />}
              Go
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Doctor card ─────────────────────────────────────────────

function DoctorCard({
  doctor,
  assignedAstronauts,
  handledAlerts,
}: {
  doctor: Doctor;
  assignedAstronauts: Astronaut[];
  handledAlerts: Alert[];
}) {
  const criticalHandled = handledAlerts.filter((a) => a.severity === "CRITICAL").length;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-4 transition ${
        doctor.onDuty
          ? "border-emerald-400/25 bg-white/[0.02] hover:border-emerald-400/50 hover:bg-[#0c1f18]"
          : "border-white/10 bg-slate-950/40 hover:border-white/25"
      }`}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 font-mono text-xs font-black text-emerald-100 ring-1 ring-emerald-400/30">
            {initials(doctor.name)}
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a141f] ${
                doctor.onDuty ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{doctor.name}</p>
            <p className="truncate text-[10px] text-slate-400">{doctor.specialty} · Flight Surgeon</p>
            <span className="mt-1 inline-block rounded-md border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
              {doctor.id}
            </span>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${
            doctor.onDuty
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-slate-500/25 bg-slate-500/10 text-slate-400"
          }`}
        >
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
          {doctor.onDuty ? "ON DUTY" : "OFF DUTY"}
        </span>
      </div>

      {/* Facility / shift / experience */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-300">
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
          <Stethoscope className="h-3 w-3 text-emerald-300" /> {doctor.facility}
        </span>
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
          <Clock className="h-3 w-3 text-cyan-300" /> {doctor.shift} Shift
        </span>
        <span className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1">
          <Orbit className="h-3 w-3 text-violet-300" /> {doctor.yearsExperience} yrs
        </span>
      </div>

      {/* Caseload metrics */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MetricPill icon={UserCheck} label="Assignees" value={assignedAstronauts.length} tone="cyan" />
        <MetricPill icon={TriangleAlert} label="In Review" value={handledAlerts.length} tone="amber" />
        <MetricPill icon={ShieldAlert} label="Critical" value={criticalHandled} tone="rose" />
      </div>

      {/* Assigned astronaut details */}
      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="mb-2 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          <Users className="h-3 w-3 text-cyan-300" /> Assigned Astronaut Details
        </p>
        {assignedAstronauts.length > 0 ? (
          <ul className="space-y-1.5">
            {assignedAstronauts.map((astro) => (
              <li
                key={astro.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-2.5 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[8px] font-black ${
                      astro.online
                        ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
                        : "border-slate-400/30 bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {initials(astro.name)}
                  </span>
                  <span className="truncate text-[11px] font-semibold text-slate-200">{astro.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${astro.online ? "bg-emerald-400" : "bg-slate-500"}`} />
                  <span className="font-mono text-[9px] text-cyan-300/70">{astro.id}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-1.5 rounded-xl border border-dashed border-amber-400/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/80">
            <UserCheck className="h-3.5 w-3.5 shrink-0 text-amber-300" /> No astronauts assigned yet.
          </p>
        )}
      </div>
    </article>
  );
}

// ── Metric pill ─────────────────────────────────────────────

function MetricPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "cyan" | "amber" | "rose";
}) {
  const tones = {
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  };
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 ${tones[tone]}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="font-mono text-base font-black leading-none text-white">{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}

// ── Alert row ───────────────────────────────────────────────

function AlertRow({ alert, astronaut }: { alert: Alert; astronaut?: Astronaut }) {
  const styles = severityStyles[alert.severity];
  const name =
    astronaut?.avatar && astronaut.avatar.trim() !== "" ? astronaut.avatar : astronaut ? initials(astronaut.name) : "?";
  const handled = Boolean(alert.assignedDoctorName);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a141f]/70 p-3.5 transition hover:border-white/20 hover:bg-[#0c1826]">
      <span className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${styles.bar}`} />

      {/* Top meta row */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${styles.badge}`}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${styles.dot}`} />
            {alert.severity}
          </span>
          <span className="font-mono text-[9px] font-bold tracking-wider text-slate-500">{alert.id}</span>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} /> {alert.timestamp}
        </span>
      </div>

      {/* Astronaut + message */}
      <div className="mt-3 flex items-start gap-3 pl-1">
        <span
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[10px] font-black ${
            astronaut?.online
              ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
              : "border-slate-400/30 bg-slate-500/10 text-slate-300"
          }`}
        >
          {name}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a141f] ${
              astronaut?.online ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-black text-white">
            <span className="truncate">{astronaut?.name || alert.astronautId}</span>
            <span className="font-mono text-[10px] font-bold text-cyan-300/70">{alert.astronautId}</span>
          </p>
          <p className={`mt-0.5 text-[11px] leading-relaxed text-slate-400 ${handled ? "" : "font-semibold text-amber-200/90"}`}>
            {alert.message}
          </p>
        </div>
      </div>

      {/* Handling status + telemetry */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 pl-1">
        {handled ? (
          <span className="flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
            <CircleCheckBig className="h-3.5 w-3.5" /> In Review by {doctorShortName(alert.assignedDoctorName as string)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300">
            <ShieldAlert className="h-3.5 w-3.5" /> Unassigned — Escalate
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${astronaut?.online ? "bg-emerald-400" : "bg-slate-500"}`} />
          {astronaut?.online ? "TELEMETRY LIVE" : "TELEMETRY STALE"}
        </span>
      </div>
    </article>
  );
}

// ── Stat card ───────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
  tone: "cyan" | "emerald" | "amber";
}) {
  const tones = {
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5" />
        <span className="text-[9px] uppercase tracking-wider text-slate-500">{sub}</span>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-0.5 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
