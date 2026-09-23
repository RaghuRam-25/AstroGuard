"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Eye,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Waves,
} from "lucide-react";
import { getAllMedicalAlerts } from "../../../lib/api";
import { EmptyState, ErrorState, LoadingState } from "../../../components/shared/LoadingState";
import { MedicalAlert, TriageLevel } from "../../../components/medical/types";

type FilterKey = "active" | "critical" | "all" | "resolved";

const triageStyles: Record<TriageLevel, { chip: string; card: string; icon: typeof Siren }> = {
  CRITICAL: {
    chip: "border-rose-400/30 bg-rose-500/15 text-rose-200",
    card: "border-rose-400/35 bg-rose-500/10 shadow-[0_0_25px_rgba(244,63,94,0.08)]",
    icon: Siren,
  },
  WARNING: {
    chip: "border-amber-400/30 bg-amber-500/15 text-amber-200",
    card: "border-amber-400/25 bg-amber-500/5 shadow-[0_0_20px_rgba(251,191,36,0.05)]",
    icon: AlertTriangle,
  },
  NOMINAL: {
    chip: "border-cyan-400/30 bg-cyan-500/15 text-cyan-200",
    card: "border-cyan-400/20 bg-cyan-500/5",
    icon: Activity,
  },
};

const FILTERS: Array<{ key: FilterKey; label: string; count: number }> = [
  { key: "active", label: "Active", count: 0 },
  { key: "critical", label: "Critical", count: 0 },
  { key: "all", label: "All", count: 0 },
  { key: "resolved", label: "Resolved", count: 0 },
];

function severityLevel(severity?: string): TriageLevel {
  if (severity === "Critical") return "CRITICAL";
  if (severity === "Warning" || severity === "Watch") return "WARNING";
  return "NOMINAL";
}

