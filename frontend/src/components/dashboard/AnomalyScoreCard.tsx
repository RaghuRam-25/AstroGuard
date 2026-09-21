"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Gauge, Brain, Radar } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge from "@/components/shared/StatusBadge";
import { anomalyData } from "@/data/mockData";

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AnomalyScoreCard() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setProgress(anomalyData.score / anomalyData.maxScore), 120);
    return () => window.clearTimeout(t);
  }, []);

  const score = anomalyData.score;

  return (
    <Card title="AI Anomaly Score" className="h-full" bodyClassName="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        {/* Ring */}
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
            <defs>
              <linearGradient id="anomalyRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#22D3EE" />
              </linearGradient>
            </defs>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="rgba(148,163,184,0.12)"
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="url(#anomalyRingGradient)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-tight text-white">{score}</span>
            <span className="mt-0.5 text-[11px] font-medium text-slate-400">
              / {anomalyData.maxScore}
            </span>
            <span className="mt-3 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[10px] font-bold tracking-[0.16em] text-primary">
              LOW RISK
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="w-full flex-1 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Status
            </span>
            <StatusBadge label={anomalyData.status} tone="blue" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <Gauge className="h-4 w-4 text-cyan-300" />
              Confidence
            </span>
            <span className="text-sm font-bold text-white">{anomalyData.confidence}%</span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3">
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <Brain className="h-4 w-4 text-indigo-300" />
              Model
            </span>
            <span className="text-sm font-semibold text-slate-200">{anomalyData.model}</span>
          </div>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-sky-400/10 bg-sky-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-400">
        <Radar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        {anomalyData.description}
      </p>
    </Card>
  );
}