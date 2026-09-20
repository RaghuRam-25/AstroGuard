import Link from "next/link";
import Image from "next/image";
import { Shield, Brain, Activity, Cpu, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#07111f]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 p-1">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={24} height={24} priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Astro<span className="text-blue-400">Guard</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 transition">
            Mission Gateway Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400">
            <Shield className="w-3.5 h-3.5" />
            <span>NASA Space Apps Challenge Innovation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Autonomous Health Intelligence for Deep Space Exploration
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            AstroGuard is an AI-powered astronaut health monitoring system designed to bridge communication latency in deep space missions, detecting physiological anomalies before clinical manifestation.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-[#07111f]/80 p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Dual-Baseline Ingestion</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dynamically computes individual personalized 90-day baselines alongside mission cohort baselines across Heart Rate, SpO₂, Sleep Duration, and Physical Activity.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#07111f]/80 p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Multi-Variate Isolation Forest</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unsupervised machine learning model detects subtle cross-signal deviations (such as tachycardia coupled with suppressed mobility) up to 36 hours prior to single-threshold alarms.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#07111f]/80 p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Explainable Insights & RBAC</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Translates mathematical anomaly scores into human-interpretable contributor metrics, actionable countermeasure recommendations, and strict role-based clearances.
            </p>
          </div>
        </div>

        {/* Technical Architecture */}
        <div className="rounded-3xl border border-white/10 bg-[#07111f]/80 p-8 space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-white/5 pb-4">
            Mission Security & Privacy Standards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Zero Public Telemetry: All medical & physiological data is restricted behind HTTP-only JWTs.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Strict Ownership Enforcement: Astronauts can only view their authenticated biometric streams.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Role-Based Clearances: Dedicated views for Flight Surgeons, Mission Control, and Administrators.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Non-Diagnostic Safeguards: Clear separation between monitoring alarms and medical diagnosis.</span>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              <span>Access Secure Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
