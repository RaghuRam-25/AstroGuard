import {
  Activity,
  Bell,
  Clock,
  Cpu,
  Database,
  Ear,
  HeartPulse,
  LineChart,
  Radar,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import PublicShell from "../../components/public/PublicShell";

const INTELLIGENCE = [
  {
    icon: HeartPulse,
    title: "Personal Baseline",
    description:
      "AstroGuard learns each astronaut's unique normal — their heart rate rhythm, oxygen saturation, sleep need, and activity patterns over time.",
    tone: "text-rose-400 border-rose-400/20 bg-rose-400/10",
  },
  {
    icon: Users,
    title: "Mission Baseline",
    description:
      "Individual signals are measured against the mission cohort, capturing the shared reality of living and working in space.",
    tone: "text-sky-400 border-sky-400/20 bg-sky-400/10",
  },
];

const WORKFLOW = [
  { icon: Database, label: "DATA", note: "Vital telemetry" },
  { icon: Cpu, label: "ANALYSIS", note: "AI scoring" },
  { icon: Radar, label: "ANOMALY", note: "Deviation found" },
  { icon: LineChart, label: "INSIGHT", note: "Explained signal" },
  { icon: Bell, label: "ALERT", note: "Crew notified" },
];

const CAPABILITIES = [
  { icon: Activity, label: "Continuous Monitoring" },
  { icon: Cpu, label: "AI Analysis" },
  { icon: Radar, label: "Early Anomaly Detection" },
  { icon: ShieldCheck, label: "Crew Safety" },
  { icon: Ear, label: "Mission Awareness" },
];

export default function MissionPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 lg:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <Target className="h-3.5 w-3.5" />
          Our Mission
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Protect astronaut health
          <span className="block bg-gradient-to-r from-primary to-cyan-bright bg-clip-text text-transparent">
            through intelligent data.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Deep space removes the safety net of instant communication. AstroGuard&apos;s mission is
          to give crews an intelligent companion that watches their physiology continuously
          and raises the alarm when something changes — early.
        </p>
      </section>

      {/* Mission objective */}
      <section className="mx-auto max-w-5xl px-5 sm:px-8">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-xl font-bold text-foreground">Mission Objective</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Monitor astronaut health continuously and identify meaningful changes early.
            AstroGuard detects deviation from each astronaut&apos;s personal and mission baselines
            — turning raw telemetry into actionable insight long before a single-threshold
            alarm would ever fire.
          </p>
        </div>
      </section>

      {/* Mission intelligence */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Mission <span className="text-primary">Intelligence</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Health signals are continuously compared against two living baselines.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {INTELLIGENCE.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="glass-card group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_50px_rgba(56,189,248,0.12)]"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${item.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission workflow — mission control visualization */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Cpu className="h-3.5 w-3.5" />
            Mission Workflow
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            A mission-control <span className="text-primary">rhythm</span>
          </h2>
        </div>

        <div className="glass-card relative overflow-hidden rounded-3xl p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
            {WORKFLOW.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative flex items-center justify-center">
                  <div className="flex w-full max-w-[10rem] flex-col items-center gap-3 rounded-2xl border border-primary/20 bg-[#020817]/70 px-4 py-5 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold tracking-widest text-primary">
                        {step.label}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">{step.note}</p>
                    </div>
                  </div>
                  {index < WORKFLOW.length - 1 && (
                    <span className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-primary/70 sm:block">
                      →
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Designed for long-duration missions */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:pb-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Clock className="h-3.5 w-3.5" />
            Deep Space Ready
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Designed for Long-Duration <span className="text-primary">Space Missions</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Built for the months and years crews spend far beyond mission control&apos;s reach.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.label}
                className="glass-card flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
              >
                <Icon className="h-6 w-6 text-primary" />
                <p className="text-xs font-bold text-foreground">{cap.label}</p>
              </div>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}