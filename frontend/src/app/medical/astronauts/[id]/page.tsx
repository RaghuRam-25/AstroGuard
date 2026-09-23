"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getClinicalReviews, getMedicalCrewMember, submitClinicalReview } from "../../../../lib/api";
import { LoadingState, ErrorState } from "../../../../components/shared/LoadingState";
import {
  Heart,
  Droplet,
  Moon,
  Activity,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  FlaskConical,
  Send,
} from "lucide-react";

interface AstronautDetail {
  astronaut?: {
    astronautId?: string;
    name?: string;
    role?: string;
    mission?: string;
    missionDay?: number;
  };
  latestHealth?: {
    heartRate?: number;
    spo2?: number;
    sleep?: number;
    activity?: number;
  };
  latestAnalysis?: {
    riskLevel?: string;
    anomalyScore?: number;
    explanation?: {
      headline?: string;
      summary?: string;
    };
    recommendations?: string[];
  };
  unresolvedAlerts?: number;
}

interface ClinicalReview {
  _id?: string;
  riskLevel: "LOW" | "WATCH" | "WARNING" | "CRITICAL";
  clinicalDiagnosis: string;
  countermeasure: string;
  forwardedToAuthority: boolean;
  recommendedAuthorityAction?: string;
  createdAt?: string;
}

