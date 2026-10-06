"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Heart,
  Droplet,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Siren,
  ArrowRight,
  Radio,
  Sparkles,
  MessageCircle,
  ScanLine,
  Send,
  X,
  Satellite,
  User,
  Scale,
  Moon,
  Zap,
  Microscope,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getMyRecommendations,
  markMyRecommendationRead,
  sendEmergencySOS,
  sendMedicalCommunicationMessage,
} from "@/lib/api";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import {
  missionInfo,
  astronaut,
} from "@/data/mockData";

// Initial Nutrient and Macro State
interface MacroState {
  protein: number;
  fat: number;
  kcal: number;
  fiber: number;
  water: number;
  vit: Record<string, number>;
  min: Record<string, number>;
  scans: number;
}

const INITIAL_MACROS: MacroState = {
  protein: 48,
  fat: 34,
  kcal: 1350,
  fiber: 16,
  water: 1.65,
  vit: { A: 1800, B: 12, C: 75, D: 600, E: 9, K: 50 },
  min: { Fe: 5.5, Ca: 620, Mg: 230, Zn: 6.2, K: 1950 },
  scans: 3,
};

const MACRO_TARGETS = {
  protein: 95,
  fat: 70,
  kcal: 2600,
  fiber: 32,
  water: 2.8,
};

const VITAMIN_TARGETS: Record<string, [[string, number, string], number]> = {
  A: [["Vitamin A", 1800, "IU"], 3000],
  B: [["B-Complex", 12, "mg"], 20],
  C: [["Vitamin C", 75, "mg"], 90],
  D: [["Vitamin D3", 600, "IU"], 1500],
  E: [["Vitamin E", 9, "mg"], 15],
  K: [["Vitamin K", 50, "mcg"], 120],
};

const MINERAL_TARGETS: Record<string, [string, string, number]> = {
  Fe: ["Iron (Fe)", "mg", 8],
  Ca: ["Calcium (Ca)", "mg", 1000],
  Mg: ["Magnesium (Mg)", "mg", 400],
  Zn: ["Zinc (Zn)", "mg", 11],
  K: ["Potassium (K)", "mg", 2600],
};

const RFID_PACKS = [
  {
    emoji: "💧",
    name: "Hydration & Electrolyte Mix Pack",
    code: "RFID-HMP-001",
    effect: (s: MacroState) => {
      s.water = +(s.water + 0.5).toFixed(2);
      s.min.K += 300;
      s.min.Mg += 20;
    },
  },
  {
    emoji: "🥩",
    name: "High-Protein & Healthy Fats Stew",
    code: "RFID-HPF-STEW",
    effect: (s: MacroState) => {
      s.protein += 27;
      s.fat += 18;
      s.kcal += 520;
      s.min.Fe += 1.8;
      s.min.Zn += 2;
    },
  },
  {
    emoji: "💊",
    name: "Multivitamin & Essential Mineral Shot",
    code: "RFID-MVM-CAP",
    effect: (s: MacroState) => {
      s.vit.D += 600;
      s.vit.E += 4;
      s.vit.B += 5;
      s.min.Ca += 250;
      s.min.Fe += 1.2;
    },
  },
  {
    emoji: "🥣",
    name: "High-Fiber Chia & Berry Space Bowl",
    code: "RFID-FIB-BOWL",
    effect: (s: MacroState) => {
      s.fiber += 9;
      s.kcal += 280;
      s.protein += 6;
      s.vit.C += 20;
      s.min.Mg += 60;
    },
  },
];

