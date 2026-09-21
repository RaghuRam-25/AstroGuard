"use client";

import { usePathname } from "next/navigation";
import { Bell, Clock, Menu } from "lucide-react";
import { astronaut, missionInfo } from "@/data/mockData";

interface TopbarProps {
  onMenuClick: () => void;
}

const PAGE_HEADINGS: Record<string, { title: string; subtitle: string }> = {
  "/astronaut/health": {
    title: "My Health",
    subtitle: "Track your health metrics, trends and personal insights.",
  },
  "/astronaut/data-input": {
    title: "Data Input",
    subtitle: "Submit and record new health telemetry.",
  },
  "/astronaut/ai-analysis": {
    title: "AI Analysis",
    subtitle: "Explainable anomaly detection and insights.",
  },
  "/astronaut/alerts": {
    title: "My Alerts",
    subtitle: "Monitor important changes in your health signals.",
  },
  "/astronaut/profile": {
    title: "Profile",
    subtitle: "Your mission profile and personal details.",
  },
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const heading = PAGE_HEADINGS[pathname] ?? {
    title: "AstroGuard",
    subtitle: "Astronaut Health Intelligence",
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-sky-400/10 bg-background/80 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-white">
            {heading.title}
          </h1>
          <p className="truncate text-xs text-slate-400">{heading.subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-primary md:inline-block">
          {missionInfo.mission.toUpperCase()}
        </span>

        <div className="hidden items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 lg:flex">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <div className="leading-tight">
            <p className="text-[11px] font-semibold text-white">14:32 UTC</p>
            <p className="text-[10px] text-slate-400">Apr 28, 2025</p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-[#020817]">
            2
          </span>
        </button>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-400/30 bg-gradient-to-br from-sky-500/25 to-cyan-400/10 text-[11px] font-bold text-sky-300"
          aria-label={`${astronaut.name} avatar`}
        >
          AM
        </div>
      </div>
    </header>
  );
}