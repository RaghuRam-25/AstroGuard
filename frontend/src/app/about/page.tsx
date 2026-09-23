import React from "react";
import { 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Stethoscope, 
  Radio, 
  ScanLine, 
  CheckCircle2, 
  Zap, 
  HeartPulse, 
  Users, 
  Bot 
} from "lucide-react";
import PublicShell from "../../components/public/PublicShell";

// Core Platform Highlights
const PLATFORM_PILLARS = [
  {
    icon: Cpu,
    title: "Zero-Manual-Entry IoT Sensors",
    description: "Subdermal bio-bands, micro-fluidic sweat patches, and smart telemetry stream continuous vitals directly into the cockpit with zero typing.",
    badge: "Automated Ingestion",
    accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
  },
  {
    icon: Stethoscope,
    title: "Dedicated Flight Surgeons",
    description: "Assigned Medical Officers monitor live astronaut cohorts, conduct 1-on-1 encrypted video calls, and issue calm clinical guidance.",
    badge: "1-on-1 Telemedicine",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
  },
  {
    icon: Radio,
    title: "Mission Control Command",
    description: "Centralized fleet management that delegates medical assignments, manages time-limited registration, and oversees high-level alerts.",
    badge: "Fleet Oversight",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10"
  },
  {
    icon: ScanLine,
    title: "RFID & Diagnostic Scanning",
    description: "Instant 1-click RFID food pack and Lab-on-a-Chip scanning to instantly track macro/micro nutrients and biomarker deficits.",
    badge: "Instant Sync",
    accent: "text-purple-400 border-purple-500/30 bg-purple-500/10"
  }
];

// Quick Platform Metrics
const METRICS = [
  { label: "Biometric Parameters", value: "14+", sub: "Continuous Vitals" },
  { label: "Data Ingestion Sync", value: "100 Hz", sub: "Real-time SSE Engine" },
  { label: "Psychological Safety", value: "100%", sub: "Panic-Free Calm UI" },
  { label: "Human Telemedicine", value: "24/7", sub: "Flight Surgeon Link" }
];

// Operational Flow Steps
const WORKFLOW_STEPS = [
  { step: "01", title: "IoT Bio-Sensors", desc: "Automated telemetry collection" },
  { step: "02", title: "AI Anomaly Engine", desc: "Baseline deficit detection" },
  { step: "03", title: "Doctor Triage", desc: "Flight surgeon evaluation" },
  { step: "04", title: "Calm Guidance", desc: "Non-alarmist astronaut advice" }
];

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-10 pb-14 text-slate-100 sm:px-8">
            {/* 2. STATS BAR */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {METRICS.map((metric) => (
              <div 
                key={metric.label}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md transition hover:border-cyan-500/30"
              >
                <div className="text-2xl font-black tracking-tight text-cyan-400 sm:text-3xl font-mono">
                  {metric.value}
                </div>
                <div className="mt-1 text-xs font-bold text-slate-200">{metric.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{metric.sub}</div>
              </div>
            ))}
          </div>

          {/* 3. FOUR CORE PILLARS GRID */}
          <section className="mt-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PLATFORM_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article 
                    key={pillar.title} 
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-900/80"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${pillar.accent}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border border-white/10 bg-slate-800 text-slate-400">
                          {pillar.badge}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-bold text-white group-hover:text-cyan-300 transition">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-400">
                        {pillar.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* 4. WORKFLOW & SYSTEM PHILOSOPHY SECTION */}
          <section className="mt-8 grid gap-6 lg:grid-cols-12">
            
            {/* Left: Psychological Safety Protocol */}
            <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-slate-900/90 p-6 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  <Bot className="h-4 w-4" /> Psychological Mission Safety
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">Calm HUD vs. Clinical Triage</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  To prevent panic in deep space, raw medical alerts are hidden from astronauts. 
                  Instead, complex biometric anomalies are sent directly to their assigned **Flight Surgeon**, 
                  who sends calm, actionable care guidance back to the astronaut's HUD.
                </p>
              </div>

              <div className="mt-6 space-y-2 text-xs font-medium text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Panic-Inducing Popups for Crew
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Direct Encrypted Doctor Telemedicine
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Mission Control Governance Oversight
                </div>
              </div>
            </div>

            {/* Right: Operational Workflow */}
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-cyan-400 mb-4">
                <Activity className="h-4 w-4" /> End-to-End Care Loop
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {WORKFLOW_STEPS.map((item, index) => (
                  <div key={item.step} className="relative rounded-xl border border-white/10 bg-[#080C14]/80 p-3 text-center">
                    <div className="text-xs font-mono font-bold text-cyan-400">{item.step}</div>
                    <div className="mt-1 text-xs font-bold text-white">{item.title}</div>
                    <div className="mt-1 text-[10px] text-slate-400 leading-tight">{item.desc}</div>
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <span className="absolute -right-2 top-1/2 -translate-y-1/2 hidden text-cyan-500/50 sm:block text-xs font-mono">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </section>
      </div>
    </PublicShell>
  );
}