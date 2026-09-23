"use client";

import { useState } from "react";
import {
  Lock,
  Unlock,
  Clock,
  ShieldAlert,
  Play,
  RotateCcw,
  Timer,
  Radio,
} from "lucide-react";
import { useRegistration } from "../../context/RegistrationContext";

const PRESETS = [
  { label: "15 Minutes", minutes: 15 },
  { label: "30 Minutes", minutes: 30 },
  { label: "1 Hour", minutes: 60 },
];

const CUSTOM_MIN = 1;
const CUSTOM_MAX = 1440;

export default function RegistrationControlPanel() {
  const {
    isRegistrationOpen,
    registrationExpiresAt,
    expiresInMs,
    remainingLabel,
    statusLabel,
    loading,
    startRegistration,
    closeRegistration,
  } = useRegistration();

  const [preset, setPreset] = useState(30);
  const [customOpen, setCustomOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = isRegistrationOpen;
  const expiresAtLabel = registrationExpiresAt
    ? new Date(registrationExpiresAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const handleStart = async () => {
    const minutes = customOpen ? Number(customMinutes) : preset;
    if (!Number.isFinite(minutes) || minutes < CUSTOM_MIN || minutes > CUSTOM_MAX) {
      setError(`Custom window must be ${CUSTOM_MIN}–${CUSTOM_MAX} minutes.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await startRegistration(Math.max(minutes, 1));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async () => {
    setError(null);
    setBusy(true);
    try {
      await closeRegistration();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-300">
          <ShieldAlert className="h-4 w-4" />
          Time-Limited Public Registration Controller
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          System Governance
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Open or close the public astronaut enrollment gate. Registration windows auto-expire on
          a countdown — the Navbar &quot;Join Crew&quot; button is only visible while the window is
          open.
        </p>
      </div>

      {/* Status strip */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0c061f]/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gate State</p>
          <div className="mt-2 flex items-center gap-2">
            {open ? (
              <Unlock className="h-5 w-5 text-emerald-400" />
            ) : (
              <Lock className="h-5 w-5 text-amber-400" />
            )}
            <span
              className={`text-xl font-black ${open ? "text-emerald-300" : "text-amber-300"}`}
            >
              {loading ? "SYNC" : statusLabel}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0c061f]/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Remaining Window
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Clock className={`h-5 w-5 ${open ? "text-cyan-300" : "text-slate-600"}`} />
            <span
              className={`font-mono text-xl font-black tabular-nums ${
                open && expiresInMs < 30_000
                  ? "text-red-400 animate-pulse"
                  : "text-cyan-300"
              }`}
            >
              {open ? remainingLabel : "00:00"}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0c061f]/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Expires At
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Timer className="h-5 w-5 text-slate-500" />
            <span className="font-mono text-xl font-black text-white">
              {expiresAtLabel ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Control card */}
      <div className="rounded-2xl border border-white/10 bg-[#0c061f]/60 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              {open ? "Registration window in progress" : "Open a new registration window"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {open
                ? "The public Navbar Join Crew button is currently visible."
                : "Select a duration to broadcast the enrollment window to the public site."}
            </p>
          </div>
          <Radio className={`h-5 w-5 ${open ? "text-emerald-400 animate-pulse" : "text-slate-600"}`} />
        </div>

        <div className="mt-5 space-y-4">
          {/* Duration presets */}
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const selected = p.minutes === preset;
              return (
                <button
                  key={p.minutes}
                  onClick={() => {
                    setPreset(p.minutes);
                    setCustomOpen(false);
                    setCustomMinutes("");
                  }}
                  disabled={open || busy}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-bold transition ${
                    selected && !customOpen
                      ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom duration component */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => setCustomOpen((current) => !current)}
              disabled={open || busy}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold transition ${
                customOpen
                  ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              }`}
            >
              <Timer className="h-4 w-4" />
              Custom Duration
            </button>
            {customOpen && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={CUSTOM_MIN}
                  max={CUSTOM_MAX}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="w-32 rounded-xl border border-white/10 bg-[#0a0418]/80 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                />
                <span className="text-xs text-slate-400">minute(s)</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row">
            <button
              onClick={handleStart}
              disabled={open || busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-[#020817] shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Start Registration Window
            </button>
            <button
              onClick={handleClose}
              disabled={!open || busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-300 transition hover:border-amber-500/60 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Close Window (Force Reset)
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600">
        Windows broadcast via the live system bus — open the public site in another tab to see the
        Join Crew button appear, then vanish on expiry.
      </p>
    </div>
  );
}