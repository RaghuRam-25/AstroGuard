"use client";

import { Brain, Mic, Square, Volume2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/analysisChat";
import { speechTextFor } from "@/lib/analysisChat";
import AnalysisResponseCard from "./AnalysisResponseCard";
import type { PlaybackController } from "@/hooks/useSpeechPlayback";

interface AnalysisMessageProps {
  message: ChatMessage;
  playback: PlaybackController;
  onQuickQuestion: (text: string) => void;
}

export default function AnalysisMessage({ message, playback, onQuickQuestion }: AnalysisMessageProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[86%] rounded-2xl rounded-br-md bg-gradient-to-r from-primary/90 to-cyan-500/90 px-4 py-3 shadow-lg shadow-primary/20">
          <p className="text-sm font-medium leading-relaxed text-background">{message.text}</p>
        </div>
      </div>
    );
  }

  const hasAnalysis = Boolean(message.analysis);
  const analysis = message.analysis;
  const speechId = message.id;
  const isSpeaking = playback.isSpeaking(speechId);

  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 shadow-[0_0_18px_rgba(56,189,248,0.2)]">
        <Brain className="h-4 w-4 text-primary" />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-white">AstroGuard AI</p>
            <span className="flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success">
              <span className="h-1 w-1 rounded-full bg-success" />
              Online
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasAnalysis && playback.supported && analysis && (
              <button
                type="button"
                onClick={() =>
                  isSpeaking
                    ? playback.stop()
                    : playback.speak(speechId, speechTextFor(analysis))
                }
                title={isSpeaking ? "Stop voice playback" : "Play voice response"}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold transition-all",
                  isSpeaking
                    ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_14px_rgba(56,189,248,0.3)]"
                    : "border-sky-400/15 bg-card-secondary/40 text-slate-300 hover:border-primary/30 hover:text-white"
                )}
              >
                {isSpeaking ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                {isSpeaking ? "Stop" : "Play"}
              </button>
            )}
            {message.voice && (
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                <Mic className="h-3 w-3 text-primary" />
                Voice
              </span>
            )}
          </div>
        </div>

        {hasAnalysis && message.analysis ? (
          <AnalysisResponseCard analysis={message.analysis} />
        ) : (
          <div className="rounded-2xl border border-sky-400/10 bg-card-secondary/30 px-4 py-3">
            <p className="text-sm leading-relaxed text-slate-300">{message.text}</p>
          </div>
        )}

        {message.analysis?.followUps && message.analysis.followUps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.analysis.followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => onQuickQuestion(followUp)}
                className="flex items-center gap-1.5 rounded-full border border-sky-400/15 bg-card-secondary/40 px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-all hover:border-primary/30 hover:text-white"
              >
                <Sparkles className="h-3 w-3 text-primary" />
                {followUp}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}