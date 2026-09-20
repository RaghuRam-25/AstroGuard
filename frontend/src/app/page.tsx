import Link from "next/link";
import Image from "next/image";
import { Activity, Brain, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/health", label: "Health" },
    { href: "/input", label: "Data Input" },
    { href: "/ai-analysis", label: "AI Analysis" },
    { href: "/alerts", label: "Alerts" },
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white overflow-hidden relative selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      {/* Background Image: homebg.png */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/homebg.png"
          alt="AstroGuard Space Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Soft overlay gradients for maximum text legibility & contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/90 via-[#020817]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-[#020817]/60" />
      </div>

      {/* Top Navigation Bar (matching Home mockup) */}
      <header className="relative z-30 mx-auto w-full max-w-7xl items-center justify-between px-6 sm:px-8 flex h-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 p-1">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={28} height={28} priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Astro<span className="text-blue-400">Guard</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.href === "/"
                  ? "text-blue-400 font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 mx-auto w-full max-w-7xl px-6 sm:px-8 pt-8 pb-16 lg:py-20 flex-1 flex flex-col justify-center">
        <div className="max-w-2xl space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-white">
            Healthier Astronauts.{" "}
            <span className="block text-blue-400">
              Safer Missions.
            </span>
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-300">
            AI-powered health monitoring for a safer tomorrow
          </p>

          <p className="text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl">
            AstroGuard uses advanced AI to detect anomalies, monitor vital signs, and keep astronauts healthy — beyond Earth.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/35 hover:bg-blue-500 transition-all active:scale-95"
            >
              Get Started
            </Link>
            <Link
              href="/ai-analysis"
              className="rounded-xl border border-white/20 bg-slate-950/40 px-7 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-900/60 hover:text-white transition-all backdrop-blur-md"
            >
              Learn More
            </Link>
          </div>

          {/* 3 Horizontal Feature Badges Below Hero */}
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
                <p className="text-[11px] text-slate-400 mt-0.5">Detect risks early</p>
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
    </div>
  );
}
