"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Heart,
  Droplet,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Scale,
  Moon,
  Dumbbell,
  ScanLine,
  Pill,
  Apple,
  Cpu,
  Clock,
  Sparkles,
  Radio,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMyRecommendations, markMyRecommendationRead } from "@/lib/api";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

// Computed once at module load (outside render) so the HUD initializer stays pure.
const INITIAL_SYNC_TIMESTAMP = Date.now();

// ─── 1. INTERFACES & DATA MODELS ─────────────────────────────────

export interface BiometricVitals {
  heartRate: number;              // 1. BPM
  bloodPressureSystolic: number;  // 2. mmHg (systolic)
  bloodPressureDiastolic: number; // 2. mmHg (diastolic)
  spo2: number;                   // 3. %
  bloodGlucose: number;           // 4. mg/dL
  bodyWeightKg: number;           // 5. kg
  bmi: number;                    // 5. kg/m²
  sleepHours: number;             // 6. Hours
  sleepQualityScore: number;      // 6. Score (0 - 100)
  activeSteps: number;            // 7. Steps
  activeCaloriesBurned: number;   // 7. kcal
  activeWorkoutMinutes: number;   // 7. Minutes
  coreBodyTemp: number;           // °C
  hydrationTissuePct: number;     // %
  lastSyncTimestamp: number;
}

export interface MacroNutrients {
  proteinG: number;               // 8. Protein
  healthyFatsG: number;           // 9. Healthy Fats
  caloriesKcal: number;           // 10. Calories / Energy
  fiberG: number;                 // 11. Dietary Fiber
  hydrationL: number;             // 12. Water / Fluid Liters
}

export interface MicroVitamins {
  vitaminA_IU: number;            // 13. Vitamin A
  vitaminB_Complex_mg: number;    // 13. B-Complex
  vitaminC_mg: number;            // 13. Vitamin C
  vitaminD3_IU: number;           // 13. Vitamin D3
  vitaminE_mg: number;            // 13. Vitamin E
  vitaminK_mcg: number;           // 13. Vitamin K
}

export interface MicroMinerals {
  iron_mg: number;                // 14. Iron (Fe)
  calcium_mg: number;             // 14. Calcium (Ca)
  magnesium_mg: number;           // 14. Magnesium (Mg)
  zinc_mg: number;                // 14. Zinc (Zn)
  potassium_mg: number;           // 14. Potassium (K)
}

export interface NutritionState {
  macros: MacroNutrients;
  vitamins: MicroVitamins;
  minerals: MicroMinerals;
  scannedPacksCount: number;
  lastScannedPackName?: string;
}

export interface TargetsState {
  macros: MacroNutrients;
  vitamins: MicroVitamins;
  minerals: MicroMinerals;
}

export interface RFIDPackItem {
  id: string;
  name: string;
  category: "HYDRATION" | "MACRO_MEAL" | "MICRONUTRIENT" | "FIBER_SUPERFOOD";
  emoji: string;
  badge: string;
  macros: Partial<MacroNutrients>;
  vitamins: Partial<MicroVitamins>;
  minerals: Partial<MicroMinerals>;
}

// ─── 2. RFID MEAL PACK CATALOGUE ─────────────────────────────────

