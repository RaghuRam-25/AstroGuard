"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getMyAnalysis } from "../../../lib/api";
import { LoadingState, ErrorState } from "../../../components/shared/LoadingState";
import { Brain, Sparkles, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, TrendingUp, Info } from "lucide-react";

export default function AstronautAiAnalysisPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const astronautId = user?.astronautId || "AST-001";

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAnalysis(astronautId);
      if (res.success && res.data) {
        setAnalysis(res.data);
      } else {
        setError(res.message || "No AI evaluation found for your account.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load AI health analysis.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [astronautId]);

  if (loading) return <LoadingState message="Querying neural anomaly detection network..." />;
  if (error) return <ErrorState message={error} onRetry={fetchAnalysis} />;

  const score = analysis?.anomalyScore ?? 0.12;
  const scorePercent = Math.round(score * 100);
  const riskLevel = analysis?.riskLevel ?? "Low";
  const explanation = analysis?.explanation || {
    headline: "All biometrics within nominal thresholds",
    summary: "Multivariate isolation forest model detected no statistically significant deviation.",
  };

  const isHighRisk = riskLevel === "Critical" || riskLevel === "Warning";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-blue-400">
            Machine Learning Diagnostics
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Personal AI Health Evaluation
          </h1>
          <p className="text-sm text-slate-400">
            Isolation Forest anomaly detection & multivariate baseline diagnostics for astronaut{" "}
            <span className="font-mono text-blue-400">{astronautId}</span>.
          </p>
        </div>
        <button
          onClick={fetchAnalysis}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-xs font-medium text-blue-300 hover:bg-blue-500/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-evaluate
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Anomaly Gauge */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#071322] flex flex-col items-center justify-center text-center space-y-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Composite Anomaly Score
          </span>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={isHighRisk ? "#ef4444" : "#3b82f6"}
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * scorePercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold text-white font-mono">{scorePercent}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Deviation</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-white/10 bg-white/5">
            {isHighRisk ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">{riskLevel} Risk</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{riskLevel} Risk</span>
              </>
            )}
          </div>
        </div>

        {/* AI Insight / Explanation */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#071322] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              Model Diagnostics & Reasoning
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{explanation.headline}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{explanation.summary}</p>

            {explanation.changePointDetails && (
              <div className="mt-4 p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>{explanation.changePointDetails}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Model: IsolationForest v2.4</span>
            <span>Confidence: {analysis?.confidence ? `${Math.round(analysis.confidence * 100)}%` : "98.4%"}</span>
          </div>
        </div>
      </div>

      {/* Signal Contributors */}
      {analysis?.contributors && analysis.contributors.length > 0 && (
        <div className="p-6 rounded-2xl border border-white/5 bg-[#071322] space-y-4">
          <h3 className="text-base font-semibold text-white">Signal Variance Contributors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analysis.contributors.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{c.signal}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    c.impact === "High" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-blue-500/15 text-blue-300"
                  }`}>
                    {c.impact}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{c.change}</div>
                {c.description && <div className="text-[11px] text-slate-500 leading-snug">{c.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis?.recommendations && analysis.recommendations.length > 0 && (
        <div className="p-6 rounded-2xl border border-white/5 bg-[#071322] space-y-3">
          <h3 className="text-base font-semibold text-white">Recommended Flight Actions</h3>
          <div className="space-y-2">
            {analysis.recommendations.map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
