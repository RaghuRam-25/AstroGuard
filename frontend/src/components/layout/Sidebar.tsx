"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Radio,
  Brain,
  User,
  FlaskConical,
  Microscope,
  Satellite,
  MessageCircle,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { astronaut, missionInfo } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/astronaut/dashboard", label: "Health Dashboard", icon: LayoutDashboard },
  { href: "/astronaut/data-input", label: "Telemetry & RFID", icon: Radio },
  { href: "/astronaut/ai-analysis", label: "AI Analysis", icon: Brain },
  { href: "/astronaut/medical-consult", label: "Chat & Call", icon: MessageCircle },
  { href: "/astronaut/profile", label: "Profile", icon: User },
];

function AstroGuardLogo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M24 4L40 10V21.5C40 31.8 33.2 40.7 24 44C14.8 40.7 8 31.8 8 21.5V10L24 4Z"
        fill="#071A33"
        stroke="#38BDF8"
        strokeWidth="2"
      />
      <path
        d="M24 9L35 13V21C35 28.4 30.5 35.1 24 38C17.5 35.1 13 28.4 13 21V13L24 9Z"
        fill="#0B2A4A"
      />
      <circle cx="24" cy="20" r="7" fill="#0EA5E9" />
      <circle cx="24" cy="20" r="4.5" fill="#020817" />
      <path
        d="M21.5 17.5C22.4 16.7 23.6 16.3 24.8 16.5"
        stroke="#7DD3FC"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M17 31C17.8 26.8 20.2 24.5 24 24.5C27.8 24.5 30.2 26.8 31 31"
        stroke="#38BDF8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16 32H19L21 29L23 34L25.5 27.5L27 32H32"
        stroke="#22D3EE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AstroGuardLogoMark() {
  return <AstroGuardLogo />;
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = user?.name
    ? user.name
        .split(" ")
        .filter((w) => w.length > 0)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AM";

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#020817]/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[250px] shrink-0 flex-col border-r border-sky-400/10 transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          backgroundImage:
            "linear-gradient(to bottom, rgba(2, 8, 23, 0.95), rgba(4, 16, 31, 0.9)), url('/sidebarbg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-label="Main navigation"
      >
        {/* Header: Logo & Mobile Close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <Link
            href="/astronaut/dashboard"
            className="flex items-center gap-3"
            aria-label="AstroGuard home"
          >
            <AstroGuardLogo />
            <span className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white">
                Astro<span className="text-primary">Guard</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Astronaut Health
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-2 space-y-4 [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.2)_transparent]">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-sky-500/15 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.12)] border border-sky-400/20"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mission status card */}
          <div className="rounded-xl border border-sky-400/15 bg-card-secondary/40 p-3.5 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
              <Satellite className="h-3 w-3 text-primary" />
              Mission Status
            </p>
            <p className="mt-1.5 text-xs font-semibold text-white">
              {missionInfo.mission}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Day {missionInfo.missionDay}</span>
              <span className="flex items-center gap-1.5 font-semibold text-success">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Bottom: Astronaut Profile & Logout Button (ALWAYS VISIBLE) */}
        <div className="shrink-0 border-t border-sky-400/15 bg-[#020817]/95 px-4 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3 rounded-xl border border-sky-400/15 bg-slate-900/60 p-2.5">
            <div className="relative shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-gradient-to-br from-sky-500/25 to-cyan-400/10 text-xs font-bold text-sky-300">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#061426] bg-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user?.name || astronaut.name}
              </p>
              <p className="text-[10px] font-medium text-sky-400">
                {user?.astronautId || astronaut.id} • Astronaut
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void logout();
              onClose();
            }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-2.5 text-xs font-bold text-rose-200 transition-all duration-200 hover:border-rose-400/60 hover:bg-rose-500/25 hover:text-white shadow-[0_0_15px_rgba(244,63,94,0.15)] active:scale-[0.98]"
            title="Log out of session"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>Logout Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