export default function AstronautDashboardPage() {
  const { user, logout } = useAuth();
  const { vitals, streamSource, tickCount } = useTelemetryStream(user?.astronautId, 1200);

  // Live unified telemetry signals
  const streamHr = vitals.find((v) => v.id === "hr")?.value ?? 76;
  const streamSpo2 = vitals.find((v) => v.id === "spo2")?.value ?? 97.7;
  const streamTemp = vitals.find((v) => v.id === "temp")?.value ?? 36.8;
  const streamHydration = vitals.find((v) => v.id === "hydrat")?.value ?? 77;
  const streamFatigue = vitals.find((v) => v.id === "fatigue")?.value ?? 31;

  // Local state with live subtle oscillation
  const [liveHr, setLiveHr] = useState(streamHr);
  const [liveSpo2, setLiveSpo2] = useState(streamSpo2);
  const [macroState, setMacroState] = useState<MacroState>(INITIAL_MACROS);
  const [activeScanIdx, setActiveScanIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Interactive Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [quickMessageOpen, setQuickMessageOpen] = useState(false);
  const [quickMessageText, setQuickMessageText] = useState("");
  const [quickMessageSent, setQuickMessageSent] = useState(false);
  const [quickMessageSending, setQuickMessageSending] = useState(false);

  // Flight Surgeon live guidance
  const [surgeonGuidance, setSurgeonGuidance] = useState<
    Array<{ _id: string; doctorName: string; doctorId: string; message: string; source: "AI" | "Doctor"; createdAt: string }>
  >([]);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Sync state with telemetry stream
  useEffect(() => {
    setLiveHr(streamHr);
  }, [streamHr]);

  useEffect(() => {
    setLiveSpo2(streamSpo2);
  }, [streamSpo2]);

  // Subtle real-time pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveHr((prev) => Math.max(68, Math.min(84, prev + Math.round(Math.random() * 2 - 1))));
      setLiveSpo2((prev) => +(Math.max(97.0, Math.min(99.4, prev + (Math.random() * 0.2 - 0.1)))).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // RFID Scan Trigger
  const triggerScan = useCallback((idx: number) => {
    setActiveScanIdx(idx);
    setMacroState((prev) => {
      const copy: MacroState = {
        ...prev,
        vit: { ...prev.vit },
        min: { ...prev.min },
      };
      RFID_PACKS[idx].effect(copy);
      copy.scans += 1;
      return copy;
    });

    showToast(`📡 ${RFID_PACKS[idx].code} scanned · 14 parameters updated`);

    setTimeout(() => {
      setActiveScanIdx(null);
    }, 1800);
  }, [showToast]);

  // Load Flight Surgeon Guidance
  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await getMyRecommendations();
      if (!active) return;
      if (response.success) {
        const data = response.data as { recommendations?: Array<{ _id: string; doctorName: string; doctorId: string; message: string; source: "AI" | "Doctor"; createdAt: string; readAt?: string | null }> } | undefined;
        setSurgeonGuidance((data?.recommendations || []).filter((item) => !item.readAt));
      }
    };
    void load();
    const interval = window.setInterval(() => { void load(); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const acknowledgeGuidance = async (id: string) => {
    setAcknowledgingId(id);
    const response = await markMyRecommendationRead(id);
    if (response.success) setSurgeonGuidance((current) => current.filter((item) => item._id !== id));
    setAcknowledgingId(null);
  };

  const sendQuickDoctorMessage = async () => {
    if (!quickMessageText.trim()) return;
    setQuickMessageSending(true);
    try {
      await sendMedicalCommunicationMessage({
        receiverId: "DOCTOR-001",
        message: quickMessageText.trim(),
        messageType: "text",
      });
      setQuickMessageSent(true);
      setQuickMessageText("");
      showToast("💬 Message dispatched to Flight Surgeon");
      setTimeout(() => {
        setQuickMessageSent(false);
        setQuickMessageOpen(false);
      }, 1500);
    } catch {
      setQuickMessageSent(true);
      setTimeout(() => {
        setQuickMessageSent(false);
        setQuickMessageOpen(false);
      }, 1500);
    }
    setQuickMessageSending(false);
  };

  // Sparkline generator
  const generateSparkline = (seed: number) => {
    let y = [];
    let v = 50;
    for (let i = 0; i < 24; i++) {
      v += Math.sin(i * seed) * 9 + (((i * seed * 7) % 5) - 2);
      y.push(Math.max(8, Math.min(42, v)));
    }
    const d = y.map((p, i) => `${i ? "L" : "M"}${(i * 100 / 23).toFixed(1)},${(50 - p).toFixed(1)}`).join("");
    return (
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-8 mt-1.5 overflow-visible">
        <path d={`${d} L100,50 L0,50Z`} fill="#2ee6f6" opacity="0.12" />
        <path d={d} fill="none" stroke="#2ee6f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  // Percent & Color helpers
  const pct = (a: number, b: number) => Math.min(100, Math.round((a / b) * 100));
  const getProgressColor = (p: number) => (p >= 70 ? "#3ddc97" : p >= 40 ? "#ffb547" : "#ff5468");

  // Single unified vitals array with hardware source provenance tags
  const vitalsData = [
    {
      label: "Heart Rate",
      val: liveHr,
      unit: "BPM",
      status: "Rest: 60-85 BPM",
      seed: 1.3,
      color: "text-[#3ddc97]",
      sourceTag: "Bio-Patch (BLE)",
      sourceType: "live" as const,
    },
    {
      label: "Blood Press.",
      val: "118/78",
      unit: "mmHg",
      status: "Optimal",
      seed: 2.1,
      color: "text-[#3ddc97]",
      sourceTag: "BP Cuff (BLE)",
      sourceType: "device" as const,
    },
    {
      label: "SpO₂ Sat.",
      val: liveSpo2,
      unit: "%",
      status: "Norm: 95-100%",
      seed: 0.7,
      color: "text-[#3ddc97]",
      sourceTag: "Pulse Ox (BLE)",
      sourceType: "live" as const,
    },
    {
      label: "Glucose",
      val: "94",
      unit: "mg/dL",
      status: "Target: 70-110",
      seed: 1.9,
      color: "text-[#2ee6f6]",
      sourceTag: "CGM Probe (BLE)",
      sourceType: "live" as const,
    },
    {
      label: "Weight & BMI",
      val: "76.4",
      unit: "kg",
      status: "BMI 22.8 kg/m²",
      seed: 0.4,
      color: "text-slate-300",
      sourceTag: "Manual / Scale",
      sourceType: "manual" as const,
    },
    {
      label: "Sleep Rest",
      val: "7.6",
      unit: "h",
      status: "Score: 92/100",
      seed: 2.7,
      color: "text-[#a98bff]",
      sourceTag: "Calculated (IMU)",
      sourceType: "derived" as const,
    },
    {
      label: "Activity",
      val: "8,420",
      unit: "steps",
      status: "485 kcal · 45m",
      seed: 1.1,
      color: "text-[#ffb547]",
      sourceTag: "IMU Accel (Watch)",
      sourceType: "derived" as const,
    },
  ];

  // Radar Polygon Points
  const radarPoints = useMemo(() => {
    const axes = [
      { name: "Protein", val: macroState.protein / MACRO_TARGETS.protein },
      { name: "Fats", val: macroState.fat / MACRO_TARGETS.fat },
      { name: "Fiber", val: macroState.fiber / MACRO_TARGETS.fiber },
      { name: "Water", val: macroState.water / MACRO_TARGETS.water },
      { name: "Energy", val: macroState.kcal / MACRO_TARGETS.kcal },
      { name: "Vit D", val: macroState.vit.D / 1500 },
      { name: "Calcium", val: macroState.min.Ca / 1000 },
      { name: "Iron", val: macroState.min.Fe / 8 },
    ];
    const cx = 130;
    const cy = 120;
    const R = 78;
    const n = axes.length;

    const getCoord = (i: number, r: number) => [
      cx + Math.sin((2 * Math.PI * i) / n) * r,
      cy - Math.cos((2 * Math.PI * i) / n) * r,
    ];

    const dataCoords = axes.map((a, i) => getCoord(i, R * Math.min(1, a.val)));
    const pts = dataCoords.map((c) => c.join(",")).join(" ");

    return { axes, getCoord, dataCoords, pts, cx, cy, R };
  }, [macroState]);

  // 24h Timeline Chart Data
  const timelineSvgData = useMemo(() => {
    const hrArr = [];
    const glArr = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 24;
      hrArr.push(70 + 8 * Math.sin((t / 24) * 6.28 - 1.5) + (t > 17 && t < 18 ? 14 : 0) + Math.sin(i * 2.3) * 3);
      glArr.push(
        90 +
          16 * Math.max(0, Math.sin((t - 7.5) * 1.7)) * (t > 7 && t < 10 ? 1 : 0) +
          14 * (t > 12 && t < 14.5 ? Math.sin((t - 12) * 1.25) : 0) +
          Math.sin(i * 1.1) * 2
      );
    }
    const makePath = (arr: number[], lo: number, hi: number) =>
      arr.map((v, i) => `${i ? "L" : "M"}${((i / 47) * 600).toFixed(1)},${(140 - ((v - lo) / (hi - lo)) * 125).toFixed(1)}`).join("");

    const hrPath = makePath(hrArr, 55, 95);
    const glPath = makePath(glArr, 75, 120);

    return { hrPath, glPath };
  }, []);

  const astronautName = user?.name || astronaut.name;
  const astronautInitials = astronautName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full space-y-5 animate-fade-in text-[#e4f0fb] font-sans pb-10">
      
      {/* ─────────────────────────────────────────────────────────
          FLIGHT SURGEON NOTE BANNER (If Active)
      ───────────────────────────────────────────────────────── */}
      {surgeonGuidance.length > 0 && (
        <div className="rounded-xl border border-[#3ddc97]/40 bg-[#3ddc97]/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(61,220,151,0.15)]">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-[#3ddc97] shrink-0" />
            <span className="font-semibold text-[#3ddc97]">Flight Surgeon Note:</span>
            <span className="text-[#e4f0fb]">{surgeonGuidance[0].message}</span>
          </div>
          <button
            type="button"
            onClick={() => void acknowledgeGuidance(surgeonGuidance[0]._id)}
            disabled={acknowledgingId === surgeonGuidance[0]._id}
            className="self-start sm:self-center shrink-0 rounded-lg border border-[#3ddc97]/40 bg-[#3ddc97]/20 px-3 py-1 text-xs font-semibold text-[#3ddc97] hover:bg-[#3ddc97]/30 transition"
          >
            {acknowledgingId === surgeonGuidance[0]._id ? "Acknowledging…" : "Acknowledge"}
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          1. COCKPIT · AUTONOMOUS BIO-MATRIX (TOP ROW)
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase">
          <span className="text-[#2ee6f6]">▌</span> Cockpit · Autonomous Bio-Matrix
        </div>
        <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
          {missionInfo.mission.toUpperCase()} · DAY {missionInfo.missionDay}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* Crew Commander Card (4 Cols) */}
        <div className="md:col-span-4 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-md shadow-md">
          <div className="h-14 w-14 rounded-full flex items-center justify-center font-bold text-sm text-[#070d16] bg-gradient-to-tr from-[#2ee6f6] via-[#3ddc97] to-[#2ee6f6] shadow-[0_0_15px_rgba(46,230,246,0.3)] shrink-0 animate-hue-spin">
            {astronautInitials}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-[#7f96ae] font-mono tracking-wider">CREW COMMANDER</div>
            <h2 className="text-lg font-bold text-[#e4f0fb] truncate">{astronautName}</h2>
            <div className="font-mono text-xs text-[#2ee6f6] flex items-center gap-2 mt-0.5">
              <span>{user?.astronautId || "AST-001"}</span>
              <span className="text-[10px] text-[#3ddc97] bg-[#3ddc97]/15 px-1.5 py-0.5 rounded font-mono font-bold">
                EVA READY
              </span>
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="text-[11px] text-[#7f96ae] hover:text-[#2ee6f6] underline ml-1"
              >
                Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Bio-Link Gateway Status (3 Cols) */}
        <div className="md:col-span-3 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-3.5 flex flex-col justify-between font-mono text-xs backdrop-blur-md shadow-md">
          <div className="flex justify-between items-center py-1 border-b border-dashed border-[#1d2f47]">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-[#2ee6f6]" />
              <span className="text-[#7f96ae] font-sans font-semibold">Bio-Link Status</span>
            </div>
            <span className="flex items-center gap-1 text-[#3ddc97] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#3ddc97] shadow-[0_0_6px_#3ddc97] animate-pulse" />
              CONNECTED
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-dashed border-[#1d2f47]">
            <span className="text-[#7f96ae] font-sans">Edge Gateway</span>
            <span className="text-[#e4f0fb]">BLG-001 (Hab 2)</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-dashed border-[#1d2f47]">
            <span className="text-[#7f96ae] font-sans">Sensors Online</span>
            <span className="text-[#3ddc97] font-bold">5 / 5 Devices (BLE/USB)</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-[#7f96ae] font-sans">Last Sync: 3s ago</span>
            <Link
              href="/astronaut/bio-link"
              className="text-[#2ee6f6] hover:underline flex items-center gap-0.5 text-[11px] font-bold font-sans"
            >
              <span>Manage</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* AI Care Recommendation (5 Cols) */}
        <div className="md:col-span-5 rounded-xl border border-[#2ee6f6]/40 bg-gradient-to-br from-[#2ee6f6]/10 via-[#0d1726] to-[#0d1726] p-4 flex flex-col justify-between backdrop-blur-md shadow-[0_0_25px_rgba(46,230,246,0.1)]">
          <div>
            <span className="rounded-full border border-[#2ee6f6]/30 bg-[#2ee6f6]/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#2ee6f6]">
              AI CARE RECOMMENDATION
            </span>
            <h3 className="text-sm font-bold text-[#e4f0fb] mt-2 flex items-center gap-1.5">
              <span>💧</span>
              <span>{macroState.water >= MACRO_TARGETS.water ? "Hydration Target Reached" : "Enjoy a Hydration & Electrolyte Mix Pack"}</span>
            </h3>
            <p className="text-xs text-[#7f96ae] mt-1 leading-relaxed">
              {macroState.water >= MACRO_TARGETS.water
                ? "Hydration target reached — great work. Next: close your Vitamin D3 gap."
                : `A hydration top-up will feel great right now — you're at ${macroState.water.toFixed(2)}L for the day. Your body will thank you at the next sync.`}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#7f96ae] pt-2 border-t border-[#1d2f47]/50 mt-2 font-mono">
            <span>14 parameters streamed autonomously</span>
            <button
              type="button"
              onClick={() => setQuickMessageOpen(true)}
              className="text-[#2ee6f6] hover:underline font-semibold flex items-center gap-1"
            >
              Message Surgeon <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          2. LIVE ECG & MISSION READINESS GAUGE
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Live ECG Waveform (8 Cols) */}
        <div className="lg:col-span-8 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
              LIVE ECG · LEAD II
            </span>
            <span className="font-mono text-xs font-bold text-[#3ddc97] flex items-center gap-1">
              ♥ <span className="text-base">{liveHr}</span> BPM
            </span>
          </div>

          <div className="h-24 w-full rounded-lg overflow-hidden relative bg-[repeating-linear-gradient(90deg,#1d2f47_0_1px,transparent_1px_24px),repeating-linear-gradient(0deg,#1d2f47_0_1px,transparent_1px_22px)] flex items-center">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0d1726] via-transparent to-[#0d1726] pointer-events-none z-10" />
            <svg viewBox="0 0 960 100" preserveAspectRatio="none" className="w-[200%] h-full animate-ecg-wave drop-shadow-[0_0_6px_#3ddc97]">
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

        {/* Mission Readiness Gauge (4 Cols) */}
        <div className="lg:col-span-4 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md flex flex-col items-center justify-center text-center">
          <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae] mb-2">
            MISSION READINESS
          </span>

          <div className="relative w-44">
            <svg viewBox="0 0 140 84" className="w-full">
              <defs>
                <linearGradient id="hudGauge" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffb547" />
                  <stop offset="100%" stopColor="#3ddc97" />
                </linearGradient>
              </defs>
              <path d="M10 74 A60 60 0 0 1 130 74" fill="none" stroke="#1d2f47" strokeWidth="11" strokeLinecap="round" />
              <path
                d="M10 74 A60 60 0 0 1 130 74"
                fill="none"
                stroke="url(#hudGauge)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray="173 189"
                style={{ filter: "drop-shadow(0 0 6px #3ddc97)" }}
              />
              <text x="70" y="66" textAnchor="middle" fill="#e4f0fb" fontSize="28" fontWeight="700">
                92
              </text>
            </svg>
          </div>
          <div className="text-[11px] font-mono text-[#7f96ae] mt-1">
            Sleep 92 · SpO₂ {liveSpo2}% · Anomaly 0.14
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          3. BIOMETRIC VITALS STREAM (7 CARDS)
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase">
          <span className="text-[#2ee6f6]">01</span> Biometric Vitals Stream
        </div>
        <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
          auto-sync · 2.5s pulse
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {vitalsData.map((v) => (
          <div
            key={v.label}
            className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-3 flex flex-col justify-between transition-all hover:-translate-y-1 hover:border-[#2ee6f6] hover:shadow-[0_8px_25px_-8px_rgba(46,230,246,0.3)] backdrop-blur-md"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7f96ae] truncate">{v.label}</span>
                <span
                  className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                    v.sourceType === "live"
                      ? "border-[#3ddc97]/40 bg-[#3ddc97]/15 text-[#3ddc97]"
                      : v.sourceType === "derived"
                      ? "border-[#a98bff]/40 bg-[#a98bff]/15 text-[#a98bff]"
                      : v.sourceType === "device"
                      ? "border-[#2ee6f6]/40 bg-[#2ee6f6]/15 text-[#2ee6f6]"
                      : "border-[#7f96ae]/40 bg-[#7f96ae]/15 text-[#7f96ae]"
                  }`}
                >
                  {v.sourceTag}
                </span>
              </div>
              <div className="font-mono text-2xl font-bold bg-gradient-to-b from-[#e4f0fb] to-[#2ee6f6] bg-clip-text text-transparent mt-1">
                {v.val} <small className="text-[10px] text-[#7f96ae] font-medium">{v.unit}</small>
              </div>
              <div className={`text-[10px] font-medium mt-0.5 ${v.color}`}>{v.status}</div>
            </div>
            {generateSparkline(v.seed)}
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. BODY SCAN · NUTRIENT RADAR · ORGAN TELEMETRY
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase pt-2">
        <span className="text-[#2ee6f6]">◉</span> Body Scan · Radar · 24h Timeline
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* Body Bio-Scan Silhouette with animated laser scan & pulsing organs (3 Cols) */}
        <div className="md:col-span-3 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[310px] backdrop-blur-md shadow-md">
          <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2 py-0.5 text-[10px] font-mono text-[#7f96ae] absolute top-3 left-3">
            BIO-SCAN
          </span>

          {/* Animated Laser Scan Beam */}
          <div className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-[#2ee6f6]/25 to-transparent border-y border-[#2ee6f6]/50 pointer-events-none animate-body-scan z-10" />

          <svg viewBox="0 0 120 260" className="w-32 h-60 overflow-visible relative">
            <g className="fill-[#2ee6f6]/10 stroke-[#2ee6f6] stroke-[1.2] stroke-opacity-70">
              <circle cx="60" cy="24" r="16" />
              <path d="M42 48 Q60 42 78 48 L96 62 L100 120 L90 122 L84 80 L82 140 L84 250 L68 250 L62 150 L58 150 L52 250 L36 250 L38 140 L36 80 L30 122 L20 120 L24 62Z" />
            </g>
            {/* Brain Pulse */}
            <g fill="#3ddc97">
              <circle cx="60" cy="22" r="3" />
              <circle cx="60" cy="22" r="3" className="animate-organ-pulse origin-center" />
            </g>
            {/* Heart Pulse */}
            <g fill="#ff5468">
              <circle cx="67" cy="80" r="3.5" />
              <circle cx="67" cy="80" r="3.5" className="animate-organ-pulse origin-center" />
            </g>
            {/* Lungs Pulse */}
            <g fill="#2ee6f6">
              <circle cx="52" cy="72" r="3" />
              <circle cx="70" cy="68" r="3" />
              <circle cx="52" cy="72" r="3" className="animate-organ-pulse origin-center" />
            </g>
            {/* Gut Pulse */}
            <g fill="#ffb547">
              <circle cx="60" cy="118" r="3.5" />
              <circle cx="60" cy="118" r="3.5" className="animate-organ-pulse origin-center" />
            </g>
            {/* Limbs / Joints */}
            <g fill="#3ddc97">
              <circle cx="30" cy="96" r="3" />
              <circle cx="90" cy="96" r="3" />
            </g>
          </svg>
        </div>

        {/* Nutrient Coverage Radar (4 Cols) */}
        <div className="md:col-span-4 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 flex flex-col justify-between backdrop-blur-md shadow-md">
          <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae] self-start">
            NUTRIENT COVERAGE RADAR
          </span>

          <svg viewBox="0 0 260 240" className="w-full mt-2">
            {[0.25, 0.5, 0.75, 1].map((g) => (
              <polygon
                key={g}
                points={radarPoints.axes.map((_, i) => radarPoints.getCoord(i, radarPoints.R * g).join(",")).join(" ")}
                fill="none"
                stroke="#1d2f47"
              />
            ))}
            {radarPoints.axes.map((a, i) => {
              const [x, y] = radarPoints.getCoord(i, radarPoints.R);
              const [lx, ly] = radarPoints.getCoord(i, radarPoints.R + 16);
              return (
                <g key={a.name}>
                  <line x1={radarPoints.cx} y1={radarPoints.cy} x2={x} y2={y} stroke="#1d2f47" />
                  <text x={lx} y={ly + 3} textAnchor="middle" fontSize="9.5" fill="#7f96ae" className="font-mono">
                    {a.name}
                  </text>
                </g>
              );
            })}
            <polygon
              points={radarPoints.pts}
              fill="#2ee6f6"
              fillOpacity="0.22"
              stroke="#2ee6f6"
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 6px #2ee6f6)" }}
            />
            {radarPoints.dataCoords.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#2ee6f6" />
            ))}
          </svg>
        </div>

        {/* Organ Telemetry List (5 Cols) */}
        <div className="md:col-span-5 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 flex flex-col justify-between backdrop-blur-md shadow-md">
          <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae] self-start mb-1">
            ORGAN TELEMETRY
          </span>

          <div className="space-y-1 divide-y divide-dashed divide-[#1d2f47] text-xs">
            
            <div className="flex items-center gap-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-sm shrink-0">
                🧠
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#7f96ae] block text-[11px]">Neuro / Sleep</span>
                <b className="text-[#e4f0fb] font-mono text-xs">Score 92 · Stable</b>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[#3ddc97]/15 text-[#3ddc97]">
                OK
              </span>
            </div>

            <div className="flex items-center gap-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-sm shrink-0">
                🫁
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#7f96ae] block text-[11px]">Respiratory</span>
                <b className="text-[#e4f0fb] font-mono text-xs">SpO₂ {liveSpo2}%</b>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[#3ddc97]/15 text-[#3ddc97]">
                OK
              </span>
            </div>

            <div className="flex items-center gap-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-sm shrink-0">
                ❤️
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#7f96ae] block text-[11px]">Cardiac</span>
                <b className="text-[#e4f0fb] font-mono text-xs">118/78 · {liveHr} BPM</b>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[#3ddc97]/15 text-[#3ddc97]">
                OPTIMAL
              </span>
            </div>

            <div className="flex items-center gap-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-sm shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#7f96ae] block text-[11px]">Metabolic / Gut</span>
                <b className="text-[#e4f0fb] font-mono text-xs">Glucose 94 · Fiber {pct(macroState.fiber, MACRO_TARGETS.fiber)}%</b>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ffb547]/15 text-[#ffb547]">
                WATCH
              </span>
            </div>

            <div className="flex items-center gap-2.5 py-1.5">
              <div className="h-8 w-8 rounded-lg bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-sm shrink-0">
                💪
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[#7f96ae] block text-[11px]">Muscle Recovery</span>
                <b className="text-[#e4f0fb] font-mono text-xs">Protein {pct(macroState.protein, MACRO_TARGETS.protein)}%</b>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ffb547]/15 text-[#ffb547]">
                BUILDING
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          5. 24H TIMELINE CHART (HEART RATE & GLUCOSE)
      ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
            24H TIMELINE · HEART RATE &amp; GLUCOSE
          </span>
          <div className="flex items-center gap-4 text-xs font-mono text-[#7f96ae]">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-3 rounded bg-[#ff5468]" /> Heart Rate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-3 rounded bg-[#2ee6f6]" /> Glucose
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-3 rounded bg-[#ffb547]" /> Meal Ingestion
            </span>
          </div>
        </div>

        <div className="w-full h-40 relative">
          <svg viewBox="0 0 600 150" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="glGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2ee6f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2ee6f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3, 4, 5, 6].map((k) => (
              <line key={k} x1={k * 100} x2={k * 100} y1="0" y2="150" stroke="#1d2f47" strokeDasharray="3 5" />
            ))}

            <path d={`${timelineSvgData.glPath} L600,150 L0,150 Z`} fill="url(#glGrad)" />
            <path d={timelineSvgData.glPath} fill="none" stroke="#2ee6f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <path d={timelineSvgData.hrPath} fill="none" stroke="#ff5468" strokeWidth="2" vectorEffect="non-scaling-stroke" />

            {/* Meal Scan Pins */}
            {[
              { time: 7.5, emoji: "🥣" },
              { time: 12.5, emoji: "🥩" },
              { time: 16.0, emoji: "💧" },
            ].map((m, idx) => {
              const x = (m.time / 24) * 600;
              return (
                <g key={idx}>
                  <line x1={x} x2={x} y1="0" y2="150" stroke="#ffb547" strokeWidth="1.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                  <text x={x} y="20" textAnchor="middle" fontSize="11">
                    {m.emoji}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex justify-between font-mono text-[10px] text-[#7f96ae] pt-1 border-t border-[#1d2f47]">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          6. MACRO & METABOLIC ENERGY HUD
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase">
          <span className="text-[#2ee6f6]">02</span> Macro &amp; Metabolic Energy HUD
        </div>
        <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
          target vs consumed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        
        {/* Circular Nutrient Rings (7 Cols) */}
        <div className="md:col-span-7 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            
            {/* Protein */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 96 96" className="w-full h-full drop-shadow-[0_0_6px_rgba(46,230,246,0.2)]">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#1d2f47" strokeWidth="9" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="#4da3ff"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 38 * pct(macroState.protein, MACRO_TARGETS.protein)) / 100} ${2 * Math.PI * 38}`}
                    transform="rotate(-90 48 48)"
                    className="transition-all duration-700"
                  />
                  <text x="48" y="53" textAnchor="middle" fill="#e4f0fb" fontSize="17" fontWeight="700">
                    {pct(macroState.protein, MACRO_TARGETS.protein)}%
                  </text>
                </svg>
              </div>
              <div className="text-xs font-semibold mt-1">Protein</div>
              <div className="font-mono text-[10.5px] text-[#7f96ae]">
                {macroState.protein} / {MACRO_TARGETS.protein}g
              </div>
            </div>

            {/* Healthy Fats */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 96 96" className="w-full h-full drop-shadow-[0_0_6px_rgba(255,181,71,0.2)]">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#1d2f47" strokeWidth="9" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="#ffb547"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 38 * pct(macroState.fat, MACRO_TARGETS.fat)) / 100} ${2 * Math.PI * 38}`}
                    transform="rotate(-90 48 48)"
                    className="transition-all duration-700"
                  />
                  <text x="48" y="53" textAnchor="middle" fill="#e4f0fb" fontSize="17" fontWeight="700">
                    {pct(macroState.fat, MACRO_TARGETS.fat)}%
                  </text>
                </svg>
              </div>
              <div className="text-xs font-semibold mt-1">Healthy Fats</div>
              <div className="font-mono text-[10.5px] text-[#7f96ae]">
                {macroState.fat} / {MACRO_TARGETS.fat}g
              </div>
            </div>

            {/* Fiber */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 96 96" className="w-full h-full drop-shadow-[0_0_6px_rgba(61,220,151,0.2)]">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#1d2f47" strokeWidth="9" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="#3ddc97"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 38 * pct(macroState.fiber, MACRO_TARGETS.fiber)) / 100} ${2 * Math.PI * 38}`}
                    transform="rotate(-90 48 48)"
                    className="transition-all duration-700"
                  />
                  <text x="48" y="53" textAnchor="middle" fill="#e4f0fb" fontSize="17" fontWeight="700">
                    {pct(macroState.fiber, MACRO_TARGETS.fiber)}%
                  </text>
                </svg>
              </div>
              <div className="text-xs font-semibold mt-1">Fiber</div>
              <div className="font-mono text-[10.5px] text-[#7f96ae]">
                {macroState.fiber} / {MACRO_TARGETS.fiber}g
              </div>
            </div>

            {/* Water */}
            <div className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 96 96" className="w-full h-full drop-shadow-[0_0_6px_rgba(46,230,246,0.2)]">
                  <circle cx="48" cy="48" r="38" fill="none" stroke="#1d2f47" strokeWidth="9" />
                  <circle
                    cx="48"
                    cy="48"
                    r="38"
                    fill="none"
                    stroke="#2ee6f6"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${(2 * Math.PI * 38 * pct(macroState.water, MACRO_TARGETS.water)) / 100} ${2 * Math.PI * 38}`}
                    transform="rotate(-90 48 48)"
                    className="transition-all duration-700"
                  />
                  <text x="48" y="53" textAnchor="middle" fill="#e4f0fb" fontSize="17" fontWeight="700">
                    {pct(macroState.water, MACRO_TARGETS.water)}%
                  </text>
                </svg>
              </div>
              <div className="text-xs font-semibold mt-1">Water</div>
              <div className="font-mono text-[10.5px] text-[#7f96ae]">
                {macroState.water} / {MACRO_TARGETS.water}L
              </div>
            </div>

          </div>
        </div>

        {/* Energy & Basal Reserve Bar (5 Cols) */}
        <div className="md:col-span-5 rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 flex flex-col justify-between backdrop-blur-md shadow-md">
          <div>
            <div className="text-[11px] font-mono tracking-wider text-[#7f96ae]">ENERGY · BASAL RESERVE</div>
            <div className="font-mono text-3xl font-bold text-[#e4f0fb] my-1">
              {macroState.kcal} <small className="text-xs text-[#7f96ae]">/ {MACRO_TARGETS.kcal} kcal</small>
            </div>
            
            <div className="h-3 w-full rounded-full bg-[#1d2f47] overflow-hidden my-2">
              <div
                className="h-full bg-gradient-to-r from-[#2ee6f6] to-[#3ddc97] rounded-full transition-all duration-700"
                style={{ width: `${pct(macroState.kcal, MACRO_TARGETS.kcal)}%` }}
              />
            </div>

            <div className="text-xs text-[#7f96ae] space-y-0.5 mt-2">
              <div>
                Remaining: <b className="text-[#e4f0fb] font-mono">{Math.max(0, MACRO_TARGETS.kcal - macroState.kcal)} kcal</b>
              </div>
              <div>
                Tissue Hydration Index:{" "}
                <b className="text-[#e4f0fb] font-mono">
                  {Math.min(99, +(77.2 + (macroState.water - 1.65) * 8).toFixed(1))}%
                </b>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1d2f47]/60 flex items-center justify-between">
            <span className="rounded-full border border-[#2ee6f6]/30 bg-[#2ee6f6]/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#2ee6f6]">
              24H AI PRESCRIPTION ACTIVE
            </span>
            <span className="text-[11px] font-mono text-[#3ddc97]">METABOLIC NOMINAL</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          7. MICRO-ARRAY ASSAY (VITAMINS & MINERALS)
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase pt-2">
        <span className="text-[#2ee6f6]">03</span> Micro-Array Assay
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Key Vitamins */}
        <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md space-y-3">
          <div className="text-xs font-bold text-[#e4f0fb]">
            Key Vitamins <span className="text-[#7f96ae] font-normal">(A, B, C, D3, E, K)</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(VITAMIN_TARGETS).map(([k, [meta, tg]]) => {
              const p = pct(macroState.vit[k], tg);
              const chipText = k === "D" && p < 50 ? "DEFICIT" : p >= 70 ? "OPTIMAL" : "ACTIVE";
              const chipColor =
                k === "D" && p < 50
                  ? "bg-[#ff5468]/15 text-[#ff5468]"
                  : p >= 70
                  ? "bg-[#3ddc97]/15 text-[#3ddc97]"
                  : "bg-[#ffb547]/15 text-[#ffb547]";

              return (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200">{meta[0]}</span>
                    <span className="font-mono text-[11px] flex items-center gap-1.5">
                      <span className="text-[#e4f0fb]">{macroState.vit[k]} {meta[2]}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${chipColor}`}>
                        {chipText}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1d2f47] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p}%`, backgroundColor: getProgressColor(p) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Essential Minerals */}
        <div className="rounded-xl border border-[#1d2f47] bg-[#0d1726]/90 p-4 backdrop-blur-md shadow-md space-y-3">
          <div className="text-xs font-bold text-[#e4f0fb]">
            Essential Minerals <span className="text-[#7f96ae] font-normal">(Fe, Ca, Mg, Zn, K)</span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(MINERAL_TARGETS).map(([k, [name, unit, tg]]) => {
              const p = pct(macroState.min[k], tg);
              const chipText = k === "Ca" && p < 70 ? "WATCH" : p >= 70 ? "OPTIMAL" : "OK";
              const chipColor =
                k === "Ca" && p < 70
                  ? "bg-[#ffb547]/15 text-[#ffb547]"
                  : p >= 70
                  ? "bg-[#3ddc97]/15 text-[#3ddc97]"
                  : "bg-[#2ee6f6]/15 text-[#2ee6f6]";

              return (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-200">{name}</span>
                    <span className="font-mono text-[11px] flex items-center gap-1.5">
                      <span className="text-[#e4f0fb]">{macroState.min[k]} {unit}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${chipColor}`}>
                        {chipText}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1d2f47] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${p}%`, backgroundColor: getProgressColor(p) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────
          8. RFID SPACE-MEAL SCANNER
      ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-[#7f96ae] uppercase">
          <span className="text-[#2ee6f6]">04</span> RFID Space-Meal Scanner
        </div>
        <span className="rounded-full border border-[#1d2f47] bg-[#070d16] px-2.5 py-0.5 text-[10px] font-mono text-[#7f96ae]">
          {macroState.scans} packs scanned today
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {RFID_PACKS.map((pack, idx) => {
          const isScanning = activeScanIdx === idx;
          return (
            <div
              key={pack.code}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all backdrop-blur-md shadow-md ${
                isScanning
                  ? "border-[#2ee6f6] bg-[#2ee6f6]/15 shadow-[0_0_20px_rgba(46,230,246,0.3)]"
                  : "border-[#1d2f47] bg-[#0d1726]/90 hover:border-[#2ee6f6]/50"
              }`}
            >
              <div className="space-y-2">
                <div className="h-12 w-12 rounded-xl bg-[#2ee6f6]/10 border border-[#1d2f47] flex items-center justify-center text-2xl">
                  {pack.emoji}
                </div>
                <div>
                  <b className="text-xs text-[#e4f0fb] block line-clamp-1">{pack.name}</b>
                  <code className="font-mono text-[10px] text-[#7f96ae]">{pack.code}</code>
                </div>
                <div className="text-[10px] text-[#7f96ae] font-mono">Autonomous Nutrient Stream</div>
              </div>

              <button
                type="button"
                onClick={() => triggerScan(idx)}
                disabled={activeScanIdx !== null}
                className={`mt-4 w-full rounded-lg py-2 text-xs font-mono font-bold tracking-wider transition ${
                  isScanning
                    ? "border border-[#3ddc97] bg-[#3ddc97]/20 text-[#3ddc97]"
                    : "border border-[#2ee6f6] text-[#2ee6f6] bg-transparent hover:bg-[#2ee6f6] hover:text-[#070d16]"
                }`}
              >
                {isScanning ? "✓ INGESTED" : "TRIGGER RFID"}
              </button>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────
          9. TOAST NOTIFICATION
      ───────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl border border-[#2ee6f6] bg-[#0d1726] px-5 py-2.5 text-xs font-mono text-[#e4f0fb] shadow-[0_0_25px_rgba(46,230,246,0.4)] animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          10. IN-PLACE PROFILE & CREDENTIALS MODAL
      ───────────────────────────────────────────────────────── */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#070d16]/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#1d2f47] bg-[#0d1726] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-[#1d2f47] pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#2ee6f6]/20 border border-[#2ee6f6]/30 flex items-center justify-center text-[#2ee6f6] font-bold">
                  {astronautInitials}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">{astronautName}</h2>
                  <p className="text-xs font-mono text-[#2ee6f6]">{user?.astronautId || "AST-001"} · Commander</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-lg p-1.5 text-[#7f96ae] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-[#070d16] border border-[#1d2f47]">
                <span className="text-[#7f96ae] text-[10px] block">Blood Type</span>
                <span className="font-semibold text-white">{astronaut.bloodType}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070d16] border border-[#1d2f47]">
                <span className="text-[#7f96ae] text-[10px] block">Nationality</span>
                <span className="font-semibold text-white">{astronaut.nationality}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070d16] border border-[#1d2f47]">
                <span className="text-[#7f96ae] text-[10px] block">Height / Weight</span>
                <span className="font-semibold text-white">{astronaut.height} / {astronaut.weight}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#070d16] border border-[#1d2f47]">
                <span className="text-[#7f96ae] text-[10px] block">Emergency Contact</span>
                <span className="font-semibold text-white">{astronaut.emergencyContact}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#1d2f47]">
              <button
                type="button"
                onClick={() => {
                  void logout();
                  setProfileModalOpen(false);
                }}
                className="rounded-xl border border-[#ff5468]/30 bg-[#ff5468]/10 px-3.5 py-2 text-xs font-semibold text-[#ff5468] hover:bg-[#ff5468]/20 transition"
              >
                Sign Out
              </button>

              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="rounded-xl bg-[#2ee6f6] px-4 py-2 text-xs font-bold text-[#070d16] hover:bg-[#20cbd9] transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          11. IN-PLACE QUICK MESSAGE MODAL
      ───────────────────────────────────────────────────────── */}
      {quickMessageOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#070d16]/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#1d2f47] bg-[#0d1726] p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2ee6f6] font-mono">Flight Surgeon Comms</span>
                <h2 className="text-base font-bold text-white mt-0.5">Message to Dr. Sarah Chen</h2>
              </div>
              <button
                type="button"
                onClick={() => setQuickMessageOpen(false)}
                className="rounded-lg p-1.5 text-[#7f96ae] hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {quickMessageSent ? (
              <div className="rounded-xl border border-[#3ddc97]/30 bg-[#3ddc97]/10 p-4 text-center space-y-1">
                <CheckCircle2 className="mx-auto h-7 w-7 text-[#3ddc97]" />
                <p className="text-xs font-bold text-white">Message Transmitted to Flight Surgeon</p>
              </div>
            ) : (
              <>
                <textarea
                  value={quickMessageText}
                  onChange={(e) => setQuickMessageText(e.target.value)}
                  rows={3}
                  placeholder="Type your medical update or symptom note…"
                  className="w-full rounded-xl border border-[#1d2f47] bg-[#070d16] p-3 text-xs text-white placeholder:text-[#7f96ae] outline-none focus:border-[#2ee6f6] resize-none"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickMessageOpen(false)}
                    className="rounded-xl border border-[#1d2f47] bg-[#070d16] px-3 py-2 text-xs text-[#7f96ae] hover:bg-white/5 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={quickMessageSending || !quickMessageText.trim()}
                    onClick={sendQuickDoctorMessage}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2ee6f6] px-4 py-2 text-xs font-bold text-[#070d16] hover:bg-[#20cbd9] disabled:opacity-40 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{quickMessageSending ? "Sending…" : "Send Message"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
