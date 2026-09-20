"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Activity,
  Brain,
  Bell,
  LogOut,
  Menu,
  X,
  Stethoscope,
} from "lucide-react";

const navItems = [
  { href: "/medical/dashboard", label: "Medical Dashboard", icon: LayoutDashboard },
  { href: "/medical/astronauts", label: "Astronauts", icon: Users },
  { href: "/medical/alerts", label: "Alerts", icon: Bell },
];

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020c18] text-white">
      {/* Desktop Sidebar — emerald/teal accent (clinical) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-emerald-500/10 bg-[#041a12]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/medical/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-emerald-400">Guard</span>
            </span>
          </Link>

          {/* Role Tag */}
          <div className="flex items-center gap-2 px-2">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">Medical Center</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/medical/astronauts" && pathname.startsWith("/medical/astronauts"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Assigned Crew Summary */}
          {user?.assignedAstronautIds && user.assignedAstronautIds.length > 0 && (
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3 space-y-1">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Assigned Crew</p>
              {user.assignedAstronautIds.slice(0, 5).map((id) => (
                <Link
                  key={id}
                  href={`/medical/astronauts/${id}`}
                  className="block text-xs text-slate-300 hover:text-emerald-400 transition font-mono py-0.5"
                >
                  {id}
                </Link>
              ))}
              {user.assignedAstronautIds.length > 5 && (
                <p className="text-[10px] text-slate-500">+{user.assignedAstronautIds.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300">
                {user.name.split(" ").filter(w => w.length > 1).map((n) => n[0]).join("").slice(0,2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-emerald-400">Flight Surgeon</p>
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
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#041a12]/90 px-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold">Medical <span className="text-emerald-400">Center</span></span>
          <div className="h-8 w-8 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-300">
            {user?.name.split(" ").filter(w => w.length > 1).map((n) => n[0]).join("").slice(0,2) || "MO"}
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#041a12] p-4 space-y-1">
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
  );
}
