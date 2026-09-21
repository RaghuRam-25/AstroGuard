"use client";

import { ShieldCheck, Gauge, Brain } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { anomalyData } from "@/data/mockData";

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const FRACTION = anomalyData.score / anomalyData.maxScore;

export default function AnomalyScore() {
  return (
    <Card
      title="AI Anomaly Score"
      subtitle={anomalyData.description}
      className="h-full"
      bodyClassName="flex flex-col gap-4 p-4"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Circular ring */}
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
              strokeDashoffset={CIRCUMFERENCE * (1 - FRACTION)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span className="text-4xl font-bold tracking-tight text-white">
              {anomalyData.score}
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              / {anomalyData.maxScore}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2">
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Status
            </span>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">
              {anomalyData.status} RISK
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2">
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <Gauge className="h-3.5 w-3.5 text-cyan-300" />
              Confidence
            </span>
            <span className="text-sm font-bold text-white">{anomalyData.confidence}%</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2">
            <span className="flex items-center gap-2 text-[11px] text-slate-400">
              <Brain className="h-3.5 w-3.5 text-indigo-300" />
              Model
            </span>
            <span className="text-sm font-semibold text-slate-200">{anomalyData.model}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}