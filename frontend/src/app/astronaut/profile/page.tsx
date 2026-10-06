"use client";

import Image from "next/image";
import {
  ChevronRight,
  FileDown,
  HelpCircle,
  KeyRound,
  Mail,
  Pencil,
  Rocket,
  User,
  ShieldCheck,
  Phone,
  Calendar,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { astronaut, missionInfo } from "@/data/mockData";

export default function AstronautProfilePage() {
  const { user } = useAuth();

  const PERSONAL = [
    { label: "Full Name", value: user?.name || astronaut.name },
    { label: "Astronaut ID", value: user?.astronautId || astronaut.id },
    { label: "Role", value: "Mission Specialist / Commander" },
    { label: "Date of Birth", value: astronaut.dob },
    { label: "Nationality", value: astronaut.nationality },
    { label: "Height", value: astronaut.height },
    { label: "Weight", value: astronaut.weight },
    { label: "Blood Type", value: astronaut.bloodType },
  ];

  const CONTACT = [
    { label: "Email", value: user?.email || astronaut.email },
    { label: "Phone", value: astronaut.phone },
    { label: "Emergency Contact", value: astronaut.emergencyContact },
    { label: "Emergency Phone", value: astronaut.emergencyPhone },
  ];

  const MISSION = [
    { label: "Active Mission", value: user?.missionIds?.[0] || missionInfo.mission },
    { label: "Mission Day", value: `Day ${missionInfo.missionDay} of 365` },
    { label: "Current Phase", value: missionInfo.phase },
    { label: "Operational Status", value: missionInfo.statusLabel },
  ];

  const MISSION_PROGRESS = Math.round((missionInfo.missionDay / 365) * 100);

  const QUICK_ACTIONS = [
    { label: "Edit Personal Record", icon: Pencil },
    { label: "Security & Encryption Keys", icon: KeyRound },
    { label: "Export Health Data Archive", icon: FileDown },
    { label: "Medical Support Desk", icon: HelpCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2 sm:py-4 px-2 sm:px-4 animate-fade-in text-slate-100">
      
      {/* ─────────────────────────────────────────────────────────
          1. HEADER
      ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-sky-400/10 pb-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-sky-400 font-mono">
            Astronaut Dossier
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Astronaut Profile
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mission credentials, biometric parameters, and emergency records.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Flight Certified
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. PROFILE SUMMARY CARD
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative shrink-0">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl border border-sky-400/30 bg-slate-900 shadow-xl">
              <Image
                src="/astronaut-avatar.png"
                alt={`${user?.name || astronaut.name} portrait`}
                width={128}
                height={128}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#071324] bg-emerald-400" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {user?.name || astronaut.name}
                </h2>
                <p className="text-xs font-mono text-sky-400">
                  {user?.astronautId || astronaut.id} · Commander
                </p>
              </div>

              <span className="inline-flex items-center self-center sm:self-auto gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
                Active Assignment
              </span>
            </div>

            <p className="text-xs text-slate-300 italic pt-1 leading-relaxed">
              &ldquo;{astronaut.bio}&rdquo;
            </p>

            <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Mission: {user?.missionIds?.[0] || missionInfo.mission}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                Blood: {astronaut.bloodType}
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/[0.06] text-slate-300">
                ECLSS Band: Tier 1
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          3. PERSONAL & BIOMETRIC DETAILS
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Personal Information
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Verified NASA Bio-ID</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {PERSONAL.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-white/[0.04]"
            >
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs font-semibold text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          4. CONTACT & EMERGENCY CHANNELS
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Emergency &amp; Ground Contacts
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Priority Comms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {CONTACT.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-white/[0.04]"
            >
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs font-semibold text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. MISSION STATUS & PROGRESS
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Mission Status
            </h2>
          </div>
          <span className="text-xs font-mono text-sky-400">{MISSION_PROGRESS}% Duration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {MISSION.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-2 border-b border-white/[0.04]"
            >
              <span className="text-xs text-slate-400">{item.label}</span>
              <span className="text-xs font-semibold text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Mission Timeline Progress</span>
            <span className="font-mono text-slate-200">{missionInfo.missionDay} / 365 Days</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
              style={{ width: `${MISSION_PROGRESS}%` }}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. QUICK ACTIONS & PROFILE SETTINGS
      ───────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-5 sm:p-6 backdrop-blur-md space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Account Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-slate-900/40 hover:bg-slate-900/80 hover:border-sky-400/30 transition text-left text-xs font-medium text-slate-200"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-sky-400" />
                  <span>{action.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500" />
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}