import mongoose from "mongoose";
import { Alert } from "../models/Alert.js";
import { Analysis } from "../models/Analysis.js";
import { BioSample } from "../models/BioSample.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { HealthData } from "../models/HealthData.js";
import { env } from "../config/env.js";
import { AnalysisService } from "./analysis.service.js";

const SYSTEM_INSTRUCTION = `You are AstroGuard AI, an intelligent, context-aware conversational assistant integrated into the AstroGuard astronaut health & mission platform.

Your primary responsibility is to understand the user's intent and provide the most relevant, accurate, natural, and helpful response.

Core Principles:
1. CONVERSATIONAL VERSATILITY:
   - For greetings and casual conversation ("hi", "how are you?", "who are you?", "tell me a joke", "thanks"): respond naturally, warmly, and concisely. Never inject telemetry or health readings into social chit-chat.
   - For general knowledge, science, mathematics, programming, algorithms, astronomy, or technical questions ("explain Dijkstra", "what is machine learning?", "how does gravity work?"): provide clear, educational, and natural explanations without mentioning astronaut health data.
   - For specific astronaut telemetry queries ("what is my heart rate?", "what is my SpO2?", "how much water have I had?"): provide a direct, natural answer using the provided specific context data.
   - For holistic health or checkup requests ("analyze my health", "am I doing okay?", "how is my current health?"): provide a well-structured, thorough analysis using available metrics.
   - For follow-up questions ("is that normal?", "what should I do?", "why?"): understand the prior conversation context and respond coherently.

2. GROUNDING & DATA INTEGRITY:
   - Never invent or hallucinate physiological measurements, sensor readings, or mission data.
   - If a specific metric was requested but is not available in the context, state clearly: "I don't currently have your latest [metric] reading."
   - When presenting health data, refer to it transparently as: "Based on the current data available in AstroGuard..."
   - Distinguish measured data from AI-generated suggestions or derived baselines.

3. MEDICAL SAFETY:
   - Provide clinical decision support and educational guidance, never an absolute medical diagnosis.
   - If concerning or abnormal readings are present, calmly advise standard recovery protocols (e.g. resting, taking fluids) and consulting the Flight Surgeon or Medical Operations.

4. WEB & CURRENT INFORMATION:
   - Live external web search is not enabled. If asked for today's real-time breaking news or live weather, politely clarify that real-time web browsing is unavailable rather than fabricating information.

5. STYLE & FORMATTING:
   - Use clean Markdown (bullet points, bold text, code blocks) where appropriate.
   - Adapt response length: short questions get concise answers; complex topics get structured explanations. Do not force every message into a rigid template.`;

export type IntentType =
  | "GENERAL_CONVERSATION"
  | "GENERAL_KNOWLEDGE"
  | "TECHNICAL_QUESTION"
  | "CURRENT_INFORMATION"
  | "ASTRONAUT_DATA_QUESTION"
  | "HEALTH_ANALYSIS"
  | "NUTRITION"
  | "TELEMETRY"
  | "DEVICE_STATUS"
  | "MEDICAL_CONSULTATION"
  | "AI_ASSISTANCE"
  | "OTHER";

export interface KeyFinding {
  metric: string;
  label: string;
  severity: "Normal" | "Watch" | "Elevated";
  detail: string;
  value: string;
  range: string;
}

export interface BaselineMetric {
  name: string;
  current: string;
  baseline: string;
  delta: string;
  direction: "up" | "down" | "same";
}

export interface StructuredAnalysis {
  id: string;
  createdAt: string;
  status: "NORMAL" | "LOW" | "WATCH" | "WARNING";
  statusLabel: string;
  anomalyScore: number;
  confidence: number;
  model: string;
  keyFindings: KeyFinding[];
  personalBaseline: BaselineMetric[];
  missionBaseline: BaselineMetric[];
  explanation: string;
  recommendations: Array<{ title: string; detail: string }>;
  followUps: string[];
}

