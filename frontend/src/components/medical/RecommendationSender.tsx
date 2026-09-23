"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Check, Clock, Bot, Send, Sparkles } from "lucide-react";
import { getAstronautRecommendations, sendMedicalRecommendation } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { CrewMember, Recommendation, TriageLevel, triageFromRisk } from "./types";

interface Props {
  astronaut: CrewMember | null;
  aiSuggestion: string;
  suggestionKey: number;
  onPushed: (recommendation: Recommendation) => void;
}

const aiTemplates: Array<{ triage: TriageLevel[] | "all"; text: string }> = [
  {
    triage: "all",
    text: "Maintain your hydration cadence: 700ml with every bio-patch sync over the next 90-minute cycle.",
  },
  {
    triage: "all",
    text: "Stick to the planned rest block — a 45-minute in-cabin sleep window keeps your next EVA window on track.",
  },
  {
    triage: ["WARNING", "CRITICAL"],
    text: "Gently reduce exertion now: begin a guided breathing sequence and await a Flight Surgeon check-in.",
  },
  {
    triage: "all",
    text: "Balance your energy: schedule a 20-minute ARED countermeasure block before the next work shift.",
  },
];

function timeAgo(value?: string): string {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function RecommendationSender({ astronaut, aiSuggestion, suggestionKey, onPushed }: Props) {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Recommendation[]>([]);
  const [appliedKey, setAppliedKey] = useState(0);

  // Adjust local draft only once per new AI suggestion (pure render-time adjustment).
  if (aiSuggestion && suggestionKey > 0 && suggestionKey !== appliedKey) {
    setAppliedKey(suggestionKey);
    setDraft(aiSuggestion);
    setActiveChip(aiSuggestion);
  }

  const level = astronaut ? triageFromRisk(astronaut.latestAnalysis?.riskLevel) : "NOMINAL";
  const chips = useMemo(
    () => (astronaut ? aiTemplates.filter((item) => item.triage === "all" || item.triage.includes(level)).map((item) => item.text) : []),
    [astronaut, level]
  );

  const loadHistory = useCallback(async () => {
    if (!astronaut) return;
    const response = await getAstronautRecommendations(astronaut.astronautId);
    if (response.success) setHistory(((response.data as { recommendations?: Recommendation[] })?.recommendations || []).slice(0, 4));
  }, [astronaut]);

  useEffect(() => { void Promise.resolve().then(() => loadHistory()); }, [loadHistory]);

  const handleChip = (template: string) => {
    setDraft(template);
    setActiveChip(template);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!astronaut || !draft.trim() || sending) return;
    setSending(true);
    const isUrgent = draft.toLowerCase().includes("immediate") || draft.toLowerCase().includes("reduce exertion");
    const response = await sendMedicalRecommendation({
      astronautId: astronaut.astronautId,
      message: draft.trim(),
      source: activeChip ? "AI" : "Doctor",
      tone: isUrgent ? "urgent" : "calm",
      approvedByDoctor: activeChip ? user?.name : undefined,
    });
    setSending(false);
    if (response.success && response.data) {
      onPushed(response.data as Recommendation);
      setDraft("");
      setActiveChip(null);
      void Promise.resolve().then(() => loadHistory());
    }
  };

  return (
    <section className="flex flex-col rounded-2xl border border-emerald-400/20 bg-[#0a141f]/85 shadow-[0_0_30px_rgba(16,185,129,0.06)] backdrop-blur-xl">
      <div className="border-b border-emerald-400/10 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4 text-emerald-300" /> AI-Powered Recommendation Sender
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Push calm, actionable guidance straight to the astronaut&apos;s dashboard — zero alarm messaging.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 p-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              type="button"
              key={chip}
              onClick={() => handleChip(chip)}
              className={`flex max-w-full items-start gap-1.5 rounded-xl border px-2.5 py-2 text-left text-[10px] leading-relaxed transition ${activeChip === chip ? "border-emerald-400/50 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-emerald-400/30 hover:text-white"}`}
            >
              <Bot className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" />
              <span className="line-clamp-2">{chip}</span>
            </button>
          ))}
        </div>

        <textarea
          value={draft}
          onChange={(event) => { setDraft(event.target.value); setActiveChip(null); }}
          rows={3}
          placeholder={astronaut ? "Write calm surgeon guidance for the astronaut…" : "Select an assigned astronaut first"}
          disabled={!astronaut}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/40 disabled:opacity-40"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            {draft.trim() && (activeChip ? (
              <>
                <BrainCircuit className="h-3 w-3 text-emerald-300" />
                <span>
                  AI-calibrated · <span className="text-slate-300">approved by {user?.name || "you"}</span>
                </span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-cyan-300" />
                <span>Doctor-authored personal guidance</span>
              </>
            ))}
          </div>
          <button
            type="submit"
            disabled={!astronaut || !draft.trim() || sending}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-[#01261c] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" /> {sending ? "Pushing…" : "Push to Astronaut"}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="border-t border-white/5 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Recent guidance pushed</p>
          <div className="space-y-2">
            {history.map((rec) => (
              <div key={rec._id} className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] p-2.5">
                <span className={`mt-0.5 rounded-md border px-1.5 py-0.5 text-[8px] font-black tracking-wider ${rec.source === "AI" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"}`}>
                  {rec.source}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-300">{rec.message}</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[9px] text-slate-500">
                    {timeAgo(rec.createdAt)}
                    {rec.readAt ? (
                      <span className="flex items-center gap-1 text-emerald-300"><Check className="h-2.5 w-2.5" /> acknowledged</span>
                    ) : (
                      <span className="text-amber-300">awaiting read</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}