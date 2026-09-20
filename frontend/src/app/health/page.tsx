"use client";

import { useState } from "react";
import { Heart, Droplet, Moon, Activity, ChevronDown } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function HealthPage() {
  const [selectedRange, setSelectedRange] = useState("Last 24h");
  const [selectedAstronaut, setSelectedAstronaut] = useState("Alex Morgan");

  const ranges = ["Last 24h", "Last 7 days", "Last 30 days"];

  const vitals = [
    {
      title: "Heart Rate",
      value: "72",
      unit: "BPM",
      status: "Normal",
      change: "+2.1%",
      icon: Heart,
      iconColor: "text-red-400 bg-red-500/10",
      sparkColor: "#ef4444",
      sparkPoints: "0,15 15,10 30,18 45,6 60,12 75,8 90,4",
    },
    {
      title: "SpO₂",
      value: "98",
      unit: "%",
      status: "Normal",
      change: "+0.5%",
      icon: Droplet,
      iconColor: "text-cyan-400 bg-cyan-500/10",
      sparkColor: "#06b6d4",
      sparkPoints: "0,12 15,14 30,10 45,8 60,11 75,6 90,5",
    },
    {
      title: "Sleep",
      value: "7.4",
      unit: "hrs",
      status: "Good",
      change: "-1.2%",
      icon: Moon,
      iconColor: "text-purple-400 bg-purple-500/10",
      sparkColor: "#a855f7",
      sparkPoints: "0,8 15,12 30,16 45,10 60,14 75,9 90,11",
    },
    {
      title: "Activity",
      value: "68",
      unit: "%",
      status: "Normal",
      change: "+2.4%",
      icon: Activity,
      iconColor: "text-emerald-400 bg-emerald-500/10",
      sparkColor: "#10b981",
      sparkPoints: "0,16 15,12 30,14 45,8 60,6 75,10 90,5",
    },
  ];

  const quickStats = [
    { label: "Average HR", value: "72 BPM", icon: Heart, color: "text-red-400" },
    { label: "SpO₂", value: "98%", icon: Droplet, color: "text-cyan-400" },
    { label: "Sleep", value: "7.4 hrs", icon: Moon, color: "text-purple-400" },
    { label: "Activity", value: "68%", icon: Activity, color: "text-emerald-400" },
  ];

  const baselineData = [
    { metric: "Heart Rate", personal: "70 BPM", mission: "72 BPM", current: "72 BPM", delta: "+2.8%", status: "Optimal" },
    { metric: "Blood Oxygen (SpO₂)", personal: "98.0%", mission: "97.8%", current: "98.2%", delta: "+0.2%", status: "Optimal" },
    { metric: "Sleep Rest", personal: "7.6 hrs", mission: "7.8 hrs", current: "7.4 hrs", delta: "-2.6%", status: "Normal" },
    { metric: "Physical Activity", personal: "65%", mission: "62%", current: "68%", delta: "+4.6%", status: "Nominal" },
  ];

  const timeLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Health Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Detailed view of astronaut&apos;s health metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Astronaut Selector */}
            <div className="relative">
              <select
                value={selectedAstronaut}
                onChange={(e) => setSelectedAstronaut(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-[#07111f] px-4 py-1.5 pr-8 text-xs font-semibold text-white outline-none focus:border-blue-500 transition"
              >
                <option value="Alex Morgan">Alex Morgan</option>
                <option value="Sarah Chen">Sarah Chen</option>
                <option value="James Wilson">James Wilson</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Time Range Filter Pills */}
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#07111f] p-1">
              {ranges.map((range) => {
                const isSelected = selectedRange === range;
                return (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Health Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {vitals.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition hover:border-blue-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${v.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">{v.title}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold tracking-tight text-white">{v.value}</span>
                  <span className="text-xs font-medium text-slate-400">{v.unit}</span>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                      {v.status}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400">{v.change}</span>
                  </div>

                  <svg className="w-20 h-5 overflow-visible" viewBox="0 0 90 20">
                    <polyline
                      fill="none"
                      stroke={v.sparkColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={v.sparkPoints}
                    />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Section: Health Metrics Trend (Left 75%) + Quick Stats (Right 25%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left: Trend Multi-Line Spline Chart */}
          <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Health Metrics Trend
              </h3>

              {/* Line Legends */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Heart Rate
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  SpO₂
                </span>
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="h-2 w-2 rounded-full bg-purple-400" />
                  Sleep
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Activity
                </span>
              </div>
            </div>

            {/* SVG Multi-Line Chart */}
            <div className="relative h-60 w-full pt-4">
              <svg className="w-full h-48 overflow-visible" viewBox="0 0 500 160">
                {/* Horizontal grid lines */}
                <line x1="40" y1="10" x2="490" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="55" x2="490" y2="55" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="490" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="145" x2="490" y2="145" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Y Axis Labels */}
                <text x="15" y="14" fill="#64748b" fontSize="10" fontFamily="monospace">150</text>
                <text x="15" y="59" fill="#64748b" fontSize="10" fontFamily="monospace">100</text>
                <text x="15" y="104" fill="#64748b" fontSize="10" fontFamily="monospace">50</text>
                <text x="15" y="149" fill="#64748b" fontSize="10" fontFamily="monospace">0</text>

                {/* Line 1: Heart Rate (Cyan) */}
                <path
                  d="M 50,105 C 120,80 180,95 250,70 C 320,100 380,80 470,85"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {[50, 130, 210, 290, 380, 470].map((cx, i) => (
                  <circle key={i} cx={cx} cy={80 + (i % 2 === 0 ? 10 : -10)} r="4" fill="#06b6d4" stroke="#020817" strokeWidth="2" />
                ))}

                {/* Line 2: SpO2 (Blue) */}
                <path
                  d="M 50,45 C 120,40 180,50 250,42 C 320,38 380,44 470,40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Line 3: Activity (Emerald) */}
                <path
                  d="M 50,130 C 120,110 180,85 250,95 C 320,80 380,70 470,75"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Line 4: Sleep (Purple) */}
                <path
                  d="M 50,140 C 120,135 180,140 250,135 C 320,130 380,135 470,132"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
              </svg>

              {/* X Axis Time Labels */}
              <div className="flex justify-between pl-10 pr-4 text-[10px] font-mono text-slate-500">
                {timeLabels.map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick Stats Panel */}
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4 flex flex-col justify-between">
            <div className="border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Quick Stats
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Average resting values over {selectedRange}</p>
            </div>

            <div className="space-y-3.5 my-auto">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs font-medium text-slate-300">{stat.label}</span>
                    </div>
                    <span className="text-sm font-bold text-white font-mono">{stat.value}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/5 pt-3 text-[11px] text-slate-400 flex justify-between">
              <span>Astronaut:</span>
              <span className="font-semibold text-white">{selectedAstronaut}</span>
            </div>
          </div>

        </div>

        {/* Baseline Comparison Section */}
        <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Dual Baseline Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              AstroGuard benchmarks real-time vitals against both calibrated personal patterns and mission phase cohort norms.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="pb-3 font-semibold">Physiological Metric</th>
                  <th className="pb-3 font-semibold">Personal Baseline</th>
                  <th className="pb-3 font-semibold">Mission Baseline</th>
                  <th className="pb-3 font-semibold">Current Reading</th>
                  <th className="pb-3 font-semibold">Variance</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {baselineData.map((row) => (
                  <tr key={row.metric} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-medium text-white">{row.metric}</td>
                    <td className="py-3.5 text-blue-300 font-mono">{row.personal}</td>
                    <td className="py-3.5 text-purple-300 font-mono">{row.mission}</td>
                    <td className="py-3.5 font-bold text-white font-mono">{row.current}</td>
                    <td className="py-3.5 text-emerald-400 font-mono">{row.delta}</td>
                    <td className="py-3.5">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}
