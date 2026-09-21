"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Activity, Brain, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/health",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin/dashboard",
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to their role dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_REDIRECTS[user.role] || "/login");
    }
  }, [user, loading, router]);

  // While checking auth, show a minimal spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  // Already authenticated — waiting for redirect
  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817]">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  // Not authenticated — show the public landing page
  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-hidden relative selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-[#020817]/60" />
        {/* Neon glows */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/8 blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-30 mx-auto w-full max-w-7xl items-center justify-between px-6 sm:px-8 flex h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 p-1">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={28} height={28} priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Astro<span className="text-blue-400">Guard</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-200 hover:border-blue-400/40 hover:text-white transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
          >
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 mx-auto w-full max-w-7xl px-6 sm:px-8 pt-8 pb-16 lg:py-20 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold text-blue-300 tracking-wide">NASA Space App Challenge 2025</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Healthier Astronauts.{" "}
            <span className="block text-blue-400">
              Safer Missions.
            </span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-300">
            AI-powered health monitoring for a safer tomorrow
          </p>

          <p className="text-sm sm:text-base leading-relaxed text-slate-400 max-w-xl">
            AstroGuard uses advanced AI to detect anomalies, monitor vital signs, and keep astronauts healthy — beyond Earth.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/35 hover:bg-blue-500 transition-all active:scale-95"
            >
              Get Started
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-white/20 bg-slate-950/40 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60 hover:text-white transition-all backdrop-blur-md"
            >
              Create Account
            </Link>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-white/10">
            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3.5 backdrop-blur-md shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Real-time Monitoring</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Track vital signs continuously</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3.5 backdrop-blur-md shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AI Anomaly Detection</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Detect health risks early</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-3.5 backdrop-blur-md shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Mission Ready</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">For a healthier future</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/5 py-4 text-center text-xs text-slate-600">
        AstroGuard © 2025 · Autonomous Biosensor Protocol · Ares Mission 01
      </footer>
    </div>
  );
}