export type TriageLevel = "CRITICAL" | "WARNING" | "NOMINAL";

export interface CrewMember {
  astronautId: string;
  name: string;
  role?: string;
  mission?: string;
  missionDay?: number;
  missionPhase?: string;
  status?: string;
  avatar?: string;
  latestHealth?: {
    heartRate?: number;
    spo2?: number;
    sleep?: number;
    activity?: number;
    timestamp?: string;
  };
  latestAnalysis?: {
    riskLevel?: string;
    anomalyScore?: number;
    confidence?: number;
    createdAt?: string;
  };
  unresolvedAlerts: number;
}

export interface MedicalAlert {
  _id?: string;
  id?: string;
  astronautId: string;
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  signal?: string;
  value?: number | string;
  baseline?: number | string;
  resolved?: boolean;
  createdAt?: string;
}

export interface Recommendation {
  _id: string;
  astronautId: string;
  doctorId: string;
  doctorName: string;
  message: string;
  source: "AI" | "Doctor";
  tone: "calm" | "preventive" | "urgent";
  approvedByDoctor?: string;
  readAt?: string | null;
  createdAt: string;
}

export interface CommunicationPeer {
  id: string;
  name: string;
  email: string;
  role: "astronaut" | "medical_officer";
  astronautId?: string;
}

export interface ChatMessage {
  _id?: string;
  id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: "text" | "voice" | "file";
  attachments?: Array<{ name: string; type: string; url: string; size?: number }>;
  timestamp?: string;
  readAt?: string;
}

export function triageFromSeverity(severity?: string): TriageLevel {
  if (severity === "Critical") return "CRITICAL";
  if (severity === "Warning" || severity === "Watch") return "WARNING";
  return "NOMINAL";
}

export function triageFromRisk(riskLevel?: string): TriageLevel {
  if (riskLevel === "Critical") return "CRITICAL";
  if (riskLevel === "Warning" || riskLevel === "Watch") return "WARNING";
  return "NOMINAL";
}