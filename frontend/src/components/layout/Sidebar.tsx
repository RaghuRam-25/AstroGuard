"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  MessageCircle,
  Radio,
  X,
  LogOut,
  User,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { astronaut } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import SidebarSpacewalkBackground from "./SidebarSpacewalkBackground";

const navItems = [
  { href: "/astronaut/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/astronaut/ai-analysis", label: "AI Analysis", icon: Brain },
  { href: "/astronaut/medical-consult", label: "Medical Consult", icon: MessageCircle },
  { href: "/astronaut/bio-link", label: "Bio-Link", icon: Radio },
];

function AstroGuardLogo() {
  return (
    <svg
      width="36"
      height="36"
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
    pathname === href || (href !== "/astronaut/dashboard" && pathname.startsWith(href));

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
          "fixed inset-y-0 left-0 z-50 flex w-[240px] shrink-0 flex-col overflow-hidden border-r border-sky-400/20 bg-[#020712]/30 backdrop-blur-sm transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {/* Full-Height Spacewalk Floating Astronaut & Satellite Animation Background */}
        <SidebarSpacewalkBackground />

        {/* Header: Logo & Mobile Close */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-4 shrink-0 border-b border-white/[0.12] bg-[#020814]/50 backdrop-blur-md">
          <Link
            href="/astronaut/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
            aria-label="AstroGuard home"
          >
            <AstroGuardLogo />
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white drop-shadow">
                Astro<span className="text-cyan-300">Guard</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
                Astronaut Portal
              </span>
            </div>
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

        {/* Primary 3-Item Navigation */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-3.5 py-5 space-y-2 [scrollbar-width:none]">
          <nav className="flex flex-col gap-2">
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
                    "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all duration-150 backdrop-blur-md shadow-md",
                    active
                      ? "bg-cyan-500/90 text-[#021127] font-bold shadow-lg shadow-cyan-500/30 border border-cyan-300"
                      : "bg-[#020712]/60 text-slate-100 hover:bg-sky-500/30 hover:text-white border border-white/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-[#021127]" : "text-cyan-300 group-hover:text-white"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Fixed Bottom: Astronaut Profile Summary, Profile Access, & Logout */}
        <div className="relative z-10 shrink-0 border-t border-white/[0.08] bg-[#020710]/80 backdrop-blur-xl p-3 space-y-2">
          <Link
            href="/astronaut/profile"
            onClick={onClose}
            className="group flex items-center justify-between rounded-xl border border-white/[0.08] bg-slate-900/60 p-2.5 transition hover:bg-slate-900/90 hover:border-sky-400/30"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/25 text-xs font-bold text-sky-200 border border-sky-400/40 shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-semibold text-white group-hover:text-sky-300 transition">
                  {user?.name || astronaut.name}
                </p>
                <p className="text-[10px] text-slate-300 truncate">
                  {user?.astronautId || astronaut.id} · Astronaut
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-sky-400 transition shrink-0" />
          </Link>

          <button
            type="button"
            onClick={() => {
              void logout();
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/15 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/25 active:scale-[0.98]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
