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
  Users,
  UserCircle,
  Rocket,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/astronauts", label: "Astronauts", icon: UserCircle },
  { href: "/admin/missions", label: "Missions", icon: Rocket },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <RoleGuard allowedRoles={["admin"]}>
    <div className="flex min-h-screen bg-[#0a0800] text-white">
      {/* Desktop Sidebar — amber/orange accent (administrative) */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-amber-500/10 bg-[#150f00]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600/20 border border-amber-500/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Astro<span className="text-amber-400">Guard</span>
            </span>
          </Link>

          {/* Role Tag */}
          <div className="flex items-center gap-2 px-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-widest">Administration</span>
          </div>

          {/* Nav */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-600/80 text-white shadow-lg shadow-amber-600/20"
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
              <div className="h-9 w-9 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-amber-400">System Administrator</p>
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
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#150f00]/90 px-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="text-sm font-bold"><span className="text-amber-400">Admin</span> Panel</span>
          <div className="h-8 w-8 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
            {user?.name.split(" ").map((n) => n[0]).join("").slice(0,2) || "AD"}
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#150f00] p-4 space-y-1">
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
