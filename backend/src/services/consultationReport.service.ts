import { Alert } from "../models/Alert.js";
import { Analysis } from "../models/Analysis.js";
import { BioSample } from "../models/BioSample.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ConsultationReport, IConsultationReport } from "../models/ConsultationReport.js";
import { HealthData } from "../models/HealthData.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { AIChatService } from "./aiChat.service.js";

type ReportDraft = { symptoms: string; aiAdviceSummary: string; riskLevel: "Low" | "Moderate" | "Critical"; anomalyScore: number };

function parseJson(content: string): ReportDraft | null {
  try {
    const parsed = JSON.parse(content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
    if (typeof parsed.symptoms !== "string" || typeof parsed.aiAdviceSummary !== "string") return null;
    return { symptoms: parsed.symptoms, aiAdviceSummary: parsed.aiAdviceSummary, riskLevel: parsed.riskLevel === "Critical" ? "Critical" : parsed.riskLevel === "Moderate" ? "Moderate" : "Low", anomalyScore: Number(parsed.anomalyScore) || 0 };
  } catch { return null; }
}

export class ConsultationReportService {
  static async resolveAssignedDoctorId(astronautId: string): Promise<string> {
    const assignment = await MedicalAssignment.findOne({ astronautIds: astronautId }).sort({ updatedAt: -1 }).lean();
    if (assignment?.medicalOfficerId) {
      const assignedUser = await User.findOne({ $or: [{ _id: assignment.medicalOfficerId }, { email: assignment.medicalOfficerId }] }).select("_id").lean();
      if (assignedUser) return assignedUser._id.toString();
      return assignment.medicalOfficerId;
    }
    const user = await User.findOne({ role: "medical_officer", assignedAstronautIds: astronautId }).select("_id").lean();
    if (!user) throw new Error(`No Medical Officer assignment found for astronaut ${astronautId}.`);
    return user._id.toString();
  }

  static async createFromChat(astronautId: string, requestedDoctorId?: string): Promise<IConsultationReport> {
    const [context, transcript, latestHealth, sample, analysis, alerts] = await Promise.all([
      AIChatService.buildContext(astronautId),
      ChatMessage.find({ astronautId }).sort({ createdAt: 1 }).limit(200).lean(),
      HealthData.findOne({ astronautId }).sort({ timestamp: -1 }).lean(),
      BioSample.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
      Analysis.findOne({ astronautId }).sort({ createdAt: -1 }).lean(),
      Alert.find({ astronautId, resolved: false }).sort({ createdAt: -1 }).limit(8).lean(),
    ]);
    if (!transcript.length) throw new Error("No consultation transcript is available to summarize.");
    const assignedDoctorId = requestedDoctorId || await this.resolveAssignedDoctorId(astronautId);
    const vitalsSnapshot = { capturedAt: new Date().toISOString(), heartRate: latestHealth?.heartRate ?? context.current.heartRate, spo2: latestHealth?.spo2 ?? context.current.spo2, sleep: latestHealth?.sleep ?? context.current.sleep, activity: latestHealth?.activity ?? context.current.activity, urineHydration: sample?.urine?.hydrationLevel ?? null, salivaCortisol: sample?.saliva?.cortisol ?? null, stoolMicrobiome: sample?.stool?.microbiomeDiversityIndex ?? null, cbcScan: sample?.cbcScan || "not recorded", anomalyScore: analysis?.anomalyScore ?? 0, activeAlerts: alerts.map((alert) => ({ title: alert.title, severity: alert.severity })) };
    const transcriptText = transcript.map((message) => `${message.role.toUpperCase()}: ${message.text || ""}`).join("\n");
    const draft = await this.summarize(transcriptText, vitalsSnapshot, analysis?.anomalyScore ?? 0);
    return ConsultationReport.create({ astronautId, assignedDoctorId, timestamp: new Date(), symptoms: draft.symptoms, vitalsSnapshot, aiAdviceSummary: draft.aiAdviceSummary, fullTranscript: transcript.map((message) => ({ role: message.role, text: message.text, analysis: message.analysis, voice: message.voice, createdAt: message.createdAt })), riskLevel: draft.riskLevel, anomalyScore: draft.anomalyScore, status: "Unreviewed" });
  }

  static async summarize(transcript: string, vitals: Record<string, unknown>, anomalyScore: number): Promise<ReportDraft> {
    const fallback: ReportDraft = { symptoms: transcript.split("\n").filter((line) => line.startsWith("USER:")).slice(-3).join(" ").slice(0, 1000) || "No specific symptom documented.", aiAdviceSummary: "Review the full consultation transcript and current vitals. Continue prescribed hydration, rest, and monitoring protocols; escalate red-flag symptoms to Medical Operations.", riskLevel: anomalyScore >= 81 ? "Critical" : anomalyScore >= 41 ? "Moderate" : "Low", anomalyScore };
    const apiKey = env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = env.AI_API_BASE_URL || process.env.OPENAI_API_BASE;
    if (!apiKey || !baseUrl) return fallback;
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: env.AI_MODEL, temperature: 0.1, max_completion_tokens: 900, messages: [{ role: "system", content: "You are a clinical documentation assistant for a NASA Flight Surgeon. Summarize the complete consultation into valid JSON only with keys: symptoms, aiAdviceSummary, riskLevel (Low, Moderate, or Critical), anomalyScore. Never invent measurements, diagnoses, or treatments. Use the supplied transcript and vitals only." }, { role: "user", content: `Vitals and bio-sample snapshot:\n${JSON.stringify(vitals)}\n\nFull chat transcript:\n${transcript}` }] }) });
      if (!response.ok) return fallback;
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return parseJson(payload.choices?.[0]?.message?.content || "") || fallback;
    } catch { return fallback; }
  }
}
