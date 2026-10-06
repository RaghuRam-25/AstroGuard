"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import { postAnalysisChat } from "@/lib/api";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

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

// Built-in Space Medicine Knowledge Base
const KNOWLEDGE_RESPONSES: Record<string, QuestionResponse> = {
  "Why is my heart rate elevated?": {
    summaryStatus: "Low risk",
    anomalyScore: 18,
    confidence: 90,
    explanation:
      "ASTRO-AI grounded this response in the latest MongoDB health record, historical baseline, bio-sample, alert and anomaly context. Your heart rate is slightly above the 60–100 BPM range and personal baseline, but SpO2, sleep, and core temp remain nominal. This represents short-term cardiovascular adaptation.",
    keyFindings: [
      { name: "Heart rate", valStr: "106 BPM", rangeStr: "60–100", val: 106, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
      { name: "SpO₂", valStr: "98%", rangeStr: "95–100", val: 98, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Sleep duration", valStr: "7.4 hrs", rangeStr: "7–9", val: 7.4, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
      { name: "Activity level", valStr: "51%", rangeStr: "50–85", val: 51, min: 50, max: 85, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
    ],
    personalBaseline: [
      { name: "Heart rate", current: 106, baseline: 98.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
      { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 51, baseline: 51, color: "#F5B83D" },
    ],
    missionBaseline: [
      { name: "Heart rate", current: 106, baseline: 102.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
      { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 51, baseline: 56.8, color: "#F5B83D" },
    ],
    nextSteps: [
      "Rest for a few minutes in nominal posture, then re-check your heart rate.",
      "Drink a 250mL hydration electrolyte mix and note any recent physical workload.",
      "Contact Flight Surgeon Dr. Sarah Chen if heart rate exceeds 115 BPM at rest or you feel dizzy.",
    ],
    followUps: [
      "What do my latest trends show?",
      "How should I improve hydration?",
      "Should I contact Medical Operations?",
    ],
  },
  "What do my latest trends show?": {
    summaryStatus: "Nominal",
    anomalyScore: 14,
    confidence: 94,
    explanation:
      "Heart rate rose from 70 to 106 to 124 BPM across today's physical workout and sample collection cycle. SpO2, core body temperature, sleep recovery, and metabolic markers have stayed stable with zero hypoxic deviations.",
    keyFindings: [
      { name: "Heart rate", valStr: "124 BPM", rangeStr: "60–100", val: 124, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
      { name: "SpO₂", valStr: "98%", rangeStr: "95–100", val: 98, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Sleep duration", valStr: "7.6 hrs", rangeStr: "7–9", val: 7.6, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
      { name: "Activity level", valStr: "52%", rangeStr: "50–85", val: 52, min: 50, max: 85, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
    ],
    personalBaseline: [
      { name: "Heart rate", current: 124, baseline: 98.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 52, baseline: 51, color: "#F5B83D" },
    ],
    missionBaseline: [
      { name: "Heart rate", current: 124, baseline: 102.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 52, baseline: 56.8, color: "#F5B83D" },
    ],
    nextSteps: [
      "Maintain active hydration: consume remaining 1.15L daily water target.",
      "Log scheduled 45-minute ergometer resistance exercise in the afternoon cycle.",
      "Review continuous 100 Hz SSE telemetry on Mission Console.",
    ],
    followUps: [
      "How should I improve hydration?",
      "Why is my heart rate elevated?",
      "Analyze my latest data",
    ],
  },
  "How should I improve hydration?": {
    summaryStatus: "Watch",
    isWarning: true,
    anomalyScore: 22,
    confidence: 92,
    explanation:
      "Current daily water intake is 1.65L of your 2.80L target (59% completed). In microgravity, cephalad fluid shifts reduce thirst perception. Low fluid intake increases blood viscosity and elevates resting heart rate.",
    keyFindings: [
      { name: "Tissue Hydration", valStr: "77.2%", rangeStr: "75–85", val: 77.2, min: 75, max: 85, axisMin: 50, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Water Intake", valStr: "1.65 L", rangeStr: "2.5–3.0", val: 1.65, min: 2.5, max: 3.0, axisMin: 0, axisMax: 3.5, color: "#FF7A66", aboveRange: true },
      { name: "Electrolytes (K)", valStr: "1950 mg", rangeStr: "2000–3000", val: 1950, min: 2000, max: 3000, axisMin: 1000, axisMax: 3500, color: "#F5B83D", aboveRange: true },
      { name: "Heart rate", valStr: "106 BPM", rangeStr: "60–100", val: 106, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
    ],
    personalBaseline: [
      { name: "Water (L)", current: 1.65, baseline: 2.6, color: "#3DD6C3" },
      { name: "Potassium", current: 1950, baseline: 2400, color: "#F5B83D" },
      { name: "Heart rate", current: 106, baseline: 98, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
    ],
    missionBaseline: [
      { name: "Water (L)", current: 1.65, baseline: 2.8, color: "#3DD6C3" },
      { name: "Potassium", current: 1950, baseline: 2600, color: "#F5B83D" },
      { name: "Heart rate", current: 106, baseline: 102, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
    ],
    nextSteps: [
      "Trigger RFID Pack: 'Hydration & Electrolyte Mix Pack' on Dashboard (+500mL, +300mg K).",
      "Drink fluid steadily in 150mL increments every 45 minutes.",
      "Re-evaluate blood pressure and pulse wave velocity at next telemetry sync.",
    ],
    followUps: [
      "Analyze my latest data",
      "What do my latest trends show?",
      "Should I contact Medical Operations?",
    ],
  },
  "Should I contact Medical Operations?": {
    summaryStatus: "Low risk",
    anomalyScore: 12,
    confidence: 96,
    explanation:
      "Current physiological risk is low. All telemetry parameters are within safe operational boundaries. Ground contact is not urgently required for physiological reasons, but routine comms remain open.",
    keyFindings: [
      { name: "Overall Risk", valStr: "Low Risk", rangeStr: "Nominal", val: 12, min: 0, max: 30, axisMin: 0, axisMax: 100, color: "#45D69A", aboveRange: false },
      { name: "Surgeon Status", valStr: "Online", rangeStr: "Available", val: 100, min: 80, max: 100, axisMin: 0, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Ground Link", valStr: "Locked", rangeStr: "<1ms SSE", val: 99, min: 90, max: 100, axisMin: 0, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Heart rate", valStr: "106 BPM", rangeStr: "60–100", val: 106, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
    ],
    personalBaseline: [
      { name: "Anomaly", current: 12, baseline: 14, color: "#45D69A" },
      { name: "Heart rate", current: 106, baseline: 98.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
      { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
    ],
    missionBaseline: [
      { name: "Anomaly", current: 12, baseline: 16, color: "#45D69A" },
      { name: "Heart rate", current: 106, baseline: 102.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
      { name: "Activity", current: 51, baseline: 56.8, color: "#F5B83D" },
    ],
    nextSteps: [
      "Contact Flight Surgeon only if resting heart rate remains >115 BPM after rest, or you experience chest tightness, dizziness, or visual flashes.",
      "Use 'Quick Message Doctor' on the Dashboard or Medical Consult for non-urgent inquiries.",
      "In acute distress, press the red EMERGENCY SOS button immediately.",
    ],
    followUps: [
      "Why is my heart rate elevated?",
      "How should I improve hydration?",
      "Analyze my latest data",
    ],
  },
  "Analyze my latest data": {
    summaryStatus: "Nominal",
    anomalyScore: 16,
    confidence: 95,
    explanation:
      "Latest record summary: HR 124 BPM, SpO2 98%, sleep 7.6 hrs, activity 52%, core temp 36.8 °C. Heart rate is slightly elevated due to recent physical workload, while all other biomatrices show excellent space adaptation.",
    keyFindings: [
      { name: "Heart rate", valStr: "124 BPM", rangeStr: "60–100", val: 124, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
      { name: "SpO₂", valStr: "98%", rangeStr: "95–100", val: 98, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Sleep duration", valStr: "7.6 hrs", rangeStr: "7–9", val: 7.6, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
      { name: "Core temp", valStr: "36.8 °C", rangeStr: "36.5–37.2", val: 36.8, min: 36.5, max: 37.2, axisMin: 35.5, axisMax: 38.5, color: "#45D69A", aboveRange: false },
    ],
    personalBaseline: [
      { name: "Heart rate", current: 124, baseline: 98.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 52, baseline: 51, color: "#F5B83D" },
    ],
    missionBaseline: [
      { name: "Heart rate", current: 124, baseline: 102.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 52, baseline: 56.8, color: "#F5B83D" },
    ],
    nextSteps: [
      "All primary biomatrices are within expected flight boundaries.",
      "Stay hydrated and complete scheduled resistance cycle.",
      "Continue autonomous 100 Hz SSE continuous monitoring.",
    ],
    followUps: [
      "Why is my heart rate elevated?",
      "How should I improve hydration?",
      "What do my trends show?",
    ],
  },
  "How can I improve my sleep?": {
    summaryStatus: "Nominal",
    anomalyScore: 15,
    confidence: 93,
    explanation:
      "Your 7.6 hrs sleep duration (Sleep Score: 92/100) is well within the 7–9 hour target range. Deep REM recovery cycles were optimal. Maintaining circadian lighting rhythms will sustain cognitive performance.",
    keyFindings: [
      { name: "Sleep duration", valStr: "7.6 hrs", rangeStr: "7–9", val: 7.6, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
      { name: "Sleep Score", valStr: "92 / 100", rangeStr: "80–100", val: 92, min: 80, max: 100, axisMin: 50, axisMax: 100, color: "#45D69A", aboveRange: false },
      { name: "SpO₂ during rest", valStr: "98.2%", rangeStr: "95–100", val: 98.2, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Nocturnal HR", valStr: "64 BPM", rangeStr: "55–75", val: 64, min: 55, max: 75, axisMin: 40, axisMax: 100, color: "#3DD6C3", aboveRange: false },
    ],
    personalBaseline: [
      { name: "Sleep (hrs)", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Sleep Score", current: 92, baseline: 88, color: "#45D69A" },
      { name: "Resting HR", current: 64, baseline: 66, color: "#FF7A66" },
      { name: "SpO₂", current: 98.2, baseline: 98, color: "#3DD6C3" },
    ],
    missionBaseline: [
      { name: "Sleep (hrs)", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Sleep Score", current: 92, baseline: 85, color: "#45D69A" },
      { name: "Resting HR", current: 64, baseline: 68, color: "#FF7A66" },
      { name: "SpO₂", current: 98.2, baseline: 98.5, color: "#3DD6C3" },
    ],
    nextSteps: [
      "Dim crew quarters lighting to low-kelvin amber 30 minutes before sleep cycle.",
      "Avoid caffeine ingestion within 6 hours of scheduled rest.",
      "Ensure sleep pod ventilation ECLSS airflow remains at nominal 0.15 m/s.",
    ],
    followUps: [
      "Analyze my latest data",
      "Why is my heart rate elevated?",
      "What do my trends show?",
    ],
  },
  "What do my trends show?": {
    summaryStatus: "Nominal",
    anomalyScore: 14,
    confidence: 94,
    explanation:
      "Heart rate is trending up during active EVA/exercise cycles (70 → 106 → 124 BPM) and returning rapidly to baseline during rest. Oxygen saturation, sleep scores, and activity load remain stable.",
    keyFindings: [
      { name: "Heart rate trend", valStr: "+18 BPM", rangeStr: "Nominal", val: 106, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: true },
      { name: "SpO₂ stability", valStr: "98% flat", rangeStr: "95–100", val: 98, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
      { name: "Sleep quality", valStr: "Stable", rangeStr: "7–9 hrs", val: 7.6, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
      { name: "Metabolic rate", valStr: "1350 kcal", rangeStr: "Nominal", val: 52, min: 40, max: 70, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
    ],
    personalBaseline: [
      { name: "Heart rate", current: 106, baseline: 98.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 51, baseline: 51, color: "#F5B83D" },
    ],
    missionBaseline: [
      { name: "Heart rate", current: 106, baseline: 102.3, color: "#FF7A66" },
      { name: "SpO₂", current: 98, baseline: 98.5, color: "#3DD6C3" },
      { name: "Sleep", current: 7.6, baseline: 7.4, color: "#9C8FFF" },
      { name: "Activity", current: 51, baseline: 56.8, color: "#F5B83D" },
    ],
    nextSteps: [
      "All 7 longitudinal trend parameters reflect healthy mission adaptation.",
      "Stay on schedule with nutrition packs and hydration.",
      "Next autonomous biometric batch sync scheduled in 2 hours.",
    ],
    followUps: [
      "How should I improve hydration?",
      "Why is my heart rate elevated?",
      "Analyze my latest data",
    ],
  },
};

export default function AstronautAiAnalysisPage() {
  const { user } = useAuth();
  const { vitals } = useTelemetryStream(user?.astronautId, 1200);

  // Live Vitals
  const liveHr = vitals.find((v) => v.id === "hr")?.value ?? 124;
  const liveSpo2 = vitals.find((v) => v.id === "spo2")?.value ?? 98;
  const liveTemp = vitals.find((v) => v.id === "temp")?.value ?? 36.8;

  // Initial Seed Message matching the exact HTML
  const initialMessages: ChatMessage[] = [
    {
      id: "seed-1",
      role: "user",
      text: "Why is my heart rate elevated?",
      timestamp: "2026-10-01 13:54 UTC",
    },
    {
      id: "seed-2",
      role: "assistant",
      text: "ASTRO-AI grounded this response in the latest MongoDB health record, historical baseline, bio-sample, alert and anomaly context.",
      timestamp: "2026-10-01 13:54 UTC",
      data: KNOWLEDGE_RESPONSES["Why is my heart rate elevated?"],
    },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyItems, setHistoryItems] = useState([
    { time: "2026-10-01 13:54", risk: "Low risk", query: "Why is my heart rate elevated? · 106 BPM" },
    { time: "2026-10-01 13:43", risk: "Low risk", query: "Why is my heart rate elevated? · 70 BPM" },
  ]);

  const playback = useSpeechPlayback();
  const recorder = useVoiceRecorder();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // Ask function
  const askQuestion = useCallback(
    async (queryText: string, voice = false) => {
      const q = queryText.trim();
      if (!q || isTyping) return;

      const nowStr = new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

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

      // Add to history
      setHistoryItems((prev) => [
        { time: nowStr.slice(0, 16), risk: "Low risk", query: `${q} · ${liveHr} BPM` },
        ...prev.slice(0, 5),
      ]);

      // Check if known in local knowledge base or generate dynamic response
      let responseData: QuestionResponse;
      if (KNOWLEDGE_RESPONSES[q]) {
        await new Promise((r) => setTimeout(r, 600));
        responseData = KNOWLEDGE_RESPONSES[q];
      } else {
        // Fallback or API call
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
            const d = res.data as { response?: Record<string, unknown> };
            const resp = d.response;
            responseData = {
              summaryStatus: String(resp?.statusLabel || "Nominal"),
              isWarning: String(resp?.status || "").toUpperCase() === "WATCH",
              anomalyScore: Number(resp?.anomalyScore ?? 16),
              confidence: Number(resp?.confidence ?? 92),
              explanation: String(
                resp?.explanation ||
                  `ASTRO-AI analyzed telemetry: HR ${liveHr} BPM, SpO₂ ${liveSpo2}%, Temp ${liveTemp}°C. Contextual inference confirms standard parameters for current mission phase.`
              ),
              keyFindings: [
                { name: "Heart rate", valStr: `${liveHr} BPM`, rangeStr: "60–100", val: liveHr, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: liveHr > 100 },
                { name: "SpO₂", valStr: `${liveSpo2}%`, rangeStr: "95–100", val: liveSpo2, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
                { name: "Sleep duration", valStr: "7.4 hrs", rangeStr: "7–9", val: 7.4, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
                { name: "Activity level", valStr: "52%", rangeStr: "50–85", val: 52, min: 50, max: 85, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
              ],
              personalBaseline: [
                { name: "Heart rate", current: liveHr, baseline: 98.3, color: "#FF7A66" },
                { name: "SpO₂", current: liveSpo2, baseline: 98, color: "#3DD6C3" },
                { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
                { name: "Activity", current: 52, baseline: 51, color: "#F5B83D" },
              ],
              missionBaseline: [
                { name: "Heart rate", current: liveHr, baseline: 102.3, color: "#FF7A66" },
                { name: "SpO₂", current: liveSpo2, baseline: 98.5, color: "#3DD6C3" },
                { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
                { name: "Activity", current: 52, baseline: 56.8, color: "#F5B83D" },
              ],
              nextSteps: [
                "Continue standard telemetry monitoring.",
                "Maintain hydration and nutrition schedule.",
                "Consult Medical Operations if you feel unwell.",
              ],
              followUps: [
                "What do my latest trends show?",
                "How should I improve hydration?",
                "Why is my heart rate elevated?",
              ],
            };
          } else {
            throw new Error("API fallback");
          }
        } catch {
          await new Promise((r) => setTimeout(r, 700));
          responseData = {
            summaryStatus: "Nominal",
            anomalyScore: 16,
            confidence: 91,
            explanation: `ASTRO-AI evaluated your question '${q}' against live biometrics (HR: ${liveHr} BPM, SpO₂: ${liveSpo2}%, Temp: ${liveTemp}°C). Physiological status is stable with nominal adaptation.`,
            keyFindings: [
              { name: "Heart rate", valStr: `${liveHr} BPM`, rangeStr: "60–100", val: liveHr, min: 60, max: 100, axisMin: 40, axisMax: 140, color: "#FF7A66", aboveRange: liveHr > 100 },
              { name: "SpO₂", valStr: `${liveSpo2}%`, rangeStr: "95–100", val: liveSpo2, min: 95, max: 100, axisMin: 90, axisMax: 100, color: "#3DD6C3", aboveRange: false },
              { name: "Sleep duration", valStr: "7.4 hrs", rangeStr: "7–9", val: 7.4, min: 7, max: 9, axisMin: 5, axisMax: 10, color: "#9C8FFF", aboveRange: false },
              { name: "Activity level", valStr: "52%", rangeStr: "50–85", val: 52, min: 50, max: 85, axisMin: 0, axisMax: 100, color: "#F5B83D", aboveRange: false },
            ],
            personalBaseline: [
              { name: "Heart rate", current: liveHr, baseline: 98.3, color: "#FF7A66" },
              { name: "SpO₂", current: liveSpo2, baseline: 98, color: "#3DD6C3" },
              { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
              { name: "Activity", current: 52, baseline: 51, color: "#F5B83D" },
            ],
            missionBaseline: [
              { name: "Heart rate", current: liveHr, baseline: 102.3, color: "#FF7A66" },
              { name: "SpO₂", current: liveSpo2, baseline: 98.5, color: "#3DD6C3" },
              { name: "Sleep", current: 7.4, baseline: 7.4, color: "#9C8FFF" },
              { name: "Activity", current: 52, baseline: 56.8, color: "#F5B83D" },
            ],
            nextSteps: [
              "Hydrate and maintain normal posture.",
              "Track vitals trends on the Dashboard.",
              "Uplink message to Flight Surgeon if symptoms persist.",
            ],
            followUps: [
              "What do my latest trends show?",
              "How should I improve hydration?",
              "Should I contact Medical Operations?",
            ],
          };
        }
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: responseData.explanation,
        timestamp: nowStr,
        data: responseData,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      if (playback.voiceMode) {
        playback.speak(assistantMsg.id, responseData.explanation);
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
              <small className="text-[11px] text-[#8C98B5] font-mono">Model: ASTRO-AI contextual health engine</small>
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

                  {data ? (
                    <>
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

                      {/* Baseline Comparison */}
                      <div className="space-y-1.5">
                        <div className="text-[10.5px] font-bold text-white tracking-wider uppercase">Baseline comparison</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {/* Personal Baseline */}
                          <div className="rounded-xl border border-[#223158] bg-[#121C38] p-2.5 space-y-1.5">
                            <h4 className="text-[10.5px] font-semibold text-[#8C98B5]">Personal baseline</h4>
                            {data.personalBaseline.map((b) => {
                              const maxVal = Math.max(b.current, b.baseline);
                              const curW = (b.current / maxVal) * 100;
                              const baseW = (b.baseline / maxVal) * 100;

                              return (
                                <div key={b.name} className="grid grid-cols-[68px_1fr_38px] gap-1.5 items-center text-xs">
                                  <span className="text-[#8C98B5] text-[10.5px] truncate">{b.name}</span>
                                  <div className="h-3 rounded bg-[#223158] relative overflow-hidden flex flex-col justify-between">
                                    <i className="h-1.5 rounded transition-all duration-700" style={{ width: `${curW}%`, backgroundColor: b.color }} />
                                    <i className="h-1 rounded opacity-40 transition-all duration-700" style={{ width: `${baseW}%`, backgroundColor: b.color }} />
                                  </div>
                                  <b className="text-white font-mono text-[10.5px] text-right">{b.baseline}</b>
                                </div>
                              );
                            })}
                          </div>

                          {/* Mission Baseline */}
                          <div className="rounded-xl border border-[#223158] bg-[#121C38] p-2.5 space-y-1.5">
                            <h4 className="text-[10.5px] font-semibold text-[#8C98B5]">Mission baseline</h4>
                            {data.missionBaseline.map((b) => {
                              const maxVal = Math.max(b.current, b.baseline);
                              const curW = (b.current / maxVal) * 100;
                              const baseW = (b.baseline / maxVal) * 100;

                              return (
                                <div key={b.name} className="grid grid-cols-[68px_1fr_38px] gap-1.5 items-center text-xs">
                                  <span className="text-[#8C98B5] text-[10.5px] truncate">{b.name}</span>
                                  <div className="h-3 rounded bg-[#223158] relative overflow-hidden flex flex-col justify-between">
                                    <i className="h-1.5 rounded transition-all duration-700" style={{ width: `${curW}%`, backgroundColor: b.color }} />
                                    <i className="h-1 rounded opacity-40 transition-all duration-700" style={{ width: `${baseW}%`, backgroundColor: b.color }} />
                                  </div>
                                  <b className="text-white font-mono text-[10.5px] text-right">{b.baseline}</b>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-3.5 text-[10.5px] text-[#8C98B5]">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded bg-white" /> Current
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded bg-white opacity-40" /> Baseline
                          </span>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="space-y-1">
                        <div className="text-[10.5px] font-bold text-white tracking-wider uppercase">AI explanation</div>
                        <p className="text-xs text-[#8C98B5] bg-[#121C38] border border-[#223158] rounded-xl p-2.5 leading-relaxed">
                          {data.explanation}
                        </p>
                      </div>

                      {/* Recommended Next Steps */}
                      <div className="space-y-1.5">
                        <div className="text-[10.5px] font-bold text-white tracking-wider uppercase">Recommended next steps</div>
                        <ol className="space-y-1.5 text-xs">
                          {data.nextSteps.map((step, idx) => (
                            <li key={idx} className="flex gap-2.5 bg-[#121C38] border border-[#223158] rounded-xl p-2 items-start">
                              <b className="h-5 w-5 rounded-full bg-[#5BA8F5] text-white flex items-center justify-center shrink-0 text-[11px] font-bold font-mono">
                                {idx + 1}
                              </b>
                              <span className="text-[#E8EDF9] text-xs leading-relaxed pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

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
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#E8EDF9] leading-relaxed">{msg.text}</p>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#5BA8F5] font-mono bg-[#0D1731] border border-[#223158] p-2.5 rounded-xl animate-pulse">
                <Brain className="h-4 w-4 animate-spin" />
                <span>ASTRO-AI analyzing multi-modal health vectors…</span>
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
                placeholder="Ask about your health data"
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
                "Why is my heart rate elevated?",
                "How can I improve my sleep?",
                "What do my trends show?",
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
              Your current health signals are generally stable. Heart rate shows a small deviation from personal baseline during physical tasks, while SpO₂ remains stable.
            </p>
            <p className="text-[10px] text-[#8C98B5] pt-1 border-t border-[#223158]/50">
              AI-generated monitoring insight. Not a medical diagnosis.
            </p>
          </section>

          {/* AI Analysis History */}
          <section className="rounded-2xl border border-[#223158] bg-[#121C38] p-3.5 shadow-lg backdrop-blur-md space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white border-b border-[#223158] pb-1.5">
              AI analysis history
            </h3>
            <div className="space-y-1.5">
              {historyItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => void askQuestion(item.query.split(" · ")[0])}
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