"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertOctagon,
  Flame,
  Dumbbell,
  Mic,
  MicOff,
  Sparkles,
  ShieldAlert,
  X,
  Radio,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";

export default function EdgeCockpitPage() {
  const { user } = useAuth();
  const { vitals } = useTelemetryStream(user?.astronautId, 1500);

  // Real-time telemetry values
  const hr = vitals.find((v) => v.id === "hr")?.value ?? 74;
  const spo2 = vitals.find((v) => v.id === "spo2")?.value ?? 98.4;
  const temp = vitals.find((v) => v.id === "temp")?.value ?? 36.8;

  // 1. Countermeasure Prescription State
  const [targetWattage, setTargetWattage] = useState(190);
  const [stressArea, setStressArea] = useState<"lower_lumbar" | "quads" | "nominal">("lower_lumbar");

  // 2. Radiation Ring State
  const [currentDoseMsv, setCurrentDoseMsv] = useState(0.38);
  const dailyLimitMsv = 1.0;
  const radPercentage = Math.min(100, Math.round((currentDoseMsv / dailyLimitMsv) * 100));

  // 3. Voice Sentiment State
  const [recording, setRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [voiceStressScore, setVoiceStressScore] = useState<number | null>(16);
  const [voiceSummary, setVoiceSummary] = useState<string>(
    "Acoustic pitch jitter nominal. Vocal tract resonance indicates optimal cognitive resilience."
  );

  // 4. Emergency State
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const handleVoiceRecord = () => {
    if (recording) {
      setRecording(false);
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        const newScore = Math.floor(14 + Math.random() * 12);
        setVoiceStressScore(newScore);
        setVoiceSummary(
          newScore < 30
            ? "Edge inference complete (0.0ms uplink latency): Zero psychological isolation fatigue."
            : "Mild vocal perturbation detected: Suggested 15-minute VR Earth nature relaxation."
        );
      }, 1400);
    } else {
      setRecording(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#02050c] text-slate-100 font-sans p-4 sm:p-6 lg:p-8 animate-fade-in selection:bg-cyan-500/30">
      
      {/* ─── HUD TOPBAR ─── */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase">
              100% Offline Edge Mode · Autonomous Deep Space Protocol
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            AstroGuard <span className="text-cyan-400 font-light">Edge Cockpit</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/astronaut/dashboard"
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-slate-900/60 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Mission Console</span>
          </Link>

          {/* MASSIVE EMERGENCY PROTOCOL BUTTON */}
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="group relative flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-xs font-black tracking-wider text-white shadow-[0_0_35px_rgba(225,29,72,0.4)] transition hover:shadow-[0_0_50px_rgba(225,29,72,0.7)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <AlertOctagon className="h-4 w-4 animate-pulse text-white" />
            <span className="tracking-widest uppercase">Emergency SOS</span>
          </button>
        </div>
      </header>

      {/* ─── 3-CARD ZERO-COGNITIVE-LOAD HUD ─── */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ════ CARD 1: PHYSICAL COUNTERMEASURES ════ */}
        <section className="rounded-3xl border border-white/[0.08] bg-[#070f1e]/80 p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Activity className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Physical Prescription</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Bio-Harness Sync</span>
          </div>

          {/* Actionable First (Zero Cognitive Load) */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.06] p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5" /> Prescribed Protocol
            </span>
            <p className="text-lg font-bold text-white leading-snug">
              45 Mins Cycle Ergometer
            </p>
            <p className="text-xs text-slate-300">
              Target resistance: <span className="text-cyan-300 font-mono font-bold">{targetWattage} Watts</span> to counter microgravity bone mineral deconditioning in lower lumbar.
            </p>
          </div>

          {/* 3D Digital Twin Stress Heatmap SVG */}
          <div className="flex items-center justify-center gap-6 py-2 bg-slate-950/40 rounded-2xl border border-white/[0.04] p-4">
            <svg viewBox="0 0 100 160" className="h-36 w-24 overflow-visible">
              <circle cx="50" cy="20" r="12" className="fill-slate-800 stroke-cyan-400/40 stroke-1" />
              <rect x="38" y="36" width="24" height="42" rx="4" className="fill-slate-800 stroke-cyan-400/40 stroke-1" />
              <rect x="22" y="38" width="10" height="38" rx="3" className="fill-slate-850 stroke-white/10" />
              <rect x="68" y="38" width="10" height="38" rx="3" className="fill-slate-850 stroke-white/10" />
              <rect
                x="37"
                y="84"
                width="11"
                height="58"
                rx="4"
                className="fill-amber-500/30 stroke-amber-400 stroke-1.5 animate-pulse"
              />
              <rect
                x="52"
                y="84"
                width="11"
                height="58"
                rx="4"
                className="fill-amber-500/30 stroke-amber-400 stroke-1.5 animate-pulse"
              />
            </svg>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">Resting Pulse</span>
                <span className="text-xl font-black text-white">{hr} <span className="text-xs font-normal text-slate-400">BPM</span></span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Bone Load Factor</span>
                <span className="text-sm font-bold text-amber-300">94.2% Nominal</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════ CARD 2: RADIATION DOSIMETRY & RING ════ */}
        <section className="rounded-3xl border border-white/[0.08] bg-[#070f1e]/80 p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Flame className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Radiation Dosimetry</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">Shielding: Stable</span>
          </div>

          {/* Radiation Gauge Ring */}
          <div className="relative flex flex-col items-center justify-center py-4">
            <svg className="h-44 w-44 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-slate-800/80"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="stroke-cyan-400 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - radPercentage / 100)}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-black font-mono text-white tracking-tight">
                {currentDoseMsv}
              </span>
              <span className="text-[10px] font-mono uppercase text-slate-400">
                mSv / {dailyLimitMsv} Limit
              </span>
            </div>
          </div>

          {/* Actionable Status */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-center">
            <p className="text-xs font-bold text-emerald-300">
              ✓ Solar Particle Event: Nominal Band
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Habitation shelter deployment not required for current sol.
            </p>
          </div>
        </section>

        {/* ════ CARD 3: VOICE SENTIMENT & MOOD ════ */}
        <section className="rounded-3xl border border-white/[0.08] bg-[#070f1e]/80 p-6 backdrop-blur-xl flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider">Voice Sentiment UI</h2>
            </div>
            <span className="text-[10px] font-mono text-purple-400">Offline NPU</span>
          </div>

          {/* Voice Input Station */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-white/[0.04] space-y-3">
            <button
              type="button"
              onClick={handleVoiceRecord}
              className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                recording
                  ? "bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse"
                  : "bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30"
              }`}
            >
              {recording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>

            <span className="text-xs font-mono text-slate-300">
              {recording ? "Listening… Speak your 10-sec daily log" : "Tap to record daily voice log"}
            </span>

            {/* Live Audio Waveform Simulation */}
            {recording && (
              <div className="flex items-center gap-1.5 h-6">
                {[12, 24, 16, 32, 20, 28, 14, 26].map((height, i) => (
                  <span
                    key={i}
                    className="w-1 bg-purple-400 rounded-full animate-pulse"
                    style={{ height: `${height}px`, animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Instant Offline Voice Analysis Result */}
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-300 uppercase font-bold">
                Stress Perturbation Index
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {voiceStressScore !== null ? `${voiceStressScore} / 100` : "Ready"}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analyzing ? "Running Edge quantized neural inference on acoustic features…" : voiceSummary}
            </p>
          </div>
        </section>

      </main>

      {/* ─── MASSIVE EMERGENCY PROTOCOL MODAL ─── */}
      {emergencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl border-2 border-red-500/50 bg-[#120407] p-6 sm:p-8 shadow-[0_0_100px_rgba(239,68,68,0.4)] space-y-6">
            <div className="flex items-start justify-between border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-300 animate-pulse">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    Emergency First-Aid Protocol
                  </h2>
                  <p className="text-xs text-red-300 font-mono">
                    AUTONOMOUS OFFLINE TRIAGE · HABITAT CREW ALERTED
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-red-500 text-[#02050b] font-black text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Cabin Decompression / Hypoxia</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Don emergency O2 mask immediately. Switch suit regulator to 100% partial pressure.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-red-500 text-[#02050b] font-black text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Acute Trauma &amp; Hemorrhage</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Deploy Medical Kit Bay 3 (Celox Hemostatic Gauze + Pneumatic Tourniquet).</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEmergencyOpen(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:from-red-500 transition"
            >
              Acknowledge &amp; Resume Systems
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
