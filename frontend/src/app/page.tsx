"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Brain, ShieldCheck, Loader2, HeartPulse, Radar, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PublicShell from "../components/public/PublicShell";
import SpaceLaunchOverlay from "../components/SpaceLaunchOverlay";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/health",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin",
};

const FEATURES = [
  { icon: Brain, label: "AI Health Analysis", detail: "Explainable health insights" },
  { icon: Activity, label: "Real-Time Monitoring", detail: "Continuous vital telemetry" },
  { icon: Radar, label: "Anomaly Detection", detail: "Early deviation signals" },
  { icon: ShieldCheck, label: "Mission Insights", detail: "Crew health awareness" },
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace(ROLE_REDIRECTS[user.role] || "/login");
    }
  }, [user, loading]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[calc(100vh-9.5rem)] max-w-7xl items-center px-5 py-8 sm:px-8 lg:py-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              Astronaut Health Intelligence
            </span>
            <h1 className="public-glow mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Healthier Astronauts. <span className="text-primary">Safer Missions.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold text-slate-200 sm:text-lg">
              AI-powered health monitoring for the next generation of space missions.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              AstroGuard turns vital signals into understandable anomaly insights, personal baselines and mission health awareness—without exposing private astronaut data publicly.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-xl bg-gradient-to-r from-primary to-cyan-bright px-6 py-3 text-sm font-bold text-[#020817] shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-95">
                Get Started
              </Link>
              <button
                type="button"
                onClick={() => setIsLaunching(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/50 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-200 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] active:scale-95"
              >
                <Sparkles className="h-4 w-4 animate-pulse text-cyan-400" />
                Explore
              </button>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FEATURES.map(({ icon: Icon, label, detail }) => (
                <div key={label} className="glass-card rounded-xl p-3">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="mt-2 text-[11px] font-bold text-foreground">{label}</p>
                  <p className="mt-1 text-[10px] leading-snug text-muted">{detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <div className="relative h-80 w-80 rounded-full border border-primary/20 bg-primary/5 p-5 shadow-[0_0_80px_rgba(56,189,248,0.18)]">
              <div className="absolute inset-3 animate-spin rounded-full border border-dashed border-primary/25 [animation-duration:45s]" />
              <div className="flex h-full items-center justify-center rounded-full border border-primary/20 bg-[#020817]/50">
                <HeartPulse className="h-24 w-24 text-primary drop-shadow-[0_0_24px_rgba(56,189,248,0.55)]" />
              </div>
              <span className="absolute -right-10 top-24 rounded-xl border border-primary/20 bg-[#071a2e]/90 px-3 py-2 text-[10px] shadow-xl backdrop-blur"><span className="block font-bold text-primary">72 BPM</span><span className="text-slate-400">Live telemetry</span></span>
              <span className="absolute -left-10 bottom-24 rounded-xl border border-success/20 bg-[#071a2e]/90 px-3 py-2 text-[10px] shadow-xl backdrop-blur"><span className="block font-bold text-success">98%</span><span className="text-slate-400">SpO₂ nominal</span></span>
              <span className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-success">Mission Ready</span>
              <span className="absolute bottom-10 left-2 rounded-full border border-primary/20 bg-[#071a2e]/90 px-3 py-1 text-[10px] font-semibold text-primary">Baseline Active</span>
            </div>
          </div>
        </div>
      </section>

      {isLaunching && <SpaceLaunchOverlay onClose={() => setIsLaunching(false)} />}
    </PublicShell>
  );
}
