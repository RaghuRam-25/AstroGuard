"use client";

import { Mic, Send, X, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoiceRecorder } from "@/hooks/useVoiceRecorder";

export const QUICK_ACTIONS = [
  "Analyze my latest data",
  "Why is my heart rate elevated?",
  "How can I improve my sleep?",
  "What do my trends show?",
];

interface ChatInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onQuickQuestion: (text: string) => void;
  recorder: VoiceRecorder;
  onVoiceStop: () => void;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ChatInputBar({
  value,
  onChange,
  onSend,
  onQuickQuestion,
  recorder,
  onVoiceStop,
}: ChatInputBarProps) {
  return (
    <div className="space-y-3">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action, i) => (
          <button
            key={action}
            type="button"
            onClick={() => onQuickQuestion(action)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all",
              i === 0
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-sky-400/15 bg-card-secondary/40 text-slate-300 hover:border-primary/30 hover:text-white"
            )}
          >
            {i === 0 && <Sparkles className="h-3 w-3" />}
            {action}
          </button>
        ))}
      </div>

      {/* Recording state */}
      {recorder.listening ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-3">
          <div className="flex h-8 items-center gap-[3px]">
            {recorder.waveform.map((height, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-primary to-cyan-400 transition-all duration-100"
                style={{ height: `${Math.max(6, Math.min(32, height))}px` }}
              />
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-bold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Listening...
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
              {formatDuration(recorder.duration)}
              {recorder.transcript ? " · signal captured" : " · speak now"}
            </p>
          </div>
          <button
            type="button"
            onClick={recorder.cancel}
            title="Cancel recording"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-400/15 bg-card-secondary/40 text-slate-300 transition-all hover:border-danger/30 hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onVoiceStop}
            title="Stop and send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-background shadow-lg shadow-primary/30 transition-all hover:brightness-110"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-sky-400/15 bg-background/60 p-2">
          <button
            type="button"
            onClick={() => void recorder.start()}
            title={recorder.supported ? "Talk to AI" : "Voice input requires microphone access"}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-background shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-95"
          >
            <Mic className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) onSend();
            }}
            placeholder="Ask about your health, symptoms or latest data..."
            className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim()}
            title="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-500 text-background transition-all hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {recorder.error && (
        <p className="text-center text-[11px] text-amber-400">{recorder.error}</p>
      )}
    </div>
  );
}