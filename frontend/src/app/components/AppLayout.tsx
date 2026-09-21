"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Activity,
  FileSpreadsheet,
  Brain,
  Bell,
  Search,
  Menu,
  X,
  Shield,
  LogOut,
  LogIn,
  Info,
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isBypassLayout =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/about" ||
    pathname === "/unauthorized" ||
    pathname.startsWith("/astronaut") ||
    pathname.startsWith("/medical") ||
    pathname.startsWith("/mission-control") ||
    pathname.startsWith("/admin");

  // If on public pages or role-specific routes, bypass generic layout
  if (isBypassLayout) {
    return <>{children}</>;
  }

  const baseNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/health", label: "Health", icon: Activity },
    { href: "/input", label: "Data Input", icon: FileSpreadsheet },
    { href: "/ai-analysis", label: "AI Analysis", icon: Brain },
    { href: "/alerts", label: "Alerts", icon: Bell },
  ];

  // Admin link only visible to admin role
  const navItems = user?.role === "admin"
    ? [...baseNavItems, { href: "/admin", label: "Admin Security", icon: Shield }]
    : baseNavItems;

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Mission Administrator";
      case "medical_officer":
        return "Flight Surgeon";
      case "mission_control":
        return "Mission Control Lead";
      case "astronaut":
      default:
        return `Astronaut (${user?.astronautId || "AST-001"})`;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020817] text-white">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-white/10 bg-[#07111f]/95 p-5 shrink-0 fixed top-0 bottom-0 left-0 z-40 backdrop-blur-md">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 p-1">
              <Image src="/logo.svg" alt="AstroGuard Logo" width={24} height={24} priority />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Astro<span className="text-blue-400">Guard</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/25"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="space-y-2">
          {user ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-blue-500/30 bg-slate-800">
                  <Image
                    src="/astronaut-avatar.png"
                    alt="User"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                  <p className="truncate text-[11px] text-blue-400 font-medium">
                    {formatRoleLabel(user.role)}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout Session</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#07111f]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
          {/* Mobile hamburger & brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2 font-bold text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 p-0.5">
                <Image src="/logo.svg" alt="AstroGuard Logo" width={20} height={20} priority />
              </div>
              <span className="text-white">Astro<span className="text-blue-400">Guard</span></span>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:flex items-center w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search metrics, telemetry, logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#020817]/70 py-1.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Right Header Status Bar */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/about"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Mission Info</span>
            </Link>

            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
            </div>

            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="relative h-7 w-7 rounded-full overflow-hidden border border-blue-500/40">
                  <Image src="/astronaut-avatar.png" alt="Avatar" fill className="object-cover" />
                </div>
                <div className="text-left leading-tight hidden lg:block">
                  <span className="text-[11px] font-semibold text-slate-200 block">{user.name}</span>
                  <span className="text-[10px] text-blue-400 font-mono block">{formatRoleLabel(user.role)}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/10 bg-[#07111f] p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout ({user.name})</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        )}

        {/* Page Children */}
        <main className="flex-1 pb-16 lg:pb-8">{children}</main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#07111f]/95 backdrop-blur-md px-2 py-1.5 flex justify-around items-center">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                  isActive ? "text-blue-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
