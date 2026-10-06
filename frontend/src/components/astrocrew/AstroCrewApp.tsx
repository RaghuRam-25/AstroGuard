"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Users,
  Compass,
  FileText,
  Pill,
  Dumbbell,
  Moon,
  Smile,
  Zap,
  Microscope,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Sliders,
  Flame,
  ArrowRight,
  Check,
  Play,
  RotateCcw,
} from "lucide-react";

// ─── TYPES & DATA MODELS ──────────────────────────────────────────

export type AstroRole = "astronaut" | "doctor" | "flight_director";

export interface CrewMemberData {
  id: string;
  name: string;
  role: string;
  avatar: string;
  missionDay: number;
  status: "nominal" | "caution" | "critical";
  healthScore: number;
  heartRate: number;
  spo2: number;
  coreTemp: number;
  bloodPressure: string;
  radiationDoseMsv: number;
  smsScore: number; // Space Motion Sickness: 0 - 4
  sleepScore: number;
  evaClearance: "GO" | "NO-GO" | "CONDITIONAL";
  evaClearanceReason?: string;
  lastUrineTest: {
    specificGravity: number;
    ketones: "Negative" | "Trace" | "Moderate";
    microalbumin: number; // mg/dL
    pH: number;
    leukocytes: "Negative" | "Trace" | "Positive";
    risk: "Low" | "Moderate" | "Elevated";
    timestamp: string;
  };
  lastBloodPanel: {
    hematocritPct: number;
    wbcK_uL: number;
    plateletsK_uL: number;
    hemoglobinG_dL: number;
    microgravityAnemiaShift: boolean;
  };
  stoolLog: {
    bristolType: number; // 1 - 7
    diversityIndex: number; // Shannon Index e.g. 3.8
    notes: string;
    timestamp: string;
  };
  prescriptions: Array<{
    id: string;
    type: "Exercise" | "Hydration" | "Sleep" | "Radiation Shelter";
    dosage: string;
    prescribedBy: string;
    timestamp: string;
    status: "Active" | "Completed";
  }>;
}

