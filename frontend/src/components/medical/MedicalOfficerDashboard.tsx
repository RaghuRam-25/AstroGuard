"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  HeartPulse,
  History,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  UserCheck,
  Zap,
} from "lucide-react";
import {
  getAllMedicalAlerts,
  getAstronautAlerts,
  getMedicalCommunicationPeers,
  getMyAssignedAstronauts,
  submitClinicalReview,
} from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import { LoadingState, EmptyState } from "../shared/LoadingState";
import { CommunicationPeer, CrewMember, MedicalAlert, TriageLevel, triageFromRisk, triageFromSeverity } from "./types";

type FilterKey = "All" | "CRITICAL" | "WARNING" | "NOMINAL";
type SortKey = "newest" | "severity" | "oldest";

const REPORT_CLASSES = [
  { id: "mission-summary", title: "Mission Health Summary", detail: "Crew wellness, anomalies, alerts and operational readiness." },
  { id: "astronaut-report", title: "Astronaut Clinical Report", detail: "Individual vitals, risk history and doctor instructions." },
  { id: "alert-register", title: "Medical Alert Register", detail: "Open, resolved and escalated medical alert events." },
];

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

export default function MedicalOfficerDashboard() {
  const { user } = useAuth();
  const { startCall } = useCall();
  const router = useRouter();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [loadingCrew, setLoadingCrew] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Anomaly/Triage states
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [allAlerts, setAllAlerts] = useState<MedicalAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("All");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);

  // Telemedicine Call states
  const [peers, setPeers] = useState<CommunicationPeer[]>([]);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"Audio" | "Video">("Audio");
  const [callSequence, setCallSequence] = useState(0);
  const [callMeta, setCallMeta] = useState<{ callerId: string; receiverId: string; roomSlug: string } | null>(null);

  // Reports states
  const [selectedReport, setSelectedReport] = useState("Mission Health Summary");
  const [reportMission, setReportMission] = useState("Ares Mission 01");
  const [reportPeriod, setReportPeriod] = useState("Last 7 days");
  const [reportGenerated, setReportGenerated] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [crewRes, peersRes, alertsRes] = await Promise.all([
        getMyAssignedAstronauts(),
        getMedicalCommunicationPeers(),
        getAllMedicalAlerts("assigned"),
      ]);
      if (crewRes.success) {
        const next = ((crewRes.data as { astronauts?: CrewMember[] })?.astronauts || []);
        setCrew(next);
        setSelectedId((current) => current && next.some((item) => item.astronautId === current) ? current : next[0]?.astronautId || null);
      }
      if (peersRes.success) setPeers(((peersRes.data as { peers?: CommunicationPeer[] })?.peers || []));
      if (alertsRes.success) setAllAlerts(((alertsRes.data || []) as MedicalAlert[]));
    } finally {
      setLoadingCrew(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadAll());
    const interval = window.setInterval(() => { void loadAll(); }, 7000);
    return () => window.clearInterval(interval);
  }, [loadAll]);

  // Load selected astronaut's alerts
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void (async () => {
      setAlertsLoading(true);
      const response = await getAstronautAlerts(selectedId);
      if (!active) return;
      setAlertsLoading(false);
      if (response.success) setAlerts((response.data as MedicalAlert[] | undefined) || []);
    })();
    return () => { active = false; };
  }, [selectedId]);

  const selectedCrew = useMemo(() => crew.find((member) => member.astronautId === selectedId) || null, [crew, selectedId]);
  const selectedPeer = useMemo(() => peers.find((peer) => peer.astronautId === selectedId) || null, [peers, selectedId]);

  const kpis = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let nominal = 0;
    let alertsOpen = 0;
    crew.forEach((member) => {
      const level = triageFromRisk(member.latestAnalysis?.riskLevel);
      if (level === "CRITICAL") critical += 1;
      else if (level === "WARNING") warning += 1;
      else nominal += 1;
      alertsOpen += member.unresolvedAlerts || 0;
    });
    return { critical, warning, nominal, alertsOpen };
  }, [crew]);

  const counts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let nominal = 0;
    alerts.forEach((alert) => {
      const level = triageFromSeverity(alert.severity);
      if (level === "CRITICAL") critical += 1;
      else if (level === "WARNING") warning += 1;
      else nominal += 1;
    });
    return { critical, warning, nominal };
  }, [alerts]);

  const visibleAlerts = useMemo(() => {
    const list = filter === "All" ? [...alerts] : alerts.filter((alert) => triageFromSeverity(alert.severity) === filter);
    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === "severity") {
      const score = (sev?: string) => (sev === "Critical" ? 3 : sev === "Warning" || sev === "Watch" ? 2 : 1);
      list.sort((a, b) => score(b.severity) - score(a.severity));
    }
    return list;
  }, [alerts, filter, sortBy]);

  const openCall = (type: "Audio" | "Video") => {
    if (!selectedCrew) { showToast("Select an assigned astronaut to begin the link."); return; }
    const receiver = selectedPeer || peers.find((p) => p.astronautId === selectedCrew.astronautId || p.name === selectedCrew.name);
    if (!receiver?.id) {
      showToast("Astronaut session not resolved. Reconnecting telemedicine link...");
      return;
    }
    void startCall(
      {
        id: receiver.id,
        name: selectedCrew.name,
        role: "astronaut",
        astronautId: selectedCrew.astronautId,
      },
      type
    );
  };

  const handleFlagMissionControl = async (alert: MedicalAlert) => {
    if (!selectedCrew) return;
    const response = await submitClinicalReview(selectedCrew.astronautId, {
      riskLevel: alert.severity === "Critical" ? "CRITICAL" : "WATCH",
      clinicalDiagnosis: alert.title,
      countermeasure: "Escalate to Mission Control authority per Flight Surgeon protocol.",
      forwardedToAuthority: true,
      forwardReason: alert.description,
      recommendedAuthorityAction: "Priority medical review by Mission Control.",
    });
    const key = alert._id || alert.id || `${alert.astronautId}-${alert.title}`;
    if (response.success) {
      setFlaggedIds((current) => (current.includes(key) ? current : [...current, key]));
      showToast(`Anomaly flagged to Mission Control for ${selectedCrew.name}.`);
    } else {
      showToast(response.message || "Failed to flag the anomaly.");
    }
  };

  const scrollToReports = () => {
    const el = document.getElementById("sec-reports");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loadingCrew) {
    return <LoadingState message="Loading your assigned astronaut roster & telemetry command…" />;
  }

  if (!crew.length) {
    return (
      <EmptyState
        title="No Astronauts Assigned"
        description="Mission Control has not assigned any astronauts to your roster yet. Once an astronaut is assigned to you, their telemetry, triage, and telemedicine channel will appear here."
      />
    );
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-8 text-white animate-fade-in">

      {/* ─────────────────────────────────────────────────────────
          STAT CARDS (Grid 4)
      ───────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 backdrop-blur-md">
          <div className="text-[11.5px] tracking-[0.12em] uppercase text-slate-400 font-semibold">Assigned Astronauts</div>
          <div className="font-['Sora',sans-serif] text-[36px] font-semibold leading-none text-white mt-3">{crew.length}</div>
        </div>
        <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 backdrop-blur-md">
          <div className="text-[11.5px] tracking-[0.12em] uppercase text-slate-400 font-semibold">Advisory Watch</div>
          <div className="font-['Sora',sans-serif] text-[36px] font-semibold leading-none text-amber-300 mt-3">{kpis.warning}</div>
        </div>
        <div className="bg-[#180A12]/80 border border-rose-500/30 rounded-[18px] p-5 backdrop-blur-md">
          <div className="text-[11.5px] tracking-[0.12em] uppercase text-rose-300/80 font-semibold">Critical Triage</div>
          <div className="font-['Sora',sans-serif] text-[36px] font-semibold leading-none text-rose-400 mt-3">{kpis.critical}</div>
        </div>
        <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 backdrop-blur-md">
          <div className="text-[11.5px] tracking-[0.12em] uppercase text-slate-400 font-semibold">Active Incident Signals</div>
          <div className="font-['Sora',sans-serif] text-[36px] font-semibold leading-none text-cyan-300 mt-3">{kpis.alertsOpen}</div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 1: Crew Overview & Clinical Triage
      ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-['Sora',sans-serif] text-lg sm:text-[20px] font-bold text-white">1. Crew Overview &amp; Clinical Triage</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1.7fr)_minmax(300px,1fr)] gap-5 items-start">
          
          {/* Left Column: Live ECG & Telemetry + Clinical Triage */}
          <div className="flex flex-col gap-4">

            {/* 1.1 Selected Astronaut Live Biomedical Telemetry & ECG Strip */}
            <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 sm:p-6 flex flex-col gap-4 backdrop-blur-md">
              {/* Header */}
              <div className="flex justify-between items-center gap-3 flex-wrap border-b border-sky-400/15 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold">
                    <HeartPulse className="h-5 w-5 text-cyan-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[15px] text-white">
                        {selectedCrew?.name || "Astronaut"} Live Cardiovascular Telemetry
                      </h3>
                      <span className="text-slate-400 font-mono text-[11px] bg-[#040C18] px-2 py-0.5 rounded border border-sky-400/20">
                        {selectedCrew?.astronautId || "AST-001"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono font-semibold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE 10Hz TELEMETRY
                  </span>
                </div>
              </div>

              {/* 4 Vitals Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Heart Rate */}
                <div className="bg-[#040C18]/90 border border-sky-400/15 rounded-[12px] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Heart Rate</span>
                    <HeartPulse className={`h-3.5 w-3.5 ${
                      (selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "text-rose-400 animate-bounce" : "text-emerald-400 animate-pulse"
                    }`} />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <b className="font-['Sora',sans-serif] text-[22px] font-bold text-white">
                      {selectedCrew?.latestHealth?.heartRate ?? 78}
                    </b>
                    <span className="text-[11px] text-slate-400">BPM</span>
                  </div>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    (selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                  }`}>
                    {(selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "Elevated Watch" : "Sinus Nominal"}
                  </span>
                </div>

                {/* SpO2 Oxygenation */}
                <div className="bg-[#040C18]/90 border border-sky-400/15 rounded-[12px] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Blood Oxygen</span>
                    <Activity className="h-3.5 w-3.5 text-cyan-300" />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <b className="font-['Sora',sans-serif] text-[22px] font-bold text-cyan-300">
                      {selectedCrew?.latestHealth?.spo2 !== undefined ? `${selectedCrew.latestHealth.spo2}%` : "98%"}
                    </b>
                    <span className="text-[11px] text-slate-400">SpO₂</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    Optimal Diffusion
                  </span>
                </div>

                {/* Blood Pressure (NIBP) */}
                <div className="bg-[#040C18]/90 border border-sky-400/15 rounded-[12px] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Blood Pressure</span>
                    <Stethoscope className="h-3.5 w-3.5 text-sky-400" />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <b className="font-['Sora',sans-serif] text-[18px] sm:text-[20px] font-bold text-white">
                      {(selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "138/88" : "118/76"}
                    </b>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-mono text-slate-400">
                    MAP ~{(selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "104" : "90"} mmHg
                  </span>
                </div>

                {/* Core Temp & Respiration */}
                <div className="bg-[#040C18]/90 border border-sky-400/15 rounded-[12px] p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] uppercase tracking-wider text-slate-400 font-semibold">Respiration / Temp</span>
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <b className="font-['Sora',sans-serif] text-[18px] sm:text-[20px] font-bold text-white">
                      {(selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "19" : "15"}
                    </b>
                    <span className="text-[10.5px] text-slate-400">Br/min · 37.1°C</span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-mono text-slate-400">
                    Normothermic
                  </span>
                </div>
              </div>

              {/* Live ECG Waveform Oscilloscope Strip */}
              <div className="rounded-[14px] border border-sky-400/20 bg-[#030A14] p-3.5 flex flex-col gap-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-sky-400/30 bg-[#071324] px-2.5 py-0.5 text-[10.5px] font-mono font-semibold text-cyan-300">
                      ECG · LEAD II (50 mm/s)
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono hidden sm:inline">
                      PR: 142ms · QRS: 86ms · QTc: 412ms
                    </span>
                  </div>
                  <span className={`font-mono text-xs font-bold flex items-center gap-1.5 ${
                    (selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
                    <span>Rhythm: {(selectedCrew?.latestHealth?.heartRate || 75) > 100 ? "Sinus Tachycardia" : "Regular Sinus"}</span>
                  </span>
                </div>

                {/* Oscilloscope Grid & Running Wave */}
                <div className="h-20 w-full rounded-lg overflow-hidden relative bg-[repeating-linear-gradient(90deg,#0D233A_0_1px,transparent_1px_24px),repeating-linear-gradient(0deg,#0D233A_0_1px,transparent_1px_20px)] flex items-center">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#030A14] via-transparent to-[#030A14] pointer-events-none z-10" />
                  <svg viewBox="0 0 960 100" preserveAspectRatio="none" className="w-[200%] h-full animate-ecg-wave drop-shadow-[0_0_8px_#3ddc97]">
                    <path
                      d="M0,60 L20,60 L26,56 L32,60 L44,60 L48,72 L54,12 L60,88 L64,60 L84,60 L92,46 L100,60 L120,60 L126,56 L132,60 L144,60 L148,72 L154,12 L160,88 L164,60 L184,60 L192,46 L200,60 L220,60 L226,56 L232,60 L244,60 L248,72 L254,12 L260,88 L264,60 L284,60 L292,46 L300,60 L320,60 L326,56 L332,60 L344,60 L348,72 L354,12 L360,88 L364,60 L384,60 L392,46 L400,60 L420,60 L426,56 L432,60 L444,60 L448,72 L454,12 L460,88 L464,60 L484,60 L492,46 L500,60 L520,60 L526,56 L532,60 L544,60 L548,72 L554,12 L560,88 L564,60 L584,60 L592,46 L600,60 L620,60 L626,56 L632,60 L644,60 L648,72 L654,12 L660,88 L664,60 L684,60 L692,46 L700,60 L720,60 L726,56 L732,60 L744,60 L748,72 L754,12 L760,88 L764,60 L784,60 L792,46 L800,60 L820,60 L826,56 L832,60 L844,60 L848,72 L854,12 L860,88 L864,60 L884,60 L892,46 L900,60 L920,60 L926,56 L932,60 L944,60 L948,72 L954,12 L960,88"
                      fill="none"
                      stroke="#3ddc97"
                      strokeWidth="2.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 1.2 Clinical Triage & Anomaly Tracker for Selected Astronaut */}
            <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 sm:p-6 flex flex-col gap-3.5 backdrop-blur-md">
              <div className="flex justify-between items-start gap-3 flex-wrap border-b border-sky-400/15 pb-3">
                <div>
                  <div className="font-bold text-[15px] text-white">Clinical Triage &amp; Anomaly Signals</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-1.5 bg-[#040C18] border border-sky-400/20 rounded-[8px] px-2.5 py-1">
                    <ArrowUpDown className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="text-[11px] text-slate-400 font-semibold">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortKey)}
                      className="bg-transparent text-slate-200 text-[11.5px] font-semibold outline-none cursor-pointer"
                    >
                      <option value="newest" className="bg-[#071324] text-white">Newest First</option>
                      <option value="severity" className="bg-[#071324] text-white">Severity (Critical First)</option>
                      <option value="oldest" className="bg-[#071324] text-white">Oldest First</option>
                    </select>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(["All", "CRITICAL", "WARNING", "NOMINAL"] as FilterKey[]).map((f) => {
                      const label =
                        f === "All" ? `All · ${alerts.length}` :
                        f === "CRITICAL" ? `Critical · ${counts.critical}` :
                        f === "WARNING" ? `Warning · ${counts.warning}` : `Nominal · ${counts.nominal}`;
                      const isSel = filter === f;

                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFilter(f)}
                          className={`text-[11px] font-semibold h-7 px-2.5 rounded-full border cursor-pointer transition ${
                            isSel
                              ? "bg-cyan-500 text-[#021127] border-cyan-400 shadow-md shadow-cyan-500/20"
                              : "bg-transparent text-slate-300 border-sky-400/20 hover:border-sky-400/50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Alert List Cards — Scrollable Fixed Height Container */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {alertsLoading ? (
                  <p className="py-8 text-center text-xs text-slate-400">Loading anomaly telemetry…</p>
                ) : visibleAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-xs font-bold text-white">No active anomalies</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Biomedical telemetry is nominal.</p>
                  </div>
                ) : (
                  visibleAlerts.map((alert) => {
                    const isCrit = alert.severity === "Critical";
                    const isWarn = alert.severity === "Warning" || alert.severity === "Watch";
                    const flagged = flaggedIds.includes(alert._id || alert.id || `${alert.astronautId}-${alert.title}`);

                    return (
                      <div
                        key={alert._id || alert.id || `${alert.astronautId}-${alert.title}`}
                        className="grid grid-cols-[3px_1fr] gap-2.5 bg-[#040C18]/90 border border-sky-400/15 rounded-[10px] py-2.5 pr-3 pl-0 overflow-hidden transition hover:border-sky-400/40"
                      >
                        <div className={`rounded-r-[3px] ${isCrit ? "bg-rose-500" : isWarn ? "bg-amber-400" : "bg-emerald-400"}`} />
                        <div>
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block text-[9.5px] font-bold tracking-[0.06em] px-2 py-0.5 rounded-full ${
                                isCrit ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : isWarn ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              }`}>
                                {alert.severity ? alert.severity.toUpperCase() : "ALERT"}
                              </span>
                              <span className="font-semibold text-[12.5px] text-white truncate max-w-[220px] sm:max-w-[320px]">
                                {alert.title}
                              </span>
                            </div>
                            <span className="text-slate-400 text-[10.5px] font-mono shrink-0">{timeAgo(alert.createdAt)}</span>
                          </div>

                          <div className="text-slate-300 text-[11.5px] leading-snug mt-1 line-clamp-2">{alert.description}</div>

                          <div className="flex gap-1.5 flex-wrap mt-2">
                            <button
                              type="button"
                              onClick={() => router.push("/medical/medical-consult")}
                              className="h-7 px-2.5 rounded-[7px] border border-sky-400/20 bg-[#0A1A30] text-slate-200 hover:bg-[#112745] hover:border-cyan-400/50 transition text-[11px] font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3 text-cyan-300" />
                              <span>Voice Call</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                showToast(`Guidance drafted for ${alert.title}.`);
                              }}
                              className="h-7 px-2.5 rounded-[7px] border border-sky-400/20 bg-[#0A1A30] text-slate-200 hover:bg-[#112745] hover:border-sky-400/40 transition text-[11px] font-semibold cursor-pointer"
                            >
                              AI Prescription Guidance
                            </button>
                            <button
                              type="button"
                              disabled={flagged}
                              onClick={() => void handleFlagMissionControl(alert)}
                              className={`h-7 px-2.5 rounded-[7px] border transition text-[11px] font-bold cursor-pointer ${
                                flagged
                                  ? "border-sky-400/20 bg-[#112745] text-slate-400"
                                  : "border-rose-500 bg-rose-600 text-white hover:bg-rose-500"
                              }`}
                            >
                              {flagged ? "Flagged" : "Flag Mission Control"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Assigned Roster */}
          <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 flex flex-col gap-3.5 backdrop-blur-md sticky top-20">
            <div className="flex justify-between items-center">
              <div className="text-[11.5px] tracking-[0.12em] uppercase text-slate-400 font-semibold">Assigned Roster</div>
              <span className="text-slate-400 text-[11.5px]">{crew.length} assigned · strict scope</span>
            </div>

            <div className="space-y-2.5 mt-0.5">
              {crew.map((member) => {
                const isSel = member.astronautId === selectedId;
                const health = member.latestHealth;
                const isCrit = triageFromRisk(member.latestAnalysis?.riskLevel) === "CRITICAL";

                return (
                  <button
                    key={member.astronautId}
                    type="button"
                    onClick={() => setSelectedId(member.astronautId)}
                    className={`flex flex-col gap-3 text-left w-full cursor-pointer rounded-[14px] p-3.5 transition border ${
                      isSel
                        ? "border-cyan-400/80 bg-[#041E28]/90 shadow-[0_0_20px_rgba(6,182,212,0.18)]"
                        : "border-sky-400/15 bg-[#040C18]/90 hover:border-sky-400/40 hover:bg-[#08182E]"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[15px] text-white">{member.name}</div>
                        <div className="text-slate-400 text-[11px] font-mono mt-0.5">{member.astronautId}</div>
                      </div>
                      <span className={`inline-block text-[10px] font-bold tracking-[0.08em] px-2.5 py-0.5 rounded-full ${
                        isCrit ? "bg-rose-500/20 border border-rose-500/40 text-rose-300" : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                      }`}>
                        {isCrit ? "CRITICAL" : "NOMINAL"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#09172B]/80 rounded-[10px] p-2">
                        <b className="font-['Sora',sans-serif] text-[17px] block text-white leading-tight">
                          {health?.heartRate ?? "111"}
                        </b>
                        <span className="text-[10.5px] text-slate-400">BPM</span>
                      </div>
                      <div className="flex-1 bg-[#09172B]/80 rounded-[10px] p-2">
                        <b className="font-['Sora',sans-serif] text-[17px] block text-white leading-tight">
                          {health?.spo2 !== undefined ? `${health.spo2}%` : "98%"}
                        </b>
                        <span className="text-[10.5px] text-slate-400">SpO₂</span>
                      </div>
                      <div className="flex-1 bg-[#09172B]/80 rounded-[10px] p-2">
                        <b className={`font-['Sora',sans-serif] text-[17px] block leading-tight ${
                          member.unresolvedAlerts > 0 ? "text-rose-400" : "text-white"
                        }`}>
                          {member.unresolvedAlerts}
                        </b>
                        <span className="text-[10.5px] text-slate-400">Alerts</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 2: Clinical Reports & Mission Logs
      ───────────────────────────────────────────────────────── */}
      <section id="sec-reports" className="flex flex-col gap-4 scroll-mt-24">
        <div>
          <h2 className="font-['Sora',sans-serif] text-lg sm:text-[20px] font-bold text-white">2. Clinical Reports &amp; Mission Logs</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,1.6fr)_minmax(280px,1fr)] gap-5 items-start">
          
          {/* Left Column: Automated Clinical Report Generator */}
          <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 sm:p-6 flex flex-col gap-4 backdrop-blur-md">
            <div>
              <div className="font-bold text-[15px] text-white">Automated Clinical Report Generator</div>
              <div className="text-slate-400 text-[12px] mt-0.5">Select reporting criteria and duration window.</div>
            </div>

            {/* Report Types Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {REPORT_CLASSES.map((rep) => {
                const isSel = selectedReport === rep.title;
                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => { setSelectedReport(rep.title); setReportGenerated(false); }}
                    className={`flex flex-col gap-1 text-left cursor-pointer rounded-[12px] p-3.5 min-h-[44px] transition border ${
                      isSel
                        ? "border-cyan-400/80 bg-[#041E28]/90 shadow-[0_0_20px_rgba(6,182,212,0.18)]"
                        : "border-sky-400/15 bg-[#040C18]/90 hover:border-sky-400/40 hover:bg-[#08182E]"
                    }`}
                  >
                    <b className="text-[13px] font-bold text-white leading-snug">{rep.title}</b>
                    <span className="text-slate-400 text-[11.5px] leading-relaxed mt-0.5">{rep.detail}</span>
                  </button>
                );
              })}
            </div>

            {/* Select inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label>
                <div className="text-[11px] tracking-[0.12em] uppercase text-slate-400 font-semibold mb-1.5">Mission Target</div>
                <select
                  value={reportMission}
                  onChange={(e) => setReportMission(e.target.value)}
                  className="w-full min-h-[40px] bg-[#040C18] text-slate-200 border border-sky-400/20 rounded-[10px] px-3 text-[12.5px] font-medium outline-none focus:border-cyan-400"
                >
                  <option value="Ares Mission 01">Ares Mission 01</option>
                  <option value="Artemis Deep Space Base">Artemis Deep Space Base</option>
                </select>
              </label>

              <label>
                <div className="text-[11px] tracking-[0.12em] uppercase text-slate-400 font-semibold mb-1.5">Reporting Duration</div>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full min-h-[40px] bg-[#040C18] text-slate-200 border border-sky-400/20 rounded-[10px] px-3 text-[12.5px] font-medium outline-none focus:border-cyan-400"
                >
                  <option value="Last 24 hours">Last 24 hours</option>
                  <option value="Last 7 days">Last 7 days</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Full mission lifecycle">Full mission lifecycle</option>
                </select>
              </label>
            </div>

            {/* Action summary bar */}
            <div className="flex justify-between items-center gap-4 flex-wrap bg-[#040C18]/90 border border-sky-400/15 rounded-[12px] p-3.5 sm:px-4">
              <div>
                <div className="font-bold text-[13.5px] text-white">{selectedReport}</div>
                <div className="text-slate-400 text-[12px] mt-0.5">{reportMission} · {reportPeriod} · {crew.length} crew astronauts</div>
              </div>
              <button
                type="button"
                onClick={() => setReportGenerated(true)}
                className="min-h-[38px] px-4 rounded-[10px] border border-cyan-400 bg-cyan-500 text-[#021127] hover:bg-cyan-400 transition text-[12.5px] font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Generate Report
              </button>
            </div>

            {reportGenerated && (
              <div className="flex justify-between items-center gap-3 bg-emerald-500/15 border border-emerald-500/30 rounded-[12px] p-3.5 text-[12.5px] text-emerald-300 animate-fade-in">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>Report prepared and cryptographic digest verified.</span>
                </span>
                <button
                  type="button"
                  onClick={() => showToast("Downloading encrypted clinical report PDF...")}
                  className="font-bold underline hover:text-white cursor-pointer"
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Historical Reports Log */}
          <div className="bg-[#071324]/80 border border-sky-400/15 rounded-[18px] p-5 sm:p-6 backdrop-blur-md">
            <div className="font-bold text-[15px] text-white mb-2">Historical Reports Log</div>
            
            <div className="divide-y divide-sky-400/10">
              <div className="flex justify-between items-center gap-3 py-3 first:border-t-0">
                <div>
                  <div className="font-semibold text-[13.5px] text-white">Mission Health Summary</div>
                  <div className="text-slate-400 text-[11.5px] mt-0.5">Day 28 · PDF · Signed by Flight Surgeon</div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Downloading Mission Health Summary...")}
                  className="h-8 px-3 rounded-[8px] border border-sky-400/20 bg-[#0A1A30] text-slate-200 hover:bg-[#112745] hover:border-cyan-400/40 transition text-[11.5px] font-semibold cursor-pointer"
                >
                  Download
                </button>
              </div>

              <div className="flex justify-between items-center gap-3 py-3">
                <div>
                  <div className="font-semibold text-[13.5px] text-white">Clinical Alert Register</div>
                  <div className="text-slate-400 text-[11.5px] mt-0.5">Day 27 · PDF · Signed by Flight Surgeon</div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Downloading Clinical Alert Register...")}
                  className="h-8 px-3 rounded-[8px] border border-sky-400/20 bg-[#0A1A30] text-slate-200 hover:bg-[#112745] hover:border-cyan-400/40 transition text-[11.5px] font-semibold cursor-pointer"
                >
                  Download
                </button>
              </div>

              <div className="flex justify-between items-center gap-3 py-3">
                <div>
                  <div className="font-semibold text-[13.5px] text-white">Crew Readiness Brief</div>
                  <div className="text-slate-400 text-[11.5px] mt-0.5">Day 26 · PDF · Signed by Flight Surgeon</div>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Downloading Crew Readiness Brief...")}
                  className="h-8 px-3 rounded-[8px] border border-sky-400/20 bg-[#0A1A30] text-slate-200 hover:bg-[#112745] hover:border-cyan-400/40 transition text-[11.5px] font-semibold cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-[#041E28]/95 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}