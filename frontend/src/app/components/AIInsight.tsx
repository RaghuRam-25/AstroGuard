interface AIInsightProps {
  title?: string;
  message: string;
  confidence?: number;
  model?: string;
}

const AIInsight = ({
  title = "AI Health Insight",
  message,
  confidence = 95,
  model = "Personalized Isolation Forest",
}: AIInsightProps) => {
  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-6 backdrop-blur-sm shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-lg">
            🧠
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{title}</h3>
            <p className="text-xs text-blue-300/80">Automated Clinical Intelligence</p>
          </div>
        </div>

        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 border border-blue-400/20">
          Explainable AI
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-300 font-normal">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-4 text-xs text-slate-400">
        <div>
          <span>Model: </span>
          <span className="font-medium text-slate-200">{model}</span>
        </div>
        <div>
          <span>Confidence: </span>
          <span className="font-semibold text-emerald-400">{confidence}%</span>
        </div>
      </div>
    </div>
  );
};

export default AIInsight;