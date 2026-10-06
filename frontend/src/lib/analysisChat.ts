// AI Analysis assistant — domain types, mock fallback engine, and payload builders.
// When the backend is reachable, the page posts to /api/analysis/chat and uses the
// returned Gemini / AI response. Everything in this module acts as a typed fallback.

export interface LatestHealthSnapshot {
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
}

export const LATEST_SNAPSHOT: LatestHealthSnapshot = {
  heartRate: 72,
  spo2: 98,
  sleep: 7.4,
  activity: 68,
};

export const SNAPSHOT_UNITS: Record<keyof LatestHealthSnapshot, string> = {
  heartRate: "BPM",
  spo2: "%",
  sleep: "hrs",
  activity: "%",
};

export type RiskStatus = "NORMAL" | "LOW" | "WATCH" | "WARNING";

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

export interface Recommendation {
  title: string;
  detail: string;
}

export interface AnalysisResponse {
  id: string;
  createdAt: string;
  status: RiskStatus;
  statusLabel: string;
  anomalyScore: number;
  confidence: number;
  model: string;
  keyFindings: KeyFinding[];
  personalBaseline: BaselineMetric[];
  missionBaseline: BaselineMetric[];
  explanation: string;
  recommendations: Recommendation[];
  followUps: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  analysis?: AnalysisResponse | null;
  voice?: boolean;
  createdAt: number;
}

const MODEL = "AstroGuard Grounded Health Intelligence";

function personalBaseline(s: LatestHealthSnapshot): BaselineMetric[] {
  return [
    {
      name: "Heart Rate",
      current: `${s.heartRate} BPM`,
      baseline: "70.5 BPM",
      delta: "+2.1%",
      direction: "up",
    },
    {
      name: "SpO₂",
      current: `${s.spo2}%`,
      baseline: "98.2%",
      delta: "-0.2%",
      direction: "same",
    },
    {
      name: "Sleep",
      current: `${s.sleep} hrs`,
      baseline: "7.6 hrs",
      delta: "-2.6%",
      direction: "down",
    },
    {
      name: "Activity",
      current: `${s.activity}%`,
      baseline: "71%",
      delta: "-4.2%",
      direction: "down",
    },
  ];
}

function missionBaseline(s: LatestHealthSnapshot): BaselineMetric[] {
  return [
    {
      name: "Heart Rate",
      current: `${s.heartRate} BPM`,
      baseline: "74 BPM",
      delta: "-2.7%",
      direction: "same",
    },
    {
      name: "SpO₂",
      current: `${s.spo2}%`,
      baseline: "97.8%",
      delta: "+0.2%",
      direction: "same",
    },
    {
      name: "Sleep",
      current: `${s.sleep} hrs`,
      baseline: "7.0 hrs",
      delta: "+5.7%",
      direction: "up",
    },
    {
      name: "Activity",
      current: `${s.activity}%`,
      baseline: "65%",
      delta: "+4.6%",
      direction: "up",
    },
  ];
}

const DEFAULT_FINDINGS: KeyFinding[] = [
  {
    metric: "heartRate",
    label: "Heart Rate",
    severity: "Normal",
    detail: "Within your personal and mission ranges.",
    value: "72 BPM",
    range: "60-100 BPM",
  },
  {
    metric: "spo2",
    label: "SpO₂",
    severity: "Normal",
    detail: "Saturation stable over the last 12 hours.",
    value: "98%",
    range: "95-100%",
  },
  {
    metric: "sleep",
    label: "Sleep Duration",
    severity: "Watch",
    detail: "0.2 hrs below your recent 14-day average.",
    value: "7.4 hrs",
    range: "7-9 hrs",
  },
  {
    metric: "activity",
    label: "Activity Level",
    severity: "Normal",
    detail: "Matches the mission activity standard.",
    value: "68%",
    range: "50-85%",
  },
];

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    title: "Hydration & recovery",
    detail: "Maintain your current hydration and exercise protocol — trajectory is nominal.",
  },
  {
    title: "Monitor morning vitals",
    detail: "Confirm heart rate returns to baseline during the next scheduled wake window.",
  },
  {
    title: "Extra sleep recovery",
    detail: "Add 30 minutes of sleep before intensive operations to restore recent average.",
  },
];

const DEFAULT_EXPLANATION =
  "I compared your latest reading against your personal 14-day baseline and the ARES-01 mission baseline. No signal crossed the anomaly threshold — the whole-body anomaly score is 18/100 (Low). Your physiology is operating nominally.";

function followUps(): string[] {
  return [
    "What do my latest trends show?",
    "How can I improve my hydration?",
    "Why is my heart rate elevated?",
  ];
}

