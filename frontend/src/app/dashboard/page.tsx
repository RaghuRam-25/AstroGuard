import Link from "next/link";
import { Heart, Droplet, Moon, Activity, CheckCircle2 } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

export default function DashboardPage() {

  const vitals = [
    {
      title: "Heart Rate",
      value: "72",
      unit: "BPM",
      status: "Normal",
      change: "+2.1%",
      changeType: "up",
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
      changeType: "up",
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
      changeType: "down",
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
      changeType: "up",
      icon: Activity,
      iconColor: "text-emerald-400 bg-emerald-500/10",
      sparkColor: "#10b981",
      sparkPoints: "0,16 15,12 30,14 45,8 60,6 75,10 90,5",
    },
  ];

  // Data points for Vital Signs Overview line chart
  const timeLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Astronaut Health Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time monitoring and AI-powered insights
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Apr 23, 2025 14:32</span>
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
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

                  {/* SVG Sparkline */}
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

        {/* Main Content Grid: Chart (Left) + Anomaly Score (Middle) + Recent Alerts (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left: Vital Signs Overview Chart (7 Cols) */}
          <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Vital Signs Overview
              </h3>

              {/* Line Legends */}
              <div className="flex items-center gap-4 text-xs">
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
                  Activity
                </span>
              </div>
            </div>

            {/* SVG Multi-Line Chart */}
            <div className="relative h-56 w-full pt-4">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 160">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="10" x2="490" y2="10" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="50" x2="490" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="90" x2="490" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="130" x2="490" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Y Axis Labels */}
                <text x="15" y="14" fill="#64748b" fontSize="10" fontFamily="monospace">160</text>
                <text x="15" y="54" fill="#64748b" fontSize="10" fontFamily="monospace">120</text>
                <text x="15" y="94" fill="#64748b" fontSize="10" fontFamily="monospace">80</text>
                <text x="15" y="134" fill="#64748b" fontSize="10" fontFamily="monospace">40</text>

                {/* Line 1: Heart Rate (Cyan) */}
                <path
                  d="M 50,110 C 120,95 180,75 250,90 C 320,105 380,80 470,85"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {[
                  { cx: 50, cy: 110, val: "68" },
                  { cx: 130, cy: 98, val: "72" },
                  { cx: 210, cy: 85, val: "78" },
                  { cx: 290, cy: 95, val: "74" },
                  { cx: 380, cy: 82, val: "76" },
                  { cx: 470, cy: 85, val: "72" },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#06b6d4"
                    stroke="#020817"
                    strokeWidth="2"
                    className="cursor-pointer hover:r-6 transition-all"
                  />
                ))}

                {/* Line 2: SpO2 (Blue) */}
                <path
                  d="M 50,45 C 120,40 180,48 250,42 C 320,38 380,44 470,40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {[
                  { cx: 50, cy: 45 },
                  { cx: 130, cy: 42 },
                  { cx: 210, cy: 46 },
                  { cx: 290, cy: 40 },
                  { cx: 380, cy: 43 },
                  { cx: 470, cy: 40 },
                ].map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.cx}
                    cy={pt.cy}
                    r="4"
                    fill="#3b82f6"
                    stroke="#020817"
                    strokeWidth="2"
                    className="cursor-pointer"
                  />
                ))}

                {/* Line 3: Activity (Purple) */}
                <path
                  d="M 50,135 C 120,120 180,95 250,70 C 320,85 380,65 470,80"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
              </svg>

              {/* X-Axis Time Labels */}
              <div className="flex justify-between pl-10 pr-4 text-[10px] font-mono text-slate-500">
                {timeLabels.map((time) => (
                  <span key={time}>{time}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Center/Middle: AI Anomaly Score (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between items-center text-center">
            <div className="w-full text-left border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">AI Anomaly Score</h3>
            </div>

            {/* Circular Neon Ring Gauge */}
            <div className="relative my-4 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Progress Ring */}
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
                  className="transition-all duration-1000 ease-out shadow-lg"
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

            <div className="w-full border-t border-white/5 pt-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Model Confidence:</span>
                <span className="font-semibold text-white">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Engine:</span>
                <span className="font-mono text-slate-300">Isolation Forest</span>
              </div>
            </div>
          </div>

          {/* Right: Recent Alerts (3 Cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-[#07111f]/80 p-5 sm:p-6 backdrop-blur-sm shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Recent Alerts</h3>
              <Link href="/alerts" className="text-xs text-blue-400 hover:underline">
                View All
              </Link>
            </div>

            {/* Active Status Info */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 my-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">No critical alerts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  All vital systems nominal. No urgent physiological deviations detected.
                </p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Last Scan:</span>
                <span className="font-mono text-slate-300">Apr 23, 2025 14:32</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-400 font-semibold">Nominal Stream</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ProtectedRoute>
  );
}
