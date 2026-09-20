"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Activity,
  FileSpreadsheet,
  Brain,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Satellite,
} from "lucide-react";

const navItems = [
  { href: "/astronaut/dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { href: "/astronaut/health", label: "My Health", icon: Activity },
  { href: "/astronaut/data-input", label: "Data Input", icon: FileSpreadsheet },
  { href: "/astronaut/ai-analysis", label: "AI Analysis", icon: Brain },
  { href: "/astronaut/alerts", label: "My Alerts", icon: Bell },
  { href: "/astronaut/profile", label: "Profile", icon: User },
];

export default function AstronautLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#020817] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-blue-500/10 bg-[#06111e]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/astronaut/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-blue-400">Guard</span>
            </span>
          </Link>

          {/* Role Tag */}
          <div className="flex items-center gap-2 px-2">
            <Satellite className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-widest">Astronaut Portal</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
          {user && (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-blue-400 font-mono">{user.astronautId || "Astronaut"}</p>
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
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#06111e]/90 px-4 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold">
            Astro<span className="text-blue-400">Guard</span>
          </span>
          <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
            {user?.name.split(" ").map((n) => n[0]).join("") || "AS"}
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#06111e] p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
