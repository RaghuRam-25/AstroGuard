"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardPenLine,
  FileClock,
  Flag,
  HeartPulse,
  Loader2,
  Microscope,
  Radiation,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserRound,
  Waves,
} from "lucide-react";
import {
  createCountermeasure,
  createDiagnosticOrder,
  getAllMedicalAlerts,
  getClinicalReviews,
  getMyAssignedAstronauts,
  submitClinicalReview,
} from "../../../lib/api";
import { ErrorState, LoadingState } from "../../../components/shared/LoadingState";
import { useAuth } from "../../../context/AuthContext";
import AssignedCrewSelector from "../../../components/medical/AssignedCrewSelector";
import { CrewMember, MedicalAlert, triageFromRisk } from "../../../components/medical/types";

type RiskLevel = "LOW" | "WATCH" | "WARNING" | "CRITICAL";

interface ReviewItem {
  _id: string;
  astronautId: string;
  riskLevel: string;
  clinicalDiagnosis: string;
  countermeasure: string;
  forwardedToAuthority?: boolean;
  forwardReason?: string;
  recommendedAuthorityAction?: string;
  createdAt?: string;
}

const AUTHORITY_ACTIONS = ["EVA stand-down", "Modified exercise protocol", "Medication review", "Return-to-base evaluation"];

const riskTones: Record<RiskLevel, { label: string; badge: string; active: string }> = {
  LOW: {
    label: "Routine / Low",
    badge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    active: "border-emerald-400/70 bg-emerald-400/10 shadow-[0_0_18px_rgba(16,185,129,0.15)]",
  },
  WATCH: {
    label: "Follow-up / Watch",
    badge: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    active: "border-amber-400/70 bg-amber-400/10 shadow-[0_0_18px_rgba(251,191,36,0.15)]",
  },
  WARNING: {
    label: "Moderate Attention",
    badge: "border-orange-400/40 bg-orange-400/10 text-orange-300",
    active: "border-orange-400/70 bg-orange-400/10 shadow-[0_0_18px_rgba(251,146,60,0.15)]",
  },
  CRITICAL: {
    label: "Critical Danger",
    badge: "border-rose-400/40 bg-rose-400/10 text-rose-300",
    active: "border-rose-400/70 bg-rose-400/10 shadow-[0_0_18px_rgba(251,113,133,0.18)]",
  },
};

function riskFromMember(riskLevel?: string): RiskLevel {
  if (riskLevel === "Critical") return "CRITICAL";
  if (riskLevel === "Warning") return "WARNING";
  if (riskLevel === "Watch") return "WATCH";
  return "LOW";
}

function detectDiagnosticType(text: string): string | null {
  const value = text.toLowerCase();
  if (value.includes("ecg") || value.includes("arrhythmia") || value.includes("electrocardiogram")) return "ECG";
  if (value.includes("ultrasound")) return "ULTRASOUND";
  if (value.includes("blood draw") || value.includes("hematology") || value.includes("cbc")) return "VENOUS_BLOOD_DRAW";
  if (value.includes("vision") || value.includes("acuity")) return "VISION_CHECK";
  if (value.includes("urine") || value.includes("renal") || value.includes("urinalysis")) return "URINALYSIS";
  return null;
}

function detectProtocol(text: string): string {
  const value = text.toLowerCase();
  if (value.includes("lnbp") || value.includes("lbnp")) return "LBNP";
  if (value.includes("cevis") || value.includes("exercise")) return "CEVIS";
  if (value.includes("vitamin d")) return "VITAMIN_D";
  if (value.includes("bisphosphonate")) return "BISPHOSPHONATE";
  return "ELECTROLYTE_REHYDRATION";
}

function priorityFor(risk: RiskLevel): string {
  if (risk === "CRITICAL") return "STAT";
  if (risk === "WARNING") return "URGENT";
  return "ROUTINE";
}

function normalizeAlert(raw: Record<string, unknown>): MedicalAlert {
  return {
    _id: (raw._id as string) || undefined,
    astronautId: String(raw.astronautId || ""),
    title: String(raw.title || raw.type || "Clinical signal"),
    description: String(raw.description || raw.message || ""),
    severity: (raw.severity as MedicalAlert["severity"]) || "Watch",
    value: raw.value as MedicalAlert["value"],
    baseline: raw.baseline as MedicalAlert["baseline"],
    resolved: Boolean(raw.resolved),
    createdAt: (raw.createdAt as string) || undefined,
  };
}