const RFID_SPACE_PACKS: RFIDPackItem[] = [
  {
    id: "RFID-HMP-001",
    name: "Hydration & Electrolyte Mix Pack",
    category: "HYDRATION",
    emoji: "💧",
    badge: "border-cyan-500/40 text-cyan-300 bg-cyan-500/10",
    macros: { hydrationL: 0.75, caloriesKcal: 45 },
    vitamins: { vitaminC_mg: 80 },
    minerals: { potassium_mg: 450, magnesium_mg: 120 },
  },
  {
    id: "RFID-HPF-STEW",
    name: "High-Protein & Healthy Fats Stew",
    category: "MACRO_MEAL",
    emoji: "🥩",
    badge: "border-purple-500/40 text-purple-300 bg-purple-500/10",
    macros: { proteinG: 42, healthyFatsG: 22, caloriesKcal: 560, hydrationL: 0.25, fiberG: 4 },
    vitamins: { vitaminB_Complex_mg: 8, vitaminD3_IU: 400 },
    minerals: { iron_mg: 6.5, zinc_mg: 4.8, potassium_mg: 320 },
  },
  {
    id: "RFID-MVM-CAP",
    name: "Multivitamin & Essential Mineral Shot",
    category: "MICRONUTRIENT",
    emoji: "💊",
    badge: "border-emerald-500/40 text-emerald-300 bg-emerald-500/10",
    macros: { hydrationL: 0.15, caloriesKcal: 20 },
    vitamins: {
      vitaminA_IU: 2500,
      vitaminB_Complex_mg: 15,
      vitaminC_mg: 120,
      vitaminD3_IU: 1000,
      vitaminE_mg: 15,
      vitaminK_mcg: 80,
    },
    minerals: { iron_mg: 8.0, calcium_mg: 400, magnesium_mg: 150, zinc_mg: 5.5 },
  },
  {
    id: "RFID-FIB-BOWL",
    name: "High-Fiber Chia & Berry Space Bowl",
    category: "FIBER_SUPERFOOD",
    emoji: "🥣",
    badge: "border-amber-500/40 text-amber-300 bg-amber-500/10",
    macros: { fiberG: 14, healthyFatsG: 12, caloriesKcal: 320, proteinG: 10, hydrationL: 0.2 },
    vitamins: { vitaminC_mg: 45, vitaminE_mg: 8 },
    minerals: { calcium_mg: 220, magnesium_mg: 90, potassium_mg: 280 },
  },
];

// ─── 3. PRESCRIPTION TARGETS & INITIAL INTAKE ────────────────────

const TARGETS: TargetsState = {
  macros: {
    proteinG: 95,            // 8. Target Protein
    healthyFatsG: 70,        // 9. Target Healthy Fats
    caloriesKcal: 2600,      // 10. Target Energy
    fiberG: 32,              // 11. Target Fiber
    hydrationL: 2.8,         // 12. Target Hydration
  },
  vitamins: {
    vitaminA_IU: 3000,
    vitaminB_Complex_mg: 20,
    vitaminC_mg: 100,
    vitaminD3_IU: 1200,
    vitaminE_mg: 15,
    vitaminK_mcg: 90,
  },
  minerals: {
    iron_mg: 10,
    calcium_mg: 1000,
    magnesium_mg: 400,
    zinc_mg: 11,
    potassium_mg: 3400,
  },
};

const INITIAL_INTAKE: NutritionState = {
  macros: {
    proteinG: 48,
    healthyFatsG: 34,
    caloriesKcal: 1350,
    fiberG: 16,
    hydrationL: 1.65,
  },
  vitamins: {
    vitaminA_IU: 1800,
    vitaminB_Complex_mg: 12,
    vitaminC_mg: 75,
    vitaminD3_IU: 600,
    vitaminE_mg: 9,
    vitaminK_mcg: 50,
  },
  minerals: {
    iron_mg: 5.5,
    calcium_mg: 620,
    magnesium_mg: 230,
    zinc_mg: 6.2,
    potassium_mg: 1950,
  },
  scannedPacksCount: 3,
};

// ─── 4. MAIN COMPONENT ───────────────────────────────────────────

