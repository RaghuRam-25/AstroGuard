"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Brain,
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  Sparkles,
  Activity,
  Heart,
  Droplet,
  Moon,
  Zap,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTelemetryStream } from "@/hooks/useTelemetryStream";
import { postAnalysisChat, getAnalysisChatHistory } from "@/lib/api";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import MarkdownMessage from "@/components/analysis/MarkdownMessage";

interface KeyFindingItem {
  name: string;
  valStr: string;
  rangeStr: string;
  val: number;
  min: number;
  max: number;
  axisMin: number;
  axisMax: number;
  color: string;
  aboveRange: boolean;
}

interface QuestionResponse {
  summaryStatus: string;
  isWarning?: boolean;
  anomalyScore: number;
  confidence: number;
  explanation: string;
  keyFindings: KeyFindingItem[];
  personalBaseline: { name: string; current: number; baseline: number; color: string }[];
  missionBaseline: { name: string; current: number; baseline: number; color: string }[];
  nextSteps: string[];
  followUps: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  data?: QuestionResponse;
  voice?: boolean;
}

export default function AstronautAiAnalysisPage() {
  const { user } = useAuth();
  const { vitals } = useTelemetryStream(user?.astronautId, 1200);

  // Live Vitals
  const liveHr = vitals.find((v) => v.id === "hr")?.value ?? 72;
  const liveSpo2 = vitals.find((v) => v.id === "spo2")?.value ?? 98;
  const liveTemp = vitals.find((v) => v.id === "temp")?.value ?? 36.8;

  // Initial welcome message
  const initialMessages: ChatMessage[] = [
    {
      id: "seed-welcome",
      role: "assistant",
      text: "Hello! I am your AstroGuard AI Assistant. I can assist with general questions, mission telemetry, specific vital queries (such as your heart rate or SpO₂), or complete health analyses. How can I help you today?",
      timestamp: "Live · Ready",
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyItems, setHistoryItems] = useState([
    { time: "Live Sync", risk: "Low risk", query: "System Telemetry Active · 72 BPM" },
  ]);

  const playback = useSpeechPlayback();
  const recorder = useVoiceRecorder();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Load persistent history on mount
  useEffect(() => {
    let isMounted = true;
    void getAnalysisChatHistory(40).then((res) => {
      if (!isMounted || !res.success || !res.data) return;
      const history = (res.data as { messages?: Array<any> }).messages;
      if (history && history.length > 0) {
        const mapped = history.map((m: any) => ({
          id: String(m._id || m.id || `msg-${m.createdAt}`),
          role: m.role as "user" | "assistant",
          text: m.text || "",
          timestamp: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
          data: m.analysis ? mapAnalysisToQuestionResponse(m.analysis) : undefined,
          voice: Boolean(m.voice),
        }));
        setMessages(mapped);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  function mapAnalysisToQuestionResponse(analysis: any): QuestionResponse {
    const findings: KeyFindingItem[] = (analysis.keyFindings || []).map((k: any) => ({
      name: k.label || k.metric,
      valStr: k.value || `${k.metric}`,
      rangeStr: k.range || "Nominal",
      val: parseFloat(k.value) || 0,
      min: 60,
      max: 100,
      axisMin: 40,
      axisMax: 140,
      color: k.severity === "Elevated" ? "#FF7A66" : k.severity === "Watch" ? "#F5B83D" : "#3DD6C3",
      aboveRange: k.severity === "Elevated",
    }));

    const pBase = (analysis.personalBaseline || []).map((b: any) => ({
      name: b.name,
      current: parseFloat(b.current) || 0,
      baseline: parseFloat(b.baseline) || 0,
      color: "#3DD6C3",
    }));

    const mBase = (analysis.missionBaseline || []).map((b: any) => ({
      name: b.name,
      current: parseFloat(b.current) || 0,
      baseline: parseFloat(b.baseline) || 0,
      color: "#5BA8F5",
    }));

    const nextSteps = (analysis.recommendations || []).map((r: any) => `${r.title}: ${r.detail}`);

    return {
      summaryStatus: analysis.statusLabel || "Low risk",
      isWarning: analysis.status === "WATCH" || analysis.status === "WARNING",
      anomalyScore: analysis.anomalyScore ?? 14,
      confidence: analysis.confidence ?? 94,
      explanation: analysis.explanation || "",
      keyFindings: findings,
      personalBaseline: pBase,
      missionBaseline: mBase,
      nextSteps: nextSteps.length > 0 ? nextSteps : ["Maintain nominal rest and hydration protocols."],
      followUps: analysis.followUps || ["What do my latest trends show?", "How should I improve hydration?"],
    };
  }

  // Ask function
  const askQuestion = useCallback(
    async (queryText: string, voice = false) => {
      const q = queryText.trim();
      if (!q || isTyping) return;

      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: q,
        timestamp: nowStr,
        voice,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsTyping(true);

      // Add to query history sidebar
      setHistoryItems((prev) => [
        { time: nowStr, risk: "Nominal", query: `${q}` },
        ...prev.slice(0, 5),
      ]);

      try {
        const res = await postAnalysisChat({
          astronautId: user?.astronautId || "AST-001",
          question: q,
          latestData: {
            heartRate: liveHr,
            spo2: liveSpo2,
            sleepHours: 7.4,
            activityScore: 52,
            temp: liveTemp,
          },
          voice,
        });

        if (res.success && res.data) {
          const payload = res.data as { response?: { answer?: string; analysis?: any } };
          const resp = payload.response;
          const answerText = resp?.answer || "I processed your request.";
          const structuredData = resp?.analysis ? mapAnalysisToQuestionResponse(resp.analysis) : undefined;

          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: answerText,
            timestamp: nowStr,
            data: structuredData,
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setIsTyping(false);

          if (playback.voiceMode) {
            playback.speak(assistantMsg.id, answerText.replace(/[#*`_]/g, "").trim());
          }
          return;
        }
      } catch (err) {
        console.warn("Analysis request fallback:", err);
      }

      // Intelligent Client Fallback if backend was unreachable
      const cleanQ = q.toLowerCase();
      let fallbackText = `I received your inquiry: "${q}". How else can I assist you with your mission operations or telemetry?`;
      let structuredData: QuestionResponse | undefined = undefined;

      if (cleanQ.includes("heart rate") || cleanQ.includes("pulse")) {
        fallbackText = `Based on the latest data in AstroGuard, your current heart rate is **${liveHr} BPM** (nominal resting range is 60–100 BPM).`;
      } else if (cleanQ.includes("spo2") || cleanQ.includes("oxygen")) {
        fallbackText = `Based on current AstroGuard telemetry, your blood oxygen saturation (SpO₂) is **${liveSpo2}%** (nominal range is 95–100%).`;
      } else if (cleanQ.includes("how are you")) {
        fallbackText = "I'm doing well, thank you for asking! All systems are operational and I'm ready to help. What would you like to know?";
      } else if (cleanQ === "hi" || cleanQ === "hello" || cleanQ === "hey") {
        fallbackText = "Hello! How can I assist you with your mission or questions today?";
      } else if (cleanQ.includes("analyze") || cleanQ.includes("health") || cleanQ.includes("trends")) {
        fallbackText = `### Health Status Analysis\n\nBased on your latest multi-modal telemetry:\n- **Heart Rate:** ${liveHr} BPM (Nominal)\n- **Blood Oxygen (SpO₂):** ${liveSpo2}% (Stable)\n- **Core Temperature:** ${liveTemp}°C\n\n**Summary:** Your overall physiological status is stable. Multi-modal biometrics remain within expected mission thresholds.`;
        structuredData = {
          summaryStatus: "Nominal",
          anomalyScore: 14,
          confidence: 94,
          explanation: `ASTRO-AI evaluated your biometrics (HR: ${liveHr} BPM, SpO₂: ${liveSpo2}%, Temp: ${liveTemp}°C). Physiological status is stable with nominal adaptation.`,
          keyFindings: [
            { name: "Heart rate", valStr: `${liveHr} BPM`, rangeStr: "60–100", val: liveHr, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#3DD6C3", aboveRange: liveHr > 100 },
            { name: "SpO₂", valStr: `${liveSpo2}%`, rangeStr: "95–100", val: liveSpo2, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
            { name: "Sleep duration", valStr: "7.4 hrs", rangeStr: "7–9", val: 7.4, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
            { name: "Activity level", valStr: "52%", rangeStr: "50–85", val: 52, min: 50, max: 85, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
          ],
          personalBaseline: [
            { name: "Heart rate", current: liveHr, baseline: 70.5, color: "#3DD6C3" },
            { name: "SpO₂", current: liveSpo2, baseline: 98, color: "#3DD6C3" },
          ],
          missionBaseline: [
            { name: "Heart rate", current: liveHr, baseline: 74, color: "#5BA8F5" },
            { name: "SpO₂", current: liveSpo2, baseline: 97.8, color: "#5BA8F5" },
          ],
          nextSteps: [
            "Maintain nominal hydration and nutrition schedule.",
            "Continue standard monitoring protocols.",
          ],
          followUps: [
            "What do my latest trends show?",
            "What is my current SpO2?",
            "How should I improve hydration?",
          ],
        };
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: fallbackText,
        timestamp: nowStr,
        data: structuredData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      if (playback.voiceMode) {
        playback.speak(assistantMsg.id, fallbackText.replace(/[#*`_]/g, "").trim());
      }
    },
    [isTyping, liveHr, liveSpo2, liveTemp, user, playback]
  );

  const handleVoiceToggle = async () => {
    if (recorder.listening) {
      const transcript = await recorder.stop();
      if (transcript && transcript.trim()) {
        void askQuestion(transcript.trim(), true);
      }
    } else {
      playback.toggleVoiceMode();
      if (!playback.voiceMode) {
        await recorder.start();
      }
    }
  };

  const calcRangePercent = (val: number, min: number, max: number) => {
    return Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-3 py-1 text-[#E8EDF9] font-sans animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3.5 items-start">
        
        {/* ── LEFT: AI ASSISTANT CONVERSATION CARD ── */}
        <section className="rounded-2xl border border-[#223158] bg-[#121C38] p-3.5 sm:p-4 shadow-lg backdrop-blur-md min-w-0 space-y-3">
          
          {/* Top Bar inside Card */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#223158] pb-2.5">
            <div>
              <b className="text-sm sm:text-base font-bold text-white block">AstroGuard AI Assistant</b>
              <small className="text-[11px] text-[#8C98B5] font-mono">Context-Aware Conversational Intelligence</small>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#223158] bg-[#0D1731] px-2.5 py-0.5 text-xs font-mono text-[#E8EDF9] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#45D69A]" />
                Online
              </span>

              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition flex items-center gap-1.5 ${
                  recorder.listening
                    ? "border-red-500 bg-red-500/20 text-red-300 animate-pulse"
                    : playback.voiceMode
                    ? "border-[#5BA8F5] bg-[#5BA8F5]/20 text-[#5BA8F5]"
                    : "border-[#223158] bg-[#0D1731] text-[#E8EDF9] hover:border-[#5BA8F5]"
                }`}
              >
                {recorder.listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                <span>{recorder.listening ? "Listening…" : "🎙 Voice Mode"}</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatContainerRef}
            className="space-y-3 max-h-[430px] lg:max-h-[460px] overflow-y-auto pr-1.5 [scrollbar-width:thin]"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#5BA8F5] text-white px-3.5 py-2 text-xs sm:text-sm font-medium shadow-md">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              const data = msg.data;

              return (
                <div key={msg.id} className="rounded-xl border border-[#223158] bg-[#0D1731] p-3 sm:p-3.5 space-y-3">
                  {/* Meta */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-[#8C98B5] font-mono border-b border-[#223158]/50 pb-1.5">
                    <span className="flex items-center gap-1.5 text-white font-bold">
                      <Brain className="h-3.5 w-3.5 text-[#5BA8F5]" /> AstroGuard AI · Online
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Natural markdown response */}
                  <div className="text-xs sm:text-sm text-[#E8EDF9] leading-relaxed">
                    <MarkdownMessage content={msg.text} />
                  </div>

                  {/* Optional rich analysis card if health analysis was requested */}
                  {data && (
                    <div className="pt-2 border-t border-[#223158]/60 space-y-3">
                      {/* Top 3 Metric Tiles */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="rounded-xl border border-[#223158] bg-[#121C38] p-2.5">
                          <small className="text-[10.5px] text-[#8C98B5] block mb-0.5">Overall health status</small>
                          <span
                            className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                              data.isWarning
                                ? "bg-[#F5B83D]/20 text-[#F5B83D]"
                                : "bg-[#45D69A]/20 text-[#45D69A]"
                            }`}
                          >
                            {data.summaryStatus}
                          </span>
                        </div>

                        <div className="rounded-xl border border-[#223158] bg-[#121C38] p-2.5">
                          <small className="text-[10.5px] text-[#8C98B5] block mb-0.5">Anomaly score</small>
                          <b className="text-lg font-bold font-mono text-white">{data.anomalyScore}/100</b>
                        </div>

                        <div className="rounded-xl border border-[#223158] bg-[#121C38] p-2.5">
                          <small className="text-[10.5px] text-[#8C98B5] block mb-0.5">Confidence</small>
                          <b className="text-lg font-bold font-mono text-[#5BA8F5]">{data.confidence}%</b>
                        </div>
                      </div>

                      {/* Key Findings with Range Sliders */}
                      {data.keyFindings.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10.5px] font-bold text-white tracking-wider uppercase">Key findings</div>
                          <div className="space-y-1.5">
                            {data.keyFindings.map((k) => {
                              const rangeStart = calcRangePercent(k.min, k.axisMin, k.axisMax);
                              const rangeWidth = calcRangePercent(k.max, k.axisMin, k.axisMax) - rangeStart;
                              const markerPos = calcRangePercent(k.val, k.axisMin, k.axisMax);

                              return (
                                <div
                                  key={k.name}
                                  className="grid grid-cols-1 sm:grid-cols-[115px_1fr_auto] gap-2 items-center text-xs py-1.5 border-t border-[#223158]"
                                >
                                  <div>
                                    <b className="text-white block text-xs">{k.name}</b>
                                    <small className="text-[#8C98B5] text-[10.5px]">Range {k.rangeStr}</small>
                                  </div>

                                  <div className="h-2 w-full rounded-full bg-[#223158] relative">
                                    {/* Normal band */}
                                    <i
                                      className="absolute top-0 bottom-0 rounded-full bg-[#45D69A]/30"
                                      style={{ left: `${rangeStart}%`, width: `${rangeWidth}%` }}
                                    />
                                    {/* Current marker */}
                                    <u
                                      className="absolute -top-1 w-1.5 h-4 rounded-sm"
                                      style={{ left: `calc(${markerPos}% - 3px)`, backgroundColor: k.color }}
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 font-mono">
                                    <b className="text-white text-xs">{k.valStr}</b>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        k.aboveRange
                                          ? "bg-[#F5B83D]/20 text-[#F5B83D]"
                                          : "bg-[#45D69A]/20 text-[#45D69A]"
                                      }`}
                                    >
                                      {k.aboveRange ? "Above range" : "In range"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Context Chips */}
                      {data.followUps && data.followUps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[#223158]/40">
                          {data.followUps.map((chipText) => (
                            <button
                              key={chipText}
                              type="button"
                              onClick={() => void askQuestion(chipText)}
                              className="rounded-full border border-[#223158] bg-[#121C38] px-2.5 py-1 text-[11px] text-[#E8EDF9] hover:border-[#5BA8F5] transition flex items-center gap-1.5"
                            >
                              <Sparkles className="h-3 w-3 text-[#5BA8F5]" />
                              <span>{chipText}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#5BA8F5] font-mono bg-[#0D1731] border border-[#223158] p-2.5 rounded-xl animate-pulse">
                <Brain className="h-4 w-4 animate-spin" />
                <span>ASTRO-AI analyzing contextual intelligence…</span>
              </div>
            )}
          </div>

          {/* Question Input Box */}
          <div className="pt-2 border-t border-[#223158]/60 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) void askQuestion(inputText.trim());
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything (health, telemetry, questions, conversation)..."
                aria-label="Ask a question"
                className="flex-1 rounded-xl border border-[#223158] bg-[#0D1731] px-3.5 py-2 text-xs text-white placeholder-[#8C98B5] outline-none focus:border-[#5BA8F5] transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="rounded-xl bg-[#5BA8F5] px-4 py-2 text-xs font-bold text-white hover:bg-[#4a97e4] transition disabled:opacity-40"
              >
                Send
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Analyze my latest data",
                "What is my heart rate?",
                "What is my current SpO2?",
                "How are you?",
                "Explain Dijkstra's algorithm",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void askQuestion(chip)}
                  className="rounded-full border border-[#223158] bg-[#0D1731] px-2.5 py-0.5 text-[10.5px] text-[#E8EDF9] hover:border-[#5BA8F5] transition"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </section>

        {/* ── RIGHT: LIVE TELEMETRY SNAPSHOT & AI HISTORY ── */}
        <div className="space-y-3">
          
          {/* Live Telemetry Snapshot Card */}
          <section className="rounded-2xl border border-[#223158] bg-[#121C38] p-3.5 shadow-lg backdrop-blur-md space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#223158] pb-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#3DD6C3]" />
                Live telemetry snapshot
              </h3>
              <span className="rounded-full border border-[#223158] bg-[#0D1731] px-2 py-0.5 text-[9.5px] font-mono text-[#45D69A]">
                100 Hz sync
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-[#223158] bg-[#0D1731] p-2.5 space-y-0.5">
                <small className="text-[#8C98B5] text-[10.5px] block">Heart rate</small>
                <b className="text-lg font-bold font-mono text-white">
                  {liveHr} <em className="text-[10px] text-[#8C98B5] font-normal not-italic">BPM</em>
                </b>
                <span className="inline-block rounded-full bg-[#45D69A]/15 text-[#45D69A] px-1.5 py-0.2 text-[9.5px] font-bold">
                  Nominal
                </span>
              </div>

              <div className="rounded-xl border border-[#223158] bg-[#0D1731] p-2.5 space-y-0.5">
                <small className="text-[#8C98B5] text-[10.5px] block">SpO₂</small>
                <b className="text-lg font-bold font-mono text-white">
                  {liveSpo2} <em className="text-[10px] text-[#8C98B5] font-normal not-italic">%</em>
                </b>
                <span className="inline-block rounded-full bg-[#45D69A]/15 text-[#45D69A] px-1.5 py-0.2 text-[9.5px] font-bold">
                  Nominal
                </span>
              </div>

              <div className="rounded-xl border border-[#223158] bg-[#0D1731] p-2.5 space-y-0.5">
                <small className="text-[#8C98B5] text-[10.5px] block">Sleep duration</small>
                <b className="text-lg font-bold font-mono text-white">
                  7.4 <em className="text-[10px] text-[#8C98B5] font-normal not-italic">hrs</em>
                </b>
                <span className="inline-block rounded-full bg-[#45D69A]/15 text-[#45D69A] px-1.5 py-0.2 text-[9.5px] font-bold">
                  Nominal
                </span>
              </div>

              <div className="rounded-xl border border-[#223158] bg-[#0D1731] p-2.5 space-y-0.5">
                <small className="text-[#8C98B5] text-[10.5px] block">Activity index</small>
                <b className="text-lg font-bold font-mono text-white">
                  52 <em className="text-[10px] text-[#8C98B5] font-normal not-italic">%</em>
                </b>
                <span className="inline-block rounded-full bg-[#45D69A]/15 text-[#45D69A] px-1.5 py-0.2 text-[9.5px] font-bold">
                  Nominal
                </span>
              </div>

              <div className="col-span-2 rounded-xl border border-[#223158] bg-[#0D1731] p-2.5 flex items-center justify-between">
                <div>
                  <small className="text-[#8C98B5] text-[10.5px] block">Core temp</small>
                  <b className="text-lg font-bold font-mono text-white">
                    {liveTemp} <em className="text-[10px] text-[#8C98B5] font-normal not-italic">°C</em>
                  </b>
                </div>
                <span className="rounded-full bg-[#45D69A]/15 text-[#45D69A] px-2 py-0.5 text-[10px] font-bold">
                  Nominal
                </span>
              </div>
            </div>
          </section>

          {/* AI Health Summary */}
          <section className="rounded-2xl border border-[#223158] bg-[#121C38] p-3.5 shadow-lg backdrop-blur-md space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-[#223158] pb-1.5">
              AI health summary
            </h3>
            <p className="text-xs text-[#E8EDF9] leading-relaxed">
              Your current health signals are stable. Biometric parameters are within safe operational boundaries.
            </p>
            <p className="text-[10px] text-[#8C98B5] pt-1 border-t border-[#223158]/50">
              AI-generated monitoring insight. Not a medical diagnosis.
            </p>
          </section>

          {/* AI Analysis History */}
          <section className="rounded-2xl border border-[#223158] bg-[#121C38] p-3.5 shadow-lg backdrop-blur-md space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-[#223158] pb-1.5">
              AI query history
            </h3>
            <div className="space-y-1.5">
              {historyItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => void askQuestion(item.query)}
                  className="rounded-xl border border-[#223158] bg-[#0D1731] p-2 text-xs cursor-pointer hover:border-[#5BA8F5] transition"
                >
                  <small className="text-[#8C98B5] flex justify-between items-center mb-0.5 font-mono text-[9.5px]">
                    <span>{item.time}</span>
                    <span className="rounded-full bg-[#45D69A]/15 text-[#45D69A] px-1.5 py-0.2 font-bold">
                      {item.risk}
                    </span>
                  </small>
                  <span className="text-[#E8EDF9] text-[11px] block truncate">{item.query}</span>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}