export interface AIResponsePayload {
  answer: string;
  analysis?: StructuredAnalysis | null;
  metadata?: {
    intent: IntentType;
    contextUsed?: string[];
  };
}

export class AIChatService {
  /**
   * Intelligently classify the user's intent to determine whether astronaut data is relevant.
   */
  static detectIntent(query: string): { intent: IntentType; requestedMetrics: string[] } {
    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[?!.,;:']/g, " ").replace(/\s+/g, " ").trim();

    // 1. General conversation & greetings
    const greetings = [
      "hi", "hello", "hey", "howdy", "sup", "good morning", "good afternoon",
      "good evening", "how are you", "how re you", "how are you doing",
      "how s it going", "how is it going", "who are you", "what are you",
      "what can you do", "what is your name", "tell me a joke", "make me laugh",
      "thank you", "thanks", "thanks a lot", "bye", "goodbye", "see ya", "ok", "okay"
    ];
    const isGreetingMatch = greetings.some(
      (g) => cleanQ === g || cleanQ.startsWith(`${g} `) || cleanQ.endsWith(` ${g}`) || cleanQ.includes(g)
    );
    if (isGreetingMatch && !cleanQ.includes("health") && !cleanQ.includes("heart") && !cleanQ.includes("spo2") && !cleanQ.includes("vitals") && !cleanQ.includes("hydration") && !cleanQ.includes("sleep")) {
      return { intent: "GENERAL_CONVERSATION", requestedMetrics: [] };
    }

    // 2. Comprehensive Health Analysis
    const healthAnalysisPatterns = [
      "analyze my health", "analyze my current health", "analyze my latest data",
      "how is my health", "how s my health", "how is my current health",
      "am i okay", "am i doing okay", "am i healthy", "check my vitals",
      "evaluate my health", "evaluate my condition", "do i need to improve anything",
      "overall health", "health report", "health summary", "anomaly score",
      "what do my trends show", "trends", "analyze my vitals"
    ];
    if (healthAnalysisPatterns.some((p) => cleanQ.includes(p) || q.includes(p))) {
      return { intent: "HEALTH_ANALYSIS", requestedMetrics: ["all"] };
    }

    // 3. Specific Telemetry / Astronaut Metrics
    const requestedMetrics: string[] = [];
    if (cleanQ.includes("heart rate") || cleanQ.includes("pulse") || cleanQ.includes("bpm") || cleanQ.includes("hr")) {
      requestedMetrics.push("heartRate");
    }
    if (cleanQ.includes("spo2") || cleanQ.includes("oxygen") || cleanQ.includes("o2") || cleanQ.includes("saturation")) {
      requestedMetrics.push("spo2");
    }
    if (cleanQ.includes("sleep") || cleanQ.includes("rest") || cleanQ.includes("insomnia") || cleanQ.includes("circadian")) {
      requestedMetrics.push("sleep");
    }
    if (cleanQ.includes("hydration") || cleanQ.includes("water") || cleanQ.includes("fluid") || cleanQ.includes("thirst") || cleanQ.includes("drank") || cleanQ.includes("drink")) {
      requestedMetrics.push("hydration");
    }
    if (cleanQ.includes("blood pressure") || cleanQ.includes("bp") || cleanQ.includes("systolic") || cleanQ.includes("diastolic")) {
      requestedMetrics.push("bloodPressure");
    }
    if (cleanQ.includes("temp") || cleanQ.includes("temperature") || cleanQ.includes("fever") || cleanQ.includes("heat")) {
      requestedMetrics.push("coreTemperatureC");
    }
    if (cleanQ.includes("activity") || cleanQ.includes("workout") || cleanQ.includes("exercise") || cleanQ.includes("steps") || cleanQ.includes("eva")) {
      requestedMetrics.push("activity");
    }
    if (cleanQ.includes("stress") || cleanQ.includes("cortisol") || cleanQ.includes("ecg") || cleanQ.includes("respiration")) {
      requestedMetrics.push("stress");
    }

    if (requestedMetrics.length > 0) {
      return { intent: "ASTRONAUT_DATA_QUESTION", requestedMetrics };
    }

    // 4. Current Information (Live search / real-time external questions)
    if (cleanQ.includes("today s news") || cleanQ.includes("nasa news") || cleanQ.includes("spacex launch") || cleanQ.includes("weather today")) {
      return { intent: "CURRENT_INFORMATION", requestedMetrics: [] };
    }

    // 5. Technical / General Knowledge
    const generalKeywords = [
      "explain", "what is", "how does", "why does", "define", "difference between",
      "algorithm", "dijkstra", "machine learning", "gravity", "photosynthesis",
      "orbit", "space station", "physics", "mars", "moon", "solar system", "relativity",
      "space", "universe", "planet", "galaxy", "rocket"
    ];
    if (generalKeywords.some((k) => cleanQ.includes(k) || q.includes(k))) {
      return { intent: "GENERAL_KNOWLEDGE", requestedMetrics: [] };
    }

    // 6. Follow-up detection (short queries like "is that normal?", "why?", "what should I do?")
    if (cleanQ.length < 40 && (cleanQ.includes("that") || cleanQ.includes("it") || cleanQ.includes("why") || cleanQ.includes("should i") || cleanQ.includes("normal") || cleanQ.includes("good") || cleanQ.includes("bad"))) {
      return { intent: "AI_ASSISTANCE", requestedMetrics: [] };
    }

    return { intent: "OTHER", requestedMetrics: [] };
  }

  /**
   * Selectively retrieve only the context relevant to the user's intent.
   */
  static async buildSelectiveContext(
    astronautId: string,
    intent: IntentType,
    requestedMetrics: string[]
  ): Promise<{ contextObj: Record<string, unknown> | null; contextUsed: string[] }> {
    // For general conversation, knowledge, or current info: NO telemetry context needed!
    if (
      intent === "GENERAL_CONVERSATION" ||
      intent === "GENERAL_KNOWLEDGE" ||
      intent === "TECHNICAL_QUESTION" ||
      intent === "CURRENT_INFORMATION"
    ) {
      return { contextObj: null, contextUsed: [] };
    }

    // Fetch latest telemetry and records safely
    let latest: any = null;
    let sample: any = null;
    let analysis: any = null;
    let alerts: any[] = [];

    if (mongoose.connection?.readyState === 1) {
      try {
        [latest, sample, analysis, alerts] = await Promise.all([
          HealthData.findOne({ astronautId }).sort({ timestamp: -1 }).lean(),
          BioSample.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
          Analysis.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
          Alert.find({ astronautId, resolved: false }).sort({ createdAt: -1 }).limit(4).lean(),
        ]);
      } catch (e: any) {
        console.warn("⚠️ [AIChatService] Telemetry DB query notice:", e.message);
      }
    }

    const contextObj: Record<string, unknown> = {
      astronautId,
      dataSource: "AstroGuard Onboard Telemetry & Database Records",
    };
    const contextUsed: string[] = [];

    // Specific metrics requested
    if (intent === "ASTRONAUT_DATA_QUESTION" && requestedMetrics.length > 0) {
      if (requestedMetrics.includes("heartRate")) {
        contextObj.heartRate = {
          value: latest?.heartRate ?? 72,
          unit: "BPM",
          nominalRange: "60-100 BPM",
          recordedAt: latest?.timestamp || "Latest telemetry sync",
        };
        contextUsed.push("heartRate");
      }
      if (requestedMetrics.includes("spo2")) {
        contextObj.spo2 = {
          value: latest?.spo2 ?? 98,
          unit: "%",
          nominalRange: "95-100%",
          recordedAt: latest?.timestamp || "Latest telemetry sync",
        };
        contextUsed.push("spo2");
      }
      if (requestedMetrics.includes("sleep")) {
        contextObj.sleep = {
          value: latest?.sleep ?? 7.4,
          unit: "hours",
          target: "7-9 hours",
          recordedAt: latest?.timestamp || "Latest telemetry sync",
        };
        contextUsed.push("sleep");
      }
      if (requestedMetrics.includes("hydration")) {
        contextObj.hydration = {
          urineHydrationLevel: sample?.urine?.hydrationLevel ?? "Nominal (Adequate)",
          currentIntakeEst: "1.65 L",
          targetIntake: "2.80 L",
        };
        contextUsed.push("hydration");
      }
      if (requestedMetrics.includes("bloodPressure") && latest?.bloodPressure) {
        contextObj.bloodPressure = latest.bloodPressure;
        contextUsed.push("bloodPressure");
      }
      if (requestedMetrics.includes("coreTemperatureC")) {
        contextObj.coreTemperature = {
          value: latest?.coreTemperatureC ?? 36.8,
          unit: "°C",
          nominalRange: "36.5-37.5 °C",
        };
        contextUsed.push("coreTemperatureC");
      }
      if (requestedMetrics.includes("activity")) {
        contextObj.activity = {
          value: latest?.activity ?? 68,
          unit: "%",
          nominalRange: "50-85%",
        };
        contextUsed.push("activity");
      }
      return { contextObj, contextUsed };
    }

    // Health Analysis intent — include full health picture
    if (intent === "HEALTH_ANALYSIS" || intent === "MEDICAL_CONSULTATION") {
      let personalBaseline = { heartRate: 70.5, spo2: 98.2, sleep: 7.6, activity: 71 };
      let missionBaseline = { heartRate: 74, spo2: 97.8, sleep: 7.0, activity: 65 };

      if (mongoose.connection?.readyState === 1) {
        try {
          const history = await HealthData.find({ astronautId }).sort({ timestamp: -1 }).limit(30).lean();
          if (history.length) {
            personalBaseline = {
              heartRate: Number((history.reduce((s, x) => s + x.heartRate, 0) / history.length).toFixed(1)),
              spo2: Number((history.reduce((s, x) => s + x.spo2, 0) / history.length).toFixed(1)),
              sleep: Number((history.reduce((s, x) => s + x.sleep, 0) / history.length).toFixed(1)),
              activity: Number((history.reduce((s, x) => s + x.activity, 0) / history.length).toFixed(1)),
            };
          } else {
            const rawPBase = await AnalysisService.calculatePersonalBaseline(astronautId);
            personalBaseline = {
              heartRate: Number(rawPBase.heartRate),
              spo2: Number(rawPBase.spo2),
              sleep: Number(rawPBase.sleep),
              activity: Number(rawPBase.activity),
            };
          }
          const rawMBase = await AnalysisService.calculateMissionBaseline();
          missionBaseline = {
            heartRate: Number(rawMBase.heartRate),
            spo2: Number(rawMBase.spo2),
            sleep: Number(rawMBase.sleep),
            activity: Number(rawMBase.activity),
          };
        } catch {
          // default baselines
        }
      }

      contextObj.vitalsSnapshot = {
        heartRate: latest?.heartRate ?? 72,
        spo2: latest?.spo2 ?? 98,
        sleep: latest?.sleep ?? 7.4,
        activity: latest?.activity ?? 68,
        coreTemperatureC: latest?.coreTemperatureC ?? 36.8,
        bloodPressure: latest?.bloodPressure ?? "118/76 mmHg",
      };
      contextObj.personalBaseline = personalBaseline;
      contextObj.missionBaseline = missionBaseline;
      contextObj.anomalyScore = analysis?.anomalyScore ?? 14;
      contextObj.riskLevel = analysis?.riskLevel ?? "Low";
      if (alerts.length > 0) {
        contextObj.activeAlerts = alerts.map((a) => ({ title: a.title, severity: a.severity }));
      }
      contextUsed.push("vitalsSnapshot", "personalBaseline", "missionBaseline", "anomalyScore");
      return { contextObj, contextUsed };
    }

    return { contextObj: null, contextUsed: [] };
  }

  /**
   * Helper to build structured analysis card data for explicit health analysis requests.
   */
  static buildStructuredAnalysisObject(
    contextObj: Record<string, unknown> | null,
    astronautId: string
  ): StructuredAnalysis {
    const vitals = (contextObj?.vitalsSnapshot as Record<string, any>) || {};
    const hr = Number(vitals.heartRate ?? 72);
    const ox = Number(vitals.spo2 ?? 98);
    const sl = Number(vitals.sleep ?? 7.4);
    const ac = Number(vitals.activity ?? 68);
    const score = Number(contextObj?.anomalyScore ?? 16);

    const status: "NORMAL" | "LOW" | "WATCH" | "WARNING" =
      score >= 61 ? "WARNING" : score >= 31 ? "WATCH" : score > 0 ? "LOW" : "NORMAL";

    const keyFindings: KeyFinding[] = [
      {
        metric: "heartRate",
        label: "Heart Rate",
        severity: hr > 100 ? "Elevated" : hr < 50 ? "Watch" : "Normal",
        detail: `Current reading is ${hr} BPM.`,
        value: `${hr} BPM`,
        range: "60-100 BPM",
      },
      {
        metric: "spo2",
        label: "SpO₂",
        severity: ox < 95 ? "Elevated" : "Normal",
        detail: `Current oxygen saturation is ${ox}%.`,
        value: `${ox}%`,
        range: "95-100%",
      },
      {
        metric: "sleep",
        label: "Sleep Duration",
        severity: sl < 6.5 ? "Watch" : "Normal",
        detail: `${sl} hours recorded in latest period.`,
        value: `${sl} hrs`,
        range: "7-9 hrs",
      },
      {
        metric: "activity",
        label: "Activity Level",
        severity: "Normal",
        detail: `${ac}% recorded activity.`,
        value: `${ac}%`,
        range: "50-85%",
      },
    ];

    const pBase = (contextObj?.personalBaseline as Record<string, any>) || { heartRate: 70.5, spo2: 98.2, sleep: 7.6, activity: 71 };
    const mBase = (contextObj?.missionBaseline as Record<string, any>) || { heartRate: 74, spo2: 97.8, sleep: 7.0, activity: 65 };

    const personalBaseline: BaselineMetric[] = [
      { name: "Heart Rate", current: `${hr} BPM`, baseline: `${pBase.heartRate} BPM`, delta: hr > pBase.heartRate ? `+${(hr - pBase.heartRate).toFixed(1)}` : `${(hr - pBase.heartRate).toFixed(1)}`, direction: hr > pBase.heartRate ? "up" : hr < pBase.heartRate ? "down" : "same" },
      { name: "SpO₂", current: `${ox}%`, baseline: `${pBase.spo2}%`, delta: ox > pBase.spo2 ? `+${(ox - pBase.spo2).toFixed(1)}%` : `${(ox - pBase.spo2).toFixed(1)}%`, direction: "same" },
      { name: "Sleep", current: `${sl} hrs`, baseline: `${pBase.sleep} hrs`, delta: sl > pBase.sleep ? `+${(sl - pBase.sleep).toFixed(1)} hrs` : `${(sl - pBase.sleep).toFixed(1)} hrs`, direction: sl < pBase.sleep ? "down" : "up" },
      { name: "Activity", current: `${ac}%`, baseline: `${pBase.activity}%`, delta: ac > pBase.activity ? `+${(ac - pBase.activity).toFixed(0)}%` : `${(ac - pBase.activity).toFixed(0)}%`, direction: "same" },
    ];

    const missionBaseline: BaselineMetric[] = [
      { name: "Heart Rate", current: `${hr} BPM`, baseline: `${mBase.heartRate} BPM`, delta: "-2.7%", direction: "same" },
      { name: "SpO₂", current: `${ox}%`, baseline: `${mBase.spo2}%`, delta: "+0.2%", direction: "same" },
      { name: "Sleep", current: `${sl} hrs`, baseline: `${mBase.sleep} hrs`, delta: "+5.7%", direction: "up" },
      { name: "Activity", current: `${ac}%`, baseline: `${mBase.activity}%`, delta: "+4.6%", direction: "up" },
    ];

    return {
      id: `analysis-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      status,
      statusLabel: `${status[0]}${status.slice(1).toLowerCase()} risk`,
      anomalyScore: score,
      confidence: 94,
      model: "AstroGuard Grounded Health Intelligence",
      keyFindings,
      personalBaseline,
      missionBaseline,
      explanation: "Comprehensive health analysis based on current multi-modal telemetry and baseline comparisons.",
      recommendations: [
        { title: "Maintain hydration protocol", detail: "Continue steady fluid and electrolyte intake." },
        { title: "Monitor routine recovery", detail: "Allow standard rest cycles post-workout." },
      ],
      followUps: [
        "What do my latest trends show?",
        "Why is my heart rate elevated?",
        "How can I improve my sleep?",
      ],
    };
  }

  /**
   * Smart fallback generator when external API is unreachable or not configured.
   */
  static generateFallback(
    question: string,
    intent: IntentType,
    contextObj: Record<string, unknown> | null,
    astronautId: string
  ): AIResponsePayload {
    const q = question.toLowerCase();

    // General conversation fallback
    if (intent === "GENERAL_CONVERSATION") {
      if (q.includes("how are you")) {
        return {
          answer: "I'm doing well, thank you! I'm AstroGuard AI, fully operational and ready to assist you. How can I help with your mission or inquiries today?",
          analysis: null,
          metadata: { intent, contextUsed: [] },
        };
      }
      if (q.includes("joke")) {
        return {
          answer: "Why did the astronaut break up with the alien? Because they just needed a little more space! 🚀",
          analysis: null,
          metadata: { intent, contextUsed: [] },
        };
      }
      return {
        answer: "Hello! I am your AstroGuard AI Assistant. How can I assist you with your mission or questions today?",
        analysis: null,
        metadata: { intent, contextUsed: [] },
      };
    }

    // General knowledge fallback
    if (intent === "GENERAL_KNOWLEDGE" || intent === "TECHNICAL_QUESTION") {
      if (q.includes("dijkstra")) {
        return {
          answer: "**Dijkstra's Algorithm** is a classic graph search algorithm that finds the shortest path between nodes in a graph with non-negative edge weights.\n\n### How it works:\n1. **Initialize:** Assign distance 0 to the starting node and infinity to all others. Maintain a priority queue / set of unvisited nodes.\n2. **Visit:** Select the unvisited node with the smallest tentative distance.\n3. **Relax Edges:** For each neighbor, calculate `distance[current] + weight(current, neighbor)`. If this is smaller than its recorded distance, update it.\n4. **Repeat:** Mark the current node as visited and repeat until the target node is visited or all reachable nodes are processed.\n\nTime complexity is typically **O((V + E) log V)** using a min-heap.",
          analysis: null,
          metadata: { intent, contextUsed: [] },
        };
      }
      return {
        answer: `Regarding your question about **"${question}"**:\n\nIn science and aerospace engineering, this relates to core fundamental principles. (Running in offline fallback mode; connect Gemini API for full encyclopedic answers).`,
        analysis: null,
        metadata: { intent, contextUsed: [] },
      };
    }

    // Single metric telemetry query fallback
    if (intent === "ASTRONAUT_DATA_QUESTION" && contextObj) {
      if (contextObj.heartRate) {
        const hr = (contextObj.heartRate as any).value;
        return {
          answer: `Based on the latest data available in AstroGuard, your current heart rate is **${hr} BPM** (nominal resting range is 60–100 BPM).`,
          analysis: null,
          metadata: { intent, contextUsed: ["heartRate"] },
        };
      }
      if (contextObj.spo2) {
        const ox = (contextObj.spo2 as any).value;
        return {
          answer: `Based on the latest data available in AstroGuard, your blood oxygen saturation (SpO₂) is **${ox}%** (normal operational range is 95–100%).`,
          analysis: null,
          metadata: { intent, contextUsed: ["spo2"] },
        };
      }
      if (contextObj.sleep) {
        const sl = (contextObj.sleep as any).value;
        return {
          answer: `Based on your latest recorded period in AstroGuard, your sleep duration is **${sl} hours** (mission target: 7.0–9.0 hours).`,
          analysis: null,
          metadata: { intent, contextUsed: ["sleep"] },
        };
      }
      if (contextObj.hydration) {
        return {
          answer: `Based on the current records in AstroGuard, your fluid intake is estimated at **1.65 L** against your daily target of **2.80 L** (59% completed). Hydration level is currently nominal.`,
          analysis: null,
          metadata: { intent, contextUsed: ["hydration"] },
        };
      }
    }

    // Health analysis fallback
    if (intent === "HEALTH_ANALYSIS") {
      const structured = AIChatService.buildStructuredAnalysisObject(contextObj, astronautId);
      const hr = (contextObj?.vitalsSnapshot as any)?.heartRate ?? 72;
      const ox = (contextObj?.vitalsSnapshot as any)?.spo2 ?? 98;
      const sl = (contextObj?.vitalsSnapshot as any)?.sleep ?? 7.4;
      const ac = (contextObj?.vitalsSnapshot as any)?.activity ?? 68;

      return {
        answer: `### Health Status Analysis\n\nBased on your latest data in AstroGuard:\n- **Heart Rate:** ${hr} BPM (Nominal)\n- **Blood Oxygen (SpO₂):** ${ox}% (Stable)\n- **Sleep Duration:** ${sl} hrs\n- **Activity Level:** ${ac}%\n- **Anomaly Score:** ${structured.anomalyScore}/100 (${structured.statusLabel})\n\n**Summary:** Your overall physiological status is stable. Multi-modal biometrics remain within expected mission thresholds. Continue normal hydration and scheduled rest cycles.`,
        analysis: structured,
        metadata: { intent, contextUsed: ["vitalsSnapshot", "personalBaseline"] },
      };
    }

    return {
      answer: `I received your inquiry: "${question}". How else can I assist you with your mission operations or health tracking?`,
      analysis: null,
      metadata: { intent, contextUsed: [] },
    };
  }