const INITIAL_CREW: CrewMemberData[] = [
  {
    id: "AST-001",
    name: "Alex Morgan",
    role: "Commander & Flight Lead",
    avatar: "AM",
    missionDay: 142,
    status: "nominal",
    healthScore: 96,
    heartRate: 72,
    spo2: 98.4,
    coreTemp: 36.8,
    bloodPressure: "118/78",
    radiationDoseMsv: 0.24,
    smsScore: 0,
    sleepScore: 92,
    evaClearance: "GO",
    lastUrineTest: {
      specificGravity: 1.018,
      ketones: "Negative",
      microalbumin: 12,
      pH: 6.4,
      leukocytes: "Negative",
      risk: "Low",
      timestamp: "Today · 06:30 UTC",
    },
    lastBloodPanel: {
      hematocritPct: 44.2,
      wbcK_uL: 6.8,
      plateletsK_uL: 260,
      hemoglobinG_dL: 14.6,
      microgravityAnemiaShift: false,
    },
    stoolLog: {
      bristolType: 4,
      diversityIndex: 3.85,
      notes: "Optimal smooth stool. Microbiome stable.",
      timestamp: "Day 142 · 07:15 UTC",
    },
    prescriptions: [
      {
        id: "RX-101",
        type: "Exercise",
        dosage: "ARED 45m Resistive + 30m CEVIS Ergometer @ 165W",
        prescribedBy: "Dr. Sarah Chen, MD",
        timestamp: "Day 141 · 18:00 UTC",
        status: "Active",
      },
    ],
  },
  {
    id: "AST-002",
    name: "Dr. Elena Rostova",
    role: "Flight Engineer & Systems Specialist",
    avatar: "ER",
    missionDay: 142,
    status: "caution",
    healthScore: 84,
    heartRate: 86,
    spo2: 96.8,
    coreTemp: 37.1,
    bloodPressure: "126/82",
    radiationDoseMsv: 0.38,
    smsScore: 2,
    sleepScore: 71,
    evaClearance: "CONDITIONAL",
    evaClearanceReason: "Mild dehydration & Stage-2 Space Motion Sickness. Rehydration mandated before airlock egress.",
    lastUrineTest: {
      specificGravity: 1.028,
      ketones: "Trace",
      microalbumin: 28,
      pH: 5.6,
      leukocytes: "Trace",
      risk: "Moderate",
      timestamp: "Today · 07:00 UTC",
    },
    lastBloodPanel: {
      hematocritPct: 46.8,
      wbcK_uL: 7.9,
      plateletsK_uL: 245,
      hemoglobinG_dL: 15.2,
      microgravityAnemiaShift: true,
    },
    stoolLog: {
      bristolType: 2,
      diversityIndex: 3.42,
      notes: "Slight constipation. Electrolyte retention indicated.",
      timestamp: "Day 142 · 06:45 UTC",
    },
    prescriptions: [
      {
        id: "RX-102",
        type: "Hydration",
        dosage: "0.75L Isotonic Electrolyte Packet + 500mL Water",
        prescribedBy: "Dr. Sarah Chen, MD",
        timestamp: "Today · 07:30 UTC",
        status: "Active",
      },
    ],
  },
  {
    id: "AST-003",
    name: "Marcus Vance",
    role: "Payload & Geochemical Specialist",
    avatar: "MV",
    missionDay: 142,
    status: "nominal",
    healthScore: 91,
    heartRate: 68,
    spo2: 98.8,
    coreTemp: 36.7,
    bloodPressure: "114/74",
    radiationDoseMsv: 0.28,
    smsScore: 1,
    sleepScore: 86,
    evaClearance: "GO",
    lastUrineTest: {
      specificGravity: 1.015,
      ketones: "Negative",
      microalbumin: 8,
      pH: 6.8,
      leukocytes: "Negative",
      risk: "Low",
      timestamp: "Today · 06:15 UTC",
    },
    lastBloodPanel: {
      hematocritPct: 43.5,
      wbcK_uL: 6.4,
      plateletsK_uL: 275,
      hemoglobinG_dL: 14.2,
      microgravityAnemiaShift: false,
    },
    stoolLog: {
      bristolType: 3,
      diversityIndex: 3.91,
      notes: "Nominal digestion pattern.",
      timestamp: "Day 141 · 20:00 UTC",
    },
    prescriptions: [
      {
        id: "RX-103",
        type: "Sleep",
        dosage: "0.5mg Melatonin + 450nm Blue Light Filter at T-30m",
        prescribedBy: "Dr. Sarah Chen, MD",
        timestamp: "Day 140 · 21:00 UTC",
        status: "Completed",
      },
    ],
  },
];

