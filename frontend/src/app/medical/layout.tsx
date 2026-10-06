"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";
import { getAllMedicalAlerts } from "../../lib/api";
import SidebarSpacewalkBackground from "../../components/layout/SidebarSpacewalkBackground";
import {
  LayoutDashboard,
  MessageCircle,
  Bell,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Siren,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

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

const navItems: NavItem[] = [
  { href: "/medical/dashboard", label: "Medical Dashboard", icon: LayoutDashboard },
  { href: "/medical/medical-consult", label: "Chat & Call", icon: MessageCircle },
];

const PAGE_HEADINGS: Record<string, { title: string; subtitle?: string }> = {
  "/medical/dashboard": { title: "Medical Operations Hub", subtitle: "Real-time astronaut telemetry & telemetry streams" },
  "/medical/clinical-protocols": { title: "Health Monitoring & Protocols", subtitle: "Live mission protocols & clinical guidelines" },
  "/medical/alerts": { title: "Medical Incident Alerts", subtitle: "High-priority telemetry anomaly notifications" },
  "/medical/reports": { title: "Clinical Reports & Logs", subtitle: "Historical flight crew diagnostics" },
  "/medical/medical-consult": { title: "Flight Surgeon Medical Consult", subtitle: "Direct bi-directional astronaut teleconsultation" },
  "/medical/profile": { title: "Flight Surgeon Profile", subtitle: "Active medical credentials and station details" },
  "/medical/ai-analysis": { title: "Clinical AI Diagnostics", subtitle: "Deep AI biometric assessment and risk forecasting" },
};

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

function getHeading(pathname: string) {
  if (PAGE_HEADINGS[pathname]) return PAGE_HEADINGS[pathname];
  if (pathname.startsWith("/medical/astronauts/")) {
    if (pathname.endsWith("/health")) return { title: "Astronaut Biometrics & Health", subtitle: "Longitudinal biometric telemetry and vital trends" };
    if (pathname.endsWith("/analysis")) return { title: "Astronaut AI Diagnostics", subtitle: "Biometric anomaly detection and predictive scoring" };
    if (pathname.endsWith("/alerts")) return { title: "Astronaut Medical Incidents", subtitle: "Crew incident history and active clinical alerts" };
    return { title: "Astronaut Clinical Profile", subtitle: "Physiological overview and baseline health record" };
  }
  return { title: "Medical Operations", subtitle: "Flight Surgeon Telemetry & Clinical System" };
}

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFixedAnalysis = pathname === "/medical/ai-analysis";
  const heading = getHeading(pathname);

  // Load active alerts
  const loadAlerts = useCallback(async () => {
    try {
      const res = await getAllMedicalAlerts("assigned");
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
      setCurrentTime(
        now.toUTCString().slice(17, 22) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeAlertCount = alerts.length;

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["medical_officer"]}>
        <div className={`flex min-h-screen bg-[#020817] text-white ${isFixedAnalysis ? "lg:h-dvh lg:max-h-dvh lg:overflow-hidden" : ""}`}>
          {/* Desktop Sidebar — emerald/teal accent (clinical) */}
          <aside className="hidden lg:flex w-64 flex-col justify-between overflow-hidden border-r border-sky-400/20 bg-[#020712]/30 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-sm shadow-2xl">
            {/* Full-Height Spacewalk Floating Astronaut & Satellite Background */}
            <SidebarSpacewalkBackground />

            <div className="relative z-10 space-y-6">
              {/* Logo */}
              <Link href="/medical/dashboard" className="flex items-center gap-2.5 px-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 border border-cyan-400/30 p-1">
                  <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
                </div>
                <span className="text-xl font-bold tracking-tight text-white drop-shadow">
                  Astro<span className="text-cyan-300">Guard</span>
                </span>
              </Link>

              {/* Role Tag */}
              <div className="flex items-center gap-2 px-2">
                <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
                <span className="text-[10.5px] font-semibold text-cyan-300 uppercase tracking-widest">Medical Operations</span>
              </div>

              {/* Nav links */}
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/medical/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200 backdrop-blur-md shadow-md ${
                        isActive
                          ? "bg-cyan-500/90 text-[#021127] font-bold shadow-lg shadow-cyan-500/30 border border-cyan-300"
                          : "bg-[#020712]/60 text-slate-100 hover:bg-sky-500/30 hover:text-white border border-white/10"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#021127]" : "text-cyan-300"}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom: Flight surgeon identity card + Logout button */}
            <div className="relative z-10 space-y-3 pt-3 border-t border-sky-400/20 bg-[#020710]/40 backdrop-blur-md rounded-2xl p-2">
              {/* Flight surgeon identity card */}
              <Link
                href="/medical/profile"
                className="flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-slate-900/60 p-3 hover:bg-slate-900/90 transition"
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-cyan-300/50 bg-cyan-400/10">
                  <Image src="/astronaut-avatar.png" alt="Flight Surgeon" fill className="object-cover" />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#061426] bg-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{user?.name || "Dr. Evelyn Vance"}</p>
                  <p className="text-[11px] font-medium text-cyan-300">Flight Surgeon</p>
                  <p className="font-mono text-[10px] text-slate-300">MED-002 · Active</p>
                </div>
              </Link>

              {/* Logout button */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/15 hover:text-rose-200 transition cursor-pointer border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area with Fixed Topbar */}
          <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
            {/* Topbar (sticky) */}
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-sky-400/15 bg-[#061426]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
              {/* Left: Mobile hamburger & Page Title */}
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle navigation menu"
                  className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-2 text-cyan-300 hover:bg-sky-400/20 lg:hidden"
                >
                  {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    {heading.title}
                  </h1>
                  <p className="truncate text-xs text-slate-400 hidden sm:block">
                    {heading.subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Quick actions, telemetry status, UTC clock, alerts, avatar */}
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Telemetry Status Badge */}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Medical Uplink Active</span>
                </div>

                {/* Mission UTC Clock */}
                <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-slate-900/50 px-3 py-1.5 font-mono text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{currentTime || "14:32 UTC"}</span>
                </div>

                {/* Alerts Bell & Interactive Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setAlertsOpen((prev) => !prev)}
                    title="Medical Incident Alerts"
                    className={`relative rounded-xl border p-2 transition cursor-pointer ${
                      alertsOpen
                        ? "border-cyan-400/60 bg-cyan-500/20 text-white"
                        : "border-white/[0.08] bg-slate-900/50 text-slate-300 hover:text-white hover:border-cyan-400/40"
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
                    <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] rounded-2xl border border-sky-400/25 bg-[#061426]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] z-50 animate-fade-in overflow-hidden">
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between border-b border-sky-400/15 px-4 py-3 bg-[#091B33]">
                        <div className="flex items-center gap-2">
                          <Siren className="h-4 w-4 text-cyan-300" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Active Incident Signals
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                          activeAlertCount > 0 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {activeAlertCount} {activeAlertCount === 1 ? "Alert" : "Alerts"}
                        </span>
                      </div>

                      {/* Dropdown Alert List */}
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-sky-400/10 [scrollbar-width:thin]">
                        {alerts.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                              <Zap className="h-4 w-4" />
                            </div>
                            <p className="mt-2 text-xs font-bold text-white">All Astronauts Nominal</p>
                            <p className="mt-0.5 text-[11px] text-slate-400">No active medical incidents reported.</p>
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
                                  router.push("/medical/dashboard");
                                }}
                                className="w-full text-left p-3.5 hover:bg-[#0A2242]/70 transition flex items-start gap-3 cursor-pointer group"
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
                                    {alert.description || `Physiological anomaly recorded for ${alert.astronautId || "crew member"}.`}
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
                      <div className="border-t border-sky-400/15 p-2 bg-[#040C18]">
                        <button
                          type="button"
                          onClick={() => {
                            setAlertsOpen(false);
                            router.push("/medical/dashboard");
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold transition cursor-pointer"
                        >
                          <span>Open Medical Triage Console</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Surgeon Quick Profile */}
                {user && (
                  <Link
                    href="/medical/profile"
                    className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10 hover:opacity-90 transition"
                  >
                    <div className="relative h-7 w-7 rounded-full overflow-hidden border border-cyan-400/40 bg-slate-800">
                      <Image src="/astronaut-avatar.png" alt="Avatar" fill className="object-cover" />
                    </div>
                    <div className="text-left leading-tight hidden xl:block">
                      <span className="text-[11px] font-semibold text-slate-200 block truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono block">MED-002</span>
                    </div>
                  </Link>
                )}
              </div>
            </header>

            {/* Mobile Dropdown Navigation Drawer */}
            {mobileOpen && (
              <div className="lg:hidden border-b border-sky-400/15 bg-[#061426] p-4 space-y-1.5 shadow-2xl animate-fade-in">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-cyan-500 text-[#021127] font-semibold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                  </button>
                </div>
              </div>
            )}

            {/* Page Content */}
            <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isFixedAnalysis ? "lg:min-h-0 lg:overflow-hidden" : ""}`}>
              {children}
            </main>
          </div>
        </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