export default function AstronautDashboardPage() {
  const { user } = useAuth();
  const liveTelemetry = useTelemetryStream(user?.astronautId);

  // 1. Telemetry State (7 Biometric Core Groups)
  const [telemetry, setTelemetry] = useState<BiometricVitals>({
    heartRate: 72,
    bloodPressureSystolic: 118,
    bloodPressureDiastolic: 78,
    spo2: 98.6,
    bloodGlucose: 94,
    bodyWeightKg: 76.4,
    bmi: 22.8,
    sleepHours: 7.6,
    sleepQualityScore: 92,
    activeSteps: 8420,
    activeCaloriesBurned: 485,
    activeWorkoutMinutes: 45,
    coreBodyTemp: 36.8,
    hydrationTissuePct: 77,
    lastSyncTimestamp: INITIAL_SYNC_TIMESTAMP,
  });

  const [tick, setTick] = useState(0);

  // 2. Nutrition State (7 Nutrient Core Groups)
  const [intake, setIntake] = useState<NutritionState>(INITIAL_INTAKE);

  // 3. RFID Scanning Interactive State
  const [scanningPackId, setScanningPackId] = useState<string | null>(null);
  const [scanCelebration, setScanCelebration] = useState<{
    packName: string;
    highlights: string[];
  } | null>(null);

  // ─── REAL-TIME TELEMETRY ENGINE (100 Hz Sync simulation) ────────
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const byId = Object.fromEntries(liveTelemetry.vitals.map((vital) => [vital.id, vital.value]));
      setTelemetry((prev) => ({
        ...prev,
        heartRate: Math.round(Number(byId.hr ?? prev.heartRate)),
        spo2: Number(byId.spo2 ?? prev.spo2),
        hydrationTissuePct: Number(byId.hydrat ?? prev.hydrationTissuePct),
        coreBodyTemp: Number(byId.temp ?? prev.coreBodyTemp),
        lastSyncTimestamp: liveTelemetry.lastUpdatedAt,
      }));
      setTick(liveTelemetry.tickCount % 1000);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [liveTelemetry.lastUpdatedAt, liveTelemetry.tickCount, liveTelemetry.vitals]);

  // ─── FLIGHT SURGEON CALM GUIDANCE (non-alarm, gentle wording) ────
  const [surgeonGuidance, setSurgeonGuidance] = useState<
    Array<{ _id: string; doctorName: string; doctorId: string; message: string; source: "AI" | "Doctor"; createdAt: string }>
  >([]);
  const [guidanceLoaded, setGuidanceLoaded] = useState(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const response = await getMyRecommendations();
      if (!active) return;
      if (response.success) {
        const data = response.data as { recommendations?: Array<{ _id: string; doctorName: string; doctorId: string; message: string; source: "AI" | "Doctor"; createdAt: string; readAt?: string | null }> } | undefined;
        setSurgeonGuidance((data?.recommendations || []).filter((item) => !item.readAt));
        setGuidanceLoaded(true);
      }
    };
    void load();
    const interval = window.setInterval(() => { void load(); }, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const acknowledgeGuidance = async (id: string) => {
    setAcknowledgingId(id);
    const response = await markMyRecommendationRead(id);
    setAcknowledgingId(null);
    if (response.success) setSurgeonGuidance((current) => current.filter((item) => item._id !== id));
  };

  // ─── 1-CLICK RFID MEAL SCAN TRIGGER ─────────────────────────────
  const handleRFIDScan = useCallback((pack: RFIDPackItem) => {
    if (scanningPackId) return;
    setScanningPackId(pack.id);

    setTimeout(() => {
      // 1. Tally Nutrients
      setIntake((prev) => {
        const nextMacros: MacroNutrients = {
          proteinG: prev.macros.proteinG + (pack.macros.proteinG || 0),
          healthyFatsG: prev.macros.healthyFatsG + (pack.macros.healthyFatsG || 0),
          caloriesKcal: prev.macros.caloriesKcal + (pack.macros.caloriesKcal || 0),
          fiberG: prev.macros.fiberG + (pack.macros.fiberG || 0),
          hydrationL: Number((prev.macros.hydrationL + (pack.macros.hydrationL || 0)).toFixed(2)),
        };

        const nextVitamins: MicroVitamins = {
          vitaminA_IU: prev.vitamins.vitaminA_IU + (pack.vitamins.vitaminA_IU || 0),
          vitaminB_Complex_mg: prev.vitamins.vitaminB_Complex_mg + (pack.vitamins.vitaminB_Complex_mg || 0),
          vitaminC_mg: prev.vitamins.vitaminC_mg + (pack.vitamins.vitaminC_mg || 0),
          vitaminD3_IU: prev.vitamins.vitaminD3_IU + (pack.vitamins.vitaminD3_IU || 0),
          vitaminE_mg: prev.vitamins.vitaminE_mg + (pack.vitamins.vitaminE_mg || 0),
          vitaminK_mcg: prev.vitamins.vitaminK_mcg + (pack.vitamins.vitaminK_mcg || 0),
        };

        const nextMinerals: MicroMinerals = {
          iron_mg: Number((prev.minerals.iron_mg + (pack.minerals.iron_mg || 0)).toFixed(1)),
          calcium_mg: prev.minerals.calcium_mg + (pack.minerals.calcium_mg || 0),
          magnesium_mg: prev.minerals.magnesium_mg + (pack.minerals.magnesium_mg || 0),
          zinc_mg: Number((prev.minerals.zinc_mg + (pack.minerals.zinc_mg || 0)).toFixed(1)),
          potassium_mg: prev.minerals.potassium_mg + (pack.minerals.potassium_mg || 0),
        };

        return {
          macros: nextMacros,
          vitamins: nextVitamins,
          minerals: nextMinerals,
          scannedPacksCount: prev.scannedPacksCount + 1,
          lastScannedPackName: pack.name,
        };
      });

      // 2. Instant Bio-Feedback to Telemetry
      setTelemetry((prev) => ({
        ...prev,
        hydrationTissuePct: Math.min(96, prev.hydrationTissuePct + (pack.macros.hydrationL ? 5 : 1)),
        bloodGlucose: Math.min(128, prev.bloodGlucose + (pack.macros.caloriesKcal && pack.macros.caloriesKcal > 200 ? 8 : 2)),
      }));

      // 3. Construct Scan Highlights Toast
      const highlights: string[] = [];
      if (pack.macros.proteinG) highlights.push(`+${pack.macros.proteinG}g Protein`);
      if (pack.macros.healthyFatsG) highlights.push(`+${pack.macros.healthyFatsG}g Healthy Fats`);
      if (pack.macros.hydrationL) highlights.push(`+${pack.macros.hydrationL}L Hydration`);
      if (pack.macros.fiberG) highlights.push(`+${pack.macros.fiberG}g Fiber`);
      if (pack.macros.caloriesKcal) highlights.push(`+${pack.macros.caloriesKcal} kcal`);

      setScanCelebration({ packName: pack.name, highlights });
      setScanningPackId(null);
    }, 600);
  }, [scanningPackId]);

  // ─── AI CARE RECOMMENDATION ENGINE ──────────────────────────────
  // Calm, positive, action-oriented coaching in place of raw
  // "Critical/Warning Alert" messaging. Astronauts see a simple,
  // reassuring next step — never alarm badges or red warnings.
  const aiCareRecommendation = useMemo(() => {
    const proteinGap = TARGETS.macros.proteinG - intake.macros.proteinG;
    const waterGap = Number((TARGETS.macros.hydrationL - intake.macros.hydrationL).toFixed(2));
    const fiberGap = TARGETS.macros.fiberG - intake.macros.fiberG;

    if (waterGap > 0.8 || telemetry.hydrationTissuePct < 68) {
      return {
        kicker: "AI Care Recommendation",
        title: "Enjoy a Hydration & Electrolyte Mix Pack",
        emoji: "💧",
        message: `A hydration top-up will feel great right now — you're at ${intake.macros.hydrationL.toFixed(2)}L for the day. Your body will thank you at the next sync.`,
        theme: "border-cyan-400/20 from-[#061826]/95 via-[#0a121e]/90 to-[#0d0f1a]/95",
      };
    }

    if (proteinGap > 30) {
      return {
        kicker: "AI Care Recommendation",
        title: "Treat yourself to the High-Protein & Healthy Fats Stew",
        emoji: "🥩",
        message: `You're ${proteinGap}g from your daily protein goal — a warm serving now keeps your muscles strong for the rest of the mission.`,
        theme: "border-purple-400/20 from-[#120b22]/95 via-[#0a101d]/90 to-[#070b14]/95",
      };
    }

    if (fiberGap > 12) {
      return {
        kicker: "AI Care Recommendation",
        title: "Add a High-Fiber Chia & Berry Space Bowl",
        emoji: "🥣",
        message: "A colorful fiber bowl next meal keeps your digestion comfortable and your energy steady.",
        theme: "border-emerald-400/20 from-[#06181f]/95 via-[#0a1218]/90 to-[#070d14]/95",
      };
    }

    return {
      kicker: "AI Care Check-In",
      title: "Everything is looking great",
      emoji: "✅",
      message: "Your hydration, energy, and nutrition are all right on target. Keep up your steady routine.",
      theme: "border-emerald-400/20 from-[#06181f]/95 via-[#0a1218]/90 to-[#070d14]/95",
    };
  }, [intake, telemetry]);

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 px-4 pt-1.5 pb-8 sm:px-6 lg:px-8 lg:pt-3 xl:px-8 font-sans selection:bg-cyan-500 selection:text-black space-y-6 max-w-7xl mx-auto">
      <header className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-[0.1em] text-cyan-400 uppercase font-bold">
                AstroGuard Cockpit HUD · Autonomous Bio-Matrix
              </span>
            </div>
          </div>

          {/* Mission sync status cluster — fills the middle of the HUD row */}
          <div className="hidden lg:flex items-center gap-5 font-mono text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Bio-Patch Link STABLE
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {user?.missionIds?.[0] ?? "Crew Ops"} · SYNC{" "}
              {telemetry.lastSyncTimestamp
                ? new Date(telemetry.lastSyncTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "PENDING"}
            </span>
          </div>

          <div className="flex items-center gap-3">
<div className="text-right font-mono text-xs">
                <span className="text-[10px] text-slate-400 block uppercase">Crew Commander</span>
                <span className="text-cyan-300 font-bold">{user?.name ?? "--"} ({user?.astronautId ?? "--"})</span>
              </div>
              <div className="h-10 w-10 rounded-xl border border-cyan-500/40 bg-cyan-500/10 flex items-center justify-center text-cyan-300 font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                {user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "--"}
              </div>
          </div>
        </div>

        {/* Live Telemetry Status & Beacon Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-[#061826]/95 via-[#0a121e]/90 to-[#0d0f1a]/95 p-4 shadow-[0_0_30px_rgba(6,182,212,0.08)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider text-cyan-300 font-mono">
                    ● SENSOR ARRAY ACTIVE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold">
                    100 Hz Continuous Sync
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  14 Parameters Streamed Autonomously · Zero Manual Entry Directive Enforced
                </p>
              </div>
            </div>

            {/* Visualizer Waveform */}
            <div className="hidden lg:flex items-end gap-1 h-6 px-4">
              {Array.from({ length: 28 }).map((_, i) => {
                const isActive = (tick + i) % 4 === 0;
                const height = isActive ? "h-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "h-2 bg-slate-700";
                return <span key={i} className={`w-1 rounded-full transition-all duration-300 ${height}`} />;
              })}
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase">Anomaly Index</span>
                <span className="text-emerald-400 font-bold">0.14 (NOMINAL)</span>
              </div>
              <div className="border-l border-slate-700/60 pl-4 text-right">
                <span className="text-[10px] text-slate-500 block uppercase">Bio-Patch Node</span>
                <span className="text-cyan-300 font-bold">LOCKED &lt;1ms</span>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(6,182,212,0.02)_2px,rgba(6,182,212,0.02)_4px)]" />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          AI CARE RECOMMENDATION BANNER
          (calm, positive, actionable guidance — no alarm badges)
      ───────────────────────────────────────────────────────── */}
      <section>
        <div className={`rounded-2xl border bg-gradient-to-r p-4 sm:p-5 backdrop-blur-xl transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-4 ${aiCareRecommendation.theme}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-400/25 bg-cyan-500/10 text-cyan-300">
                <Sparkles className="w-3 h-3" /> {aiCareRecommendation.kicker}
              </span>
              <h3 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <span className="text-base">{aiCareRecommendation.emoji}</span> {aiCareRecommendation.title}
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-300 max-w-4xl">
              {aiCareRecommendation.message}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] font-mono text-slate-400">AI Care Guidance · Confidential Wellness Coaching</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FLIGHT SURGEON CALM GUIDANCE
          (gentle, non-alarm personal note pushed from the
          Medical Officer dashboard — never a red badge)
      ───────────────────────────────────────────────────────── */}
      {guidanceLoaded && surgeonGuidance.length > 0 && (
        <section>
          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-[#062018]/95 via-[#0a141f]/90 to-[#080C14]/95 p-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-xl sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> Flight Surgeon Guidance
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {surgeonGuidance[0].source === "AI" ? "AI-calibrated · approved by " : "Personal note from "}
                  {surgeonGuidance[0].doctorName}
                </span>
              </div>
              <h3 className="text-sm font-black tracking-wide text-white">A calm word from your medical team</h3>
              <p className="max-w-4xl text-xs leading-relaxed text-slate-300">{surgeonGuidance[0].message}</p>
              {surgeonGuidance.length > 1 && (
                <p className="text-[10px] text-slate-500">+{surgeonGuidance.length - 1} more guidance note{surgeonGuidance.length > 2 ? "s" : ""}</p>
              )}
            </div>
            <div className="shrink-0">
              <button
                onClick={() => void acknowledgeGuidance(surgeonGuidance[0]._id)}
                disabled={acknowledgingId === surgeonGuidance[0]._id}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {acknowledgingId === surgeonGuidance[0]._id ? "Acknowledging…" : "Acknowledge & Dismiss"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          SECTION 1: BIOMETRIC VITALS GRID (7 KEY PARAMETERS)
      ───────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> 1. Biometric Vitals Stream (7 Live Ingestion Nodes)
          </h2>
          <span className="text-[10px] font-mono text-slate-400">Continuous Auto-Sync (3s Pulse)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          
          {/* 1. Heart Rate */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Heart className="w-3 h-3 text-red-400 animate-pulse" /> Heart Rate
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.heartRate} <span className="text-xs text-slate-400 font-normal">BPM</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Rest: 60-85 BPM</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full" style={{ width: `${(telemetry.heartRate / 130) * 100}%` }} />
            </div>
          </div>

          {/* 2. Blood Pressure */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Activity className="w-3 h-3 text-cyan-400" /> Blood Press.
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.bloodPressureSystolic}/{telemetry.bloodPressureDiastolic}
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">mmHg (Optimal)</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: "85%" }} />
            </div>
          </div>

          {/* 3. SpO2 */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Droplet className="w-3 h-3 text-cyan-400" /> SpO₂ Sat.
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.spo2}<span className="text-xs text-cyan-400 font-normal">%</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Norm: 95-100%</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: `${telemetry.spo2}%` }} />
            </div>
          </div>

          {/* 4. Blood Glucose */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Flame className="w-3 h-3 text-amber-400" /> Glucose
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.bloodGlucose} <span className="text-xs text-slate-400 font-normal">mg/dL</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Target: 70-110</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${(telemetry.bloodGlucose / 140) * 100}%` }} />
            </div>
          </div>

          {/* 5. Weight & BMI */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Scale className="w-3 h-3 text-purple-400" /> Weight &amp; BMI
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.bodyWeightKg}<span className="text-xs text-slate-400 font-normal">kg</span>
            </div>
            <p className="text-[9px] text-purple-300 font-mono mt-0.5">BMI: {telemetry.bmi} kg/m²</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-400 h-full" style={{ width: "75%" }} />
            </div>
          </div>

          {/* 6. Sleep Quality */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Moon className="w-3 h-3 text-indigo-400" /> Sleep Rest
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.sleepHours}<span className="text-xs text-slate-400 font-normal">h</span>
            </div>
            <p className="text-[9px] text-indigo-300 font-mono mt-0.5">Score: {telemetry.sleepQualityScore}/100</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-indigo-400 h-full" style={{ width: `${telemetry.sleepQualityScore}%` }} />
            </div>
          </div>

          {/* 7. Physical Activity */}
          <div className="rounded-xl border border-cyan-500/20 bg-[#0a121e]/85 p-3.5 backdrop-blur-md relative col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Dumbbell className="w-3 h-3 text-emerald-400" /> Activity
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              {telemetry.activeSteps.toLocaleString()}
            </div>
            <p className="text-[9px] text-emerald-300 font-mono mt-0.5">{telemetry.activeCaloriesBurned} kcal · {telemetry.activeWorkoutMinutes}m</p>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: "84%" }} />
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 2: MACRO & METABOLIC HUD (CALORIES, PROTEIN, FATS, FIBER, WATER)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#061826]/90 via-[#0a101d]/90 to-[#070b14]/90 p-5 shadow-[0_0_35px_rgba(6,182,212,0.06)] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" /> 2. Macro &amp; Metabolic Energy HUD (Target vs Consumed)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live consumption updated instantly upon RFID packet scanning
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
            24h AI Prescription
          </span>
        </div>

        {/* 5 Macro Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* 8. Protein */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" /> 8. Protein
              </span>
              <span className="text-white font-bold">{intake.macros.proteinG} / {TARGETS.macros.proteinG}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700" style={{ width: `${Math.min(100, (intake.macros.proteinG / TARGETS.macros.proteinG) * 100)}%` }} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Muscle Recovery &amp; Sarcopenia Shield</p>
          </div>

          {/* 9. Healthy Fats */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> 9. Healthy Fats
              </span>
              <span className="text-white font-bold">{intake.macros.healthyFatsG} / {TARGETS.macros.healthyFatsG}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700" style={{ width: `${Math.min(100, (intake.macros.healthyFatsG / TARGETS.macros.healthyFatsG) * 100)}%` }} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Lipid Balance &amp; Omega-3 Synthesis</p>
          </div>

          {/* 10. Calories / Energy */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-red-300 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" /> 10. Energy (kcal)
              </span>
              <span className="text-white font-bold">{intake.macros.caloriesKcal} / {TARGETS.macros.caloriesKcal}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-700" style={{ width: `${Math.min(100, (intake.macros.caloriesKcal / TARGETS.macros.caloriesKcal) * 100)}%` }} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Basal Metabolic Energy Reserve</p>
          </div>

          {/* 11. Dietary Fiber */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> 11. Fiber
              </span>
              <span className="text-white font-bold">{intake.macros.fiberG} / {TARGETS.macros.fiberG}g</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(100, (intake.macros.fiberG / TARGETS.macros.fiberG) * 100)}%` }} />
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Microbiome Health &amp; Motility</p>
          </div>

          {/* 12. Water / Hydration Status */}
          <div className="space-y-1.5 rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> 12. Water (L)
              </span>
              <span className="text-white font-bold">{intake.macros.hydrationL.toFixed(2)} / {TARGETS.macros.hydrationL}L</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700" style={{ width: `${Math.min(100, (intake.macros.hydrationL / TARGETS.macros.hydrationL) * 100)}%` }} />
            </div>
            <p className="text-[9px] text-cyan-400 font-mono">Tissue Hydration Index: {telemetry.hydrationTissuePct}%</p>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 3: MICRO-NUTRIENT MATRIX (VITAMINS & ESSENTIAL MINERALS)
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 13. Key Vitamins (6 cols) */}
        <section className="lg:col-span-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#06181f]/90 via-[#0a1218]/90 to-[#070d14]/90 p-5 shadow-[0_0_35px_rgba(16,185,129,0.06)] backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Apple className="w-4 h-4 text-emerald-400" /> 13. Key Vitamins Status (A, B-Complex, C, D3, E, K)
            </h3>
            <span className="text-[9px] font-mono text-slate-400">Micro-Array Assay</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Vitamin A</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminA_IU} IU</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">NOMINAL</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">B-Complex</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminB_Complex_mg} mg</span>
              <span className="text-[9px] block text-cyan-400 mt-0.5">ACTIVE</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Vitamin C</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminC_mg} mg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">OPTIMAL</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Vitamin D3</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminD3_IU} IU</span>
              <span className="text-[9px] block text-amber-400 mt-0.5">DEFICIT</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Vitamin E</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminE_mg} mg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">STABLE</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Vitamin K</span>
              <span className="font-bold text-white text-xs">{intake.vitamins.vitaminK_mcg} mcg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">NOMINAL</span>
            </div>
          </div>
        </section>

        {/* 14. Essential Minerals (6 cols) */}
        <section className="lg:col-span-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#120b22]/90 via-[#0c0d1c]/90 to-[#070b14]/90 p-5 shadow-[0_0_35px_rgba(168,85,247,0.06)] backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-400" /> 14. Essential Minerals (Fe, Ca, Mg, Zn, K)
            </h3>
            <span className="text-[9px] font-mono text-slate-400">Electrolyte Matrix</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Iron (Fe)</span>
              <span className="font-bold text-white text-xs">{intake.minerals.iron_mg} mg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">OK</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Calcium</span>
              <span className="font-bold text-white text-xs">{intake.minerals.calcium_mg} mg</span>
              <span className="text-[9px] block text-amber-400 mt-0.5">WATCH</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Magnesium</span>
              <span className="font-bold text-white text-xs">{intake.minerals.magnesium_mg} mg</span>
              <span className="text-[9px] block text-cyan-400 mt-0.5">NOMINAL</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
              <span className="text-[9px] text-slate-400 block uppercase">Zinc (Zn)</span>
              <span className="font-bold text-white text-xs">{intake.minerals.zinc_mg} mg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">OK</span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-center col-span-2 sm:col-span-1">
              <span className="text-[9px] text-slate-400 block uppercase">Potassium</span>
              <span className="font-bold text-white text-xs">{intake.minerals.potassium_mg} mg</span>
              <span className="text-[9px] block text-emerald-400 mt-0.5">OPTIMAL</span>
            </div>
          </div>
        </section>

      </div>

      {/* ─────────────────────────────────────────────────────────
          SECTION 4: SIMULATED RFID MEAL & SUPPLEMENT SCANNER
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#081525]/90 via-[#0a0f1c]/90 to-[#060c14]/90 p-5 shadow-[0_0_40px_rgba(6,182,212,0.08)] backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-cyan-400" /> 4. Simulated RFID Space-Meal Scanner (Zero Manual Typing)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              1-Click Optical / RFID simulation · Dynamically updates all 14 biometric and nutrient parameters
            </p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 font-bold">
            {intake.scannedPacksCount} Packs Scanned Today
          </span>
        </div>

        {/* 4 Interactive RFID Pack Scan Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {RFID_SPACE_PACKS.map((pack) => {
            const isScanning = scanningPackId === pack.id;
            return (
              <button
                key={pack.id}
                onClick={() => handleRFIDScan(pack)}
                disabled={!!scanningPackId}
                className={`group relative text-left rounded-xl border p-4 transition-all duration-300 overflow-hidden ${
                  isScanning
                    ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_24px_rgba(6,182,212,0.5)] scale-[0.98]"
                    : "border-slate-800/90 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-cyan-950/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                }`}
              >
                {/* Laser scanline animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_14px_#22d3ee]" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 rounded-xl bg-slate-800/60 shrink-0">{pack.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${isScanning ? "text-cyan-300" : "text-white group-hover:text-cyan-200"}`}>
                      {pack.name}
                    </p>
                    <span className="text-[8px] font-mono text-slate-500 block mt-0.5">{pack.id}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between font-mono text-[9px]">
                  <span className="text-slate-400">Auto Ingest:</span>
                  <span className="text-cyan-300 font-bold group-hover:text-cyan-200">
                    {isScanning ? "SCANNING..." : "TRIGGER RFID"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Scan Feedback Confirmation Toast */}
        {scanCelebration && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-emerald-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                RFID Verified: <strong>{scanCelebration.packName}</strong> ({scanCelebration.highlights.join(" · ")})
              </span>
            </div>
            <span className="text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              14 Parameters Re-Synced
            </span>
          </div>
        )}
      </section>

    </div>
  );
}
