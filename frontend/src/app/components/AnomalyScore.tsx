interface AnomalyScoreProps {
  score: number;
  confidence?: number;
  status?: string;
}

const AnomalyScore = ({
  score,
  confidence = 95,
  status = "Low",
}: AnomalyScoreProps) => {
  const isCritical = score >= 70;
  const isWarning = score >= 40 && score < 70;

  const colorClass = isCritical
    ? "text-red-400"
    : isWarning
    ? "text-amber-400"
    : "text-emerald-400";

  const barColor = isCritical
    ? "bg-gradient-to-r from-orange-500 to-red-500"
    : isWarning
    ? "bg-gradient-to-r from-yellow-500 to-amber-500"
    : "bg-gradient-to-r from-teal-500 to-emerald-400";

  const badgeBg = isCritical
    ? "bg-red-500/15 text-red-300 border-red-500/30"
    : isWarning
    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-sm shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            AI Anomaly Index
          </span>
          <p className="text-xs text-slate-500 mt-0.5">Multi-signal deviation risk</p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${badgeBg}`}
        >
          {status} Risk
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-5xl font-extrabold tracking-tight ${colorClass}`}>
          {score}
        </span>
        <span className="text-base font-medium text-slate-500">/ 100</span>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-[11px] font-medium text-slate-400">
          <span>0 (Optimal)</span>
          <span>50 (Moderate)</span>
          <span>100 (Critical)</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-400">
        <span>Model Confidence</span>
        <span className="font-semibold text-slate-200">{confidence}%</span>
      </div>
    </div>
  );
};

export default AnomalyScore;