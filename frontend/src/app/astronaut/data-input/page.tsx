"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { submitHealthData } from "../../../lib/api";
import { Heart, Droplet, Moon, Activity, CheckCircle2, Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function AstronautDataInputPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    heartRate: "72",
    spo2: "98",
    sleep: "7.4",
    activity: "68",
  });
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const presets = [
    { label: "Nominal State", data: { heartRate: "72", spo2: "98", sleep: "7.5", activity: "70" } },
    { label: "Post-EVA Exercise", data: { heartRate: "115", spo2: "97", sleep: "7.0", activity: "92" } },
    { label: "Sleep Deprivation", data: { heartRate: "78", spo2: "97", sleep: "4.8", activity: "40" } },
    { label: "Mild Hypoxia Simulation", data: { heartRate: "88", spo2: "93.5", sleep: "6.5", activity: "55" } },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);

    try {
      const res = await submitHealthData({
        heartRate: parseFloat(formData.heartRate),
        spo2: parseFloat(formData.spo2),
        sleep: parseFloat(formData.sleep),
        activity: parseFloat(formData.activity),
        source: "Manual Telemetry Console",
      });

      if (res.success) {
        setResultData(res.data);
      } else {
        setErrorMessage(res.message || "Failed to submit telemetry.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-blue-500/10 pb-5">
        <span className="text-xs uppercase tracking-widest font-semibold text-blue-400">
          Telemetry Uplink Console
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
          Record Biometric Telemetry
        </h1>
        <p className="text-sm text-slate-400">
          Manual input terminal for astronaut{" "}
          <span className="font-semibold text-white">{user?.name}</span> (
          <span className="font-mono text-blue-400">{user?.astronautId || "AST-001"}</span>).
          Data is sent to the AI anomaly detection engine in real-time.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Preset Scenarios
        </span>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setFormData(p.data);
                setResultData(null);
                setErrorMessage(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-blue-500/20 bg-[#071322] text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/5 bg-[#071322] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Heart Rate */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              Heart Rate (BPM)
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.heartRate}
              onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">Normal range: 60 - 100 BPM</span>
          </div>

          {/* SpO2 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-cyan-400" />
              Oxygen Saturation (SpO₂ %)
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.spo2}
              onChange={(e) => setFormData({ ...formData, spo2: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">Normal range: 95% - 100%</span>
          </div>

          {/* Sleep */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              Sleep (Hours)
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.sleep}
              onChange={(e) => setFormData({ ...formData, sleep: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">Recommended rest: 7.0 - 8.5 hrs</span>
          </div>

          {/* Activity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Activity Level (0 - 100%)
            </label>
            <input
              type="number"
              step="any"
              required
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">Mission standard: 50% - 85%</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/30 text-xs text-red-300 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {resultData && (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-xs text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Telemetry Uplink Successful</span>
              <p className="text-slate-300 mt-0.5">
                Telemetry recorded. Real-time anomaly detection processed score:{" "}
                <span className="font-mono text-white font-bold">{resultData.analysis?.anomalyScore ?? "N/A"}</span>{" "}
                (Risk: <span className="font-semibold text-emerald-400">{resultData.analysis?.riskLevel ?? "Evaluated"}</span>)
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-sm text-white hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Transmitting & Evaluating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Transmit Telemetry to AI Engine
            </>
          )}
        </button>
      </form>
    </div>
  );
}
