import { Brain, Quote, Sparkles } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { baselineComparison, aiHealthInsight } from "@/data/mockData";

export default function AIHealthInsight() {
  return (
    <Card
      icon={Brain}
      title="AI Health Insight"
      className="h-full overflow-hidden"
      action={
        <span className="flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-primary">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </span>
      }
    >
      <div className="flex h-full flex-col gap-5">
        <div className="relative rounded-xl border border-primary/15 bg-gradient-to-br from-sky-500/10 via-card-secondary/60 to-transparent p-4">
          <Quote className="absolute right-3 top-3 h-6 w-6 text-primary/15" />
          <p className="text-[13px] leading-relaxed text-slate-300">
            &ldquo;{aiHealthInsight.summary}&rdquo;
          </p>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2 border-b border-sky-400/10 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Signal
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Personal
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Mission
            </span>
          </div>
          <div className="divide-y divide-sky-400/[0.07]">
            {baselineComparison.map((row) => (
              <div key={row.label} className="grid grid-cols-3 gap-2 py-2.5">
                <span className="text-xs text-slate-300">{row.label}</span>
                <span className="text-xs font-semibold text-white">{row.personal}</span>
                <span className="text-xs font-semibold text-slate-200">{row.mission}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-auto text-[10px] italic text-slate-500">
          {aiHealthInsight.disclaimer}
        </p>
      </div>
    </Card>
  );
}