"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Radio,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Droplet,
  Flame,
  ScanLine,
  Heart,
  Thermometer,
  Cpu,
  Clock,
  Sparkles,
  RefreshCw,
  Microscope,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { useMealScanner, MEAL_PACKS } from "@/hooks/useMealScanner";

export default function AstronautDataInputPage() {
  const { user } = useAuth();
  const { connected, tickCount, vitals, streamSource } = useTelemetryStream(user?.astronautId, 1200);
  const { intake, scanning, lastScan, scan } = useMealScanner();

  // Optical CBC Scanner simulation state (zero typing)
  const [cbcScanning, setCbcScanning] = useState(false);
  const [cbcScanned, setCbcScanned] = useState(false);
  const [opticalStatus, setOpticalStatus] = useState<string | null>(null);

  const handleOpticalCBCScan = useCallback(() => {
    if (cbcScanning) return;
    setCbcScanning(true);
    setOpticalStatus("Positioning optical laser sensor over microfluidic cartridge...");

    setTimeout(() => {
      setOpticalStatus("Spectroscopic cell diffraction analysis in progress...");
    }, 1200);

    setTimeout(() => {
      setCbcScanning(false);
      setCbcScanned(true);
      setOpticalStatus("Cartridge scanned: WBC 6.8 | RBC 4.9 | HGB 14.5 | PLT 260. Auto-synced to medical vault.");
    }, 2500);
  }, [cbcScanning]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ─────────────────────────────────────────────────────────
          HEADER & ZERO-MANUAL-ENTRY ENFORCEMENT BANNER
      ───────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase font-bold">
            AstroGuard Autonomous Ingestion Console
          </span>
        </div>
      </div>
      {/* ─────────────────────────────────────────────────────────
          LIVE TELEMETRY STREAM MONITOR (AUTO-UPDATING SENSOR FEED)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#061826]/90 via-[#09101c]/90 to-[#070b14]/90 p-5 shadow-[0_0_40px_rgba(6,182,212,0.06)] backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-400" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Live Bio-Sensor Telemetry Ingestion Feed
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-300 bg-cyan-500/10">
              Source: {streamSource === "live-sse" ? "Backend SSE Stream (100 Hz)" : "Autonomous Sim Node"}
            </span>
            <span className="text-[10px] text-slate-400">
              Packets Ingested: <strong className="text-cyan-300 font-mono">{(tickCount * 100).toLocaleString()}</strong>
            </span>
          </div>
        </div>

        {/* 5 Vitals Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {vitals.map((v) => {
            const isNominal = v.status === "nominal";
            return (
              <div
                key={v.id}
                className={`rounded-xl border p-3.5 transition-all duration-300 ${
                  isNominal
                    ? "border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40"
                    : "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {v.label}
                  </span>
                  <span
                    className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isNominal
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse"
                    }`}
                  >
                    {v.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-2xl font-black font-mono text-white tracking-tight">
                  {v.value} <span className="text-xs text-slate-400 font-normal">{v.unit}</span>
                </p>

                <div className="w-full bg-slate-800/80 h-1 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNominal ? "bg-gradient-to-r from-cyan-400 to-emerald-400" : "bg-gradient-to-r from-amber-400 to-orange-500"
                    }`}
                    style={{ width: `${Math.min(100, ((v.value - v.min) / (v.max - v.min)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-1">
                  <span>{v.min}{v.unit}</span>
                  <span>{v.max}{v.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          1-CLICK RFID MEAL SCANNER & OPTICAL CBC CARTRIDGE SCANNER
      ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. RFID Food Ingestion Scanner (7 cols) */}
        <section className="lg:col-span-7 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0c0d1c]/90 via-[#0a0e18]/90 to-[#070b14]/90 p-5 shadow-[0_0_35px_rgba(168,85,247,0.06)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-purple-400" /> 1-Click RFID Space Meal Scanner
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/30 text-purple-300 bg-purple-500/10">
              {intake.scannedPacks.length} Logged Today
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEAL_PACKS.map((pack) => {
              const isScanning = scanning === pack.packId;
              return (
                <button
                  key={pack.packId}
                  id={`scan-btn-${pack.packId}`}
                  onClick={() => void scan(pack.packId)}
                  disabled={!!scanning}
                  className={`group relative text-left rounded-xl border p-3.5 transition-all duration-300 overflow-hidden ${
                    isScanning
                      ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[0.98]"
                      : "border-slate-800/80 bg-slate-900/40 hover:border-purple-500/40 hover:bg-purple-950/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                  }`}
                >
                  {isScanning && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_12px_#22d3ee]" />
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-1 rounded-lg bg-slate-800/50">{pack.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isScanning ? "text-cyan-300" : "text-slate-100 group-hover:text-purple-200"}`}>
                        {isScanning ? "Scanning RFID..." : pack.name}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 font-mono text-[9px]">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">+{pack.nutrients.proteinG}g P</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">+{pack.nutrients.hydrationMl}mL H₂O</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">+{pack.nutrients.caloriesKcal} kcal</span>
                      </div>
                    </div>

                    <div className="shrink-0 mt-1">
                      {isScanning ? (
                        <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <ScanLine className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Last scan confirmation */}
          {lastScan && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 flex items-center justify-between text-xs font-mono text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>RFID Synced: <strong>{lastScan.name}</strong></span>
              </div>
              <span className="text-[9px] uppercase font-bold text-emerald-400">Telemetry Ingested</span>
            </div>
          )}
        </section>

        {/* 2. Optical CBC & Biomarker Cartridge Scanner (5 cols) */}
        <section className="lg:col-span-5 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#061524]/90 via-[#080f1c]/90 to-[#060b14]/90 p-5 shadow-[0_0_35px_rgba(59,130,246,0.06)] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Microscope className="w-4 h-4 text-blue-400" /> Optical CBC &amp; Bio-Cartridge
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 text-blue-300 bg-blue-500/10">
              Laser Lens v3
            </span>
          </div>

          <div className="p-5 rounded-xl border border-dashed border-blue-500/30 bg-blue-950/15 text-center space-y-3">
            <div className="flex justify-center">
              <div className={`h-12 w-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                cbcScanning
                  ? "border-cyan-400 bg-cyan-400/20 animate-pulse text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : cbcScanned
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-blue-500/30 bg-blue-500/10 text-blue-400"
              }`}>
                {cbcScanning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Microscope className="w-6 h-6" />}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-white">Microfluidic Cartridge Reader</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Insert sample cartridge into analyzer bay and trigger auto-read.
              </p>
            </div>

            <button
              onClick={handleOpticalCBCScan}
              disabled={cbcScanning}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition-all"
            >
              <ScanLine className="w-4 h-4" />
              {cbcScanning ? "Spectroscopic Scanning..." : "Trigger 1-Click Optical Scan"}
            </button>
          </div>

          {opticalStatus && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/30 p-3 text-[11px] font-mono text-cyan-200 leading-relaxed">
              <p className="font-bold text-blue-300 mb-0.5 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Optical Diagnostics Pipeline:
              </p>
              <p className="text-slate-300">{opticalStatus}</p>
            </div>
          )}
        </section>

      </div>

      {/* ─────────────────────────────────────────────────────────
          INGESTION LOGS (RECENT AUTONOMOUS ENTRIES)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-[#0a0f1c]/70 p-5 backdrop-blur-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" /> Recent Autonomous Ingestion Events
          </h3>
          <span className="text-[10px] font-mono text-emerald-400">Zero-Manual Failures: 0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-[10px]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-cyan-300 font-bold">IoT Bio-Patch Node</span>
              <span>100 Hz Sync</span>
            </div>
            <p className="text-slate-200">HR 74 BPM · SpO₂ 98% · Hydration 76% · MFI 32</p>
            <p className="text-[9px] text-emerald-400">● Synced to HealthData DB</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-purple-300 font-bold">RFID Scanner Antenna</span>
              <span>Auto-Catalogued</span>
            </div>
            <p className="text-slate-200">{intake.scannedPacks.length > 0 ? intake.scannedPacks[intake.scannedPacks.length - 1].name : "Hydration Mix Pack #2"}</p>
            <p className="text-[9px] text-purple-300">● Synced to DailyNutrientIntake DB</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-blue-300 font-bold">Isolation Forest AI</span>
              <span>Online Inference</span>
            </div>
            <p className="text-slate-200">Physiological Vector: Normal (Anomaly Score 0.18)</p>
            <p className="text-[9px] text-cyan-400">● Prescriptions Updated</p>
          </div>
        </div>
      </section>

    </div>
  );
}