export default function AstroCrewApp() {
  const [role, setRole] = useState<AstroRole>("astronaut");
  const [crew, setCrew] = useState<CrewMemberData[]>(INITIAL_CREW);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>("AST-001");
  const [anonymizedMode, setAnonymizedMode] = useState<boolean>(false);
  const [simulatedLagSeconds, setSimulatedLagSeconds] = useState<number>(324); // 5.4 min light delay

  // Active diagnostic tab for Crew role
  const [diagnosticTab, setDiagnosticTab] = useState<"vitals" | "urinalysis" | "blood" | "gut" | "psych">("vitals");

  // Interactive Urinalysis Testing State
  const [testStripColor, setTestStripColor] = useState<{
    sg: string;
    ket: string;
    alb: string;
    ph: string;
    leu: string;
  }>({
    sg: "#eab308", // Yellow (1.015 - 1.020)
    ket: "#cbd5e1", // Light (Negative)
    alb: "#22c55e", // Green (Normal <15)
    ph: "#eab308", // Light orange (pH 6.5)
    leu: "#cbd5e1", // Off-white (Negative)
  });
  const [stripTested, setStripTested] = useState<boolean>(false);
  const [stripTesting, setStripTesting] = useState<boolean>(false);

  // Self Evaluation State
  const [psychMood, setPsychMood] = useState<number>(4);
  const [psychSms, setPsychSms] = useState<number>(0);
  const [psychSleepQuality, setPsychSleepQuality] = useState<number>(5);
  const [psychFatigue, setPsychFatigue] = useState<number>(2);
  const [psychSubmitted, setPsychSubmitted] = useState<boolean>(false);

  // Doctor Prescription Form State
  const [rxTargetId, setRxTargetId] = useState<string>("AST-002");
  const [rxType, setRxType] = useState<"Exercise" | "Hydration" | "Sleep" | "Radiation Shelter">("Hydration");
  const [rxDosage, setRxDosage] = useState<string>("0.75L Isotonic Salt Solution + 20 min Rest");
  const [rxSuccessToast, setRxSuccessToast] = useState<string | null>(null);

  // Selected astronaut object
  const currentAstronaut = useMemo(
    () => crew.find((c) => c.id === selectedAstronautId) || crew[0],
    [crew, selectedAstronautId]
  );

  // Run visual dipstick simulator
  const handleRunUrinalysis = () => {
    setStripTesting(true);
    setTimeout(() => {
      setTestStripColor({
        sg: "#ca8a04", // 1.020
        ket: "#cbd5e1", // Neg
        alb: "#22c55e", // Norm
        ph: "#84cc16", // pH 6.6
        leu: "#cbd5e1", // Neg
      });
      setStripTesting(false);
      setStripTested(true);
    }, 1200);
  };

  // Submit Countermeasure Prescription (Doctor role)
  const handlePrescribe = (e: React.FormEvent) => {
    e.preventDefault();
    const newRx = {
      id: `RX-${Date.now().toString().slice(-4)}`,
      type: rxType,
      dosage: rxDosage,
      prescribedBy: "Dr. Sarah Chen, MD (Flight Surgeon)",
      timestamp: "Just now (DSN Synced)",
      status: "Active" as const,
    };

    setCrew((prev) =>
      prev.map((c) => (c.id === rxTargetId ? { ...c, prescriptions: [newRx, ...c.prescriptions] } : c))
    );

    setRxSuccessToast(`Prescription ${newRx.id} transmitted to ${crew.find((c) => c.id === rxTargetId)?.name}`);
    setTimeout(() => setRxSuccessToast(null), 4000);
  };

  // Submit Psychological Daily Log (Astronaut role)
  const handlePsychSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPsychSubmitted(true);
    setCrew((prev) =>
      prev.map((c) =>
        c.id === currentAstronaut.id
          ? {
              ...c,
              smsScore: psychSms,
              sleepScore: psychSleepQuality * 20,
              healthScore: Math.min(100, Math.max(70, c.healthScore + (psychMood >= 4 ? 2 : -2))),
            }
          : c
      )
    );
    setTimeout(() => setPsychSubmitted(false), 3500);
  };

  return (
    <div className="min-h-screen bg-[#030612] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────
          TOP NAVIGATION BAR & ROLE SELECTOR
      ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-sky-400/15 bg-[#030612]/90 backdrop-blur-xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Deep Space Light-Time Delay Indicator */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Compass className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white block">
                  AstroCrew <span className="text-cyan-400 font-light">Health</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">
                  Space Medicine Protocol · Bio-Telemetry
                </span>
              </div>
            </Link>

            {/* Simulated Earth-Mars Light Lag Badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-lg border border-white/[0.08] bg-slate-900/60 px-2.5 py-1 text-[11px] font-mono text-slate-400">
              <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>DSN Light Lag: <strong className="text-white">{(simulatedLagSeconds / 60).toFixed(1)}m</strong></span>
              <span className="text-emerald-400 font-bold">● ONLINE</span>
            </div>
          </div>

          {/* 3-Role Access Switcher */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.08]">
            <button
              onClick={() => setRole("astronaut")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                role === "astronaut"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Crew Member</span>
            </button>

            <button
              onClick={() => setRole("doctor")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                role === "doctor"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Flight Surgeon</span>
            </button>

            <button
              onClick={() => setRole("flight_director")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                role === "flight_director"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-400/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Mission Authority</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* ═════════════════════════════════════════════════════════
            ROLE 1: CREW MEMBER (ASTRONAUT) VIEW
        ═════════════════════════════════════════════════════════ */}
        {role === "astronaut" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Astronaut Banner */}
            <div className="rounded-2xl border border-sky-400/20 bg-gradient-to-r from-[#061826]/90 via-[#071324]/85 to-[#040c18]/90 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl border border-cyan-400/40 bg-cyan-500/10 text-cyan-300 flex items-center justify-center font-mono font-bold text-lg">
                  {currentAstronaut.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                    <span>{currentAstronaut.id}</span>
                    <span>·</span>
                    <span>Day {currentAstronaut.missionDay}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold">● BIO-PATCH CONNECTED</span>
                  </div>
                  <h1 className="text-xl font-bold text-white mt-0.5">{currentAstronaut.name}</h1>
                  <p className="text-xs text-slate-400">{currentAstronaut.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Overall Readiness</span>
                  <span className="text-emerald-400 font-bold text-base">{currentAstronaut.healthScore} / 100</span>
                </div>
                <div className="text-right border-l border-white/[0.08] pl-3">
                  <span className="text-[10px] text-slate-400 block uppercase">EVA Egress Status</span>
                  <span className={`font-bold text-xs px-2 py-0.5 rounded ${
                    currentAstronaut.evaClearance === "GO" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {currentAstronaut.evaClearance}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagnostic Station Tabs */}
            <div className="flex items-center gap-1 border-b border-white/[0.08] pb-1 overflow-x-auto [scrollbar-width:none]">
              {[
                { id: "vitals", label: "Physiological Vitals & ECG", icon: Heart },
                { id: "urinalysis", label: "Urinalysis Dipstick Station", icon: Droplet },
                { id: "blood", label: "Blood Cytology & Microgravity Shift", icon: Microscope },
                { id: "gut", label: "Gut Microbiome & Stool Scale", icon: Zap },
                { id: "psych", label: "Daily Psych & Motion Sickness Log", icon: Smile },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = diagnosticTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDiagnosticTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      active
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: PHYSIOLOGICAL VITALS & ECG */}
            {diagnosticTab === "vitals" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* Heart Rate & Live ECG Line */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-red-400 font-semibold">
                      <Heart className="h-3.5 w-3.5 animate-pulse" /> Heart Rate
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">SINUS RHYTHM</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {currentAstronaut.heartRate} <span className="text-xs text-slate-400 font-normal">BPM</span>
                  </div>
                  {/* Simulated ECG SVG Waveform */}
                  <div className="h-8 w-full relative overflow-hidden bg-slate-950/60 rounded-lg border border-white/[0.04]">
                    <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
                      <path
                        d="M0,15 L40,15 L45,5 L50,25 L55,10 L60,15 L100,15 L105,5 L110,25 L115,10 L120,15 L160,15 L165,5 L170,25 L175,10 L180,15 L200,15"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        className="animate-pulse"
                      />
                    </svg>
                  </div>
                </div>

                {/* Blood Oxygen SpO2 */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                      <Droplet className="h-3.5 w-3.5" /> SpO₂ Oxygen
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">SAFE</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {currentAstronaut.spo2} <span className="text-xs text-slate-400 font-normal">%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mt-3">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${currentAstronaut.spo2}%` }} />
                  </div>
                </div>

                {/* Core Body Temp */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Thermometer className="h-3.5 w-3.5" /> Core Temp
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">NOMINAL</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {currentAstronaut.coreTemp} <span className="text-xs text-slate-400 font-normal">°C</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono pt-1">Standard: 36.5–37.5 °C</p>
                </div>

                {/* Blood Pressure */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-sky-400 font-semibold">
                      <Activity className="h-3.5 w-3.5" /> Blood Press.
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">OPTIMAL</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {currentAstronaut.bloodPressure} <span className="text-xs text-slate-400 font-normal">mmHg</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono pt-1">Arterial Tonometry</p>
                </div>

                {/* Cumulative Radiation Dose */}
                <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Shield className="h-3.5 w-3.5" /> Daily Radiation
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">SHIELDED</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-white">
                    {currentAstronaut.radiationDoseMsv} <span className="text-xs text-slate-400 font-normal">mSv</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono pt-1">Limit: 1.5 mSv/day</p>
                </div>

              </div>
            )}

            {/* TAB 2: URINALYSIS DIPSTICK STATION */}
            {diagnosticTab === "urinalysis" && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-cyan-400" /> Space Urinalysis Colorimetric Test Strip Simulator
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Daily microgravity nephrolithiasis (kidney stone) and hydration assay
                    </p>
                  </div>
                  <button
                    onClick={handleRunUrinalysis}
                    disabled={stripTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-xs font-bold text-[#03142c] hover:bg-cyan-400 transition disabled:opacity-50"
                  >
                    {stripTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    <span>{stripTesting ? "Analyzing Strip..." : "Dip Test Strip"}</span>
                  </button>
                </div>

                {/* Colorimetric Dipstick Pad Visualizer */}
                <div className="p-4 rounded-xl border border-white/[0.06] bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 block">Colorimetric Reagent Strip (5-Parameter)</span>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950/80 border border-white/[0.08]">
                      <div className="w-4 h-24 rounded-full bg-slate-700 p-1 flex flex-col justify-between items-center shadow-inner">
                        <div className="w-2.5 h-3 rounded-sm transition-colors duration-700" style={{ backgroundColor: testStripColor.sg }} title="Specific Gravity" />
                        <div className="w-2.5 h-3 rounded-sm transition-colors duration-700" style={{ backgroundColor: testStripColor.ket }} title="Ketones" />
                        <div className="w-2.5 h-3 rounded-sm transition-colors duration-700" style={{ backgroundColor: testStripColor.alb }} title="Microalbumin" />
                        <div className="w-2.5 h-3 rounded-sm transition-colors duration-700" style={{ backgroundColor: testStripColor.ph }} title="pH" />
                        <div className="w-2.5 h-3 rounded-sm transition-colors duration-700" style={{ backgroundColor: testStripColor.leu }} title="Leukocytes" />
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 space-y-1">
                        <div>1. Specific Gravity (SG): <strong>{currentAstronaut.lastUrineTest.specificGravity}</strong></div>
                        <div>2. Ketones: <strong>{currentAstronaut.lastUrineTest.ketones}</strong></div>
                        <div>3. Microalbumin: <strong>{currentAstronaut.lastUrineTest.microalbumin} mg/dL</strong></div>
                        <div>4. Urine pH: <strong>{currentAstronaut.lastUrineTest.pH}</strong></div>
                        <div>5. Leukocytes: <strong>{currentAstronaut.lastUrineTest.leukocytes}</strong></div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono space-y-1">
                    <span className="text-xs text-slate-400 block">Nephrolithiasis Risk Score</span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                      RISK: {currentAstronaut.lastUrineTest.risk.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-slate-400">Citrate excretion within target limits</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BLOOD PANEL & CYTOLOGY */}
            {diagnosticTab === "blood" && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Microscope className="h-4 w-4 text-purple-400" /> Microgravity Blood Cytology Panel
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Capillary Cartridge Assay</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 uppercase block">Hematocrit (HCT)</span>
                    <span className="text-lg font-bold text-white">{currentAstronaut.lastBloodPanel.hematocritPct}%</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Nominal (40-52%)</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 uppercase block">White Blood Cells</span>
                    <span className="text-lg font-bold text-white">{currentAstronaut.lastBloodPanel.wbcK_uL} k/μL</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Immune Stable</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 uppercase block">Platelets (PLT)</span>
                    <span className="text-lg font-bold text-white">{currentAstronaut.lastBloodPanel.plateletsK_uL} k/μL</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Target Band</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 uppercase block">Hemoglobin (HGB)</span>
                    <span className="text-lg font-bold text-white">{currentAstronaut.lastBloodPanel.hemoglobinG_dL} g/dL</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">Oxygen Carrier OK</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-sky-400/15 bg-sky-500/[0.04] text-xs font-mono text-slate-300">
                  <p className="font-semibold text-sky-300 mb-0.5">Spaceflight-Induced Anemia Monitor:</p>
                  <p>Red cell mass reduction index: <strong>0.2%</strong> (Well below 10% threshold). Hemolysis markers nominal.</p>
                </div>
              </div>
            )}

            {/* TAB 4: GUT MICROBIOME & STOOL LOG */}
            {diagnosticTab === "gut" && (
              <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" /> Gut Microbiome &amp; Bristol Stool Scale
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Microbiome Alpha Diversity</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-slate-900/40 space-y-2">
                    <span className="text-xs font-mono text-slate-400 block">Shannon Diversity Index (Target: &gt;3.5)</span>
                    <div className="text-2xl font-bold font-mono text-emerald-400">
                      {currentAstronaut.stoolLog.diversityIndex}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      High diversity correlates with robust immune response and SCFA (Short Chain Fatty Acid) synthesis.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-white/[0.06] bg-slate-900/40 space-y-2">
                    <span className="text-xs font-mono text-slate-400 block">Bristol Stool Scale Classification</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        Type {currentAstronaut.stoolLog.bristolType}
                      </span>
                      <span className="text-xs font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        IDEAL SMOOTH
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{currentAstronaut.stoolLog.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: DAILY PSYCH & MOTION SICKNESS LOG */}
            {diagnosticTab === "psych" && (
              <form onSubmit={handlePsychSubmit} className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Smile className="h-4 w-4 text-amber-400" /> Daily Psychological &amp; Space Motion Sickness (SMS) Log
                  </h2>
                  <span className="text-xs font-mono text-slate-400">Self-Evaluation Protocol</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mood Rating */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Overall Mood &amp; Focus (1 to 5):</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={psychMood}
                      onChange={(e) => setPsychMood(Number(e.target.value))}
                      className="w-full accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1 (Low)</span>
                      <span className="text-cyan-300 font-bold">Level {psychMood}</span>
                      <span>5 (High)</span>
                    </div>
                  </div>

                  {/* SMS Score */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Space Motion Sickness (Graybiel Scale):</label>
                    <select
                      value={psychSms}
                      onChange={(e) => setPsychSms(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="0">0 - None (Asymptomatic)</option>
                      <option value="1">I - Mild (Episodic Discomfort)</option>
                      <option value="2">II - Moderate (Nausea / Vestibular Shift)</option>
                      <option value="3">III - Severe (Active Emesis)</option>
                    </select>
                  </div>

                  {/* Sleep Quality */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Sleep Restfulness (1 to 5):</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={psychSleepQuality}
                      onChange={(e) => setPsychSleepQuality(Number(e.target.value))}
                      className="w-full accent-emerald-400"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1 (Restless)</span>
                      <span className="text-emerald-300 font-bold">{psychSleepQuality}/5</span>
                      <span>5 (Deep REM)</span>
                    </div>
                  </div>

                  {/* Fatigue */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300 block">Cognitive Fatigue (1 to 5):</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={psychFatigue}
                      onChange={(e) => setPsychFatigue(Number(e.target.value))}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1 (Alert)</span>
                      <span className="text-amber-300 font-bold">{psychFatigue}/5</span>
                      <span>5 (Exhausted)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {psychSubmitted ? (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Self-evaluation transmitted to Flight Surgeon log.
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-xs font-bold text-[#03142c] hover:bg-cyan-400 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Daily Log</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            ROLE 2: FLIGHT SURGEON (DOCTOR / MEDICAL OFFICER) VIEW
        ═════════════════════════════════════════════════════════ */}
        {role === "doctor" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header */}
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-[#051f18]/90 via-[#071720]/85 to-[#040c18]/90 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                  Flight Surgeon Clinical Console
                </span>
                <h1 className="text-xl font-bold text-white mt-1">Crew Triage &amp; Prescription Station</h1>
                <p className="text-xs text-slate-400">
                  Live multi-astronaut clinical review, telemetry trends, and countermeasure dispatch.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">Active Crew Under Watch: <strong className="text-white">3</strong></span>
                <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                  TRIAGE: NOMINAL
                </span>
              </div>
            </div>

            {/* Crew Triage Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {crew.map((ast) => {
                const isSelected = ast.id === selectedAstronautId;
                return (
                  <div
                    key={ast.id}
                    onClick={() => setSelectedAstronautId(ast.id)}
                    className={`cursor-pointer rounded-2xl border p-4.5 transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        : "border-white/[0.08] bg-[#071324]/60 hover:border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-800 text-cyan-300 font-mono font-bold flex items-center justify-center">
                          {ast.avatar}
                        </div>
                        <div>
                          <p className="text-xs font-mono text-slate-400">{ast.id}</p>
                          <p className="text-sm font-bold text-white">{ast.name}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          ast.status === "nominal"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {ast.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block">HR</span>
                        <span className="font-bold text-white">{ast.heartRate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">SpO₂</span>
                        <span className="font-bold text-cyan-300">{ast.spo2}%</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">SCORE</span>
                        <span className="font-bold text-emerald-400">{ast.healthScore}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Astronaut Clinical Detail & Rx Dispatch */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Diagnostics Review (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="h-4 w-4 text-sky-400" /> Diagnostics Record: {currentAstronaut.name}
                  </h3>
                  <span className="text-xs font-mono text-slate-400">{currentAstronaut.id}</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl border border-white/[0.06] bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Urinalysis Nephrolithiasis Assay</span>
                      <span className="text-white font-bold">SG {currentAstronaut.lastUrineTest.specificGravity} · pH {currentAstronaut.lastUrineTest.pH} · Ketones {currentAstronaut.lastUrineTest.ketones}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Risk: {currentAstronaut.lastUrineTest.risk}</span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/[0.06] bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Microgravity Blood Panel</span>
                      <span className="text-white font-bold">HCT {currentAstronaut.lastBloodPanel.hematocritPct}% · WBC {currentAstronaut.lastBloodPanel.wbcK_uL} · HGB {currentAstronaut.lastBloodPanel.hemoglobinG_dL} g/dL</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Cytology Stable</span>
                  </div>

                  <div className="p-3 rounded-xl border border-white/[0.06] bg-slate-900/40 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Space Motion Sickness Index</span>
                      <span className="text-white font-bold">Graybiel Score: Level {currentAstronaut.smsScore} · Sleep {currentAstronaut.sleepScore}/100</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-300">Monitored</span>
                  </div>
                </div>

                {/* Active Prescriptions list */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Active Clinical Orders</span>
                  {currentAstronaut.prescriptions.map((rx) => (
                    <div key={rx.id} className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] text-xs font-mono space-y-0.5">
                      <div className="flex justify-between text-emerald-300 font-bold">
                        <span>{rx.id} · {rx.type} Protocol</span>
                        <span>{rx.status}</span>
                      </div>
                      <p className="text-slate-200">{rx.dosage}</p>
                      <span className="text-[10px] text-slate-400 block">{rx.timestamp} · {rx.prescribedBy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order & Prescription Dispatch Form (5 cols) */}
              <form onSubmit={handlePrescribe} className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 space-y-4">
                <div className="border-b border-white/[0.06] pb-3">
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-400" /> Prescribe Countermeasure
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Transmit medical order to astronaut HUD</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 block mb-1">Target Crew Member:</label>
                    <select
                      value={rxTargetId}
                      onChange={(e) => setRxTargetId(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-900 px-3 py-2 text-white"
                    >
                      {crew.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Countermeasure Protocol:</label>
                    <select
                      value={rxType}
                      onChange={(e) => setRxType(e.target.value as any)}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-900 px-3 py-2 text-white"
                    >
                      <option value="Hydration">Hydration &amp; Electrolyte Solution</option>
                      <option value="Exercise">CEVIS / ARED Exercise Extension</option>
                      <option value="Sleep">Sleep Phase / Circadian Aid</option>
                      <option value="Radiation Shelter">Radiation Shielding Protocol</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Dosage &amp; Prescription Instructions:</label>
                    <textarea
                      rows={3}
                      value={rxDosage}
                      onChange={(e) => setRxDosage(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-slate-900 p-3 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {rxSuccessToast && (
                  <div className="p-2.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-xs font-mono text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{rxSuccessToast}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-xs font-bold text-[#03142c] hover:bg-emerald-400 transition"
                >
                  <Send className="h-4 w-4" />
                  <span>Transmit Order to Crew</span>
                </button>
              </form>

            </div>

          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            ROLE 3: MISSION AUTHORITY (FLIGHT DIRECTOR / JSC) VIEW
        ═════════════════════════════════════════════════════════ */}
        {role === "flight_director" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header & Space HIPAA Anonymized Mode Switch */}
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#170a24]/90 via-[#0d0f1e]/85 to-[#040c18]/90 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold block">
                  Mission Authority · NASA JSC / ESA Flight Directorate
                </span>
                <h1 className="text-xl font-bold text-white mt-1">EVA Clearance &amp; Mission Health Matrix</h1>
                <p className="text-xs text-slate-400">
                  Combat/EVA readiness assessment, spacewalk authorization, and privacy-preserving aggregate telemetry.
                </p>
              </div>

              {/* Space HIPAA Toggle */}
              <button
                onClick={() => setAnonymizedMode(!anonymizedMode)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  anonymizedMode
                    ? "bg-purple-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                    : "bg-slate-900/60 text-slate-300 border-white/[0.08] hover:bg-slate-800"
                }`}
              >
                {anonymizedMode ? <EyeOff className="h-4 w-4 text-purple-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                <span>{anonymizedMode ? "Space HIPAA Mode: ACTIVE" : "Space HIPAA Mode: OFF"}</span>
              </button>
            </div>

            {/* Mission Health Index & Aggregate Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#071324]/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Overall Crew Combat Readiness</span>
                <div className="text-3xl font-bold text-emerald-400">94.2%</div>
                <p className="text-[10px] text-slate-400">All 3 crew members flight-certified</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#071324]/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">ECLSS Partial Pressure Index</span>
                <div className="text-3xl font-bold text-white">101.3 <span className="text-xs font-normal">kPa</span></div>
                <p className="text-[10px] text-emerald-400">● 21.2% O₂ · CO₂ Scrubbing Nominal</p>
              </div>

              <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#071324]/60 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase block">Scheduled EVA Egress Window</span>
                <div className="text-3xl font-bold text-cyan-300">T-04:20:00</div>
                <p className="text-[10px] text-slate-400">Airlock prep in progress</p>
              </div>
            </div>

            {/* EVA (Spacewalk) Clearance Matrix Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-purple-400" /> Crew EVA (Spacewalk) Clearance Matrix
                </h3>
                <span className="text-xs font-mono text-slate-400">Automated Flight Rules Rule 4.12</span>
              </div>

              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500">
                      <th className="pb-2">Crew Member</th>
                      <th className="pb-2 text-center">Cardio Readiness</th>
                      <th className="pb-2 text-center">Hydration Status</th>
                      <th className="pb-2 text-center">Psych &amp; Vestibular</th>
                      <th className="pb-2 text-center">Radiation Reserve</th>
                      <th className="pb-2 text-right">Flight Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {crew.map((ast) => (
                      <tr key={ast.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 text-white font-bold">
                          {anonymizedMode ? `Crew Specialist [${ast.id}]` : `${ast.name} (${ast.role})`}
                        </td>
                        <td className="py-3 text-center text-emerald-400">{anonymizedMode ? "PASS" : `${ast.heartRate} BPM (Normal)`}</td>
                        <td className="py-3 text-center text-cyan-300">{anonymizedMode ? "PASS" : `SG ${ast.lastUrineTest.specificGravity}`}</td>
                        <td className="py-3 text-center text-slate-200">{anonymizedMode ? "PASS" : `SMS L-${ast.smsScore}`}</td>
                        <td className="py-3 text-center text-amber-400">{anonymizedMode ? "OK" : `${ast.radiationDoseMsv} mSv`}</td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              ast.evaClearance === "GO"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {ast.evaClearance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Space HIPAA Info Dialog */}
            <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.04] text-xs font-mono text-slate-300 flex items-start gap-3">
              <Lock className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-300">Space Medicine Zero-Knowledge Data Protection (Space HIPAA):</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, individual astronaut physiological vitals are cryptographically masked from non-medical Flight Directors. Only aggregate readiness indicators and automated clearance badges are rendered.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
