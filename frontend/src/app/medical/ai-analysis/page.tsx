"use client";

import { Sparkles } from "lucide-react";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";
import LatestDataSummary from "@/components/analysis/LatestDataSummary";
import AnalysisHistoryCard from "@/components/analysis/AnalysisHistoryCard";
import MissionInformation from "@/components/health/MissionInformation";
import { aiHealthInsight } from "@/data/mockData";

export default function AstronautAiAnalysisPage() {
  return (
    <div className="flex h-full max-h-full min-h-0 animate-fade-in flex-col gap-5 lg:flex-row lg:overflow-hidden">
      <SpaceBackdrop />

      {/* AI chat workspace — fixed inside viewport, internal scroll only */}
      <div className="flex min-h-0 flex-col lg:max-h-full lg:flex-[8] lg:overflow-hidden">
        <AnalysisPanel />
      </div>

      {/* Right supporting panel — own internal scroll only */}
      <div className="flex min-h-0 flex-col gap-5 lg:max-h-full lg:flex-[4] lg:overflow-y-auto lg:pr-1">
        <LatestDataSummary />

          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-white">AI Health Insight</h3>
            </div>
            <p className="mt-3.5 text-xs leading-relaxed text-slate-300">
              {aiHealthInsight.summary}
            </p>
            <p className="mt-3 rounded-xl border border-sky-400/10 bg-card-secondary/30 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
              {aiHealthInsight.disclaimer}
            </p>
          </section>

          <AnalysisHistoryCard />

          <MissionInformation />
      </div>
    </div>
  );
}

function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -right-40 -top-44 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.09),transparent_65%)] blur-2xl" />
      <div className="absolute -bottom-80 -left-44 h-[44rem] w-[56rem] rounded-full bg-[radial-gradient(circle_at_45%_15%,rgba(56,189,248,0.18),rgba(14,165,233,0.10)_40%,transparent_72%)] blur-md" />
      <div className="absolute -bottom-44 -left-24 h-80 w-[48rem] rounded-[50%] border border-t-2 border-sky-400/10" />
      <div className="absolute -bottom-32 -left-16 h-56 w-[44rem] rounded-[50%] border border-sky-400/[0.07]" />
      <span className="absolute left-[16%] top-[20%] h-1 w-1 rounded-full bg-white/30" />
      <span className="absolute left-[30%] top-[10%] h-0.5 w-0.5 rounded-full bg-white/40" />
      <span className="absolute left-[24%] top-[64%] h-0.5 w-0.5 rounded-full bg-white/25" />
      <span className="absolute left-[42%] top-[8%] h-1 w-1 rounded-full bg-cyan-300/30" />
      <span className="absolute right-[18%] top-[18%] h-0.5 w-0.5 rounded-full bg-white/30" />
      <span className="absolute right-[32%] top-[6%] h-1 w-1 rounded-full bg-white/25" />
      <span className="absolute bottom-[30%] left-[52%] h-0.5 w-0.5 rounded-full bg-white/20" />
      <span className="absolute bottom-[14%] left-[68%] h-1 w-1 rounded-full bg-cyan-300/25" />
    </div>
  );
}