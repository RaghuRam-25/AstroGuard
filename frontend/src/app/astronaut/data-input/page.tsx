"use client";

import React, { useState, useCallback } from "react";
import {
  Activity,
  Radio,
  ScanLine,
  Microscope,
  Check,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { useMealScanner, MEAL_PACKS } from "@/hooks/useMealScanner";

export default function AstronautDataInputPage() {
  const { user } = useAuth();
  const { connected, tickCount, vitals, streamSource } = useTelemetryStream(user?.astronautId, 1200);
  const { intake, scanning, lastScan, scan } = useMealScanner();

  // Optical CBC Scanner simulation state
  const [cbcScanning, setCbcScanning] = useState(false);
  const [cbcScanned, setCbcScanned] = useState(false);
  const [opticalStatus, setOpticalStatus] = useState<string | null>(null);

  const handleOpticalCBCScan = useCallback(() => {
    if (cbcScanning) return;
    setCbcScanning(true);
    setOpticalStatus("Positioning laser sensor over microfluidic cartridge...");

    setTimeout(() => {
      setOpticalStatus("Spectroscopic cell diffraction analysis in progress...");
    }, 1200);

    setTimeout(() => {
      setCbcScanning(false);
      setCbcScanned(true);
      setOpticalStatus("Cartridge complete: WBC 6.8 | RBC 4.9 | HGB 14.5 | PLT 260. Synced to medical vault.");
    }, 2500);
  }, [cbcScanning]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2 sm:py-4 px-2 sm:px-4 animate-fade-in text-slate-100">
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER
      ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sky-400/10 pb-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-sky-400 font-mono">
            Autonomous Ingestion Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Telemetry &amp; RFID Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Continuous biosensor streaming and optical / RFID nutrition tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {streamSource === "live-sse" ? "Live Stream (SSE)" : "Autonomous Stream"}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. LIVE SENSOR TELEMETRY FEED (5 Core Sensors)
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Live Sensor Ingestion
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {(tickCount * 100).toLocaleString()} Packets Received
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {vitals.map((v) => {
            const isNominal = v.status === "nominal";
            return (
              <div
                key={v.id}
                className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400">
                    {v.label}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-semibold ${
                      isNominal
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {v.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-xl font-bold font-mono text-white">
                  {v.value} <span className="text-xs text-slate-400 font-normal">{v.unit}</span>
                </p>

                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isNominal ? "bg-sky-400" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, ((v.value - v.min) / (v.max - v.min)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          3. 1-CLICK RFID SPACE MEAL SCANNER
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              1-Click RFID Meal Scanner
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {intake.scannedPacks.length} Logged Today
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Trigger simulated optical / RFID ingestion for pre-packaged space rations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEAL_PACKS.map((pack) => {
            const isScanning = scanning === pack.packId;
            return (
              <button
                key={pack.packId}
                id={`scan-btn-${pack.packId}`}
                type="button"
                onClick={() => void scan(pack.packId)}
                disabled={!!scanning}
                className={`relative text-left rounded-xl border p-4 transition-all duration-200 overflow-hidden ${
                  isScanning
                    ? "border-sky-400 bg-sky-950/40 shadow-[0_0_15px_rgba(56,189,248,0.3)] scale-[0.99]"
                    : "border-white/[0.06] bg-slate-900/40 hover:border-purple-400/40 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl p-1.5 rounded-lg bg-slate-800/60 shrink-0">{pack.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isScanning ? "text-sky-300" : "text-white"}`}>
                      {isScanning ? "Scanning RFID…" : pack.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">+{pack.nutrients.proteinG}g Protein</span>
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300">+{pack.nutrients.hydrationMl}mL Fluid</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">+{pack.nutrients.caloriesKcal} kcal</span>
                    </div>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isScanning ? (
                      <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                    ) : (
                      <ScanLine className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {lastScan && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3.5 flex items-center justify-between text-xs font-mono text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>RFID Synced: <strong>{lastScan.name}</strong></span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">Nutrients Ingested</span>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. OPTICAL CBC & BIO-CARTRIDGE SCANNER
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Microscope className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Microfluidic Bio-Cartridge Reader
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Laser Lens v3</span>
        </div>

        <div className="p-5 rounded-xl border border-dashed border-white/[0.12] bg-slate-900/30 text-center space-y-3">
          <div className="flex justify-center">
            <div className={`h-11 w-11 rounded-xl border flex items-center justify-center transition-all ${
              cbcScanning
                ? "border-sky-400 bg-sky-400/20 text-sky-300 animate-pulse"
                : cbcScanned
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-white/[0.1] bg-white/[0.04] text-slate-400"
            }`}>
              {cbcScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Microscope className="w-5 h-5" />}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-white">Spectroscopic Biomarker Extraction</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Insert sample cartridge into analyzer bay and run automated read.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpticalCBCScan}
            disabled={cbcScanning}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-[#03142c] hover:bg-sky-400 active:scale-[0.98] disabled:opacity-60 transition"
          >
            <ScanLine className="w-3.5 h-3.5" />
            {cbcScanning ? "Scanning Cartridge…" : "Trigger 1-Click Scan"}
          </button>
        </div>

        {opticalStatus && (
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/[0.06] p-3 text-xs font-mono text-sky-200">
            <p className="font-semibold text-sky-300 mb-0.5 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Diagnostics Pipeline:
            </p>
            <p className="text-slate-300">{opticalStatus}</p>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. RECENT AUTONOMOUS INGESTION EVENTS
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Recent Ingestion Logs
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">Zero Failures</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-sky-300 font-semibold">Bio-Patch Node</span>
              <span>100 Hz Sync</span>
            </div>
            <p className="text-slate-300 text-[11px]">HR 74 BPM · SpO₂ 98% · Hydration 76%</p>
            <p className="text-[10px] text-emerald-400">● Synced to Health Database</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-purple-300 font-semibold">RFID Antenna</span>
              <span>Auto-Catalog</span>
            </div>
            <p className="text-slate-300 text-[11px] truncate">
              {intake.scannedPacks.length > 0 ? intake.scannedPacks[intake.scannedPacks.length - 1].name : "Hydration Mix Pack #2"}
            </p>
            <p className="text-[10px] text-purple-300">● Synced to Daily Intake</p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-slate-900/40 p-3 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span className="text-blue-300 font-semibold">AI Anomaly Model</span>
              <span>Inference Active</span>
            </div>
            <p className="text-slate-300 text-[11px]">Vector: Nominal (Anomaly Score: 0.18)</p>
            <p className="text-[10px] text-sky-400">● Prescriptions Updated</p>
          </div>
        </div>
      </section>

    </div>
  );
}
