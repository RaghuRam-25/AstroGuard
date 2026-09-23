export type RiskLevel = "LOW" | "WATCH" | "WARNING" | "CRITICAL" | "NORMAL";
export type ImpactLevel = "Moderate" | "Low" | "Normal";
export type Severity = "Watch" | "Warning" | "Critical" | "Normal";

export interface HealthMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  range: string;
  status: string;
  change: string;
  changeDirection: "up" | "down";
  icon: string;
}

export interface AnomalyData {
  score: number;
  maxScore: number;
  status: string;
  confidence: number;
  model: string;
  description: string;
}

export interface HealthTrendPoint {
  time: string;
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
}

export interface TrendSeries {
  "24h": HealthTrendPoint[];
  "7d": HealthTrendPoint[];
  "30d": HealthTrendPoint[];
  "90d": HealthTrendPoint[];
}

export interface AnomalyContributor {
  signal: string;
  change: string;
  impact: ImpactLevel;
  percentage: number;
}

export interface AlertItem {
  id: number;
  title: string;
  description: string;
  time: string;
  severity: Severity;
}

export interface RelatedMetric {
  label: string;
  value: string;
  status: string;
}

export interface HealthAlert extends AlertItem {
  signal: string;
  currentValue: string;
  baseline: string;
  deviation: string;
  relatedMetrics: RelatedMetric[];
  explanation: string;
  recommendations: string[];
}

export const healthAlerts: HealthAlert[] = [
  {
    id: 1,
    title: "Elevated Heart Rate",
    description: "Heart rate is slightly above the personal baseline.",
    time: "12 minutes ago",
    severity: "Watch",
    signal: "Heart Rate",
    currentValue: "72 BPM",
    baseline: "66 BPM",
    deviation: "+8.4%",
    relatedMetrics: [
      { label: "SpO₂", value: "98%", status: "Normal" },
      { label: "Sleep", value: "7.4 hrs", status: "Slightly Low" },
      { label: "Activity", value: "68%", status: "Normal" },
    ],
    explanation:
      "Your heart rate read 72 BPM, 8.4% above the personal 14-day baseline of 66 BPM. The elevation is small and stays within the mission band, with no correlated anomaly in SpO₂ or activity. The Isolation Forest model flagged a low-confidence deviation, which sets this alert to Watch.",
    recommendations: [
      "Rest and monitor heart rate",
      "Maintain proper hydration",
      "Continue monitoring for persistent deviation",
    ],
  },
  {
    id: 2,
    title: "Reduced Sleep Duration",
    description: "Sleep duration is below the recent personal average.",
    time: "2 hours ago",
    severity: "Warning",
    signal: "Sleep",
    currentValue: "7.4 hrs",
    baseline: "7.6 hrs",
    deviation: "-2.6%",
    relatedMetrics: [
      { label: "Heart Rate", value: "72 BPM", status: "Slightly High" },
      { label: "SpO₂", value: "98%", status: "Normal" },
      { label: "Activity", value: "68%", status: "Normal" },
    ],
    explanation:
      "Sleep duration of 7.4 hours is 2.6% below the recent personal average of 7.6 hours. The deficit is accumulating across consecutive days and is the primary contributor to the current anomaly score, so the system elevated this alert to Warning for closer attention ahead of intensive operations.",
    recommendations: [
      "Prioritize an additional 30 minutes of sleep recovery",
      "Advance lights-out before intensive EVA operations",
      "Report persistent decline to mission control",
    ],
  },
  {
    id: 3,
    title: "Activity Pattern Change",
    description: "Activity level shows a small deviation from the mission baseline.",
    time: "5 hours ago",
    severity: "Watch",
    signal: "Activity",
    currentValue: "68%",
    baseline: "71%",
    deviation: "-4.2%",
    relatedMetrics: [
      { label: "Heart Rate", value: "72 BPM", status: "Normal" },
      { label: "SpO₂", value: "98%", status: "Normal" },
      { label: "Sleep", value: "7.4 hrs", status: "Slightly Low" },
    ],
    explanation:
      "Activity level measured 68%, a 4.2% dip from the mission baseline of 71%. Physical load has been below the nominal rotation window over the last watch. The change is mild and correlated with the reduced sleep trend, so it is tracked as a Watch-level pattern rather than an immediate risk.",
    recommendations: [
      "Return to the nominal exercise rotation window",
      "Monitor activity load across the next mission block",
      "Review hydration intake around exercise sessions",
    ],
  },
  {
    id: 4,
    title: "SpO₂ Stable",
    description: "Blood oxygen level remains within the expected range.",
    time: "8 hours ago",
    severity: "Normal",
    signal: "SpO₂",
    currentValue: "98%",
    baseline: "98.2%",
    deviation: "-0.2%",
    relatedMetrics: [
      { label: "Heart Rate", value: "72 BPM", status: "Normal" },
      { label: "Sleep", value: "7.4 hrs", status: "Slightly Low" },
      { label: "Activity", value: "68%", status: "Normal" },
    ],
    explanation:
      "Blood oxygen saturation holds at 98%, effectively at the personal baseline of 98.2%. No downward trend was detected across the last 12 hours and no correlated ventilation change was seen, so the system confirms a stable, nominal status.",
    recommendations: [
      "Continue routine SpO₂ monitoring",
      "Maintain breathing calibration protocol",
      "No action required — continue nominal operations",
    ],
  },
];

