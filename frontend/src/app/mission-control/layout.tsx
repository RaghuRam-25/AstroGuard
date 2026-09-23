"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ProtectedRoute from "../../components/auth/ProtectedRoute";
import RoleGuard from "../../components/auth/RoleGuard";
import {
  LayoutDashboard,
  Rocket,
  LogOut,
  Menu,
  X,
  Radio,
  Users,
  ShieldAlert,
} from "lucide-react";

const navItems = [
  { href: "/mission-control/dashboard", label: "Mission Dashboard", icon: LayoutDashboard },
  { href: "/mission-control/missions", label: "Missions", icon: Rocket },
  { href: "/mission-control/crew-directory", label: "Crew Directory", icon: Users },
  { href: "/mission-control/governance", label: "System Governance", icon: ShieldAlert },
];

export default function MissionControlLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["mission_control"]}>
    <div className="flex min-h-screen bg-[#07020f] text-white">
      {/* Desktop Sidebar — purple/violet accent (operational) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-purple-500/10 bg-[#0f0520]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/mission-control/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-purple-400">Guard</span>
            </span>
          </Link>

          {/* Role Tag */}
          <div className="flex items-center gap-2 px-2">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-widest">Mission Control</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/mission-control/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-purple-600/90 text-white shadow-lg shadow-purple-600/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Assigned Missions */}
          {user?.missionIds && user.missionIds.length > 0 && (
            <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">Assigned Missions</p>
              {user.missionIds.map((m) => (
                <Link
                  key={m}
                  href={`/mission-control/missions/${encodeURIComponent(m)}`}
                  className="block text-xs text-slate-300 hover:text-purple-400 transition py-0.5 truncate"
                >
                  {m}
                </Link>
              ))}
            </div>
          )}

          {/* Live Status */}
          <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400 font-semibold">SYSTEMS NOMINAL</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-purple-400">Mission Control</p>
              </div>
            </div>
          )}
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition">
            <LogOut className="w-3.5 h-3.5" />Logout Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0f0520]/90 px-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold">Mission <span className="text-purple-400">Control</span></span>
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#0f0520] p-4 space-y-1">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
      </RoleGuard>
    </ProtectedRoute>
  );
}