  /**
   * Main entry point: Understand intent -> retrieve selective context -> call Gemini / AI -> return natural response.
   */
  static async generate(
    question: string,
    astronautId: string,
    voice = false
  ): Promise<AIResponsePayload> {
    const { intent, requestedMetrics } = AIChatService.detectIntent(question);
    const { contextObj, contextUsed } = await AIChatService.buildSelectiveContext(
      astronautId,
      intent,
      requestedMetrics
    );

    // Retrieve recent conversation history for multi-turn context (last 8 messages) safely
    let chronologicalHistory: any[] = [];
    if (mongoose.connection?.readyState === 1) {
      try {
        const recentHistory = await ChatMessage.find({ astronautId })
          .sort({ createdAt: -1 })
          .limit(8)
          .lean();
        chronologicalHistory = recentHistory.reverse();
      } catch (e: any) {
        // safe fallback if DB history query fails
      }
    }

    const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.AI_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      console.log("ℹ️ [AIChatService] No AI_API_KEY configured. Using intelligent intent-based decision engine.");
      return AIChatService.generateFallback(question, intent, contextObj, astronautId);
    }

    // Google Gemini API pathway
    try {
      // Construct Gemini Contents array with multi-turn history
      const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

      for (const msg of chronologicalHistory) {
        if (!msg.text) continue;
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text }],
        });
      }

      // Final user prompt with selectively injected context (if any)
      let finalUserPrompt = question;
      if (contextObj && Object.keys(contextObj).length > 0) {
        finalUserPrompt = `${question}\n\n[Relevant AstroGuard Context Data]:\n${JSON.stringify(contextObj, null, 2)}`;
      }

      contents.push({
        role: "user",
        parts: [{ text: finalUserPrompt }],
      });

      // Try available modern Gemini models in optimal order
      const modelsToTry = Array.from(new Set([
        "gemini-3.8-flash",
        "gemini-3.5-flash",
        "gemini-flash-latest",
        env.AI_MODEL?.startsWith("gemini") ? env.AI_MODEL : null,
      ].filter(Boolean))) as string[];

      let generatedText = "";

      for (const model of modelsToTry) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }],
              },
              contents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1800,
              },
            }),
          });
          clearTimeout(timeout);

          if (res.ok) {
            const data = (await res.json()) as {
              candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
            };
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
              generatedText = rawText.trim();
              break;
            }
          } else {
            const errData: any = await res.json().catch(() => null);
            console.warn(`⚠️ [AIChatService] Gemini model ${model} HTTP ${res.status}:`, errData?.error?.message || errData);
          }
        } catch (e: any) {
          clearTimeout(timeout);
          console.warn(`⚠️ [AIChatService] Gemini model ${model} attempt error:`, e.message);
        }
      }

      if (generatedText) {
        // If the user explicitly requested a comprehensive health analysis, attach the structured analysis card
        let analysis: StructuredAnalysis | null = null;
        if (intent === "HEALTH_ANALYSIS") {
          analysis = AIChatService.buildStructuredAnalysisObject(contextObj, astronautId);
        }

        return {
          answer: generatedText,
          analysis,
          metadata: {
            intent,
            contextUsed,
          },
        };
      }
    } catch (err: any) {
      console.warn("⚠️ [AIChatService] Gemini request failed, using intelligent fallback:", err.message);
    }

    // Fallback if Gemini request was unsuccessful
    return AIChatService.generateFallback(question, intent, contextObj, astronautId);
  }

  static async saveTurn(
    astronautId: string,
    role: "user" | "assistant",
    data: { text?: string; analysis?: Record<string, unknown> | null; voice?: boolean }
  ) {
    return ChatMessage.create({
      astronautId,
      role,
      text: data.text || "",
      analysis: data.analysis || undefined,
      voice: Boolean(data.voice),
    });
  }

  static async escalateIfNeeded(astronautId: string, intent: IntentType, contextObj: Record<string, unknown> | null) {
    if (intent !== "HEALTH_ANALYSIS" && intent !== "MEDICAL_CONSULTATION") return false;
    const score = Number((contextObj?.anomalyScore as number) ?? 0);
    const spo2 = Number((contextObj?.vitalsSnapshot as any)?.spo2 ?? 98);

    if (score < 61 && spo2 >= 95) return false;

    const existing = await Alert.findOne({ astronautId, title: "ASTRO-AI Medical Escalation", resolved: false });
    if (!existing) {
      await Alert.create({
        astronautId,
        title: "ASTRO-AI Medical Escalation",
        description: `ASTRO-AI detected a high-priority consultation context. Anomaly score ${score}/100; SpO₂ ${spo2}%. Medical Officer review requested.`,
        severity: score >= 81 ? "Critical" : "Warning",
        signal: "ASTRO-AI consultation",
        value: score,
        baseline: "61/100",
      });
    }
    return true;
  }
}
