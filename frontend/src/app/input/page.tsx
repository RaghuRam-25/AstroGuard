"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, Droplet, Moon, Activity, ChevronDown, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

export default function DataInputPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Manual Input");
  const [selectedAstronaut, setSelectedAstronaut] = useState("Alex Morgan");
  const [selectedAstronautId, setSelectedAstronautId] = useState("AST-001");

  const [formData, setFormData] = useState({
    heartRate: "72",
    spo2: "98",
    sleep: "7.4",
    activity: "68",
  });

  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "astronaut" && user.astronautId) {
      setSelectedAstronautId(user.astronautId);
      setSelectedAstronaut(user.name);
    }
  }, [user]);

  const presets = [
    { label: "Normal Values", data: { heartRate: "72", spo2: "98", sleep: "7.4", activity: "68" } },
    { label: "Slightly Elevated HR", data: { heartRate: "89", spo2: "98", sleep: "7.0", activity: "75" } },
    { label: "Low SpO₂", data: { heartRate: "82", spo2: "94.5", sleep: "6.8", activity: "50" } },
    { label: "Low Sleep", data: { heartRate: "76", spo2: "97.5", sleep: "5.2", activity: "45" } },
    { label: "High Activity", data: { heartRate: "95", spo2: "98.2", sleep: "7.2", activity: "88" } },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setResultData(null);
    setErrorMessage(null);
  };

  const handleApplyPreset = (presetData: typeof formData) => {
    setFormData(presetData);
    setResultData(null);
    setErrorMessage(null);
  };

  const handleAstronautSelect = (name: string, id: string) => {
    setSelectedAstronaut(name);
    setSelectedAstronautId(id);
    setResultData(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setResultData(null);

    try {
      const res = await apiRequest("/api/health", {
        method: "POST",
        body: JSON.stringify({
          astronautId: user?.role === "astronaut" ? (user.astronautId || "AST-001") : selectedAstronautId,
          heartRate: parseFloat(formData.heartRate),
          spo2: parseFloat(formData.spo2),
          sleep: parseFloat(formData.sleep),
          activity: parseFloat(formData.activity),
          source: "manual",
        }),
      });

      if (res.success && res.data) {
        setResultData(res.data);
      } else {
        setErrorMessage(res.message || "Failed to submit telemetry.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error submitting health data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Manual Health Data Input
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Enter astronaut physiological telemetry for real-time Isolation Forest anomaly detection.
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#07111f] p-1">
            {["Manual Input", "CSV Upload", "Live Sensor"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab !== "Manual Input" ? (
          <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-12 text-center text-slate-400 space-y-2">
            <span className="text-3xl">📡</span>
            <h3 className="text-base font-bold text-white">{activeTab} Interface</h3>
            <p className="text-xs text-slate-400">This ingestion stream module is in preparation for hardware downlink integration.</p>
          </div>
        ) : (
          /* Main 2-Column Section */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Form (65%) */}
            <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-7 backdrop-blur-sm shadow-sm space-y-6">
              
              {/* Astronaut Selector + Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
                <div className="space-y-1.5 flex-1 max-w-sm">
                  <label className="text-xs font-semibold text-slate-300">
                    Subject Profile
                  </label>
                  <div className="relative">
                    {user?.role === "astronaut" ? (
                      <div className="w-full rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 text-sm font-semibold text-white font-mono flex items-center justify-between">
                        <span>{user.name} ({user.astronautId || "AST-001"})</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Locked to ID</span>
                      </div>
                    ) : (
                      <select
                        value={selectedAstronautId}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = id === "AST-001" ? "Alex Morgan" : id === "AST-002" ? "Sarah Chen" : "James Wilson";
                          handleAstronautSelect(name, id);
                        }}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-[#020817] px-4 py-2.5 pr-8 text-sm font-semibold text-white outline-none focus:border-blue-500 transition"
                      >
                        <option value="AST-001">Alex Morgan (Commander • AST-001)</option>
                        <option value="AST-002">Sarah Chen (Flight Engineer • AST-002)</option>
                        <option value="AST-003">James Wilson (Payload Specialist • AST-003)</option>
                      </select>
                    )}
                    {user?.role !== "astronaut" && (
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* Astronaut Avatar Box */}
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-blue-500/40 bg-slate-900 shadow-md">
                    <Image src="/astronaut-avatar.png" alt={selectedAstronaut} fill className="object-cover" />
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 4 Input Fields in 2x2 Grid */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Heart Rate */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-bold text-white">Heart Rate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="30"
                        max="220"
                        value={formData.heartRate}
                        onChange={(e) => handleInputChange("heartRate", e.target.value)}
                        placeholder="72"
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-400 shrink-0">
                        BPM
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Valid range: 30 - 220</p>
                  </div>

                  {/* SpO2 */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white">Blood Oxygen (SpO₂)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="100"
                        value={formData.spo2}
                        onChange={(e) => handleInputChange("spo2", e.target.value)}
                        placeholder="98"
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-400 shrink-0">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Valid range: 50 - 100</p>
                  </div>

                  {/* Sleep Duration */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Sleep Duration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="24"
                        value={formData.sleep}
                        onChange={(e) => handleInputChange("sleep", e.target.value)}
                        placeholder="7.4"
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-400 shrink-0">
                        Hours
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Valid range: 0 - 24</p>
                  </div>

                  {/* Activity Level */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Activity Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.activity}
                        onChange={(e) => handleInputChange("activity", e.target.value)}
                        placeholder="68"
                        required
                        className="w-full rounded-lg border border-white/10 bg-[#020817] px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500 font-mono"
                      />
                      <span className="rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-400 shrink-0">
                        %
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">Valid range: 0 - 100</p>
                  </div>

                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400">Quick Simulation Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyPreset(p.data)}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:bg-blue-600/20 hover:border-blue-400/30 hover:text-white transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Executing Isolation Forest Inference...</span>
                    </>
                  ) : (
                    <span>Analyze Health Telemetry</span>
                  )}
                </button>
              </form>

            </div>

            {/* Right: Input Summary Panel (35%) */}
            <div className="lg:col-span-4 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-3">
                  Telemetry Payload Summary
                </h3>

                <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-blue-500/30">
                    <Image src="/astronaut-avatar.png" alt="Astronaut" fill className="object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Subject Profile</span>
                    <span className="text-sm font-bold text-white">{selectedAstronaut}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-1 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Heart className="w-3.5 h-3.5 text-red-400" />
                      <span>Heart Rate</span>
                    </div>
                    <span className="font-bold text-white font-mono">{formData.heartRate} BPM</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>SpO₂ Level</span>
                    </div>
                    <span className="font-bold text-white font-mono">{formData.spo2} %</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Moon className="w-3.5 h-3.5 text-purple-400" />
                      <span>Sleep Rest</span>
                    </div>
                    <span className="font-bold text-white font-mono">{formData.sleep} hrs</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Activity Level</span>
                    </div>
                    <span className="font-bold text-white font-mono">{formData.activity} %</span>
                  </div>
                </div>

                {resultData && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Inference Output Received</span>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1 font-mono pt-1 border-t border-emerald-500/20">
                      <div>Risk Score: <span className="font-bold text-white">{resultData.analysis.anomalyScore}/100</span> ({resultData.analysis.riskLevel})</div>
                      <div>Confidence: <span className="text-emerald-400">{resultData.analysis.confidence}%</span></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Panel Below */}
              <div className="rounded-2xl border border-blue-500/20 bg-blue-950/15 p-5 text-xs text-slate-300 leading-relaxed space-y-1.5">
                <span className="font-bold text-blue-300 block">Dual-Baseline Ingestion:</span>
                <p className="text-slate-400">
                  The submitted physiological signals will be compared against personal and mission baselines to identify unusual patterns.
                </p>
              </div>
            </div>

          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}