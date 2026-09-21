"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Activity } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { healthTrend } from "@/data/mockData";
import { cn } from "@/lib/utils";

const RANGES = ["24h", "7d", "30d"] as const;
type RangeKey = (typeof RANGES)[number];

const RANGE_LABELS: Record<RangeKey, string> = {
  "24h": "24 Hours",
  "7d": "7 Days",
  "30d": "30 Days",
};

const SERIES = [
  { key: "heartRate", name: "Heart Rate", color: "#FB7185", unit: "BPM" },
  { key: "spo2", name: "SpO₂", color: "#38BDF8", unit: "%" },
  { key: "activity", name: "Activity", color: "#22D3EE", unit: "%" },
];

interface TooltipEntry {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  stroke?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-primary/20 bg-[#071A2E]/95 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <p className="mb-2 text-xs font-semibold text-white">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.stroke ?? entry.color }}
            />
            <span className="text-slate-400">{entry.name}</span>
            <span className="ml-auto pl-4 font-semibold text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HealthOverviewChart() {
  const [range, setRange] = useState<RangeKey>("24h");
  const data = healthTrend[range];

  return (
    <Card
      icon={Activity}
      title="Health Overview"
      className="h-full"
      action={
        <div className="flex items-center gap-1 rounded-lg border border-sky-400/10 bg-background/40 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                range === r
                  ? "bg-primary/15 text-primary shadow-[0_0_14px_rgba(56,189,248,0.15)]"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
      }
      bodyClassName="pt-2"
    >
      {/* Legend */}
      <div className="mb-1 flex flex-wrap items-center justify-end gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </span>
        ))}
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 6, bottom: 4, left: -14 }}>
            <CartesianGrid
              stroke="rgba(148,163,184,0.08)"
              strokeDasharray="3 6"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              axisLine={{ stroke: "rgba(148,163,184,0.15)" }}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={6}
            />
            <YAxis
              yAxisId="left"
              domain={[30, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              width={40}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[92, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#475569", fontSize: 10 }}
              width={30}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "rgba(56,189,248,0.25)", strokeWidth: 1 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="heartRate"
              name="Heart Rate"
              stroke="#FB7185"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="activity"
              name="Activity"
              stroke="#22D3EE"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="spo2"
              name="SpO₂"
              stroke="#38BDF8"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}