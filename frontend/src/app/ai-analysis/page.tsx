"use client";

import { useState } from "react";
import { CheckCircle2, Droplet, Moon, Activity, X } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function AIAnalysisPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setModalOpen(true);
    }, 600);
  };

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header & Action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              AI Health Analysis
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              AI-powered insights and recommendations
            </p>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-60 shrink-0"
          >
            {isAnalyzing ? "Running Isolation Forest..." : "Run New Analysis"}
          </button>
        </div>

        {/* Top 3-Column Section (matching picture) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Left Column (25%): Anomaly Score Circular Gauge */}
          <div className="md:col-span-3 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between items-center text-center">
            <div className="w-full text-left border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Anomaly Score
              </h3>
            </div>

            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 18) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">18</span>
                <span className="text-[11px] font-mono text-slate-400">/ 100</span>
                <span className="mt-1 rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                  Low Risk
                </span>
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
            >
              View Detailed Inspection →
            </button>
          </div>

          {/* Middle Column (50%): AI Insights Card with Stable Badge */}
          <div className="md:col-span-6 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <h3 className="text-sm font-bold text-white">AI Insights</h3>
              </div>
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                Stable
              </span>
            </div>

            <div className="space-y-3 my-auto text-xs sm:text-sm leading-relaxed text-slate-300">
              <p className="font-semibold text-white">
                Your health metrics are within normal range. No significant anomalies detected.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                The current physiological signals are consistent with your personal baseline. However, we noticed a slight increase in heart rate compared to your usual pattern.
              </p>
            </div>

            <div className="border-t border-white/5 pt-3 flex justify-between text-[11px] text-slate-400 font-mono">
              <div>
                <span>Model: </span>
                <span className="text-white font-semibold">Isolation Forest</span>
              </div>
              <div>
                <span>Confidence: </span>
                <span className="text-emerald-400 font-semibold">94.2%</span>
              </div>
            </div>
          </div>

          {/* Right Column (25%): Risk Level Color Legend */}
          <div className="md:col-span-3 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Risk Level
              </h3>
            </div>

            <div className="space-y-2.5 my-auto text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Low
                </span>
                <span className="font-mono text-emerald-300 text-[11px]">0 – 30%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span className="flex items-center gap-2 text-yellow-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  Medium
                </span>
                <span className="font-mono text-yellow-300 text-[11px]">31 – 60%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <span className="flex items-center gap-2 text-orange-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  High
                </span>
                <span className="font-mono text-orange-300 text-[11px]">61 – 80%</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="flex items-center gap-2 text-red-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Critical
                </span>
                <span className="font-mono text-red-300 text-[11px]">81 – 100%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom 2-Column Section: Key Findings + Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Left: Key Findings */}
          <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Key Findings
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Heart rate is 2.1% higher than personal resting baseline</span>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sleep duration is within calibrated healthy range (7.4 hrs)</span>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>SpO₂ blood oxygenation is stable and nominal (98.2%)</span>
              </div>
              <div className="flex items-start gap-3 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Physical activity level remains within expected operational quota</span>
              </div>
            </div>
          </div>

          {/* Right: Recommendations */}
          <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Recommendations
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Droplet className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Stay hydrated during orbital EVA preparation</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Maintain current cardiovascular exercise intensity protocol</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Moon className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Target 7–8 hours of unfragmented deep rest before next shift</span>
              </div>
            </div>
          </div>

        </div>

        {/* Interactive AI Detail Modal (matching bottom-right picture mockup) */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl border border-blue-500/30 bg-[#07111f] p-6 sm:p-8 shadow-2xl shadow-blue-500/20 space-y-6">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white">AI Analysis Result</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Score & Status in Modal */}
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10">
                    <span className="text-2xl font-extrabold text-emerald-400">18</span>
                    <span className="text-[10px] font-mono text-slate-400 absolute bottom-1">/ 100</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Risk Score</span>
                    <span className="rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-xs font-bold">
                      Low Risk
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Overall Status</span>
                    <span className="text-xs font-bold text-white">Healthy</span>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis Paragraph */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Analysis</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed rounded-xl bg-white/[0.02] p-4 border border-white/5">
                  Your physiological signals are within normal range. The slight increase in heart rate is likely due to recent physical workout activity and does not indicate immediate concern. Continue standard telemetry monitoring.
                </p>
              </div>

              {/* Model stats */}
              <div className="flex justify-between text-xs font-mono text-slate-400 border-t border-white/10 pt-4">
                <div>
                  <span>Model: </span>
                  <span className="text-white font-semibold">Isolation Forest</span>
                </div>
                <div>
                  <span>Confidence: </span>
                  <span className="text-emerald-400 font-semibold">94.2%</span>
                </div>
              </div>

              {/* Close CTA */}
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}
