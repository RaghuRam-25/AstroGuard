"use client";

import { useAuth } from "../../../context/AuthContext";
import { User, Shield, Rocket, Activity, Mail, Calendar, Key, CheckCircle2 } from "lucide-react";

export default function AstronautProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-blue-500/10 pb-5">
        <span className="text-xs uppercase tracking-widest font-semibold text-blue-400">
          Flight Crew Credentials
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Astronaut Personnel Profile</h1>
        <p className="text-sm text-slate-400">
          Operational credential identification and telemetry uplink parameters.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#071322] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20 shrink-0">
            <div className="h-full w-full rounded-2xl bg-[#030914] flex items-center justify-center text-blue-400">
              <User className="w-10 h-10" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{user?.name || "Alex Morgan"}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Astronaut
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              {user?.email || "alex@astroguard.local"}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              Callsign ID: <span className="text-blue-400">{user?.astronautId || "AST-001"}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/5">
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Rocket className="w-3.5 h-3.5 text-blue-400" /> Assigned Mission
            </span>
            <span className="text-sm font-semibold text-white">Ares Mission 01</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Security Clearance
            </span>
            <span className="text-sm font-semibold text-emerald-400">Level 1 - Telemetry</span>
          </div>

          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1.5">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" /> Telemetry Protocol
            </span>
            <span className="text-sm font-semibold text-purple-300">Biometric Suit v3.2</span>
          </div>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="p-6 rounded-2xl border border-white/5 bg-[#071322] space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          Astronaut Role Scope & Data Boundary
        </h3>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized to view personal vital telemetry and historical trends.</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized to transmit biometric health readings to the anomaly detection engine.</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Authorized to review personalized AI recommendations and anomaly explanations.</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.01] border border-white/5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Strictly isolated: Cannot access or alter health data of other astronauts.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
