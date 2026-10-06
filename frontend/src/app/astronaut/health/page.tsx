"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Moon,
  Dumbbell,
  Scale,
  Flame,
  Zap,
  Wind,
  TrendingUp,
  ShieldCheck,
  Radio,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { healthTrend, healthLogs } from "@/data/mockData";

export default function AstronautHealthPage() {
  const { user } = useAuth();
  const liveTelemetry = useTelemetryStream(user?.astronautId);

  // Timeframe and signal state for the trend chart
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d" | "90d">("24h");
  const [activeSignal, setActiveSignal] = useState<"heartRate" | "spo2" | "sleep" | "activity">("heartRate");

  // Read telemetry values with fallbacks
  const hr = liveTelemetry.vitals.find((v) => v.id === "hr")?.value ?? 72;
  const spo2 = liveTelemetry.vitals.find((v) => v.id === "spo2")?.value ?? 98.6;
  const temp = liveTelemetry.vitals.find((v) => v.id === "temp")?.value ?? 36.8;
  const hydration = liveTelemetry.vitals.find((v) => v.id === "hydrat")?.value ?? 77;
  const fatigue = liveTelemetry.vitals.find((v) => v.id === "fatigue")?.value ?? 31;

  // Chart data points
  const points = useMemo(() => healthTrend[timeframe] || healthTrend["24h"], [timeframe]);

  const stats = useMemo(() => {
    const vals = points.map((p) => p[activeSignal]);
    if (!vals.length) return { min: 0, max: 0, avg: 0, current: 0 };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
    const current = vals[vals.length - 1];
    return { min, max, avg, current };
  }, [points, activeSignal]);

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-5 py-1 sm:py-2 text-slate-100 animate-fade-in">
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER & OVERALL HEALTH STATUS
      ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sky-400/10 pb-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-sky-400 font-mono">
            Medical &amp; Biometric Profile
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Astronaut Health
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Autonomous biometrics, vital signs, and physical recovery markers.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Overall Status: Nominal
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. VITALS GROUP (Clean, human-readable list rows)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" /> Vital Signs
          </h2>
          <span className="text-xs font-mono text-slate-400">Continuous Auto-Sync</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          
          {/* Heart Rate */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <Heart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Heart Rate</p>
                <p className="text-xs text-slate-400">Baseline resting: 60–85 BPM</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">{hr} <span className="text-xs text-slate-400 font-normal">BPM</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Normal</span>
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Blood Pressure</p>
                <p className="text-xs text-slate-400">Standard optimal: 120 / 80 mmHg</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">118 / 78 <span className="text-xs text-slate-400 font-normal">mmHg</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Optimal</span>
            </div>
          </div>

          {/* Blood Oxygen */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Droplet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Blood Oxygen (SpO₂)</p>
                <p className="text-xs text-slate-400">Target range: 95–100%</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">{spo2}<span className="text-xs text-slate-400 font-normal">%</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Safe</span>
            </div>
          </div>

          {/* Body Temperature */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Thermometer className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Core Body Temperature</p>
                <p className="text-xs text-slate-400">Nominal: 36.5–37.5 °C</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">{temp} <span className="text-xs text-slate-400 font-normal">°C</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Stable</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          3. BODY & METABOLISM GROUP
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-400" /> Body &amp; Metabolism
          </h2>
          <span className="text-xs font-mono text-slate-400">Bio-Impedance Sensor</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          
          {/* Weight & BMI */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Body Weight &amp; BMI</p>
                <p className="text-xs text-slate-400">Calculated mass index: 22.8 kg/m²</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">76.4 <span className="text-xs text-slate-400 font-normal">kg</span></span>
              <span className="block text-[11px] text-purple-300 font-medium">Healthy Mass</span>
            </div>
          </div>

          {/* Blood Glucose */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Blood Glucose</p>
                <p className="text-xs text-slate-400">Fasting target: 70–110 mg/dL</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">94 <span className="text-xs text-slate-400 font-normal">mg/dL</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">In Range</span>
            </div>
          </div>

          {/* Tissue Hydration */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Droplet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Tissue Hydration Index</p>
                <p className="text-xs text-slate-400">Optimal fluid band: 65–85%</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">{hydration}<span className="text-xs text-slate-400 font-normal">%</span></span>
              <span className="block text-[11px] text-cyan-300 font-medium">Hydrated</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. WELLNESS & PHYSICAL RECOVERY GROUP
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-400" /> Wellness &amp; Recovery
          </h2>
          <span className="text-xs font-mono text-slate-400">Daily Assessment</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          
          {/* Sleep */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Sleep Duration &amp; Quality</p>
                <p className="text-xs text-slate-400">Quality score: 92 / 100 · 2.1h Deep REM</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">7.6 <span className="text-xs text-slate-400 font-normal">hrs</span></span>
              <span className="block text-[11px] text-indigo-300 font-medium">Rested</span>
            </div>
          </div>

          {/* Physical Activity */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Dumbbell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Physical Activity &amp; Load</p>
                <p className="text-xs text-slate-400">485 kcal burned · 45 min workout</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">8,420 <span className="text-xs text-slate-400 font-normal">steps</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Active</span>
            </div>
          </div>

          {/* Muscle Fatigue */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Muscle Fatigue Index (MFI)</p>
                <p className="text-xs text-slate-400">Threshold: &lt;55 MFI for EVA readiness</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">{fatigue} <span className="text-xs text-slate-400 font-normal">MFI</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Low Strain</span>
            </div>
          </div>

          {/* Respiration */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Wind className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Respiration Rate</p>
                <p className="text-xs text-slate-400">Resting breathing pattern</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold font-mono text-white">14 <span className="text-xs text-slate-400 font-normal">bpm</span></span>
              <span className="block text-[11px] text-emerald-400 font-medium">Calm</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. HEALTH TRENDS & BIOMETRIC CURVE (Interactive Chart)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" /> Biometric Trends
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-timeframe historical trend curve
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/[0.06] font-mono text-xs">
            {(["24h", "7d", "30d", "90d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  timeframe === tf
                    ? "bg-sky-500/20 text-sky-300 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Signal Selector */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { key: "heartRate" as const, label: "Heart Rate (BPM)" },
            { key: "spo2" as const, label: "Oxygen SpO₂ (%)" },
            { key: "sleep" as const, label: "Sleep (Hours)" },
            { key: "activity" as const, label: "Activity (Load)" },
          ].map((sig) => (
            <button
              key={sig.key}
              type="button"
              onClick={() => setActiveSignal(sig.key)}
              className={`px-3 py-1.5 rounded-xl border transition text-xs ${
                activeSignal === sig.key
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-200 font-semibold"
                  : "border-white/[0.06] bg-slate-900/40 text-slate-400 hover:text-white"
              }`}
            >
              {sig.label}
            </button>
          ))}
        </div>

        {/* Clean Minimal Chart Canvas */}
        <div className="rounded-xl border border-white/[0.06] bg-[#050e1a]/80 p-4 space-y-2">
          <div className="h-40 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 600 140">
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="35" x2="600" y2="35" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="70" x2="600" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="105" x2="600" y2="105" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {(() => {
                if (!points || !points.length) return null;
                const vals = points.map((p) => p[activeSignal]);
                const min = Math.min(...vals) * 0.95;
                const max = Math.max(...vals) * 1.05 || 100;
                const range = max - min || 1;

                const coords = points.map((p, idx) => {
                  const x = (idx / (points.length - 1)) * 600;
                  const val = p[activeSignal];
                  const y = 130 - ((val - min) / range) * 110;
                  return { x, y, val, time: p.time };
                });

                const dPath = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
                const areaPath = `${dPath} L 600,140 L 0,140 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#healthGrad)" />
                    <path d={dPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    {coords.map((c, i) => (
                      <circle key={i} cx={c.x} cy={c.y} r="3" className="fill-white stroke-sky-400 stroke-2" />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/[0.06]">
            {points.map((p, idx) => (
              <span key={idx}>{p.time}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center font-mono text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Peak</span>
              <span className="font-semibold text-white">{stats.max}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Low</span>
              <span className="font-semibold text-slate-300">{stats.min}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Average</span>
              <span className="font-semibold text-sky-300">{stats.avg}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. RECENT HEALTH TELEMETRY LOG
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" /> Recent Health Logs
          </h2>
          <span className="text-xs font-mono text-slate-400">Suit Sensors</span>
        </div>

        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Source</th>
                <th className="pb-2 text-center">Heart Rate</th>
                <th className="pb-2 text-center">Oxygen (SpO₂)</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {healthLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-2.5 text-slate-200">{log.time}</td>
                  <td className="py-2.5 text-slate-400 text-[11px]">{log.source}</td>
                  <td className="py-2.5 text-center text-white font-medium">{log.heartRate} BPM</td>
                  <td className="py-2.5 text-center text-cyan-300 font-medium">{log.spo2}%</td>
                  <td className="py-2.5 text-right">
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