export function buildResponse(
  s: LatestHealthSnapshot,
  overrides: Partial<AnalysisResponse> = {}
): AnalysisResponse {
  return {
    id: `analysis-${Date.now().toString(36)}`,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: "LOW",
    statusLabel: "Low risk",
    anomalyScore: 18,
    confidence: 94.2,
    model: MODEL,
    keyFindings: DEFAULT_FINDINGS,
    personalBaseline: personalBaseline(s),
    missionBaseline: missionBaseline(s),
    explanation: DEFAULT_EXPLANATION,
    recommendations: DEFAULT_RECOMMENDATIONS,
    followUps: followUps(),
    ...overrides,
  };
}

export function generateAnalysisReply(
  question: string,
  s: LatestHealthSnapshot
): { answer: string; analysis?: AnalysisResponse | null } {
  const q = question.toLowerCase().trim();
  const cleanQ = q.replace(/[?!.,;:']/g, " ").replace(/\s+/g, " ").trim();

  // 1. General conversation
  if (
    cleanQ === "hi" || cleanQ === "hello" || cleanQ === "hey" ||
    cleanQ.includes("how are you") || cleanQ.includes("who are you") ||
    cleanQ.includes("what can you do") || cleanQ.includes("joke") || cleanQ.includes("thank")
  ) {
    if (cleanQ.includes("how are you")) {
      return {
        answer: "I'm doing well, thank you for asking! All systems are operational and I'm ready to assist you. What would you like to know?",
        analysis: null,
      };
    }
    if (cleanQ.includes("joke")) {
      return {
        answer: "Why did the astronaut break up with the alien? Because they needed a little more space! 🚀",
        analysis: null,
      };
    }
    return {
      answer: "Hello! I am your AstroGuard AI Assistant. How can I help you today?",
      analysis: null,
    };
  }

  // 2. Specific single metrics
  if (cleanQ.includes("heart rate") || cleanQ.includes("pulse") || cleanQ.includes("hr")) {
    return {
      answer: `Based on the latest data in AstroGuard, your current heart rate is **${s.heartRate} BPM** (nominal resting range: 60–100 BPM).`,
      analysis: null,
    };
  }

  if (cleanQ.includes("spo2") || cleanQ.includes("oxygen")) {
    return {
      answer: `Based on the latest data in AstroGuard, your blood oxygen saturation (SpO₂) is **${s.spo2}%** (nominal range: 95–100%).`,
      analysis: null,
    };
  }

  if (cleanQ.includes("sleep")) {
    return {
      answer: `Based on your latest records in AstroGuard, your sleep duration is **${s.sleep} hours** (mission target: 7.0–9.0 hours).`,
      analysis: null,
    };
  }

  if (cleanQ.includes("hydration") || cleanQ.includes("water")) {
    return {
      answer: "Based on current AstroGuard records, your estimated daily fluid intake is **1.65 L** against your **2.80 L** target (59% completed). Hydration status remains nominal.",
      analysis: null,
    };
  }

  // 3. General knowledge / science
  if (cleanQ.includes("dijkstra") || cleanQ.includes("algorithm") || cleanQ.includes("gravity") || cleanQ.includes("machine learning") || cleanQ.includes("photosynthesis")) {
    if (cleanQ.includes("dijkstra")) {
      return {
        answer: "**Dijkstra's Algorithm** finds the shortest paths between nodes in a weighted graph with non-negative edge weights using a greedy priority queue approach.",
        analysis: null,
      };
    }
    return {
      answer: `Here is information on **${question}**: This is a fundamental concept in science and computation.`,
      analysis: null,
    };
  }

  // 4. Holistic health analysis
  const analysis = buildResponse(s);
  return {
    answer: "### Health Status Analysis\n\nBased on your latest data in AstroGuard, all primary biometrics (Heart Rate, SpO₂, Sleep, Activity) are nominal and consistent with mission baselines.",
    analysis,
  };
}

export function speechTextFor(analysisOrText: AnalysisResponse | string): string {
  if (typeof analysisOrText === "string") {
    // strip markdown asterisks/headers for clean speech
    return analysisOrText.replace(/[#*`_]/g, "").trim();
  }
  const findings = (analysisOrText.keyFindings || [])
    .map((f) => `${f.label}: ${f.detail}`)
    .join(". ");
  const recommendations = (analysisOrText.recommendations || [])
    .map((r) => `${r.title}. ${r.detail}`)
    .join(". ");
  return `Overall health status ${analysisOrText.statusLabel}. Anomaly score ${analysisOrText.anomalyScore} out of 100. Key findings: ${findings}. Recommendations: ${recommendations}.`;
}