function timeAgo(value?: string): string {
  if (!value) return "";
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ClinicalProtocolsPage() {
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [risk, setRisk] = useState<RiskLevel>("WATCH");
  const [instruction, setInstruction] = useState("");
  const [countermeasure, setCountermeasure] = useState("");
  const [forwarded, setForwarded] = useState(false);
  const [authorityAction, setAuthorityAction] = useState(AUTHORITY_ACTIONS[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [crewRes, alertRes] = await Promise.all([getMyAssignedAstronauts(), getAllMedicalAlerts("assigned")]);
      const next = (crewRes.data as { astronauts?: CrewMember[] } | undefined)?.astronauts || [];
      setCrew(next);
      setSelectedId(current => (current && next.some(item => item.astronautId === current) ? current : next[0]?.astronautId || ""));
      if (alertRes.success) setAlerts(((alertRes.data || []) as Record<string, unknown>[]).map(normalizeAlert));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Health Monitoring.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void Promise.resolve().then(() => load()); }, []);

  const selected = useMemo(() => crew.find(member => member.astronautId === selectedId) || crew[0], [crew, selectedId]);
  const selectedAlerts = useMemo(
    () => alerts.filter(alert => alert.astronautId === selected?.astronautId && !alert.resolved),
    [alerts, selected]
  );

  useEffect(() => {
    if (!selected?.astronautId) return;
    let active = true;
    void (async () => {
      setReviewsLoading(true);
      const response = await getClinicalReviews(selected.astronautId);
      if (!active) return;
      setReviewsLoading(false);
      if (response.success) setReviews(((response.data as ReviewItem[] | undefined) || []));
      else setReviews([]);
    })();
    return () => { active = false; };
  }, [selected?.astronautId]);

  const kpis = useMemo(() => {
    let nominal = 0;
    crew.forEach(member => {
      if (triageFromRisk(member.latestAnalysis?.riskLevel) === "NOMINAL") nominal += 1;
    });
    return {
      connected: crew.length,
      signals: alerts.filter(alert => !alert.resolved).length,
      nominal,
    };
  }, [crew, alerts]);

  const detectedType = detectDiagnosticType(instruction);
  const detectedProtocol = countermeasure.trim() ? detectProtocol(countermeasure) : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    const reviewText = instruction.trim() || "Health monitoring review";
    const countermeasureText = countermeasure.trim() || "Monitor closely, maintain hydration, and reassess at next telemetry sync.";
    const result = await submitClinicalReview(selected.astronautId, {
      riskLevel: risk,
      clinicalDiagnosis: reviewText,
      countermeasure: countermeasureText,
      forwardedToAuthority: forwarded,
      forwardReason: forwarded ? `Doctor instruction for ${selected.astronautId}: ${reviewText}` : undefined,
      recommendedAuthorityAction: forwarded ? authorityAction : undefined,
    });
    if (result.success) {
      setMessageTone("success");
      setMessage(`Doctor instruction committed for ${selected.astronautId}.`);
      const reviewResponse = await getClinicalReviews(selected.astronautId);
      if (reviewResponse.success) setReviews(((reviewResponse.data as ReviewItem[] | undefined) || []));
      if (detectedType) await createDiagnosticOrder({
        astronautId: selected.astronautId,
        type: detectedType,
        priority: priorityFor(risk),
        instructions: reviewText,
      });
      if (countermeasure.trim()) await createCountermeasure({
        astronautId: selected.astronautId,
        protocol: detectedProtocol || "ELECTROLYTE_REHYDRATION",
        parameters: countermeasure.trim(),
      });
    } else {
      setMessageTone("error");
      setMessage(result.message || "Unable to save the instruction.");
    }
    setSaving(false);
  };

  if (loading) return <LoadingState message="Loading Health Monitoring command workspace…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-[#0a141f]/95 via-[#0c2233] to-[#0a141f]/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> Assigned-Only Clinical Scope Active
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-black text-white">
            <Stethoscope className="h-6 w-6 text-cyan-300" /> Health Monitoring & Astronaut Instructions
          </h1>
          <p className="mt-1 text-xs text-cyan-200/80">
            Select a crew member, assess the live telemetry, and issue a documented clinical instruction or mission countermeasure.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> STRICT ROSTER · LIVE
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Crew
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={UserCheck} label="Connected Astronauts" value={kpis.connected} tone="cyan" />
        <Kpi icon={AlertTriangle} label="Signals Requiring Review" value={kpis.signals} tone="amber" />
        <Kpi icon={CheckCircle2} label="Nominal Monitoring" value={kpis.nominal} tone="emerald" />
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-300">Flight Surgeon</p>
              <p className="max-w-[9rem] truncate text-sm font-bold text-white">{user?.name || "Dr. Sarah Wilson"}</p>
            </div>
            <Waves className="ml-auto h-3 w-3 opacity-40" />
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-semibold backdrop-blur-xl ${
            messageTone === "success"
              ? "border-emerald-400/30 bg-[#0a1f1a]/95 text-emerald-200"
              : "border-rose-400/30 bg-[#230f14]/95 text-rose-200"
          }`}
        >
          {messageTone === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-rose-300" />}
          {message}
        </div>
      )}

      {crew.length === 0 ? (
        <section className="rounded-2xl border border-cyan-400/20 bg-[#0a141f]/80 p-12 text-center backdrop-blur-xl">
          <UserRound className="mx-auto h-10 w-10 text-slate-500" />
          <h2 className="mt-3 text-base font-bold text-white">No astronauts assigned to your roster</h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
            Mission Control must link a crew member to you (via your assigned roster) before you can review telemetry or
            issue instructions.
          </p>
        </section>
      ) : (
        <AssignedCrewSelector
          crew={crew}
          selectedId={selected?.astronautId || ""}
          onSelect={id => {
            setSelectedId(id);
            const member = crew.find(item => item.astronautId === id);
            setRisk(riskFromMember(member?.latestAnalysis?.riskLevel));
          }}
        />
      )}

      {selected && (
        <div className="grid gap-5 xl:grid-cols-5">
          <form onSubmit={submit} className="space-y-5 xl:col-span-3">
            <section className="rounded-2xl border border-cyan-400/25 bg-[#0a141f]/80 p-5 shadow-[0_0_35px_rgba(14,165,233,0.08)] backdrop-blur-xl">
              <div className="flex flex-col justify-between gap-3 border-b border-cyan-400/10 pb-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Instruction target</p>
                  <h2 className="mt-1 flex items-center gap-2 text-xl font-black text-white">
                    {selected.name} <span className="font-mono text-sm text-cyan-300">{selected.astronautId}</span>
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {selected.role || "Astronaut"} · {selected.mission || "Ares Mission 01"} · current risk{" "}
                    <span className="font-mono text-cyan-200">{selected.latestAnalysis?.riskLevel || "Low"}</span>
                  </p>
                </div>
                <div className="flex gap-3 font-mono text-xs">
                  <span className="flex items-center gap-1 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1.5 text-rose-200">
                    <HeartPulse className="h-3.5 w-3.5" /> {selected.latestHealth?.heartRate ?? "—"} BPM
                  </span>
                  <span className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1.5 text-cyan-200">
                    <Waves className="h-3.5 w-3.5" /> {selected.latestHealth?.spo2 ?? "—"}% SpO₂
                  </span>
                  <span className="flex items-center gap-1 rounded-lg border border-slate-400/15 bg-white/[0.03] px-2.5 py-1.5 text-slate-300">
                    <Activity className="h-3.5 w-3.5" /> {selected.latestHealth?.activity ?? "—"}%
                  </span>
                </div>
              </div>

              {selectedAlerts.length > 0 && (
                <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-3">
                  <p className="flex items-center gap-2 text-xs font-bold text-amber-200">
                    <AlertTriangle className="h-4 w-4" /> Active clinical signals
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {selectedAlerts.map((alert, index) => (
                      <p key={`${alert.astronautId}-${index}`} className="rounded-lg border border-amber-400/15 bg-black/20 px-3 py-2 text-[11px] text-slate-300">
                        <span className="font-mono font-bold text-amber-200">{alert.title}</span> — {alert.description}
                        {alert.signal ? <span className="ml-1 font-mono text-slate-400">[{alert.signal}]</span> : null}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Clinical priority</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(Object.keys(riskTones) as RiskLevel[]).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setRisk(level)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                          risk === level ? riskTones[level].active : "border-white/10 bg-black/20 text-slate-400 hover:border-white/25"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${risk === level ? "bg-current" : "bg-slate-600"}`} />
                        {riskTones[level].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ClipboardPenLine className="h-3.5 w-3.5 text-cyan-300" /> Clinical instruction
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{instruction.length}/4000</span>
                  </label>
                  <textarea
                    value={instruction}
                    onChange={event => setInstruction(event.target.value)}
                    maxLength={4000}
                    rows={3}
                    placeholder="e.g. Begin 20 min LBNP countermeasure at −25 mmHg, then C.D.R. ECG rhythm strip before EVA window."
                    className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                  {detectedType && (
                    <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-cyan-300">
                      <Microscope className="h-3 w-3" /> Diagnostic order auto-detect: {detectedType} · {priorityFor(risk)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-emerald-300" /> Countermeasure / protocol
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{countermeasure.length}/4000</span>
                  </label>
                  <textarea
                    value={countermeasure}
                    onChange={event => setCountermeasure(event.target.value)}
                    maxLength={4000}
                    rows={2}
                    placeholder="e.g. LBNP −25 mmHg for 20 min, 3×/week + vitamin D 800 IU daily."
                    className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                  />
                  {detectedProtocol && (
                    <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[10px] text-emerald-300">
                      <ShieldCheck className="h-3 w-3" /> Protocol auto-detect: {detectedProtocol}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <label className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Flag className="h-3.5 w-3.5 text-amber-300" /> Flag this instruction to Mission Control
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={forwarded}
                      onClick={() => setForwarded(current => !current)}
                      className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                        forwarded ? "border-amber-400/60 bg-amber-400/30" : "border-white/15 bg-white/[0.06]"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                          forwarded ? "left-[calc(100%-1.375rem)] bg-amber-300" : "left-0.5 bg-slate-500"
                        }`}
                        style={{ height: "1.125rem", width: "1.125rem" }}
                      />
                    </button>
                  </label>
                  {forwarded && (
                    <label className="mt-3 block text-xs text-slate-400">
                      Recommended authority action
                      <select
                        value={authorityAction}
                        onChange={event => setAuthorityAction(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-amber-400/20 bg-black/30 px-3 py-2.5 text-xs font-bold text-white focus:border-amber-400/50 focus:outline-none"
                      >
                        {AUTHORITY_ACTIONS.map(action => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3 text-sm font-black text-[#020817] shadow-[0_0_25px_rgba(16,185,129,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {saving ? "Committing to mission record…" : "Commit Clinical Instruction"}
                </button>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <ProtocolTile title="Hydration & Renal" detail="Hydration therapy, calcium excretion and kidney-stone risk." tone="cyan" icon={Waves} />
              <ProtocolTile title="Hematology & Oxygenation" detail="Blood-panel interpretation, fatigue and oxygenation drift." tone="violet" icon={Activity} />
              <ProtocolTile title="EVA Readiness" detail="Issue stand-down instructions before high-strain operations." tone="amber" icon={Radiation} />
            </div>
          </form>

          <aside className="space-y-5 xl:col-span-2">
            <section className="rounded-2xl border border-cyan-400/20 bg-[#0a141f]/80 p-4 shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-cyan-400/10 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <FileClock className="h-4 w-4 text-cyan-300" /> Recent Clinical Reviews
                </h2>
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                  {selected.astronautId}
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {reviewsLoading ? (
                  <p className="py-8 text-center text-xs text-slate-500">Loading review history…</p>
                ) : reviews.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">
                    No clinical reviews recorded for this astronaut yet. Commit the first instruction above.
                  </p>
                ) : (
                  reviews.map(review => (
                    <div key={review._id} className="rounded-xl border border-white/8 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded-md border px-2 py-0.5 font-mono text-[9px] font-black tracking-wider ${
                            (riskTones[review.riskLevel as RiskLevel] || riskTones.WATCH).badge
                          }`}
                        >
                          {review.riskLevel}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{timeAgo(review.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-white">{review.clinicalDiagnosis}</p>
                      {review.countermeasure && <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{review.countermeasure}</p>}
                      {review.forwardedToAuthority && (
                        <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-400/20 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200">
                          <Flag className="h-3 w-3" /> Flagged to Mission Control · {review.recommendedAuthorityAction}
                        </p>
                      )}
                      <Link href={`/medical/astronauts/${review.astronautId}`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-cyan-300 hover:text-cyan-200">
                        Open full crew dossier <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-emerald-400/20 bg-[#0a141f]/80 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-emerald-400/10 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldAlert className="h-4 w-4 text-emerald-300" /> Autonomous Auto-Detect
                </h2>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">ON</span>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Diagnostic orders (ECG, ULTRASOUND, VENOUS_BLOOD_DRAW, VISION_CHECK, URINALYSIS) and countermeasure
                protocols (LBNP, CEVIS, VITAMIN_D, BISPHOSPHONATE, ELECTROLYTE_REHYDRATION) are detected from your
                instruction text and recorded automatically on commit.
              </p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: number; tone: "cyan" | "emerald" | "amber" }) {
  const tones = {
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
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

function ProtocolTile({ title, detail, tone, icon: Icon }: { title: string; detail: string; tone: "cyan" | "violet" | "amber"; icon: typeof Activity }) {
  const classes = tone === "cyan"
    ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400/40"
    : tone === "violet"
      ? "border-violet-400/20 bg-violet-500/10 text-violet-200 hover:border-violet-400/40"
      : "border-amber-400/20 bg-amber-500/10 text-amber-200 hover:border-amber-400/40";
  return (
    <div className={`rounded-2xl border p-4 transition ${classes}`}>
      <Icon className="h-4 w-4" />
      <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{detail}</p>
    </div>
  );
}