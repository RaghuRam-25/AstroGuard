"use client";

import { useState } from "react";
import { Heart, Moon, Droplet, Activity, ShieldCheck, LucideIcon } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";

interface AlertItem {
  id: number;
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  time: string;
  icon: LucideIcon;
  iconColor: string;
}

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filterOptions = ["All", "Normal", "Watch", "Warning", "Critical"];

  const alertList: AlertItem[] = [
    {
      id: 1,
      title: "Elevated Heart Rate",
      description: "Heart rate is 12% higher than your baseline.",
      severity: "Watch",
      time: "12 minutes ago",
      icon: Heart,
      iconColor: "text-red-400 bg-red-500/10",
    },
    {
      id: 2,
      title: "Low Sleep Duration",
      description: "Sleep duration is below your usual range.",
      severity: "Warning",
      time: "2 hours ago",
      icon: Moon,
      iconColor: "text-purple-400 bg-purple-500/10",
    },
    {
      id: 3,
      title: "SpO₂ Slightly Low",
      description: "Blood oxygen level is 2% below normal.",
      severity: "Watch",
      time: "4 hours ago",
      icon: Droplet,
      iconColor: "text-cyan-400 bg-cyan-500/10",
    },
    {
      id: 4,
      title: "Activity Level High",
      description: "Activity level is higher than usual.",
      severity: "Watch",
      time: "6 hours ago",
      icon: Activity,
      iconColor: "text-emerald-400 bg-emerald-500/10",
    },
    {
      id: 5,
      title: "All Metrics Normal",
      description: "All vital signs are within expected range.",
      severity: "Normal",
      time: "8 hours ago",
      icon: ShieldCheck,
      iconColor: "text-emerald-400 bg-emerald-500/10",
    },
  ];

  const filteredAlerts = alertList.filter((a) => {
    if (activeFilter === "All") return true;
    return a.severity.toLowerCase() === activeFilter.toLowerCase();
  });

  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 text-red-300 border border-red-500/30";
      case "Warning":
        return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
      case "Watch":
        return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
      case "Normal":
      default:
        return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    }
  };

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["medical_officer", "mission_control"]}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Filter Pills */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Alerts & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Stay informed about any health changes or potential risks.
          </p>
        </div>

        {/* Filter Pills (All, Normal, Watch, Warning, Critical) */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#07111f] p-1">
          {filterOptions.map((f) => {
            const isActive = activeFilter === f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Cards Stack */}
      <div className="space-y-3.5">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-4 sm:p-5 backdrop-blur-sm shadow-sm transition hover:border-blue-500/30 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${alert.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white">{alert.title}</h3>
                    <p className="text-xs text-slate-400">{alert.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${getSeverityBadgeStyle(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="hidden sm:inline-block text-xs font-mono text-slate-500">
                    {alert.time}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-12 text-center text-slate-400 space-y-2">
            <span className="text-3xl">🛡️</span>
            <h3 className="text-base font-bold text-white">No alerts in &quot;{activeFilter}&quot; filter</h3>
            <p className="text-xs text-slate-500">All current vitals are within expected parameters.</p>
          </div>
        )}
      </div>

    </div>
    </RoleGuard>
    </ProtectedRoute>
  );
}
