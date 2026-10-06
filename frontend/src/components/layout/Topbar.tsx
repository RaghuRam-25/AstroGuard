"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Clock, Menu, Siren, X, Send, CheckCircle2 } from "lucide-react";
import { sendEmergencySOS } from "@/lib/api";

interface TopbarProps {
  onMenuClick: () => void;
}

const PAGE_HEADINGS: Record<string, { title: string; subtitle?: string }> = {
  "/astronaut/dashboard": { title: "Mission Console", subtitle: "Live biometric telemetry & mission status" },
  "/astronaut/health": { title: "Astronaut Health", subtitle: "Comprehensive vital signs & health history" },
  "/astronaut/data-input": { title: "Telemetry & RFID Hub", subtitle: "Manual input and environmental telemetry" },
  "/astronaut/ai-analysis": { title: "AI Assistant", subtitle: "Smart health risk evaluation & diagnostics" },
  "/astronaut/medical-consult": { title: "Medical Consult", subtitle: "Direct channel with assigned flight surgeon" },
  "/astronaut/profile": { title: "Astronaut Profile", subtitle: "Astronaut credentials & mission record" },
};

const REASONS = ["Extreme Dizziness", "Acute Pain", "Breathing Issue", "Disorientation"] as const;

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const heading = PAGE_HEADINGS[pathname] ?? { title: "AstroGuard", subtitle: "Astronaut Health Intelligence" };
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<typeof REASONS[number]>(REASONS[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSending(true);
    setError("");
    const res = await sendEmergencySOS(reason);
    if (res.success) setSent(true);
    else setError(res.message || "Unable to transmit SOS.");
    setSending(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#020817]/80 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-white">{heading.title}</h1>
            <p className="truncate text-xs text-slate-400 hidden sm:block">{heading.subtitle}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setSent(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition active:scale-95"
          >
            <Siren className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Emergency SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/40 px-3 py-1.5 lg:flex font-mono text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-sky-400" />
            <span>14:32 UTC</span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-white/[0.06] bg-slate-900/40 p-2 text-slate-400 transition hover:text-white"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sky-500 text-[8px] font-bold text-[#020817]">
              2
            </span>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020817]/85 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[#0b1220] p-5 shadow-[0_0_60px_rgba(244,63,94,0.3)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-400">
                  <Siren className="h-5 w-5 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">Critical Emergency Uplink</span>
                </div>
                <h2 className="mt-1 text-lg font-bold text-white">Transmit Emergency SOS</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="text-sm font-bold text-white">Emergency Transmitted</p>
                <p className="text-xs text-emerald-200">
                  Critical signal sent for &quot;{reason}&quot;. Flight Surgeon Dr. Sarah Chen has been notified.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-3 w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-[#03142c] hover:bg-emerald-400 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300">Select Condition:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {REASONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setReason(item)}
                        className={`rounded-xl border p-3 text-left text-xs font-semibold transition ${
                          reason === item
                            ? "border-rose-400 bg-rose-500/20 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                            : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500/40"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                    {error}
                  </p>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={submit}
                    className="flex-[2] inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 py-2.5 text-xs font-bold text-white hover:from-rose-500 hover:to-red-400 transition disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Transmitting…" : `Send SOS — ${reason}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
