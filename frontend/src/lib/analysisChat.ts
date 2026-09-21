// AI Analysis assistant — domain types, mock fallback engine, and payload builders.
// When the backend is reachable, the page posts to /api/analysis/chat and uses the
// returned response. Everything in this module only acts as a typed demo fallback.

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
  analysis?: AnalysisResponse;
  voice?: boolean;
  createdAt: number;
}

const MODEL = "Isolation Forest";

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
  "I compared your latest reading against your personal 14-day baseline and the ARES-01 mission baseline using an Isolation Forest model. No signal crossed the anomaly threshold — the whole-body anomaly score is 18/100 (Low). Your physiology is operating nominally for Mission Day 142.";

function followUps(): string[] {
  return [
    "Why is my heart rate elevated?",
    "How can I improve my sleep?",
    "What do my trends show?",
  ];
}

function buildResponse(
  s: LatestHealthSnapshot,
  overrides: Partial<AnalysisResponse> = {}
): AnalysisResponse {
  return {
    id: `analysis-${Date.now().toString(36)}`,
    createdAt: "Apr 28, 2025 · 06:15 UTC",
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

function heartRateFindings(s: LatestHealthSnapshot): KeyFinding[] {
  return [
    {
      metric: "heartRate",
      label: "Heart Rate",
      severity: "Elevated",
      detail: "72 BPM is within range but trending above your 70.5 BPM personal average.",
      value: `${s.heartRate} BPM`,
      range: "60-100 BPM",
    },
    {
      metric: "spo2",
      label: "SpO₂",
      severity: "Normal",
      detail: "Oxygen saturation remains stable.",
      value: `${s.spo2}%`,
      range: "95-100%",
    },
    DEFAULT_FINDINGS[2],
    DEFAULT_FINDINGS[3],
  ];
}

function sleepFindings(s: LatestHealthSnapshot): KeyFinding[] {
  return [
    {
      metric: "sleep",
      label: "Sleep Duration",
      severity: "Watch",
      detail: "7.4 hrs is 0.2 hrs below your recent 14-day average of 7.6 hrs.",
      value: `${s.sleep} hrs`,
      range: "7-9 hrs",
    },
    DEFAULT_FINDINGS[0],
    DEFAULT_FINDINGS[1],
    DEFAULT_FINDINGS[3],
  ];
}

function trendsFindings(s: LatestHealthSnapshot): KeyFinding[] {
  return [
    DEFAULT_FINDINGS[0],
    DEFAULT_FINDINGS[1],
    {
      metric: "sleep",
      label: "Sleep Duration",
      severity: "Normal",
      detail: "Seven-day sleep trend is recovering toward your personal average.",
      value: `${s.sleep} hrs`,
      range: "7-9 hrs",
    },
    {
      metric: "activity",
      label: "Activity Level",
      severity: "Normal",
      detail: "Activity cadence consistent with EVA recovery windows.",
      value: `${s.activity}%`,
      range: "50-85%",
    },
  ];
}

function sleepRecommendations(): Recommendation[] {
  return [
    {
      title: "Light exposure reset",
      detail: "Align with the mission 22:00 UTC lights-out protocol to anchor circadian rhythm.",
    },
    {
      title: "Wind-down routine",
      detail: "Reduce blue-light exposure and screen time 45 minutes before rest.",
    },
    {
      title: "Recovery window",
      detail: "Add one rest cycle this mission day to recover the 0.2 hr deficit.",
    },
  ];
}

function heartRateRecommendations(): Recommendation[] {
  return [
    {
      title: "Resting measurement",
      detail: "Take a seated resting reading 10 minutes into your next wake window.",
    },
    {
      title: "Hydration",
      detail: "Confirm hydration protocol compliance, monitor over the next 6 hours.",
    },
    {
      title: "EVA sequencing",
      detail: "Schedule the next surface EVA after heart rate returns below 74 BPM.",
    },
  ];
}

export function generateAnalysisReply(
  question: string,
  s: LatestHealthSnapshot
): AnalysisResponse {
  const q = question.toLowerCase();

  if (q.includes("sleep")) {
    return buildResponse(s, {
      status: "WATCH",
      statusLabel: "Watch",
      anomalyScore: 34,
      confidence: 91.7,
      keyFindings: sleepFindings(s),
      recommendations: sleepRecommendations(),
      explanation:
        "Sleep duration is the only signal outside your 14-day personal average. I compared your 7.4 hrs against a 7.6 hrs personal baseline and the 7.0 hrs mission standard. The Isolation Forest model flags this as a mild deviation, not an anomaly. Recovery-focused adjustments should normalize the trend within the next mission day.",
    });
  }

  if (q.includes("heart rate") || q.includes("elevated") || q.includes("palp") || q.includes("hr ")) {
    return buildResponse(s, {
      status: "WATCH",
      statusLabel: "Watch",
      anomalyScore: 31,
      confidence: 93.1,
      keyFindings: heartRateFindings(s),
      recommendations: heartRateRecommendations(),
      explanation:
        "Your heart rate of 72 BPM sits above the 70.5 BPM personal baseline but well inside the 60-100 BPM clinical range. SpO₂, sleep and activity show no correlated anomalies. Elevated readings of this magnitude are commonly explained by hydration state, recent physical load or EVA scheduling. The model currently rates this as Watch — not a risk to mission readiness.",
    });
  }

  if (q.includes("trend")) {
    return buildResponse(s, {
      status: "LOW",
      statusLabel: "Low risk",
      anomalyScore: 21,
      confidence: 93.8,
      keyFindings: trendsFindings(s),
      recommendations: DEFAULT_RECOMMENDATIONS,
      explanation:
        "Over the last 14 days your signals track a consistent, recoverable pattern. Heart rate oscillates ±3 BPM around 72 due to EVA activity; SpO₂ holds a flat 98%; sleep recovered from 7.1 to 7.4 hrs after the last surface operation; activity alternates between suit telemetry and manual entry with no drift. The anomaly score of 21/100 is Low.",
    });
  }

  return buildResponse(s);
}

export function speechTextFor(response: AnalysisResponse): string {
  const findings = response.keyFindings
    .map((f) => `${f.label}: ${f.detail}`)
    .join(". ");
  const recommendations = response.recommendations
    .map((r) => `${r.title}. ${r.detail}`)
    .join(". ");
  return `Overall health status ${response.statusLabel}. Anomaly score ${response.anomalyScore} out of 100. Confidence ${response.confidence} percent. Key findings. ${findings}. Recommendations. ${recommendations}.`;
}