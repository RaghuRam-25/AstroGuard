"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Mic, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResponse, ChatMessage } from "@/lib/analysisChat";
import { generateAnalysisReply, LATEST_SNAPSHOT, speechTextFor } from "@/lib/analysisChat";
import { generateConsultationSummary, getAnalysisChatHistory, postAnalysisChat } from "@/lib/api";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useAuth } from "@/context/AuthContext";
import AnalysisMessage from "./AnalysisMessage";
import ChatInputBar from "./ChatInputBar";

const SEED_QUESTION = "Here is my latest health data. Am I okay?";

function buildSeedConversation(): ChatMessage[] {
  const analysis = generateAnalysisReply(SEED_QUESTION, LATEST_SNAPSHOT);
  analysis.id = "seed-analysis-1";
  return [
    {
      id: "seed-question",
      role: "user",
      text: SEED_QUESTION,
      createdAt: 1745841300000,
    },
    {
      id: "seed-answer",
      role: "assistant",
      text: "Based on your latest telemetry, here is what I found.",
      analysis,
      createdAt: 1745841350000,
    },
  ];
}

async function resolveReply(text: string, astronautId: string, voice = false): Promise<AnalysisResponse> {
  try {
    const res = await postAnalysisChat({
      astronautId: astronautId || "AST-001",
      question: text,
      latestData: LATEST_SNAPSHOT,
      voice,
    });
    if (res.success && res.data) {
      const payload = res.data as { response?: AnalysisResponse };
      if (payload.response) return payload.response;
    }
  } catch {
    // backend unreachable — demo fallback below
  }
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 400));
  return generateAnalysisReply(text, LATEST_SNAPSHOT);
}

export default function AnalysisPanel() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(buildSeedConversation);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const playback = useSpeechPlayback();
  const recorder = useVoiceRecorder();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const reportRequestedRef = useRef(false);

  useEffect(() => {
    let active = true;
    void getAnalysisChatHistory().then((res) => {
      if (!active || !res.success || !res.data) return;
      const persisted = (res.data as { messages?: Array<ChatMessage & { _id?: string }> }).messages;
      if (persisted?.length) setMessages(persisted.map((message) => ({ ...message, id: String(message._id || message.id || `history-${message.createdAt}`) })));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (messages.length <= 2) return;
    const requestHandover = () => {
      if (reportRequestedRef.current) return;
      reportRequestedRef.current = true;
      void generateConsultationSummary();
    };
    const idleTimer = window.setTimeout(requestHandover, 120000);
    window.addEventListener("pagehide", requestHandover);
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("pagehide", requestHandover);
    };
  }, [messages.length]);

  const pushAssistant = (
    text: string,
    analysis?: AnalysisResponse,
    voice = false
  ): ChatMessage => {
    return {
      id: `answer-${Date.now().toString(36)}`,
      role: "assistant",
      text,
      analysis,
      voice,
      createdAt: Date.now(),
    };
  };

  const sendMessage = async (raw: string, voice = false) => {
    const text = raw.trim();
    if (!text || busyRef.current) return;

    busyRef.current = true;
    reportRequestedRef.current = false;
    const userMessage: ChatMessage = {
      id: `ask-${Date.now().toString(36)}`,
      role: "user",
      text,
      voice,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    const reply = await resolveReply(text, user?.astronautId || "AST-001", voice);
    const assistantMessage = pushAssistant("Based on your latest telemetry, here is what I found.", reply, voice);

    setMessages((prev) => [...prev, assistantMessage]);
    setTyping(false);
    busyRef.current = false;

    if (playback.voiceMode) {
      window.setTimeout(() => {
        playback.speak(assistantMessage.id, speechTextFor(reply));
      }, 150);
    }
  };

  const handleVoiceStop = async () => {
    const transcript = await recorder.stop();
    const text =
      transcript && transcript.trim()
        ? transcript
        : "Voice message received. Analyze my latest health data.";
    await sendMessage(text, true);
  };

  const handleQuickQuestion = (text: string) => {
    void sendMessage(text);
  };

  return (
    <section className="glass-card flex h-[calc(100dvh-90px)] min-h-0 max-h-full flex-col overflow-hidden rounded-2xl lg:w-[calc(100%-24px)]">
      {/* Header */}
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sky-400/10 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <Brain className="h-5 w-5 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#061426] bg-success" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-bold text-white">AstroGuard AI Assistant</h2>
              <span className="flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-success">
                <span className="h-1 w-1 animate-pulse rounded-full bg-success" />
                Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Voice activity indicator */}
          <span
            className={cn(
              "hidden items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide sm:flex",
              recorder.listening ? "text-primary" : "text-slate-500"
            )}
          >
            <Mic className={cn("h-3.5 w-3.5", recorder.listening && "animate-pulse")} />
            {recorder.listening ? "Listening..." : "Voice inactive"}
          </span>

          {/* Voice mode toggle */}
          <button
            type="button"
            onClick={playback.toggleVoiceMode}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold transition-all",
              playback.voiceMode
                ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_rgba(56,189,248,0.25)]"
                : "border-sky-400/15 bg-card-secondary/40 text-slate-300 hover:border-primary/30 hover:text-white"
            )}
          >
            <Volume2 className="h-3.5 w-3.5" />
            Voice Mode
            <span
              className={cn(
                "relative h-4 w-7 rounded-full transition-colors",
                playback.voiceMode ? "bg-primary" : "bg-white/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all",
                  playback.voiceMode ? "left-3.5" : "left-0.5"
                )}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-5">
        {messages.map((message) => (
          <AnalysisMessage
            key={message.id}
            message={message}
            playback={playback}
            onQuickQuestion={handleQuickQuestion}
          />
        ))}

        {typing && (
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl border border-sky-400/10 bg-card-secondary/30 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:240ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input — fixed at bottom, never inside the scrollable area */}
      <div className="relative z-10 flex shrink-0 flex-col border-t border-sky-400/10 p-4 sm:px-5">
        <ChatInputBar
          value={input}
          onChange={setInput}
          onSend={() => void sendMessage(input)}
          onQuickQuestion={handleQuickQuestion}
          recorder={recorder}
          onVoiceStop={() => void handleVoiceStop()}
        />
      </div>
    </section>
  );
}
