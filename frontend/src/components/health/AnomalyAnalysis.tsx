import { Radar } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge from "@/components/shared/StatusBadge";
import { anomalyContributors } from "@/data/mockData";

const IMPACT_BAR: Record<string, string> = {
  Moderate: "from-sky-400 to-cyan-400",
  Low: "from-cyan-400/80 to-sky-400/80",
  Normal: "from-emerald-400/80 to-teal-400/80",
};

const IMPACT_TONE = {
  Moderate: "blue",
  Low: "cyan",
  Normal: "green",
} as const;

export default function AnomalyAnalysis() {
  return (
    <Card
      icon={Radar}
      title="Anomaly Analysis"
      subtitle="Signals contributing to the current anomaly score."
      className="h-full"
    >
      <div className="flex flex-col gap-5">
        {anomalyContributors.map((row) => (
          <div key={row.signal}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-200">{row.signal}</span>
              <div className="flex items-center gap-3">
                <span
                  className={
                    row.change.startsWith("+") ? "text-xs font-semibold text-success" : "text-xs font-semibold text-warning"
                  }
                >
                  {row.change}
                </span>
                <StatusBadge label={row.impact} tone={IMPACT_TONE[row.impact] ?? "blue"} />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sky-400/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${IMPACT_BAR[row.impact] ?? IMPACT_BAR.Moderate}`}
                style={{ width: `${Math.min(row.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}

        <div className="rounded-lg border border-sky-400/10 bg-sky-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-slate-400">
          Contribution percentages represent the relative weight of each signal in the computed
          anomaly score.
        </div>
      </div>
    </Card>
  );
}