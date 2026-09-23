import { Alert } from "../models/Alert.js";
import { Analysis } from "../models/Analysis.js";
import { BioSample } from "../models/BioSample.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { HealthData } from "../models/HealthData.js";
import { env } from "../config/env.js";
import { AnalysisService } from "./analysis.service.js";

const SYSTEM_PROMPT = `You are ASTRO-AI, an advanced NASA Flight Surgeon AI Assistant aboard a deep-space spacecraft.

- Tone & Style: Highly professional, empathetic, medically precise, clear, and structured (like ChatGPT/Claude). Use markdown formatting (bullet points, bold text, numbered lists) for easy reading.
- Core Responsibility: Provide real-time health analysis, symptom guidance, medical explanations, hydration/nutrition advice, and safe space-medicine recommendations.
- Critical Constraint: Always ground your answers using the logged-in astronaut's live health data provided in the system context. Never act as a generic chatbot; speak directly about their current metrics when relevant.

Safety protocol: Do not diagnose or prescribe beyond the supplied onboard protocols. For urgent symptoms, direct the astronaut to stop strenuous activity, take a confirmed reading, and contact the Medical Officer / Flight Surgeon. Return valid JSON only with this shape: {"answer":"markdown response","analysis":{...}}. The analysis object must contain id, createdAt, status (NORMAL|LOW|WATCH|WARNING), statusLabel, anomalyScore, confidence, model, keyFindings (array), personalBaseline (array), missionBaseline (array), explanation, recommendations (array), and followUps (array).`;

type Signal = { heartRate: number; spo2: number; sleep: number; activity: number; ecg?: unknown; bloodPressure?: unknown; coreTemperatureC?: number; respirationRate?: number; microgravityStressIndex?: number };
type Context = { astronautId: string; current: Signal; personalBaseline: { heartRate: unknown; spo2: unknown; sleep: unknown; activity: unknown }; missionBaseline: { heartRate: unknown; spo2: unknown; sleep: unknown; activity: unknown }; bioSample: Record<string, unknown> | null; latestAnalysis: Record<string, unknown> | null; alerts: Record<string, unknown>[] };

function display(value: unknown, suffix = "") { return `${value ?? "not recorded"}${suffix}`; }
function statusFor(score: number): "NORMAL" | "LOW" | "WATCH" | "WARNING" { if (score >= 81) return "WARNING"; if (score >= 61) return "WARNING"; if (score >= 31) return "WATCH"; return score > 0 ? "LOW" : "NORMAL"; }
function parseJson(content: string): any | null { try { return JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()); } catch { return null; } }