export const alertFilters = ["All", "Watch", "Warning", "Critical", "Normal"] as const;

export interface BaselineRow {
  label: string;
  personal: string;
  mission: string;
}

export interface MissionInfo {
  mission: string;
  missionDay: number;
  crew: number;
  phase: string;
  status: string;
  statusLabel: string;
}

export interface AstronautProfile {
  name: string;
  id: string;
  mission: string;
  missionDay: number;
  missionPhase: string;
  role: string;
  status: string;
  email: string;
  clearance: string;
  suitProtocol: string;
  bio: string;
  dob: string;
  nationality: string;
  height: string;
  weight: string;
  bloodType: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export const astronaut: AstronautProfile = {
  name: "Alex Morgan",
  id: "AST-001",
  mission: "Ares Mission 01",
  missionDay: 142,
  missionPhase: "Surface Operations",
  role: "Commander",
  status: "ACTIVE",
  email: "alex.morgan@space.org",
  clearance: "Level 1 - Telemetry",
  suitProtocol: "Biometric Suit v3.2",
  bio: "Exploring new frontiers for a healthier tomorrow.",
  dob: "April 12, 1990",
  nationality: "American",
  height: "178 cm",
  weight: "75 kg",
  bloodType: "O+",
  phone: "+1 555 012 3456",
  emergencyContact: "Sarah Morgan",
  emergencyPhone: "+1 555 987 6543",
};

export const missionInfo: MissionInfo = {
  mission: "Ares Mission 01",
  missionDay: 142,
  crew: 6,
  phase: "Surface Operations",
  status: "Active",
  statusLabel: "ACTIVE",
};

export const healthMetrics: HealthMetric[] = [
  {
    id: "heartRate",
    label: "Heart Rate",
    value: 72,
    unit: "BPM",
    range: "60–100",
    status: "Normal",
    change: "+2.1%",
    changeDirection: "up",
    icon: "heart",
  },
  {
    id: "spo2",
    label: "SpO₂",
    value: 98,
    unit: "%",
    range: "95–100",
    status: "Normal",
    change: "+0.4%",
    changeDirection: "up",
    icon: "droplet",
  },
  {
    id: "sleep",
    label: "Sleep",
    value: 7.4,
    unit: "hrs",
    range: "7–9",
    status: "Good",
    change: "-5.2%",
    changeDirection: "down",
    icon: "moon",
  },
  {
    id: "activity",
    label: "Activity",
    value: 68,
    unit: "%",
    range: "50–80",
    status: "Normal",
    change: "+3.1%",
    changeDirection: "up",
    icon: "activity",
  },
];

export const anomalyData: AnomalyData = {
  score: 18,
  maxScore: 100,
  status: "LOW",
  confidence: 94.2,
  model: "Isolation Forest",
  description: "Based on personal baseline and mission baseline.",
};

export const healthTrend: TrendSeries = {
  "24h": [
    { time: "00:00", heartRate: 68, spo2: 98, sleep: 7.4, activity: 42 },
    { time: "04:00", heartRate: 65, spo2: 97, sleep: 7.2, activity: 25 },
    { time: "08:00", heartRate: 74, spo2: 98, sleep: 7.5, activity: 58 },
    { time: "12:00", heartRate: 78, spo2: 99, sleep: 7.6, activity: 72 },
    { time: "16:00", heartRate: 76, spo2: 98, sleep: 7.3, activity: 68 },
    { time: "20:00", heartRate: 72, spo2: 98, sleep: 7.4, activity: 55 },
    { time: "24:00", heartRate: 69, spo2: 98, sleep: 7.6, activity: 38 },
  ],
  "7d": [
    { time: "Mon", heartRate: 71, spo2: 98, sleep: 7.5, activity: 62 },
    { time: "Tue", heartRate: 73, spo2: 98, sleep: 7.3, activity: 66 },
    { time: "Wed", heartRate: 70, spo2: 97, sleep: 7.2, activity: 58 },
    { time: "Thu", heartRate: 75, spo2: 98, sleep: 7.6, activity: 72 },
    { time: "Fri", heartRate: 72, spo2: 98, sleep: 7.4, activity: 68 },
    { time: "Sat", heartRate: 77, spo2: 99, sleep: 7.0, activity: 74 },
    { time: "Sun", heartRate: 74, spo2: 98, sleep: 7.4, activity: 65 },
  ],
  "30d": [
    { time: "W1", heartRate: 71, spo2: 98, sleep: 7.4, activity: 60 },
    { time: "W2", heartRate: 72, spo2: 98, sleep: 7.5, activity: 63 },
    { time: "W3", heartRate: 70, spo2: 97, sleep: 7.3, activity: 61 },
    { time: "W4", heartRate: 73, spo2: 98, sleep: 7.6, activity: 66 },
    { time: "W5", heartRate: 74, spo2: 98, sleep: 7.2, activity: 70 },
    { time: "W6", heartRate: 72, spo2: 99, sleep: 7.5, activity: 68 },
    { time: "W7", heartRate: 73, spo2: 98, sleep: 7.4, activity: 69 },
    { time: "W8", heartRate: 71, spo2: 98, sleep: 7.1, activity: 66 },
    { time: "W9", heartRate: 75, spo2: 98, sleep: 7.3, activity: 71 },
    { time: "W10", heartRate: 72, spo2: 98, sleep: 7.5, activity: 68 },
  ],
  "90d": [
    { time: "W1", heartRate: 71, spo2: 98, sleep: 7.5, activity: 62 },
    { time: "W2", heartRate: 72, spo2: 98, sleep: 7.4, activity: 64 },
    { time: "W3", heartRate: 70, spo2: 97, sleep: 7.3, activity: 60 },
    { time: "W4", heartRate: 73, spo2: 98, sleep: 7.5, activity: 66 },
    { time: "W5", heartRate: 72, spo2: 98, sleep: 7.2, activity: 63 },
    { time: "W6", heartRate: 74, spo2: 99, sleep: 7.6, activity: 68 },
    { time: "W7", heartRate: 71, spo2: 98, sleep: 7.4, activity: 65 },
    { time: "W8", heartRate: 73, spo2: 98, sleep: 7.3, activity: 67 },
    { time: "W9", heartRate: 75, spo2: 98, sleep: 7.2, activity: 70 },
    { time: "W10", heartRate: 72, spo2: 97, sleep: 7.5, activity: 68 },
    { time: "W11", heartRate: 71, spo2: 98, sleep: 7.4, activity: 64 },
    { time: "W12", heartRate: 74, spo2: 98, sleep: 7.3, activity: 69 },
    { time: "W13", heartRate: 73, spo2: 98, sleep: 7.4, activity: 67 },
  ],
};

export const anomalyContributors: AnomalyContributor[] = [
  { signal: "Heart Rate", change: "+8.4%", impact: "Moderate", percentage: 84 },
  { signal: "Sleep Duration", change: "-5.2%", impact: "Low", percentage: 52 },
  { signal: "Activity Level", change: "+3.1%", impact: "Low", percentage: 31 },
  { signal: "SpO₂", change: "+0.4%", impact: "Normal", percentage: 8 },
];

export const alerts: AlertItem[] = [
  {
    id: 1,
    title: "Elevated Heart Rate",
    description: "Heart rate is slightly above the personal baseline.",
    time: "12 minutes ago",
    severity: "Watch",
  },
  {
    id: 2,
    title: "Reduced Sleep Duration",
    description: "Sleep duration is below the recent personal average.",
    time: "2 hours ago",
    severity: "Warning",
  },
  {
    id: 3,
    title: "Activity Pattern Change",
    description: "Activity level shows a small deviation from the mission baseline.",
    time: "5 hours ago",
    severity: "Watch",
  },
  {
    id: 4,
    title: "SpO₂ Stable",
    description: "Blood oxygen level remains within the expected range.",
    time: "8 hours ago",
    severity: "Normal",
  },
];

export const baselineComparison: BaselineRow[] = [
  { label: "Heart Rate", personal: "72 BPM", mission: "70 BPM" },
  { label: "SpO₂", personal: "98%", mission: "97%" },
  { label: "Sleep", personal: "7.4 hrs", mission: "7.8 hrs" },
  { label: "Activity", personal: "68%", mission: "65%" },
];

export const healthTrendSparklines: Record<string, number[]> = {
  heartRate: [71, 72, 69, 74, 73, 76, 72, 75, 72, 74, 71, 72],
  spo2: [98, 98, 97, 98, 99, 98, 98, 99, 98, 98, 97, 98],
  sleep: [7.6, 7.4, 7.2, 7.5, 7.8, 7.1, 7.4, 7.0, 7.3, 7.2, 7.5, 7.4],
  activity: [61, 64, 60, 67, 66, 70, 65, 69, 68, 72, 66, 68],
};

export const aiHealthInsight = {
  summary:
    "Your current health signals are generally stable. Heart rate shows a small deviation from your personal baseline, while SpO₂ remains stable. Sleep duration is slightly below your recent average.",
  disclaimer: "AI-generated monitoring insight. Not a medical diagnosis.",
};

export const quickActions = [
  { label: "Enter Health Data", href: "/astronaut/data-input" },
  { label: "View AI Analysis", href: "/astronaut/ai-analysis" },
  { label: "Scan RFID Meal Pack", href: "/astronaut/dashboard" },
  { label: "View Health History", href: "/astronaut/health" },
];

export const healthLogs = [
  {
    id: 1,
    time: "Mission Day 142 · 06:00 UTC",
    heartRate: 68,
    spo2: 98,
    sleep: 7.4,
    activity: 45,
    source: "Suit Sensor v3.2",
  },
  {
    id: 2,
    time: "Mission Day 142 · 10:00 UTC",
    heartRate: 74,
    spo2: 98,
    sleep: 7.4,
    activity: 58,
    source: "Suit Sensor v3.2",
  },
  {
    id: 3,
    time: "Mission Day 142 · 14:00 UTC",
    heartRate: 78,
    spo2: 99,
    sleep: 7.4,
    activity: 72,
    source: "Suit Sensor v3.2",
  },
  {
    id: 4,
    time: "Mission Day 141 · 22:00 UTC",
    heartRate: 72,
    spo2: 98,
    sleep: 7.5,
    activity: 66,
    source: "Manual Telemetry Console",
  },
  {
    id: 5,
    time: "Mission Day 141 · 06:00 UTC",
    heartRate: 70,
    spo2: 98,
    sleep: 7.6,
    activity: 50,
    source: "Suit Sensor v3.2",
  },
  {
    id: 6,
    time: "Mission Day 140 · 22:00 UTC",
    heartRate: 71,
    spo2: 98,
    sleep: 7.3,
    activity: 68,
    source: "Manual Telemetry Console",
  },
];

export const aiRecommendations = [
  "Maintain current hydration and exercise protocol — trajectory is nominal.",
  "Monitor heart rate during the next scheduled EVA window to confirm baseline return.",
  "Prioritize an additional 30 minutes of sleep recovery before intensive operations.",
];

export const allAlerts: AlertItem[] = [
  { id: 1, title: "Elevated Heart Rate", description: "Heart rate is slightly above the personal baseline.", time: "12 minutes ago", severity: "Watch" },
  { id: 2, title: "Reduced Sleep Duration", description: "Sleep duration is below the recent personal average.", time: "2 hours ago", severity: "Warning" },
  { id: 3, title: "Activity Pattern Change", description: "Activity level shows a small deviation from the mission baseline.", time: "5 hours ago", severity: "Watch" },
  { id: 4, title: "SpO₂ Stable", description: "Blood oxygen level remains within the expected range.", time: "8 hours ago", severity: "Normal" },
  { id: 5, title: "Circadian Rhythm Consistent", description: "Sleep-wake cycle aligned with mission schedule over the past week.", time: "1 day ago", severity: "Normal" },
  { id: 6, title: "EVA Prep Strain", description: "Pre-EVA physical load briefly elevated but recovering as expected.", time: "1 day ago", severity: "Watch" },
  { id: 7, title: "Hydration Indicator", description: "In-suit hydration flag reported within nominal band.", time: "2 days ago", severity: "Normal" },
  { id: 8, title: "Recovery Complete", description: "Post-EVA recovery markers returned to personal baseline.", time: "2 days ago", severity: "Normal" },
];

export const healthOverviewStatus = [
  { label: "Heart Rate", status: "Normal", dot: "success" },
  { label: "SpO₂", status: "Normal", dot: "success" },
  { label: "Sleep", status: "Good", dot: "primary" },
  { label: "Activity", status: "Normal", dot: "success" },
] as const;

export interface AnalysisHistoryEntry {
  id: number;
  timestamp: string;
  anomalyScore: number;
  status: "NORMAL" | "LOW" | "WATCH" | "WARNING";
  model: string;
  summary: string;
}

export const analysisHistory: AnalysisHistoryEntry[] = [
  {
    id: 4,
    timestamp: "Apr 28, 2025 · 06:00 UTC",
    anomalyScore: 18,
    status: "LOW",
    model: "Isolation Forest",
    summary: "All signals within expected ranges.",
  },
  {
    id: 3,
    timestamp: "Apr 27, 2025 · 14:00 UTC",
    anomalyScore: 31,
    status: "WATCH",
    model: "Isolation Forest",
    summary: "Heart rate slightly above personal baseline.",
  },
  {
    id: 2,
    timestamp: "Apr 26, 2025 · 22:00 UTC",
    anomalyScore: 12,
    status: "LOW",
    model: "Isolation Forest",
    summary: "Nominal. No contributing signals detected.",
  },
  {
    id: 1,
    timestamp: "Apr 25, 2025 · 10:00 UTC",
    anomalyScore: 44,
    status: "WATCH",
    model: "Isolation Forest",
    summary: "Sleep duration below recent personal average.",
  },
];