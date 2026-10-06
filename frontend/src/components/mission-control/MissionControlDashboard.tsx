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
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  Zap,
  Bell,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  Timer,
  Sliders,
} from "lucide-react";
import {
  assignMissionControlDoctor,
  assignMissionControlMission,
  createMission,
  getAllMedicalAlerts,
  getAssignedMissions,
  getMissionControlDashboard,
} from "@/lib/api";
import { useRegistration } from "@/context/RegistrationContext";

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
  severity: "CRITICAL" | "WARNING" | "NOMINAL";
  title: string;
  message: string;
  timestamp: string;
  rawDate?: string;
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
    id?: string;
    _id?: string;
    astronautId: string;
    severity?: string;
    title?: string;
    description?: string;
    createdAt?: string;
    assignedDoctorName?: string | null;
  }>;
}

type AlertFilterKey = "All" | "CRITICAL" | "WARNING" | "NOMINAL";
type AlertSortKey = "newest" | "severity" | "oldest";

const REGISTRATION_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
];

function initials(name: string): string {
  return name
    .replace(/^Dr\.\s+/, "")
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeMissionStatus(status?: string): MissionStatus {
  if (status === "Completed") return "Completed";
  if (status === "Active" || status === "In Progress") return "In Progress";
  return "Pending Assignment";
}

function normalizeRiskLevel(status?: string): RiskLevel {
  if (status === "Aborted" || status === "High" || status === "HIGH RISK") return "HIGH RISK";
  if (status === "Active" || status === "Medium" || status === "MEDIUM RISK") return "MEDIUM RISK";
  return "LOW RISK";
}

function timeAgo(value?: string): string {
  if (!value) return "Just now";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MissionControlDashboard() {
  // Global Registration Governance Hook
  const {
    isRegistrationOpen,
    remainingLabel,
    statusLabel,
    startRegistration,
    closeRegistration,
  } = useRegistration();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [astronauts, setAstronauts] = useState<Astronaut[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  // Main Section View Toggle: ASTRONAUTS vs DOCTORS
  const [activeTab, setActiveTab] = useState<"ASTRONAUTS" | "DOCTORS">("ASTRONAUTS");
  const [astronautSubFilter, setAstronautSubFilter] = useState<"ALL" | "ONLINE" | "UNASSIGNED">("ALL");

  // Alert Sort & Filter States
  const [alertFilter, setAlertFilter] = useState<AlertFilterKey>("All");
  const [alertSortBy, setAlertSortBy] = useState<AlertSortKey>("newest");

  // Registration Controller State
  const [regPreset, setRegPreset] = useState(30);
  const [customMinutes, setCustomMinutes] = useState("");
  const [regBusy, setRegBusy] = useState(false);

  const [newMission, setNewMission] = useState({
    title: "",
    riskLevel: "LOW RISK" as RiskLevel,
    duration: "",
    status: "Pending Assignment" as MissionStatus,
  });

  const [doctorDrafts, setDoctorDrafts] = useState<Record<string, string>>({});
  const [missionDrafts, setMissionDrafts] = useState<Record<string, string>>({});

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setLoadError(null);

    try {
      const [dashboardRes, missionsRes, medicalAlertsRes] = await Promise.all([
        getMissionControlDashboard(),
        getAssignedMissions(),
        getAllMedicalAlerts("all"),
      ]);

      if (!dashboardRes.success) {
        setLoadError(dashboardRes.message || "Mission Control dashboard telemetry could not be loaded.");
        setLoading(false);
        return;
      }

      const dashboard = (dashboardRes.data || {}) as DashboardPayload;
      const missionRows = (
        ((missionsRes.data as { missions?: Array<Record<string, unknown>> } | undefined)?.missions || [])
      ).map((mission) => {
        const name = String(mission.name || mission.missionId || "Unnamed Mission");
        const id = String(mission.missionId || mission.name || name);
        return {
          id,
          title: name,
          riskLevel: normalizeRiskLevel(String(mission.status || "")),
          duration: mission.startDate
            ? `Started ${new Date(String(mission.startDate)).toLocaleDateString()}`
            : "Planned",
          status: normalizeMissionStatus(String(mission.status || "")),
          assignedAstronautIds: Array.isArray(mission.astronautIds) ? mission.astronautIds.map(String) : [],
        };
      });

      setMissions(missionRows);

      const astronautList = (dashboard.astronauts || []).map((item) => {
        const matchingMission = missionRows.find(
          (mission) => mission.title === item.mission || mission.id === item.mission
        );
        return {
          id: item.astronautId,
          name: item.name,
          avatar: item.avatar,
          assignedDoctorId: item.assignedDoctorId || null,
          assignedMissionId: matchingMission?.id || item.mission || null,
          online: Boolean(item.online),
          status: item.status || "Active",
        };
      });
      setAstronauts(astronautList);

      const doctorList = (dashboard.doctors || []).map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        specialty: "Space Aerospace Medicine",
        onDuty: doctor.isActive !== false,
        facility: "Orbital Command Medical Bay",
        shift: "Rotational" as const,
        yearsExperience: 8,
      }));
      setDoctors(doctorList);

      // Combine direct alerts & medical alerts
      const rawAlertsList =
        medicalAlertsRes.success && Array.isArray(medicalAlertsRes.data) && medicalAlertsRes.data.length > 0
          ? (medicalAlertsRes.data as Array<Record<string, unknown>>)
          : (dashboard.alerts || []);

      setAlerts(
        rawAlertsList.map((alert: Record<string, unknown>) => {
          const sevStr = String(alert.severity || "Warning").toLowerCase();
          const severity: "CRITICAL" | "WARNING" | "NOMINAL" =
            sevStr === "critical"
              ? "CRITICAL"
              : sevStr === "warning" || sevStr === "watch"
              ? "WARNING"
              : "NOMINAL";

          const createdAt = String(alert.createdAt || "");
          const targetAstroId = String(alert.astronautId || "AST-001");
          const matchingAstro = astronautList.find((a) => a.id === targetAstroId);
          const assignedDoc = doctorList.find((d) => d.id === matchingAstro?.assignedDoctorId);

          return {
            id: String(alert._id || alert.id || `alert-${Math.random().toString(36).slice(2, 7)}`),
            astronautId: targetAstroId,
            severity,
            title: String(alert.title || "Biomedical Anomaly Detected"),
            message: String(alert.description || alert.title || "Biosensor Telemetry Anomaly Detected"),
            timestamp: timeAgo(createdAt),
            rawDate: createdAt,
            assignedDoctorId: matchingAstro?.assignedDoctorId || null,
            assignedDoctorName: alert.assignedDoctorName
              ? String(alert.assignedDoctorName)
              : assignedDoc
              ? assignedDoc.name
              : null,
          };
        })
      );
    } catch {
      setLoadError("Network connectivity error contacting Mission Control server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const interval = window.setInterval(() => {
      void loadDashboard(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
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

  // Filtered Astronauts
  const filteredAstronauts = useMemo(() => {
    return astronauts.filter((astro) => {
      if (astronautSubFilter === "ONLINE") return astro.online;
      if (astronautSubFilter === "UNASSIGNED")
        return !astro.assignedDoctorId || !astro.assignedMissionId;
      return true;
    });
  }, [astronauts, astronautSubFilter]);

  // Filtered Doctors
  const filteredDoctors = doctors;

  // Alert Counts for badges
  const alertCounts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let nominal = 0;
    alerts.forEach((alert) => {
      if (alert.severity === "CRITICAL") critical += 1;
      else if (alert.severity === "WARNING") warning += 1;
      else nominal += 1;
    });
    return { critical, warning, nominal };
  }, [alerts]);

  // Filtered and Sorted Alerts
  const visibleAlerts = useMemo(() => {
    const list =
      alertFilter === "All"
        ? [...alerts]
        : alerts.filter((alert) => alert.severity === alertFilter);

    if (alertSortBy === "newest") {
      list.sort((a, b) => new Date(b.rawDate || 0).getTime() - new Date(a.rawDate || 0).getTime());
    } else if (alertSortBy === "oldest") {
      list.sort((a, b) => new Date(a.rawDate || 0).getTime() - new Date(b.rawDate || 0).getTime());
    } else if (alertSortBy === "severity") {
      const score = (sev: Alert["severity"]) =>
        sev === "CRITICAL" ? 3 : sev === "WARNING" ? 2 : 1;
      list.sort((a, b) => score(b.severity) - score(a.severity));
    }
    return list;
  }, [alerts, alertFilter, alertSortBy]);

  // Key stats
  const totalActiveAstronauts = astronauts.length;
  const onlineAstronautsCount = astronauts.filter((a) => a.online).length;
  const unassignedAstronautsCount = astronauts.filter(
    (a) => !a.assignedDoctorId || !a.assignedMissionId
  ).length;
  const totalActiveMissions = missions.filter((m) => m.status !== "Completed").length;
  const totalOnDutyMedicalOfficers = doctors.filter((d) => d.onDuty).length;
  const highPriorityAlertsCount = alertCounts.critical;

  const handleCreateMission = async () => {
    if (!newMission.title.trim()) return;
    setSavingAction("create-mission");
    try {
      const response = await createMission({
        name: newMission.title.trim(),
        status:
          newMission.status === "In Progress"
            ? "Active"
            : newMission.status === "Completed"
            ? "Completed"
            : "Planned",
        description: newMission.duration.trim()
          ? `Planned duration: ${newMission.duration.trim()}`
          : undefined,
      });

      if (!response.success) {
        setToast({ message: response.message || "Mission creation failed.", type: "error" });
        return;
      }
      setShowMissionModal(false);
      setNewMission({
        title: "",
        riskLevel: "LOW RISK",
        duration: "",
        status: "Pending Assignment",
      });
      setToast({ message: `Mission "${newMission.title.trim()}" dispatched successfully!`, type: "success" });
      await loadDashboard(true);
    } catch {
      setToast({ message: "Failed to dispatch mission. Please try again.", type: "error" });
    } finally {
      setSavingAction(null);
    }
  };

  const handleStartRegistrationGate = async () => {
    const mins = customMinutes ? Number(customMinutes) : regPreset;
    if (!Number.isFinite(mins) || mins < 1 || mins > 1440) {
      setToast({ message: "Please enter a valid window between 1 and 1440 minutes.", type: "error" });
      return;
    }
    setRegBusy(true);
    try {
      const ok = await startRegistration(mins);
      if (ok) {
        setToast({ message: `Public registration gate opened for ${mins} minutes!`, type: "success" });
        setShowRegistrationModal(false);
      } else {
        setToast({ message: "Could not open registration gate.", type: "error" });
      }
    } finally {
      setRegBusy(false);
    }
  };

  const handleCloseRegistrationGate = async () => {
    setRegBusy(true);
    try {
      const ok = await closeRegistration();
      if (ok) {
        setToast({ message: "Registration gate closed (Enrollment locked).", type: "success" });
        setShowRegistrationModal(false);
      } else {
        setToast({ message: "Could not close registration gate.", type: "error" });
      }
    } finally {
      setRegBusy(false);
    }
  };

  const saveDoctorAssignment = async (astronaut: Astronaut) => {
    const actionKey = `doc-${astronaut.id}`;
    setSavingAction(actionKey);
    try {
      if (doctorDrafts[astronaut.id] === "none") {
        const response = await assignMissionControlDoctor(astronaut.id, "");
        if (!response.success) {
          setToast({ message: response.message || "Flight surgeon unassignment failed.", type: "error" });
          return;
        }
        setDoctorDrafts((current) => {
          const next = { ...current };
          delete next[astronaut.id];
          return next;
        });
        setToast({ message: `Flight surgeon removed from ${astronaut.name}.`, type: "success" });
        await loadDashboard(true);
        return;
      }

      const doctorId = doctorDrafts[astronaut.id];
      if (!doctorId) return;
      const doctor = doctors.find((d) => d.id === doctorId);
      const response = await assignMissionControlDoctor(astronaut.id, doctorId);
      if (!response.success) {
        setToast({ message: response.message || "Flight surgeon assignment failed.", type: "error" });
        return;
      }

      setDoctorDrafts((current) => {
        const next = { ...current };
        delete next[astronaut.id];
        return next;
      });
      setToast({
        message: `${astronaut.name} successfully assigned to ${doctor?.name || "Flight Surgeon"}.`,
        type: "success",
      });
      await loadDashboard(true);
    } catch {
      setToast({ message: "Network error saving surgeon assignment.", type: "error" });
    } finally {
      setSavingAction(null);
    }
  };

  const saveMissionAssignment = async (astronaut: Astronaut) => {
    const actionKey = `mission-${astronaut.id}`;
    setSavingAction(actionKey);
    try {
      const missionId = missionDrafts[astronaut.id];
      if (!missionId) return;
      const mission = missionMap[missionId];
      const response = await assignMissionControlMission(astronaut.id, missionId);
      if (!response.success) {
        setToast({ message: response.message || "Mission assignment failed.", type: "error" });
        return;
      }

      setMissionDrafts((current) => {
        const next = { ...current };
        delete next[astronaut.id];
        return next;
      });
      setToast({
        message: `${astronaut.name} assigned to "${mission?.title || missionId}".`,
        type: "success",
      });
      await loadDashboard(true);
    } catch {
      setToast({ message: "Network error saving mission assignment.", type: "error" });
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Toast Notification ─────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-300 ${
            toast.type === "success"
              ? "border-emerald-400/40 bg-[#091a14]/95 text-emerald-200 shadow-emerald-950/40"
              : "border-rose-400/40 bg-[#1c080e]/95 text-rose-200 shadow-rose-950/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 animate-bounce" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Load Error Banner ──────────────────────────────── */}
      {loadError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{loadError}</span>
        </div>
      )}

      {/* ── 1 · Executive Metric KPI Cards ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Active Crew Fleet"
          value={loading ? "..." : String(totalActiveAstronauts)}
          subtext={`${onlineAstronautsCount} telemetry active · ${totalActiveAstronauts - onlineAstronautsCount} idle`}
          tone="cyan"
          glowColor="rgba(6,182,212,0.15)"
        />
        <KpiCard
          icon={Target}
          label="Active Space Missions"
          value={loading ? "..." : String(totalActiveMissions)}
          subtext={`${missions.filter((m) => m.status === "In Progress").length} in flight · ${missions.length} registered`}
          tone="blue"
          glowColor="rgba(59,130,246,0.15)"
        />
        <KpiCard
          icon={UserCheck}
          label="On-Duty Flight Surgeons"
          value={loading ? "..." : String(totalOnDutyMedicalOfficers)}
          subtext={`${doctors.length} registered medical officers`}
          tone="emerald"
          glowColor="rgba(16,185,129,0.15)"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Critical Health Signals"
          value={loading ? "..." : String(highPriorityAlertsCount)}
          subtext={
            highPriorityAlertsCount > 0
              ? `${highPriorityAlertsCount} requiring immediate triage`
              : "All astronaut biosensors normal"
          }
          tone="rose"
          glowColor="rgba(244,63,94,0.15)"
        />
      </div>

      {/* ── 2 · Operational Matrix & Roster (Clean 1-Row Controls) ────────────────── */}
      <section className="rounded-3xl border border-cyan-500/25 bg-[#030e1d]/35 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col justify-between gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                {activeTab === "DOCTORS" ? (
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4 text-cyan-300" />
                )}
              </div>
              <h2 className="text-lg font-black text-white">
                {activeTab === "DOCTORS"
                  ? "Flight Surgeon Operations Roster"
                  : "Astronaut Crew & Mission Assignment Matrix"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {activeTab === "DOCTORS"
                ? "Active medical officers, assigned astronaut caseloads, shift schedules and bio-alert oversight."
                : "Real-time crew roster, live telemetry status, flight mission assignments and assigned surgeons."}
            </p>
          </div>

          {/* Controls: Aligned in 1 Single Horizontal Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Primary Mode Switch: Astronauts VS Doctors */}
            <div className="flex items-center rounded-xl border border-white/[0.12] bg-[#020817]/50 backdrop-blur-md p-1">
              <button
                onClick={() => setActiveTab("ASTRONAUTS")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "ASTRONAUTS"
                    ? "bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>👨‍🚀 Astronauts</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    activeTab === "ASTRONAUTS"
                      ? "bg-slate-900/40 text-slate-950 font-black"
                      : "bg-[#071a2e] text-cyan-300"
                  }`}
                >
                  {astronauts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("DOCTORS")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === "DOCTORS"
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "text-emerald-300/70 hover:text-white hover:bg-emerald-500/10"
                }`}
              >
                <span>🩺 Flight Surgeons</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    activeTab === "DOCTORS"
                      ? "bg-slate-900/40 text-slate-950 font-black"
                      : "bg-[#071a2e] text-emerald-300"
                  }`}
                >
                  {doctors.length}
                </span>
              </button>
            </div>

            {/* Astronaut-only Sub-filters */}
            {activeTab === "ASTRONAUTS" && (
              <div className="flex items-center rounded-xl border border-white/[0.12] bg-[#020817]/50 backdrop-blur-md p-1">
                <button
                  onClick={() => setAstronautSubFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    astronautSubFilter === "ALL"
                      ? "bg-[#071a2e] text-cyan-200 border border-cyan-400/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAstronautSubFilter("ONLINE")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    astronautSubFilter === "ONLINE"
                      ? "bg-[#071a2e] text-cyan-200 border border-cyan-400/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Online ({onlineAstronautsCount})
                </button>
                <button
                  onClick={() => setAstronautSubFilter("UNASSIGNED")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    astronautSubFilter === "UNASSIGNED"
                      ? "bg-[#071a2e] text-cyan-200 border border-cyan-400/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pending ({unassignedAstronautsCount})
                </button>
              </div>
            )}

            {/* Registration Gate Status Button (System Governance) */}
            <button
              onClick={() => setShowRegistrationModal(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                isRegistrationOpen
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "border-cyan-500/25 bg-[#020817] text-cyan-300 hover:border-cyan-400/50 hover:text-white"
              }`}
              title="Open / Close Public Registration Gate"
            >
              {isRegistrationOpen ? (
                <>
                  <Unlock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>Gate Open ({remainingLabel})</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Registration Gate</span>
                </>
              )}
            </button>

            {/* New Mission Action Button */}
            <button
              onClick={() => setShowMissionModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs font-black text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Mission</span>
            </button>
          </div>
        </div>

        {/* Content Cards Grid: Doctors OR Astronauts */}
        <div className="mt-6">
          {loading && !astronauts.length && !doctors.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/[0.02]"
                />
              ))}
            </div>
          ) : activeTab === "DOCTORS" ? (
            /* Doctor Cards View */
            filteredDoctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-950/10 px-6 py-14 text-center">
                <Stethoscope className="h-10 w-10 text-emerald-400/50 mb-3" />
                <p className="text-sm font-bold text-white">No flight surgeons registered</p>
                <p className="mt-1 text-xs text-emerald-300/60">Registered medical officers will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDoctors.map((doctor) => (
                  <DoctorSurgeonCard
                    key={doctor.id}
                    doctor={doctor}
                    assignedAstronauts={astronauts.filter((a) => a.assignedDoctorId === doctor.id)}
                    handledAlerts={alerts.filter((a) => a.assignedDoctorId === doctor.id)}
                  />
                ))}
              </div>
            )
          ) : (
            /* Astronaut Cards View */
            filteredAstronauts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-500/20 bg-cyan-950/10 px-6 py-14 text-center">
                <Users className="h-10 w-10 text-cyan-400/50 mb-3" />
                <p className="text-sm font-bold text-white">No astronauts match the selected filter</p>
                <p className="mt-1 text-xs text-cyan-300/60 max-w-md">
                  Select "All" to view the entire crew roster.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAstronauts.map((astronaut) => (
                  <AstronautMatrixCard
                    key={astronaut.id}
                    astronaut={astronaut}
                    doctors={doctors}
                    missions={missions}
                    doctorDraft={doctorDrafts[astronaut.id] ?? astronaut.assignedDoctorId ?? ""}
                    missionDraft={missionDrafts[astronaut.id] ?? astronaut.assignedMissionId ?? ""}
                    savingDoctor={savingAction === `doc-${astronaut.id}`}
                    savingMission={savingAction === `mission-${astronaut.id}`}
                    onDoctorDraftChange={(value) =>
                      setDoctorDrafts((current) => ({ ...current, [astronaut.id]: value }))
                    }
                    onMissionDraftChange={(value) =>
                      setMissionDrafts((current) => ({ ...current, [astronaut.id]: value }))
                    }
                    onSaveDoctor={() => void saveDoctorAssignment(astronaut)}
                    onSaveMission={() => void saveMissionAssignment(astronaut)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── 3 · Cross-Fleet Emergency & Anomaly Signals (Refined, clean & ultra-readable) ────────── */}
      <section className="rounded-3xl border border-cyan-500/25 bg-[#030e1d]/35 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-start gap-4 flex-wrap border-b border-white/[0.08] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <TriangleAlert className="h-4 w-4" />
              </div>
              <h2 className="font-black text-lg text-white">
                Cross-Fleet Emergency &amp; Anomaly Signals
              </h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Active biosensor anomaly telemetry across all space missions and assigned flight surgeon review status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#020817] border border-white/[0.08] rounded-xl px-3 py-1.5 shadow-inner">
              <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs text-slate-400 font-semibold">Sort:</span>
              <select
                value={alertSortBy}
                onChange={(e) => setAlertSortBy(e.target.value as AlertSortKey)}
                className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[#020817] text-white">
                  Newest First
                </option>
                <option value="severity" className="bg-[#020817] text-white">
                  Severity (Critical First)
                </option>
                <option value="oldest" className="bg-[#020817] text-white">
                  Oldest First
                </option>
              </select>
            </div>

            {/* Filter Chips */}
            <div className="flex gap-1.5 flex-wrap">
              {(["All", "CRITICAL", "WARNING", "NOMINAL"] as AlertFilterKey[]).map((f) => {
                const label =
                  f === "All"
                    ? `All · ${alerts.length}`
                    : f === "CRITICAL"
                    ? `Critical · ${alertCounts.critical}`
                    : f === "WARNING"
                    ? `Warning · ${alertCounts.warning}`
                    : `Nominal · ${alertCounts.nominal}`;
                const isSel = alertFilter === f;

                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAlertFilter(f)}
                    className={`text-xs font-semibold h-8 px-3 rounded-full border cursor-pointer transition-all ${
                      isSel
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-bold"
                        : "bg-[#020817] text-slate-400 border-white/[0.08] hover:text-white hover:border-cyan-500/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alert List Cards — Scrollable Fixed Height 2-Column Responsive Grid */}
        <div className="mt-5 max-h-[500px] overflow-y-auto pr-1.5 [scrollbar-width:thin]">
          {loading && !alerts.length ? (
            <p className="py-10 text-center text-xs text-slate-400">Loading cross-fleet anomaly telemetry…</p>
          ) : visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-950/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                <Zap className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-bold text-white">No active anomalies detected</p>
              <p className="mt-0.5 text-xs text-emerald-300/60">
                All cross-fleet biomedical telemetries and life support metrics are nominal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {visibleAlerts.map((alert) => {
                const isCrit = alert.severity === "CRITICAL";
                const isWarn = alert.severity === "WARNING";
                const astronaut = astronautMap[alert.astronautId];

                return (
                  <div
                    key={alert.id}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 backdrop-blur-md ${
                      isCrit
                        ? "border-rose-500/30 bg-gradient-to-r from-[#240612]/50 via-[#1b0510]/40 to-[#12030b]/50 hover:border-rose-400/60 hover:shadow-[0_4px_25px_rgba(244,63,94,0.15)]"
                        : isWarn
                        ? "border-amber-500/30 bg-gradient-to-r from-[#241704]/50 via-[#1c1203]/40 to-[#120b02]/50 hover:border-amber-400/60 hover:shadow-[0_4px_25px_rgba(245,158,11,0.15)]"
                        : "border-emerald-500/30 bg-gradient-to-r from-[#042416]/50 via-[#031c11]/40 to-[#02120b]/50 hover:border-emerald-400/60 hover:shadow-[0_4px_25px_rgba(16,185,129,0.15)]"
                    }`}
                  >
                    <div>
                      {/* Top Row: Severity, Title, Astronaut Tag & Timestamp */}
                      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[9.5px] font-mono font-black tracking-wider px-2 py-0.5 rounded-lg border ${
                              isCrit
                                ? "bg-rose-500/20 text-rose-200 border-rose-500/40 shadow-sm"
                                : isWarn
                                ? "bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm"
                                : "bg-emerald-500/20 text-emerald-200 border-emerald-500/40 shadow-sm"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isCrit ? "bg-rose-400 animate-ping" : isWarn ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                            />
                            {alert.severity}
                          </span>

                          <span className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                            <Bell className="h-3.5 w-3.5 text-cyan-400" />
                            {alert.title}
                          </span>

                          {/* Astronaut Identity Badge */}
                          <span className="flex items-center gap-1 rounded-md border border-cyan-400/30 bg-cyan-950/60 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-200">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                astronaut?.online ? "bg-emerald-400" : "bg-slate-500"
                              }`}
                            />
                            {astronaut?.name || alert.astronautId}
                          </span>
                        </div>

                        <span className="text-slate-400 text-[11px] font-mono shrink-0">
                          {alert.timestamp}
                        </span>
                      </div>

                      {/* Alert Message */}
                      <p className="text-slate-200 text-xs leading-relaxed mt-2 font-medium">
                        {alert.message}
                      </p>
                    </div>

                    {/* Bottom Row: Doctor Assignment Status exclusively */}
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 flex-wrap gap-2">
                      {alert.assignedDoctorName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                          <Stethoscope className="h-3 w-3 text-emerald-400" />
                          In Review by {alert.assignedDoctorName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-200">
                          <ShieldAlert className="h-3 w-3 text-amber-400" />
                          Surgeon: Unassigned
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-500">
                        ID: {alert.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Public Registration Gate Modal (System Governance) ── */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#061426] p-6 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Sliders className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Registration Gate Controller</h3>
                  <p className="text-xs text-slate-400">Manage public astronaut recruitment window</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Gate State Banner */}
            <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-[#071a2e] p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Status
                </span>
                <span
                  className={`text-lg font-black mt-0.5 flex items-center gap-2 ${
                    isRegistrationOpen ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {isRegistrationOpen ? (
                    <>
                      <Unlock className="h-4 w-4 text-emerald-400 animate-pulse" />
                      OPEN (Recruitment Active)
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-amber-400" />
                      CLOSED (Locked)
                    </>
                  )}
                </span>
              </div>
              {isRegistrationOpen && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Remaining
                  </span>
                  <span className="font-mono text-base font-bold text-cyan-300">
                    {remainingLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Preset & Custom Duration */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select Window Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {REGISTRATION_PRESETS.map((p) => {
                    const selected = p.minutes === regPreset && !customMinutes;
                    return (
                      <button
                        key={p.minutes}
                        type="button"
                        onClick={() => {
                          setRegPreset(p.minutes);
                          setCustomMinutes("");
                        }}
                        disabled={regBusy}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition ${
                          selected
                            ? "border-cyan-400 bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30"
                            : "border-white/10 bg-[#071a2e] text-slate-300 hover:text-white hover:border-cyan-400/40"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Or Custom Duration (Minutes)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    placeholder="e.g. 45"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0 font-medium">mins</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              {isRegistrationOpen ? (
                <button
                  onClick={handleCloseRegistrationGate}
                  disabled={regBusy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 hover:border-amber-500/60 disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Force Close Window</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRegistrationGate}
                  disabled={regBusy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 active:scale-[0.98] disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>Open Registration Window</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create New Mission Modal ───────────────────────── */}
      {showMissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#061426] p-6 shadow-[0_0_60px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Dispatch New Mission</h3>
                  <p className="text-xs text-slate-400">Initialize flight profile in Mission Control</p>
                </div>
              </div>
              <button
                onClick={() => setShowMissionModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mission Identifier / Title *
                </label>
                <input
                  value={newMission.title}
                  onChange={(e) => setNewMission((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Artemis IV · Lunar South Pole EVA"
                  className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Risk Category
                  </label>
                  <select
                    value={newMission.riskLevel}
                    onChange={(e) =>
                      setNewMission((prev) => ({ ...prev, riskLevel: e.target.value as RiskLevel }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="LOW RISK" className="bg-[#020817]">🟢 Low Risk</option>
                    <option value="MEDIUM RISK" className="bg-[#020817]">🟡 Medium Risk</option>
                    <option value="HIGH RISK" className="bg-[#020817]">🔴 High Risk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Planned Duration
                  </label>
                  <input
                    value={newMission.duration}
                    onChange={(e) => setNewMission((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="e.g. 180 Days / 6h EVA"
                    className="w-full rounded-xl border border-white/10 bg-[#020817] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Initial Status
                </label>
                <select
                  value={newMission.status}
                  onChange={(e) =>
                    setNewMission((prev) => ({ ...prev, status: e.target.value as MissionStatus }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#020817] px-3.5 py-2.5 text-xs font-semibold text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Pending Assignment" className="bg-[#020817]">Pending Assignment</option>
                  <option value="In Progress" className="bg-[#020817]">In Progress (Active)</option>
                  <option value="Completed" className="bg-[#020817]">Completed</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
              <button
                onClick={() => setShowMissionModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateMission()}
                disabled={!newMission.title.trim() || savingAction === "create-mission"}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingAction === "create-mission" ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  <CircleCheckBig className="h-4 w-4 text-slate-950" />
                )}
                <span>Dispatch Mission</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sub-Components & Cards
// ─────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: typeof Users;
  label: string;
  value: string;
  subtext: string;
  tone: "cyan" | "blue" | "emerald" | "rose";
  glowColor: string;
}

function KpiCard({ icon: Icon, label, value, subtext, tone, glowColor }: KpiCardProps) {
  const tones = {
    cyan: {
      border: "border-cyan-500/25",
      bg: "from-[#071a2e]/45 to-[#04101e]/35",
      iconBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      accent: "text-cyan-300",
    },
    blue: {
      border: "border-blue-500/25",
      bg: "from-[#081b33]/45 to-[#040f1d]/35",
      iconBg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      accent: "text-blue-300",
    },
    emerald: {
      border: "border-emerald-500/25",
      bg: "from-[#052119]/45 to-[#02130e]/35",
      iconBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      accent: "text-emerald-300",
    },
    rose: {
      border: "border-rose-500/25",
      bg: "from-[#2b0816]/45 to-[#19040c]/35",
      iconBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      accent: "text-rose-300",
    },
  };

  const style = tones[tone];

  return (
    <div
      style={{ boxShadow: `0 10px 30px ${glowColor}` }}
      className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.bg} p-5 backdrop-blur-xl transition-all duration-300 hover:translate-y-[-2px] hover:border-white/30`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${style.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3">
        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">{value}</span>
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400 flex items-center gap-1.5 truncate">
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        <span className="truncate">{subtext}</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Astronaut Matrix Card
// ─────────────────────────────────────────────────────────────

interface AstronautMatrixCardProps {
  astronaut: Astronaut;
  doctors: Doctor[];
  missions: Mission[];
  doctorDraft: string;
  missionDraft: string;
  savingDoctor: boolean;
  savingMission: boolean;
  onDoctorDraftChange: (val: string) => void;
  onMissionDraftChange: (val: string) => void;
  onSaveDoctor: () => void;
  onSaveMission: () => void;
}

function AstronautMatrixCard({
  astronaut,
  doctors,
  missions,
  doctorDraft,
  missionDraft,
  savingDoctor,
  savingMission,
  onDoctorDraftChange,
  onMissionDraftChange,
  onSaveDoctor,
  onSaveMission,
}: AstronautMatrixCardProps) {
  const hasAssignedDoctor = Boolean(astronaut.assignedDoctorId);
  const doctorChanged =
    doctorDraft !== "" &&
    (hasAssignedDoctor
      ? doctorDraft === "none" || doctorDraft !== (astronaut.assignedDoctorId ?? "")
      : doctorDraft !== "");

  const missionChanged =
    missionDraft !== "" && missionDraft !== (astronaut.assignedMissionId ?? "");

  const assignedMission = missions.find((m) => m.id === astronaut.assignedMissionId);
  const assignedDoctor = doctors.find((d) => d.id === astronaut.assignedDoctorId);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-500/25 bg-[#030e1d]/45 backdrop-blur-md p-4 sm:p-5 transition-all duration-300 hover:border-cyan-400/50 hover:bg-[#061d36]/60 hover:shadow-[0_8px_30px_rgba(6,182,212,0.2)]">
      {/* Top Bar: Avatar & Status */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 font-mono text-sm font-black text-cyan-200 border border-cyan-400/30 shadow-inner">
              {initials(astronaut.name)}
              <span
                className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#071a2e] ${
                  astronaut.online ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
                title={astronaut.online ? "Telemetry Active (Online)" : "Telemetry Inactive"}
              />
            </div>
            <div>
              <h3 className="text-sm font-black text-white group-hover:text-cyan-200 transition-colors">
                {astronaut.name}
              </h3>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-cyan-300/80 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  {astronaut.id}
                </span>
                <span className="text-[10px] text-slate-400 capitalize">
                  {astronaut.status}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider border ${
              astronaut.online
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600/30 bg-slate-800/30 text-slate-400"
            }`}
          >
            {astronaut.online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        {/* Current State Badges */}
        <div className="mt-4 space-y-1.5">
          {/* Mission Tag */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-cyan-400" /> Mission:
            </span>
            <span className="font-semibold text-cyan-200 truncate max-w-[160px]">
              {assignedMission ? assignedMission.title : "Unassigned"}
            </span>
          </div>

          {/* Doctor Tag */}
          <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-emerald-400" /> Surgeon:
            </span>
            <span className="font-semibold text-emerald-200 truncate max-w-[160px]">
              {assignedDoctor ? assignedDoctor.name : "Unassigned"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Select Controls */}
      <div className="mt-5 space-y-3 border-t border-white/[0.08] pt-4">
        {/* Mission Select Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Reassign Mission
          </label>
          <div className="flex items-center gap-2">
            <select
              value={missionDraft}
              onChange={(e) => onMissionDraftChange(e.target.value)}
              className={`w-full rounded-xl border bg-[#020817] px-3 py-2 text-xs text-white focus:outline-none transition ${
                missionChanged
                  ? "border-cyan-400 bg-[#082032] text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "border-white/[0.08]"
              }`}
            >
              <option value="" className="bg-[#020817]">Select mission...</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#020817]">
                  {m.title} ({m.status})
                </option>
              ))}
            </select>
            <button
              onClick={onSaveMission}
              disabled={!missionChanged || savingMission}
              className="shrink-0 rounded-xl bg-cyan-500/20 border border-cyan-400/40 px-3 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-500/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Save mission assignment"
            >
              {savingMission ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-cyan-300" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>

        {/* Doctor Select Dropdown */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Assign Flight Surgeon
          </label>
          <div className="flex items-center gap-2">
            <select
              value={doctorDraft}
              onChange={(e) => onDoctorDraftChange(e.target.value)}
              className={`w-full rounded-xl border bg-[#020817] px-3 py-2 text-xs text-white focus:outline-none transition ${
                doctorChanged
                  ? "border-emerald-400 bg-[#062418] text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "border-white/[0.08]"
              }`}
            >
              <option value="" className="bg-[#020817]">Select surgeon...</option>
              {hasAssignedDoctor && (
                <option value="none" className="bg-[#020817]">⚠️ Clear / Unassign Surgeon</option>
              )}
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-[#020817]">
                  {doc.name} {doc.onDuty ? "(On-Duty)" : "(Off-Duty)"}
                </option>
              ))}
            </select>
            <button
              onClick={onSaveDoctor}
              disabled={!doctorChanged || savingDoctor}
              className="shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-400/40 px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Save surgeon assignment"
            >
              {savingDoctor ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-300" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Doctor Surgeon Card
// ─────────────────────────────────────────────────────────────

function DoctorSurgeonCard({
  doctor,
  assignedAstronauts,
  handledAlerts,
}: {
  doctor: Doctor;
  assignedAstronauts: Astronaut[];
  handledAlerts: Alert[];
}) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/25 bg-[#021610]/45 backdrop-blur-md p-5 transition-all duration-300 hover:border-emerald-400/50 hover:bg-[#04251a]/60 hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/20 font-mono text-sm font-black text-emerald-200 border border-emerald-400/30 shadow-inner">
              {initials(doctor.name)}
              <span
                className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#071a2e] ${
                  doctor.onDuty ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                }`}
              />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{doctor.name}</h3>
              <p className="text-xs text-emerald-300/70">{doctor.specialty}</p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-black tracking-wider border ${
              doctor.onDuty
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-slate-600/30 bg-slate-800/30 text-slate-400"
            }`}
          >
            {doctor.onDuty ? "ON DUTY" : "OFF DUTY"}
          </span>
        </div>

        {/* Doctor Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-emerald-200/80">
          <span className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1">
            <Orbit className="h-3 w-3 text-cyan-400" /> {doctor.facility}
          </span>
          <span className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-1">
            <Clock className="h-3 w-3 text-cyan-400" /> {doctor.shift} Shift
          </span>
        </div>

        {/* Caseload Stat Pill */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
            <span className="text-lg font-black text-white font-mono">
              {assignedAstronauts.length}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Crew
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
            <span className="text-lg font-black text-emerald-300 font-mono">
              {handledAlerts.length}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Bio Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Assigned Crew Chips */}
      <div className="mt-4 border-t border-white/[0.08] pt-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Assigned Astronauts ({assignedAstronauts.length})
        </p>
        {assignedAstronauts.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No astronauts currently assigned</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {assignedAstronauts.map((astro) => (
              <span
                key={astro.id}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${astro.online ? "bg-emerald-400" : "bg-slate-500"}`} />
                {astro.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
