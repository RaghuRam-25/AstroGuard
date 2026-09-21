import { Radar } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge, { getSeverityTone } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { anomalyContributors } from "@/data/mockData";

const IMPACT_BAR: Record<string, string> = {
  Moderate: "bg-gradient-to-r from-primary to-cyan-400",
  Low: "bg-sky-500/70",
  Normal: "bg-success/80",
};

const IMPACT_CHANGE: Record<string, string> = {
  Moderate: "text-cyan-300",
  Low: "text-sky-400/80",
  Normal: "text-success",
};

export default function AnomalyAnalysis() {
  return (
    <Card
      icon={Radar}
      title="Anomaly Analysis"
      subtitle="Signals contributing to the current anomaly score."
      className="h-full"
      bodyClassName="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-4">
        {anomalyContributors.map((row) => (
          <div key={row.signal}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-300">{row.signal}</span>
              <span className="flex items-center gap-2">
                <span className={cn("text-xs font-bold", IMPACT_CHANGE[row.impact])}>
                  {row.change}
                </span>
                <StatusBadge label={row.impact} tone={getSeverityTone(row.impact)} />
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn("h-full rounded-full", IMPACT_BAR[row.impact])}
                style={{ width: `${row.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-auto border-t border-sky-400/10 pt-3 text-[11px] text-slate-500">
        Impact reflects each signal&apos;s contribution to the composite anomaly score.
      </p>
    </Card>
  );
}