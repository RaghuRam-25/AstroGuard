"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";
import { getAllMedicalAlerts } from "../../lib/api";
import {
  LogOut,
  Radio,
  Clock,
  Bell,
  Siren,
  Zap,
  ArrowRight,
} from "lucide-react";

interface AlertItem {
  _id?: string;
  id?: string;
  astronautId?: string;
  title: string;
  description?: string;
  severity?: string;
  createdAt?: string;
  acknowledged?: boolean;
}

function timeAgo(value?: string): string {
  if (!value) return "just now";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load active telemetry & medical alerts for Mission Control
  const loadAlerts = useCallback(async () => {
    try {
      const res = await getAllMedicalAlerts("all");
      if (res.success && Array.isArray(res.data)) {
        setAlerts(res.data as AlertItem[]);
      }
    } catch {
      // ignore transient network errors
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
    const alertInterval = setInterval(() => {
      void loadAlerts();
    }, 8000);
    return () => clearInterval(alertInterval);
  }, [loadAlerts]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    if (alertsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [alertsOpen]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().slice(17, 22) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeAlertCount = alerts.length;

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["mission_control"]}>
        <div className="flex min-h-screen flex-col bg-transparent text-white">
          {/* Full-Width Topbar Navbar (Astronaut Portal Cosmic Cyan Theme) */}
          <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-white/[0.08] bg-[#020817]/50 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
            {/* Left: Brand Logo & Role Tag */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <Link href="/mission-control/dashboard" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 p-1.5 shadow-inner">
                  <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
                </div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Astro<span className="text-cyan-400">Guard</span>
                </span>
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span className="uppercase tracking-widest text-[10px] font-black">
                  Mission Control Core
                </span>
              </div>
            </div>

            {/* Right: Telemetry status, UTC clock, alerts dropdown, user badge & logout */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Telemetry Live</span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#071a2e]/60 px-3 py-1.5 font-mono text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{currentTime || "14:32 UTC"}</span>
              </div>

              {/* Alerts Bell & Interactive Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setAlertsOpen((prev) => !prev)}
                  title="Mission Control Incident Signals"
                  className={`relative rounded-xl border p-2 transition cursor-pointer ${
                    alertsOpen
                      ? "border-cyan-400/60 bg-cyan-500/20 text-white"
                      : "border-white/[0.08] bg-[#071a2e]/60 text-slate-300 hover:text-white hover:border-cyan-400/40"
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {activeAlertCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
                      {activeAlertCount > 9 ? "9+" : activeAlertCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Popover */}
                {alertsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-cyan-500/30 bg-[#061426]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50 animate-fade-in overflow-hidden">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between border-b border-cyan-500/15 px-4 py-3 bg-[#071a2e]">
                      <div className="flex items-center gap-2">
                        <Siren className="h-4 w-4 text-cyan-300" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Mission Incident Signals
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        activeAlertCount > 0 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}>
                        {activeAlertCount} {activeAlertCount === 1 ? "Alert" : "Alerts"}
                      </span>
                    </div>

                    {/* Dropdown Alert List */}
                    <div className="max-h-[320px] overflow-y-auto divide-y divide-cyan-500/10 [scrollbar-width:thin]">
                      {alerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                            <Zap className="h-4 w-4" />
                          </div>
                          <p className="mt-2 text-xs font-bold text-white">All Flight Systems Nominal</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">No active spacecraft or biomedical alerts.</p>
                        </div>
                      ) : (
                        alerts.slice(0, 5).map((alert) => {
                          const isCrit = alert.severity === "Critical";
                          const isWarn = alert.severity === "Warning" || alert.severity === "Watch";

                          return (
                            <button
                              key={alert._id || alert.id || `${alert.astronautId}-${alert.title}`}
                              type="button"
                              onClick={() => {
                                setAlertsOpen(false);
                                router.push("/mission-control/dashboard");
                              }}
                              className="w-full text-left p-3.5 hover:bg-[#0b1f36]/70 transition flex items-start gap-3 cursor-pointer group"
                            >
                              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                                isCrit ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" : isWarn ? "bg-amber-400" : "bg-emerald-400"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition truncate">
                                    {alert.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {timeAgo(alert.createdAt)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                                  {alert.description || `Anomaly event logged for ${alert.astronautId || "flight asset"}.`}
                                </div>
                                {alert.astronautId && (
                                  <span className="inline-block mt-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-400/20">
                                    {alert.astronautId}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Dropdown Footer Action */}
                    <div className="border-t border-cyan-500/15 p-2 bg-[#05101d]">
                      <button
                        type="button"
                        onClick={() => {
                          setAlertsOpen(false);
                          router.push("/mission-control/dashboard");
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition cursor-pointer"
                      >
                        <span>Open Mission Operations Console</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Chip & Logout */}
              {user && (
                <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                  <div className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/20 rounded-xl px-2.5 py-1">
                    <div className="relative h-6 w-6 rounded-full overflow-hidden border border-cyan-500/40 bg-slate-800">
                      <Image src="/astronaut-avatar.png" alt="Avatar" fill className="object-cover" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 hidden md:block max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    title="Logout Session"
                    className="flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Full Width Main Page Content */}
          <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
