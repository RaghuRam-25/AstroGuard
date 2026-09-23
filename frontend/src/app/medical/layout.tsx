"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";
import {
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Stethoscope,
  FileText,
  HeartPulse,
  UserRound,
  MessageCircle,
} from "lucide-react";

const navItems = [
  { href: "/medical/dashboard", label: "Crew Overview", icon: Users },
  { href: "/medical/clinical-protocols", label: "Health Monitoring", icon: HeartPulse },
  { href: "/medical/alerts", label: "Medical Alerts", icon: Bell, badge: true },
  { href: "/medical/reports", label: "Reports", icon: FileText },
  { href: "/medical/medical-consult", label: "Chat & Call", icon: MessageCircle },
  { href: "/medical/profile", label: "Profile", icon: UserRound },
];

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isFixedAnalysis = pathname === "/medical/ai-analysis";

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["medical_officer"]}>
    <div className={`flex min-h-screen bg-[#020817] text-white ${isFixedAnalysis ? "lg:h-dvh lg:max-h-dvh lg:overflow-hidden" : ""}`}>
      {/* Desktop Sidebar — emerald/teal accent (clinical) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-sky-400/15 bg-[#061426]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/medical/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600/20 border border-cyan-400/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-cyan-300">Guard</span>
            </span>
          </Link>

          {/* Flight surgeon identity */}
          <div className="flex items-center gap-3 rounded-2xl border border-sky-400/15 bg-sky-400/5 p-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-cyan-300/50 bg-cyan-400/10">
              <Image src="/astronaut-avatar.png" alt="Flight Surgeon" fill className="object-cover" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#061426] bg-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name || "Dr. Sarah Wilson"}</p>
              <p className="text-[11px] font-medium text-cyan-300">Medical Officer</p>
              <p className="font-mono text-[10px] text-slate-400">MED-002 · Online</p>
            </div>
          </div>

          {/* Role Tag */}
          <div className="flex items-center gap-2 px-2">
            <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-widest">Medical Operations</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/90 text-[#021127] shadow-lg shadow-cyan-500/25"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#021127]" : "text-slate-400"}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.label === "Medical Alerts" ? "3" : ""}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

          <div className="rounded-2xl border border-sky-400/15 bg-slate-950/30 p-3.5 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-cyan-600/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-300">
                {user.name.split(" ").filter(w => w.length > 1).map((n) => n[0]).join("").slice(0,2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-cyan-300">Flight Surgeon</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 lg:pl-64 flex flex-col min-w-0 ${isFixedAnalysis ? "lg:h-full lg:min-h-0" : ""}`}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sky-400/15 bg-[#061426]/90 px-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold">Medical <span className="text-cyan-300">Operations</span></span>
          <div className="h-8 w-8 rounded-full bg-cyan-600/20 border border-cyan-400/30 flex items-center justify-center text-xs font-bold text-cyan-300">
            {user?.name.split(" ").filter(w => w.length > 1).map((n) => n[0]).join("").slice(0,2) || "MO"}
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-sky-400/15 bg-[#061426] p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition">
                  <Icon className="w-4 h-4" />{item.label}
                </Link>
              );
            })}
            <button onClick={() => { setMobileOpen(false); logout(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition">
              <LogOut className="w-4 h-4" />Logout
            </button>
          </div>
        )}

        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${isFixedAnalysis ? "lg:min-h-0 lg:overflow-hidden" : ""}`}>{children}</main>
      </div>
    </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