function timeAgo(value?: string): string {
  if (!value) return "Just now";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MedicalAlertsPage() {
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("active");
  const [query, setQuery] = useState("");
  const [lastSync, setLastSync] = useState("");

  const fetchAlerts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const res = await getAllMedicalAlerts("assigned");
      if (res.success) {
        setAlerts((res.data || []) as MedicalAlert[]);
        setLastSync(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } else {
        setError(res.message || "Failed to load clinical alerts.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect to alert dispatch.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => fetchAlerts(true));
    const timer = window.setInterval(() => { void fetchAlerts(); }, 5000);
    return () => window.clearInterval(timer);
  }, [fetchAlerts]);

  const activeAlerts = useMemo(() => alerts.filter(alert => !alert.resolved), [alerts]);
  const criticalAlerts = useMemo(() => activeAlerts.filter(alert => alert.severity === "Critical"), [activeAlerts]);
  const warningAlerts = useMemo(() => activeAlerts.filter(alert => alert.severity !== "Critical"), [activeAlerts]);
  const resolvedCount = alerts.length - activeAlerts.length;
  const crewCount = useMemo(() => new Set(alerts.map(alert => alert.astronautId)).size, [alerts]);

  const filters = useMemo(() => FILTERS.map(item => ({
    ...item,
    count: item.key === "active"
      ? activeAlerts.length
      : item.key === "critical"
        ? criticalAlerts.length
        : item.key === "resolved"
          ? resolvedCount
          : alerts.length,
  })), [activeAlerts, criticalAlerts, resolvedCount, alerts]);

  const filtered = useMemo(() => alerts.filter(alert => {
    const matchesQuery = `${alert.astronautId} ${alert.title} ${alert.description} ${alert.signal || ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && !alert.resolved) ||
      (filter === "critical" && !alert.resolved && alert.severity === "Critical") ||
      (filter === "resolved" && Boolean(alert.resolved));
    return matchesQuery && matchesFilter;
  }), [alerts, filter, query]);

  if (loading) return <LoadingState message="Connecting to crew alert dispatch stream…" />;
  if (error) return <ErrorState message={error} onRetry={() => void fetchAlerts(true)} />;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-400/15 bg-gradient-to-r from-[#0a141f]/95 via-[#1a0e16] to-[#0a141f]/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-rose-300">
            <Siren className="h-4 w-4" /> Emergency & Anomaly Dispatch
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-black text-white">
            <Bell className="h-6 w-6 text-rose-300" /> Medical Alerts
          </h1>
          <p className="mt-1 text-xs text-rose-200/80">
            Prioritized biometric anomalies and clinical signals across your assigned crew.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> LIVE STREAM · 5s AUTO-SYNC
          </div>
          <button
            onClick={() => void fetchAlerts()}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${lastSync ? "" : "animate-spin"}`} /> Refresh Stream
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Summary icon={Bell} label="Active Signals" value={activeAlerts.length} tone="cyan" />
        <Summary icon={AlertTriangle} label="Watch / Warning" value={warningAlerts.length} tone="amber" />
        <Summary icon={ShieldAlert} label="Critical Triaged" value={criticalAlerts.length} tone="rose" />
        <Summary icon={CheckCircle2} label="Resolved" value={resolvedCount} tone="emerald" />
      </div>

      <section className="rounded-2xl border border-rose-400/15 bg-[#0a141f]/80 p-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search astronaut, signal, or description…"
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-xs text-white outline-none placeholder:text-slate-600 focus:border-rose-400/50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
            <Filter className="h-4 w-4 shrink-0 text-slate-500" />
            {filters.map(item => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={`whitespace-nowrap rounded-lg border px-3 py-2 font-semibold transition ${
                  filter === item.key
                    ? item.key === "critical"
                      ? "border-rose-400/60 bg-rose-400/90 text-[#27040c] shadow-[0_0_16px_rgba(251,113,133,0.25)]"
                      : "border-cyan-300/60 bg-cyan-400/90 text-[#03142c] shadow-[0_0_16px_rgba(34,211,238,0.25)]"
                    : "border-white/10 bg-black/20 text-slate-400 hover:text-white"
                }`}
              >
                {item.label} ({item.count})
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-3 font-mono text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-300" /> RESTRICTED TO ASSIGNED ROSTER
          </span>
          <span>Crew monitored: {crewCount} astronaut{crewCount === 1 ? "" : "s"}</span>
          <span>Last sync: {lastSync || "—"}</span>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState title="No alerts" message="No alerts match the current filter or search." />
          ) : (
            filtered.map(alert => <AlertRow key={alert._id || alert.id || `${alert.astronautId}-${alert.title}-${alert.createdAt}`} alert={alert} />)
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-rose-400/20 bg-[#160b10]/80 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-rose-200">
              <Siren className="h-5 w-5" />
              <h2 className="text-sm font-bold">Doctor Response Protocol</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              Review critical alerts first, inspect the astronaut record, then issue a documented countermeasure from the
              Health Monitoring workspace.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3">
                <Siren className="mx-auto h-4 w-4 text-rose-300" />
                <p className="mt-1 text-lg font-black text-white">{criticalAlerts.length}</p>
                <p className="text-[9px] uppercase tracking-wide text-rose-300/70">Critical now</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
                <AlertTriangle className="mx-auto h-4 w-4 text-amber-300" />
                <p className="mt-1 text-lg font-black text-white">{warningAlerts.length}</p>
                <p className="text-[9px] uppercase tracking-wide text-amber-300/70">Watch / Warning</p>
              </div>
            </div>
            <Link
              href="/medical/clinical-protocols"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/15 px-3 py-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25"
            >
              Open Doctor Instructions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="rounded-2xl border border-cyan-400/20 bg-[#0a141f]/80 p-5 backdrop-blur-xl">
            <h2 className="text-sm font-bold text-white">Dispatch Status</h2>
            <div className="mt-4 space-y-3 text-xs">
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Stream connection</span>
                <b className="flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Online</b>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Mission</span>
                <b className="text-white">Ares Mission 01</b>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Crew monitored</span>
                <b className="text-white">{crewCount} astronaut{crewCount === 1 ? "" : "s"}</b>
              </p>
              <p className="flex items-center justify-between">
                <span className="text-slate-500">Auto-sync</span>
                <b className="text-cyan-200">Every 5 seconds</b>
              </p>
              <p className="flex items-center justify-between border-t border-white/5 pt-3">
                <span className="text-slate-500">Last dispatch</span>
                <b className="text-rose-200">{lastSync || "Just now"}</b>
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: MedicalAlert }) {
  const resolved = Boolean(alert.resolved);
  const level = severityLevel(alert.severity);
  const cardTone = resolved
    ? "border-white/10 bg-slate-950/40"
    : triageStyles[level].card;
  const tone = resolved || level === "NOMINAL" ? "cyan" : level;
  const styles = {
    badge:
      tone === "CRITICAL"
        ? "border-rose-400/40 bg-rose-500/15 text-rose-200"
        : tone === "WARNING"
          ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
          : "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
    dot:
      tone === "CRITICAL"
        ? "bg-rose-400"
        : tone === "WARNING"
          ? "bg-amber-400"
          : "bg-cyan-400",
    bar:
      tone === "CRITICAL"
        ? "from-rose-400/70 via-rose-400/25 to-transparent"
        : tone === "WARNING"
          ? "from-amber-400/70 via-amber-400/25 to-transparent"
          : "from-cyan-400/60 via-cyan-400/20 to-transparent",
  } as const;
  const Icon = resolved ? CheckCircle2 : triageStyles[level].icon;
  const signalBase = alert.astronautId.replace(/\D/g, "").slice(0, 2) || alert.astronautId.slice(0, 2);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border p-3.5 transition ${cardTone} ${
        resolved ? "opacity-70" : "hover:border-white/20 hover:bg-[#0c1826]"
      }`}
    >
      <span className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${styles.bar}`} />

      {/* Top meta row */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${styles.badge}`}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${styles.dot}`} />
            {resolved ? "Resolved" : alert.severity}
          </span>
          <span className="shrink-0 font-mono text-[9px] font-bold tracking-wider text-slate-500">
            #{alert._id?.slice(-4) || alert.id?.slice(-4) || alert.astronautId}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-slate-500">
          <Waves className="h-3 w-3" /> {timeAgo(alert.createdAt)}
        </span>
      </div>

      {/* Astronaut + message */}
      <div className="mt-3 flex items-start gap-3 pl-1">
        <span
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[10px] font-black ${
            resolved
              ? "border-slate-500/30 bg-slate-700/40 text-slate-400"
              : level === "CRITICAL"
                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                : level === "WARNING"
                  ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                  : "border-cyan-400/30 bg-cyan-500/10 text-cyan-200"
          }`}
        >
          {signalBase}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-black text-white">
            <span className="truncate">{alert.astronautId}</span>
            {alert.signal && (
              <span className="shrink-0 rounded-md border border-white/10 bg-black/25 px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-300">
                {alert.signal}
              </span>
            )}
          </p>
          <h2 className="mt-0.5 text-xs font-bold text-slate-100">{alert.title}</h2>
          <p
            className={`mt-0.5 text-[11px] leading-relaxed text-slate-400 ${
              !resolved && level === "CRITICAL" ? "font-semibold text-rose-200/90" : ""
            }`}
          >
            {alert.description}
          </p>
        </div>
      </div>

      {/* Reading chips */}
      {alert.signal && (alert.value !== undefined || alert.baseline !== undefined) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-1 font-mono text-[10px]">
          {alert.value !== undefined && (
            <span className="rounded-md border border-rose-400/25 bg-rose-500/10 px-2 py-0.5 text-rose-200">
              value {String(alert.value)}
            </span>
          )}
          {alert.baseline !== undefined && (
            <span className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-cyan-200">
              baseline {String(alert.baseline)}
            </span>
          )}
        </div>
      )}

      {/* Actions + dispatch status */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3 pl-1">
        <Link
          href={`/medical/astronauts/${alert.astronautId}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
        >
          <Eye className="h-3 w-3" /> Inspect
        </Link>
        {!resolved && (
          <Link
            href={`/medical/astronauts/${alert.astronautId}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-200 transition hover:border-rose-400/50 hover:bg-rose-500/20"
          >
            <ShieldAlert className="h-3 w-3" /> Address
          </Link>
        )}
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
          <Icon className="h-3 w-3" />
          {resolved ? "RESOLVED" : level === "CRITICAL" ? "PRIORITY 1" : level === "WARNING" ? "MONITORING" : "NOMINAL"}
        </span>
      </div>
    </article>
  );
}

function Summary({ icon: Icon, label, value, tone }: { icon: typeof Bell; label: string; value: number; tone: "cyan" | "amber" | "rose" | "emerald" }) {
  const classes = {
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  }[tone];
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${classes}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[9px]">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
        <Waves className="ml-auto h-3 w-3 opacity-40" />
      </div>
    </div>
  );
}