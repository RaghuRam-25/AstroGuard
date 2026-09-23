"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  RefreshCw,
  Lock,
} from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { useTelemetryStream } from "../../hooks/useTelemetryStream";
import { useMealScanner, MEAL_PACKS } from "../../hooks/useMealScanner";

export default function DataInputPage() {
  const { user } = useAuth();
  const { connected, tickCount, vitals, streamSource } = useTelemetryStream(user?.astronautId, 1200);
  const { intake, scanning, lastScan, scan } = useMealScanner();

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header & Policy Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-[0.25em] text-cyan-400 uppercase font-bold">
                AstroGuard Autonomous Telemetry Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Autonomous Ingestion &amp; 1-Click RFID Food Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Zero-Manual-Entry Policy: All physiological telemetry and food intakes are recorded automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-xs font-mono font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Lock className="w-3.5 h-3.5" /> ZERO-MANUAL-ENTRY
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            LIVE BIO-SENSOR TELEMETRY INGESTION MATRIX
        ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#07111f]/90 p-5 backdrop-blur-md shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400" />
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Live Background Telemetry Ingestion (100 Hz Sync)
              </h2>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[10px] text-slate-400">Stream Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse" /> CONNECTED
              </span>
              <span className="text-[10px] text-cyan-300 border-l border-white/10 pl-3">
                Packets: {(tickCount * 100).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {vitals.map((v) => {
              const isNominal = v.status === "nominal";
              return (
                <div
                  key={v.id}
                  className={`rounded-xl border p-4 transition-all duration-300 ${
                    isNominal
                      ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                      : "border-amber-500/30 bg-amber-500/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                      {v.label}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                      isNominal
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-amber-500/30 text-amber-400 bg-amber-500/10 animate-pulse"
                    }`}>
                      {v.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {v.value} <span className="text-xs text-slate-400 font-normal">{v.unit}</span>
                  </div>

                  <div className="w-full bg-slate-800 h-1 rounded-full mt-2.5 overflow-hidden">
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
        </div>

        {/* ─────────────────────────────────────────────────────────
            1-CLICK RFID MEAL SCANNER SECTION
        ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 rounded-2xl border border-purple-500/20 bg-[#07111f]/90 p-5 sm:p-6 backdrop-blur-md shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <ScanLine className="w-4 h-4 text-purple-400" /> 1-Click Smart RFID Meal Scanner
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any pack to simulate optical/RFID scanner ingestion into DailyNutrientIntake DB.
                </p>
              </div>
              <span className="text-xs font-mono text-purple-300 font-bold px-2 py-1 rounded bg-purple-500/10 border border-purple-500/30">
                {intake.scannedPacks.length} Packs Ingested
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MEAL_PACKS.map((pack) => {
                const isScanning = scanning === pack.packId;
                return (
                  <button
                    key={pack.packId}
                    onClick={() => void scan(pack.packId)}
                    disabled={!!scanning}
                    className={`group text-left rounded-xl border p-4 transition-all duration-300 relative overflow-hidden ${
                      isScanning
                        ? "border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[0.98]"
                        : "border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-950/20"
                    }`}
                  >
                    {isScanning && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute left-0 right-0 h-0.5 bg-cyan-400 animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_12px_#22d3ee]" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <span className="text-2xl p-1.5 rounded-lg bg-slate-800">{pack.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${isScanning ? "text-cyan-300" : "text-white group-hover:text-purple-200"}`}>
                          {isScanning ? "Scanning Pack..." : pack.name}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 font-mono text-[9px] text-slate-400">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300">+{pack.nutrients.proteinG}g Prot</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">+{pack.nutrients.hydrationMl}mL H₂O</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">+{pack.nutrients.caloriesKcal} kcal</span>
                        </div>
                      </div>

                      <div className="shrink-0 mt-1">
                        {isScanning ? (
                          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : (
                          <ScanLine className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {lastScan && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between text-xs font-mono text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Optical RFID Synced: <strong>{lastScan.name}</strong></span>
                </div>
                <span className="text-[9px] uppercase font-bold text-emerald-400">DB Updated</span>
              </div>
            )}
          </div>

          {/* Right: Ingestion Status Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-[#07111f]/90 p-5 backdrop-blur-md shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2.5">
                Current Intake Totals
              </h3>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-slate-400">Protein Ingested:</span>
                  <span className="font-bold text-purple-300">{intake.proteinG}g</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-slate-400">Hydration Volume:</span>
                  <span className="font-bold text-cyan-300">{(intake.hydrationMl / 1000).toFixed(2)} L</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-slate-400">Metabolic Energy:</span>
                  <span className="font-bold text-amber-300">{intake.caloriesKcal} kcal</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-slate-400">Sodium / Electrolytes:</span>
                  <span className="font-bold text-emerald-300">{intake.sodiumMg} mg</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-xs text-slate-300 space-y-1.5">
              <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Zero-Manual Verification:
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                All bio-sensor streams are automatically fed into the Isolation Forest anomaly detector. Manual logging has been deprecated across the AstroGuard fleet.
              </p>
            </div>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}