export class AIChatService {
  static async buildContext(astronautId: string): Promise<Context> {
    const [latest, history, sample, analysis, alerts] = await Promise.all([
      HealthData.findOne({ astronautId }).sort({ timestamp: -1 }).lean(),
      HealthData.find({ astronautId }).sort({ timestamp: -1 }).limit(60).lean(),
      BioSample.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
      Analysis.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
      Alert.find({ astronautId, resolved: false }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    const current: Signal = { heartRate: latest?.heartRate ?? 72, spo2: latest?.spo2 ?? 98, sleep: latest?.sleep ?? 7.4, activity: latest?.activity ?? 68, ecg: latest?.ecg, bloodPressure: latest?.bloodPressure, coreTemperatureC: latest?.coreTemperatureC, respirationRate: latest?.respirationRate, microgravityStressIndex: latest?.microgravityStressIndex };
    const personalBaseline = history.length ? {
      heartRate: Number((history.reduce((s, x) => s + x.heartRate, 0) / history.length).toFixed(1)),
      spo2: Number((history.reduce((s, x) => s + x.spo2, 0) / history.length).toFixed(1)),
      sleep: Number((history.reduce((s, x) => s + x.sleep, 0) / history.length).toFixed(1)),
      activity: Number((history.reduce((s, x) => s + x.activity, 0) / history.length).toFixed(1)),
    } : await AnalysisService.calculatePersonalBaseline(astronautId);
    const missionBaseline = await AnalysisService.calculateMissionBaseline();
    return { astronautId, current, personalBaseline, missionBaseline, bioSample: sample ? { urine: sample.urine, saliva: sample.saliva, stool: sample.stool, cbcScan: sample.cbcScan || "not recorded in the current bio-sample record", symptomLog: sample.symptomLog, recordedAt: sample.createdAt } : { cbcScan: "not recorded" }, latestAnalysis: analysis ? { anomalyScore: analysis.anomalyScore, riskLevel: analysis.riskLevel, confidence: analysis.confidence, model: analysis.model, explanation: analysis.explanation, recommendations: analysis.recommendations } : null, alerts: alerts.map((alert) => ({ title: alert.title, severity: alert.severity, description: alert.description, createdAt: alert.createdAt })) };
  }

  static fallback(question: string, context: Context) {
    const score = Number(context.latestAnalysis?.anomalyScore ?? 18);
    const status = statusFor(score);
    const critical = score >= 61 || context.current.spo2 < 95;
    const alertLine = critical ? "**Escalation:** Your assigned Medical Officer has been pinged through the mission alert channel." : "No Medical Officer escalation is currently required.";
    return {
      answer: `I reviewed your current telemetry before responding. Your heart rate is **${display(context.current.heartRate, " BPM")}**, SpO₂ is **${display(context.current.spo2, "%")}**, sleep is **${display(context.current.sleep, " hours")}**, and activity is **${display(context.current.activity, "%")}**.\n\n**Immediate guidance**\n1. Pause strenuous activity and sit or lie down securely.\n2. Recheck heart rate and SpO₂ after five minutes; follow the onboard hydration protocol if you have not recently taken fluids.\n3. Contact Medical Operations immediately for worsening breathlessness, chest pain, fainting, confusion, or SpO₂ below 94%.\n\n${alertLine}\n\nThis is clinical decision support, not a diagnosis. Your question was: “${question}”`,
      analysis: AIChatService.toAnalysis(context, score, status),
    };
  }

  static toAnalysis(context: Context, score: number, status: "NORMAL" | "LOW" | "WATCH" | "WARNING") {
    const c = context.current;
    return { id: `chat-analysis-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), status, statusLabel: `${status[0]}${status.slice(1).toLowerCase()} risk`, anomalyScore: score, confidence: Number(context.latestAnalysis?.confidence ?? 90), model: String(context.latestAnalysis?.model ?? "ASTRO-AI contextual health engine"), keyFindings: [{ metric: "heartRate", label: "Heart Rate", severity: c.heartRate > 100 ? "Elevated" : "Normal", detail: `Current reading is ${c.heartRate} BPM.`, value: `${c.heartRate} BPM`, range: "60-100 BPM" }, { metric: "spo2", label: "SpO₂", severity: c.spo2 < 95 ? "Elevated" : "Normal", detail: `Current oxygen saturation is ${c.spo2}%.`, value: `${c.spo2}%`, range: "95-100%" }, { metric: "sleep", label: "Sleep Duration", severity: c.sleep < 6.5 ? "Watch" : "Normal", detail: `${c.sleep} hours recorded in the latest health record.`, value: `${c.sleep} hrs`, range: "7-9 hrs" }, { metric: "activity", label: "Activity Level", severity: "Normal", detail: `${c.activity}% activity recorded.`, value: `${c.activity}%`, range: "50-85%" }], personalBaseline: Object.entries(context.personalBaseline).map(([name, baseline]) => ({ name, current: display(c[name as keyof Signal]), baseline: display(baseline), delta: "contextual", direction: "same" })), missionBaseline: Object.entries(context.missionBaseline).map(([name, baseline]) => ({ name, current: display(c[name as keyof Signal]), baseline: display(baseline), delta: "contextual", direction: "same" })), explanation: `ASTRO-AI grounded this response in the latest MongoDB health record, historical baseline, bio-sample, alert, and anomaly context.`, recommendations: ["Maintain the prescribed hydration and rest protocol.", "Repeat a confirmed vital reading if symptoms persist.", "Escalate to Medical Operations for red-flag symptoms."], followUps: ["What do my latest trends show?", "How should I improve hydration?", "Should I contact Medical Operations?"] };
  }

  static async generate(question: string, context: Context) {
    const base = AIChatService.fallback(question, context);
    const apiKey = env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = env.AI_API_BASE_URL || process.env.OPENAI_API_BASE;
    if (!apiKey || !baseUrl) return base;
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: env.AI_MODEL, temperature: 0.2, max_completion_tokens: 1400, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: `Logged-in astronaut context (private, use only for this response):\n${JSON.stringify(context)}\n\nAstronaut question:\n${question}` }] }) });
      if (!response.ok) return base;
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const parsed = parseJson(payload.choices?.[0]?.message?.content || "");
      if (!parsed?.analysis || typeof parsed.answer !== "string") return base;
      return { answer: parsed.answer, analysis: { ...base.analysis, ...parsed.analysis, id: parsed.analysis.id || base.analysis.id, createdAt: parsed.analysis.createdAt || base.analysis.createdAt } };
    } catch { return base; }
  }

  static async saveTurn(astronautId: string, role: "user" | "assistant", data: { text?: string; analysis?: Record<string, unknown>; voice?: boolean }) { return ChatMessage.create({ astronautId, role, text: data.text || "", analysis: data.analysis, voice: Boolean(data.voice) }); }

  static async escalateIfNeeded(astronautId: string, context: Context) {
    const score = Number(context.latestAnalysis?.anomalyScore ?? 0);
    if (score < 61 && context.current.spo2 >= 95) return false;
    const existing = await Alert.findOne({ astronautId, title: "ASTRO-AI Medical Escalation", resolved: false });
    if (!existing) await Alert.create({ astronautId, title: "ASTRO-AI Medical Escalation", description: `ASTRO-AI detected a high-priority consultation context. Anomaly score ${score}/100; SpO₂ ${context.current.spo2}%. Medical Officer review requested.`, severity: score >= 81 ? "Critical" : "Warning", signal: "ASTRO-AI consultation", value: score, baseline: "61/100" });
    return true;
  }
}
