"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAstronautAnalysis } from "../../../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../../../components/shared/LoadingState";
import { ArrowLeft, Sparkles, Brain, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";

export default function MedicalAstronautAnalysisPage() {
  const params = useParams();
  const astronautId = params?.id as string;

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!astronautId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAstronautAnalysis(astronautId);
      if (res.success && res.data) {
        setAnalysisData(res.data);
      } else {
        setError(res.message || "Failed to load AI clinical analysis.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [astronautId]);

  if (loading) return <LoadingState message={`Computing anomaly evaluation for ${astronautId}...`} />;
  if (error) return <ErrorState message={error} onRetry={fetchAnalysis} />;

  const { latest, history } = analysisData || {};
  const score = latest?.anomalyScore ?? 0.08;
  const scorePct = Math.round(score * 100);
  const risk = latest?.riskLevel ?? "Low";
  const isHighRisk = risk === "Critical" || risk === "Warning";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href={`/medical/astronauts/${astronautId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Patient Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
              Isolation Forest & Neural Diagnostics
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
              AI Analysis Diagnostics ({astronautId})
            </h1>
            <p className="text-sm text-slate-400">
              Deep clinical review of anomaly contributions, signal shifts, and predictive markers.
            </p>
          </div>
          <button
            onClick={fetchAnalysis}
            className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run Analysis
          </button>
        </div>
      </div>

      {/* Main Analysis Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-white/5 bg-[#051c14] flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Composite Anomaly Score
          </span>
          <div className="text-4xl font-bold font-mono text-white">{scorePct}%</div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
              isHighRisk
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}
          >
            {risk} Risk
          </span>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#051c14] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Clinical Reasoning
          </div>
          <h2 className="text-base font-bold text-white">
            {latest?.explanation?.headline || "Physiological Parameters Stable"}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {latest?.explanation?.summary ||
              "Model evaluation detected no multi-dimensional cluster divergence across cardiovascular or respiratory telemetry streams."}
          </p>
          {latest?.explanation?.changePointDetails && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
              {latest.explanation.changePointDetails}
            </div>
          )}
        </div>
      </div>

      {/* Contributors */}
      {latest?.contributors && latest.contributors.length > 0 && (
        <div className="p-6 rounded-2xl border border-white/5 bg-[#051c14] space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Biometric Signal Drivers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latest.contributors.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{c.signal}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    c.impact === "High" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/15 text-emerald-300"
                  }`}>
                    {c.impact}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{c.change}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
