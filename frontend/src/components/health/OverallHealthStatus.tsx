"use client";

import { useId } from "react";
import { Heart, ShieldCheck } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge from "@/components/shared/StatusBadge";
import { healthOverviewStatus } from "@/data/mockData";

const SIZE = 150;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function OverallHealthStatus() {
  const gradientId = useId().replace(/:/g, "");

  return (
    <Card icon={ShieldCheck} title="Overall Health Status" className="h-full">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(148,163,184,0.1)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * 0.1}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-success/25 bg-success/10">
              <Heart className="h-5 w-5 text-success" fill="currentColor" />
            </span>
            <span className="mt-2 text-sm font-bold tracking-[0.18em] text-success">
              HEALTHY
            </span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
          All monitored signals are within the expected range.
        </p>

        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          {healthOverviewStatus.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3 py-2"
            >
              <span className="truncate text-[11px] font-medium text-slate-300">{row.label}</span>
              <StatusBadge
                label={row.status}
                tone={row.dot === "success" ? "green" : "blue"}
                dot
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}