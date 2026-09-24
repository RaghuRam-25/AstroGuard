"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Clock, Menu, Siren, X, Send, CheckCircle2, LogOut } from "lucide-react";
import { missionInfo } from "@/data/mockData";
import { sendEmergencySOS } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps { onMenuClick: () => void; }
const PAGE_HEADINGS: Record<string, { title: string; subtitle: string }> = {
  "/astronaut/dashboard": { title: "Health Dashboard HUD", subtitle: "Autonomous bio-telemetry streaming and RFID nutrition tracking." },
  "/astronaut/data-input": { title: "Automated Telemetry & RFID Hub", subtitle: "Zero manual entry biometric and nutrition sync." },
  "/astronaut/ai-analysis": { title: "AI Analysis", subtitle: "Explainable anomaly detection and insights." },
  "/astronaut/medical-consult": { title: "Medical Consult", subtitle: "Chat & call with medical officers and flight surgeons." },
  "/astronaut/profile": { title: "Profile", subtitle: "Your mission profile and personal details." },
};
const REASONS = ["Extreme Dizziness", "Acute Pain", "Breathing Issue", "Disorientation"] as const;

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const heading = PAGE_HEADINGS[pathname] ?? { title: "AstroGuard", subtitle: "Astronaut Health Intelligence" };
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<typeof REASONS[number]>(REASONS[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const initials = user?.name
    ? user.name.split(" ").filter((w) => w.length > 0).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "AM";

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
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-sky-400/10 bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onMenuClick} aria-label="Open navigation menu" className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white lg:hidden">
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight text-white">{heading.title}</h1>
            <p className="truncate text-xs text-slate-400">{heading.subtitle}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button type="button" onClick={() => { setOpen(true); setSent(false); }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-2 text-[10px] font-black tracking-wide text-rose-200 shadow-[0_0_16px_rgba(244,63,94,.18)] hover:bg-rose-500/25">
            <Siren className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">EMERGENCY SOS</span>
            <span className="sm:hidden">SOS</span>
          </button>
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-primary md:inline-block">
            {missionInfo.mission.toUpperCase()}
          </span>
          <div className="hidden items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 lg:flex">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-white">14:32 UTC</p>
              <p className="text-[10px] text-slate-400">Apr 28, 2025</p>
            </div>
          </div>
          <button type="button" aria-label="Notifications" className="relative rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-[#020817]">2</span>
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#020817]/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-rose-400/35 bg-[#0b1220] p-5 shadow-[0_0_60px_rgba(244,63,94,.2)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-300">
                  <Siren className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-[0.18em]">Critical emergency uplink</span>
                </div>
                <h2 className="mt-2 text-xl font-black text-white">Transmit Emergency SOS</h2>
                <p className="mt-1 text-xs text-slate-400">Medical Operations and Mission Control will receive a critical alert.</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {sent ? (
              <div className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-300" />
                <p className="mt-2 text-sm font-bold text-white">SOS transmitted</p>
                <p className="mt-1 text-xs text-emerald-200">Critical alert sent for {reason}. Stay calm and follow radio protocol.</p>
                <button onClick={() => setOpen(false)} className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-[#03142c]">Close</button>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-2">
                  {REASONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => setReason(item)}
                      className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${reason === item
                        ? "border-rose-300/70 bg-rose-500/20 text-rose-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-rose-300/30"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                {error && <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</p>}
                <button
                  disabled={sending}
                  onClick={submit}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 py-3 text-xs font-black text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Transmitting..." : `Send Critical SOS — ${reason}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
