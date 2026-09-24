"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Heart, Moon, Droplet, Activity, ShieldCheck, Siren, LucideIcon, RefreshCw } from "lucide-react";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";
import { getAlerts } from "../../lib/api";

interface AlertItem {
  id: string | number;
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  time: string;
  icon: LucideIcon;
  iconColor: string;
  resolved?: boolean;
}

function timeAgo(value?: string): string {
  if (!value) return "Just now";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function getIconForAlert(title: string, signal?: string): { icon: LucideIcon; iconColor: string } {
  const text = `${title} ${signal || ""}`.toLowerCase();
  if (text.includes("sos") || text.includes("emergency")) {
    return { icon: Siren, iconColor: "text-rose-400 bg-rose-500/10" };
  }
  if (text.includes("heart") || text.includes("cardiac") || text.includes("pulse")) {
    return { icon: Heart, iconColor: "text-red-400 bg-red-500/10" };
  }
  if (text.includes("sleep") || text.includes("fatigue") || text.includes("circadian")) {
    return { icon: Moon, iconColor: "text-purple-400 bg-purple-500/10" };
  }
  if (text.includes("spo2") || text.includes("oxygen") || text.includes("blood") || text.includes("hydration")) {
    return { icon: Droplet, iconColor: "text-cyan-400 bg-cyan-500/10" };
  }
  if (text.includes("activity") || text.includes("stress") || text.includes("motion")) {
    return { icon: Activity, iconColor: "text-emerald-400 bg-emerald-500/10" };
  }
  return { icon: ShieldCheck, iconColor: "text-emerald-400 bg-emerald-500/10" };
}

export default function AlertsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const filterOptions = ["All", "Normal", "Watch", "Warning", "Critical"];

  const fetchLiveAlerts = useCallback(async () => {
    try {
      const res = await getAlerts();
      if (res.success && Array.isArray(res.data)) {
        const rawAlerts = res.data as Array<{
          _id?: string;
          id?: string | number;
          title?: string;
          description?: string;
          severity?: "Normal" | "Watch" | "Warning" | "Critical";
          signal?: string;
          createdAt?: string;
          resolved?: boolean;
        }>;

        const mapped: AlertItem[] = rawAlerts.map((a, index) => {
          const title = a.title || "Health Alert";
          const severity = a.severity || "Normal";
          const { icon, iconColor } = getIconForAlert(title, a.signal);
          return {
            id: a._id || a.id || index + 1,
            title,
            description: a.description || "Alert telemetry logged.",
            severity,
            time: timeAgo(a.createdAt),
            icon,
            iconColor,
            resolved: a.resolved,
          };
        });

        setAlerts(mapped);
      }
    } catch {
      // Fallback retained
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLiveAlerts();
    const timer = setInterval(() => {
      void fetchLiveAlerts();
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchLiveAlerts]);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === "All") return alerts;
    return alerts.filter((a) => a.severity.toLowerCase() === activeFilter.toLowerCase());
  }, [alerts, activeFilter]);

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
        {loading && alerts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#07111f]/80 p-8 text-center text-slate-400">
            <p className="text-xs text-slate-400">Loading alerts stream…</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
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