export default function MedicalAstronautDetailPage() {
  const params = useParams();
  const astronautId = params?.id as string;

  const [data, setData] = useState<AstronautDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ClinicalReview[]>([]);
  const [reviewRisk, setReviewRisk] = useState<ClinicalReview["riskLevel"]>("LOW");
  const [diagnosis, setDiagnosis] = useState("");
  const [countermeasure, setCountermeasure] = useState("");
  const [forwardToAuthority, setForwardToAuthority] = useState(false);
  const [authorityAction, setAuthorityAction] = useState("EVA stand-down");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!astronautId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getMedicalCrewMember(astronautId);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Failed to retrieve astronaut clinical profile.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [astronautId]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchDetail());
  }, [astronautId, fetchDetail]);

  const fetchReviews = useCallback(async () => {
    if (!astronautId) return;
    const res = await getClinicalReviews(astronautId);
    if (res.success) setReviews((res.data || []) as ClinicalReview[]);
  }, [astronautId]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchReviews());
  }, [fetchReviews]);

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingReview(true);
    setReviewMessage(null);
    const res = await submitClinicalReview(astronautId, {
      riskLevel: reviewRisk,
      clinicalDiagnosis: diagnosis,
      countermeasure,
      forwardedToAuthority: forwardToAuthority,
      recommendedAuthorityAction: forwardToAuthority ? authorityAction : undefined,
      forwardReason: forwardToAuthority ? diagnosis : undefined,
    });
    if (res.success) {
      setReviewMessage("Clinical review committed to the mission record.");
      setDiagnosis("");
      setCountermeasure("");
      await fetchReviews();
    } else {
      setReviewMessage(res.message || "Unable to submit the clinical review.");
    }
    setSubmittingReview(false);
  };

  if (loading) return <LoadingState message={`Accessing medical record for ${astronautId}...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchDetail} />;

  const { astronaut, latestHealth, latestAnalysis, unresolvedAlerts } = data || ({} as AstronautDetail);
  const risk = latestAnalysis?.riskLevel || "Low";
  const isHighRisk = risk === "Critical" || risk === "Warning";
  const rawAnomalyScore = latestAnalysis?.anomalyScore ?? 0;
  const anomalyScore = Math.max(0, Math.min(100, Math.round((rawAnomalyScore > 1 ? rawAnomalyScore / 100 : rawAnomalyScore) * 100)));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Header */}
      <div>
        <Link
          href="/medical/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Crew Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-base">
              {astronaut?.astronautId || astronautId}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">{astronaut?.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    isHighRisk
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {risk} Risk
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {astronaut?.role || "Mission Specialist"} • {astronaut?.mission || "Ares Mission 01"} • Day {astronaut?.missionDay || 45}
              </p>
            </div>
          </div>
          <button
            onClick={fetchDetail}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Record
          </button>
        </div>
      </div>

      {/* Quick Nav Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
        <Link
          href={`/medical/astronauts/${astronautId}`}
          className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-semibold"
        >
          Clinical Overview
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/health`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors"
        >
          Telemetry History
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/analysis`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors"
        >
          AI Diagnostics
        </Link>
        <Link
          href={`/medical/astronauts/${astronautId}/alerts`}
          className="px-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          Alerts
          {(unresolvedAlerts || 0) > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
          )}
        </Link>
      </div>

      {/* Latest Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-red-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Heart Rate</span>
            <Heart className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{latestHealth?.heartRate ?? 72}</span>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Oxygenation</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-300 font-mono">{latestHealth?.spo2 ?? 98}%</span>
            <span className="text-xs text-slate-400">SpO₂</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Sleep Duration</span>
            <Moon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-300 font-mono">{latestHealth?.sleep ?? 7.2}</span>
            <span className="text-xs text-slate-400">Hours</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-[#051c14] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Physical Activity</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-300 font-mono">{latestHealth?.activity ?? 65}%</span>
            <span className="text-xs text-slate-400">Index</span>
          </div>
        </div>
      </div>

      {/* AI Clinical Assessment */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-[#11133a] via-[#091936] to-[#061735] p-5 shadow-[0_0_35px_rgba(139,92,246,0.08)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200">AI anomaly score</span>
            <div className="relative mt-3 flex h-32 w-32 items-center justify-center rounded-full" style={{ background: `conic-gradient(${isHighRisk ? "#fb7185" : risk === "Watch" ? "#fbbf24" : "#22d3ee"} ${anomalyScore * 3.6}deg, rgba(148,163,184,.13) 0deg)` }}>
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/10 bg-[#080d24]"><span className="font-mono text-3xl font-black text-white">{anomalyScore}</span><span className="text-[9px] text-slate-500">/ 100</span></div>
            </div>
            <span className={`mt-3 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${isHighRisk ? "border-rose-400/30 bg-rose-500/15 text-rose-200" : risk === "Watch" ? "border-amber-400/30 bg-amber-500/15 text-amber-200" : "border-cyan-400/30 bg-cyan-500/15 text-cyan-200"}`}>{risk} risk</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200"><Sparkles className="h-4 w-4" /> AI Diagnostic Assessment</div><span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-2 py-1 text-[9px] font-bold text-violet-200">EXPLAINABLE MODEL</span></div>
            <h3 className="mt-3 text-lg font-black text-white">{latestAnalysis?.explanation?.headline || "Nominal Physiological Stability"}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{latestAnalysis?.explanation?.summary || "All vital parameters remain concordant with standard baseline expectations. No microgravity cardiovascular deconditioning detected."}</p>
            {latestAnalysis?.recommendations && latestAnalysis.recommendations.length > 0 && <div className="mt-4 border-t border-violet-400/15 pt-3"><span className="text-[10px] font-black uppercase tracking-wider text-cyan-200">Clinical Guidance</span><div className="mt-2 grid gap-2 sm:grid-cols-2">{latestAnalysis.recommendations.map((rec: string, i: number) => <div key={i} className="flex items-start gap-2 rounded-lg border border-white/10 bg-black/15 px-2.5 py-2 text-[11px] text-slate-300"><span className="text-cyan-300">•</span><span>{rec}</span></div>)}</div></div>}
            <Link href={`/medical/astronauts/${astronautId}/analysis`} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-[10px] font-bold text-violet-200 hover:bg-violet-500/20">Open Full AI Diagnostics <Sparkles className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmitReview} className="rounded-2xl border border-emerald-500/20 bg-[#051c14] p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-300"><FlaskConical className="w-4 h-4" /><div><h2 className="text-base font-bold text-white">Doctor Clinical Review</h2><p className="text-xs text-slate-500">Diagnosis, countermeasure and authority handoff from the supplied ZIP concept.</p></div></div>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-400">Clinical risk level<select value={reviewRisk} onChange={(event) => setReviewRisk(event.target.value as ClinicalReview["riskLevel"])} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"><option value="LOW">LOW</option><option value="WATCH">WATCH</option><option value="WARNING">WARNING</option><option value="CRITICAL">CRITICAL</option></select></label><label className="text-xs text-slate-400">Authority action<select value={authorityAction} onChange={(event) => setAuthorityAction(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white"><option>Earth return abort</option><option>EVA stand-down</option><option>Medical quarantine</option><option>Protocol approved</option></select></label></div>
          <label className="block text-xs text-slate-400">Clinical diagnosis<textarea required value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} rows={3} placeholder="Document the clinical interpretation of the latest telemetry and lab evidence..." className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-400" /></label>
          <label className="block text-xs text-slate-400">Medical countermeasure<textarea required value={countermeasure} onChange={(event) => setCountermeasure(event.target.value)} rows={2} placeholder="Prescribe hydration, rest, observation, medication or other countermeasure..." className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-400" /></label>
          <label className="flex items-center gap-2 text-xs text-amber-300"><input type="checkbox" checked={forwardToAuthority} onChange={(event) => setForwardToAuthority(event.target.checked)} className="accent-amber-400" /> Forward this case to Space Authority</label>
          {reviewMessage && <p className={`rounded-lg border px-3 py-2 text-xs ${reviewMessage.includes("committed") ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300"}`}>{reviewMessage}</p>}
          <button disabled={submittingReview} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"><Send className="w-3.5 h-3.5" />{submittingReview ? "Submitting..." : "Submit Clinical Review"}</button>
        </form>
        <section className="rounded-2xl border border-white/10 bg-[#051c14] p-6"><h2 className="text-base font-bold text-white">Review History</h2><p className="mt-1 text-xs text-slate-500">Persisted Doctor evaluations for this astronaut.</p><div className="mt-4 space-y-2">{reviews.length === 0 ? <p className="py-8 text-center text-xs text-slate-500">No clinical review submitted yet.</p> : reviews.map((review) => <div key={review._id || review.createdAt} className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="flex items-center justify-between"><span className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">{review.riskLevel}</span><span className="text-[10px] text-slate-600">{review.createdAt ? new Date(review.createdAt).toLocaleString() : "Recent"}</span></div><p className="mt-2 text-xs text-slate-300">{review.clinicalDiagnosis}</p><p className="mt-1 text-[11px] text-slate-500">Countermeasure: {review.countermeasure}</p>{review.forwardedToAuthority && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">Forwarded to Authority · {review.recommendedAuthorityAction}</p>}</div>)}</div></section>
      </div>
    </div>
  );
}
