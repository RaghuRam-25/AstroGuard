export interface AstronautProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  mission: string;
  missionDay: number;
  missionPhase: "Transit" | "Orbital Ops" | "Lunar Surface" | "Deep Space";
  status: "Nominal" | "Elevated Deviation" | "Post-EVA Recovery";
  anomalyScore: number;
  riskLevel: "Low" | "Watch" | "Warning" | "Critical";
  deviationStarted?: string;
  confidence: number;
  model: string;
  healthMetrics: {
    heartRate: { value: number; unit: string; status: string; change: string; trend: string };
    spo2: { value: number; unit: string; status: string; change: string; trend: string };
    sleep: { value: number; unit: string; status: string; change: string; trend: string };
    activity: { value: number; unit: string; status: string; change: string; trend: string };
  };
  baselineComparison: {
    personal: { heartRate: string; spo2: string; sleep: string; activity: string };
    mission: { heartRate: string; spo2: string; sleep: string; activity: string };
    personalDev: number; // e.g. 0.78
    missionDev: number; // e.g. 0.64
    trendDev: number; // e.g. 0.81
  };
  anomalyContributors: {
    signal: string;
    change: string;
    impact: "High" | "Moderate" | "Low" | "Normal";
    percentage: number;
    description: string;
  }[];
  explanation: {
    headline: string;
    summary: string;
    changePointDetails: string;
    safetyNote: string;
  };
}

export const astronauts: AstronautProfile[] = [
  {
    id: "AST-001",
    name: "Alex Morgan",
    role: "Commander",
    avatar: "AM",
    mission: "Ares Mission 01",
    missionDay: 142,
    missionPhase: "Transit",
    status: "Nominal",
    anomalyScore: 18,
    riskLevel: "Low",
    confidence: 94.2,
    model: "Multi-Variate Isolation Forest",
    healthMetrics: {
      heartRate: { value: 72, unit: "BPM", status: "Normal", change: "+2.1%", trend: "Stable" },
      spo2: { value: 98.2, unit: "%", status: "Normal", change: "+0.4%", trend: "Stable" },
      sleep: { value: 7.4, unit: "hrs", status: "Good", change: "-5.2%", trend: "Consistent" },
      activity: { value: 68, unit: "%", status: "Normal", change: "+3.1%", trend: "Nominal" },
    },
    baselineComparison: {
      personal: { heartRate: "70 BPM", spo2: "98.0%", sleep: "7.6 hrs", activity: "65%" },
      mission: { heartRate: "72 BPM", spo2: "97.8%", sleep: "7.8 hrs", activity: "62%" },
      personalDev: 0.12,
      missionDev: 0.15,
      trendDev: 0.18,
    },
    anomalyContributors: [
      { signal: "Heart Rate", change: "+2.8%", impact: "Low", percentage: 22, description: "Minimal drift within normal resting window" },
      { signal: "Sleep Duration", change: "-2.6%", impact: "Low", percentage: 18, description: "Sleep stages aligned with circadian rhythm" },
      { signal: "Activity Level", change: "+3.1%", impact: "Low", percentage: 14, description: "Consistent daily exercise protocol" },
      { signal: "SpO₂ Oxygen", change: "+0.2%", impact: "Normal", percentage: 8, description: "Oxygenation levels perfectly stable" },
    ],
    explanation: {
      headline: "Nominal Physiological Baseline",
      summary: "Current physiological markers are tightly aligned with Alex Morgan's calibrated 90-day personal baseline and the transit cohort mean.",
      changePointDetails: "No statistically significant change-point detected in the last 72 hours.",
      safetyNote: "AI-generated monitoring signal, not a medical diagnosis. Continuous passive telemetry active.",
    },
  },
  {
    id: "AST-002",
    name: "Sarah Chen",
    role: "Flight Engineer",
    avatar: "SC",
    mission: "Ares Mission 01",
    missionDay: 18,
    missionPhase: "Orbital Ops",
    status: "Elevated Deviation",
    anomalyScore: 87,
    riskLevel: "Critical",
    deviationStarted: "Mission Day 18, 14:20 UTC",
    confidence: 96.8,
    model: "Multi-Variate Isolation Forest + Change-Point",
    healthMetrics: {
      heartRate: { value: 89, unit: "BPM", status: "Elevated", change: "+18.0%", trend: "Rising" },
      spo2: { value: 94.5, unit: "%", status: "Decreased", change: "-3.5%", trend: "Declining" },
      sleep: { value: 5.3, unit: "hrs", status: "Disrupted", change: "-2.1 hrs", trend: "Fragmented" },
      activity: { value: 38, unit: "%", status: "Suppressed", change: "-42.0%", trend: "Reduced" },
    },
    baselineComparison: {
      personal: { heartRate: "68 BPM", spo2: "98.5%", sleep: "7.4 hrs", activity: "70%" },
      mission: { heartRate: "72 BPM", spo2: "97.5%", sleep: "7.2 hrs", activity: "65%" },
      personalDev: 0.78,
      missionDev: 0.64,
      trendDev: 0.81,
    },
    anomalyContributors: [
      { signal: "Activity Level", change: "-42.0%", impact: "High", percentage: 78, description: "Sharp drop in routine mobility and EVA prep stamina" },
      { signal: "Heart Rate", change: "+18.0%", impact: "High", percentage: 68, description: "Resting tachycardia while physical activity is suppressed (Inverse Covariance)" },
      { signal: "SpO₂ Oxygen", change: "-3.5%", impact: "High", percentage: 55, description: "Consistent downward drift below personal threshold" },
      { signal: "Sleep Disruption", change: "-2.1 hrs", impact: "Moderate", percentage: 42, description: "Severe deep-sleep deprivation over last 48 hours" },
    ],
    explanation: {
      headline: "EARLY PHYSIOLOGICAL DEVIATION DETECTED",
      summary: "Multi-signal anomaly detected: Persistent cross-signal divergence between elevated resting heart rate (+18%) and severe activity reduction (-42%) combined with progressive SpO₂ decrease (-3.5%).",
      changePointDetails: "Deviation began: Mission Day 18, 14:20 UTC (Identified 36 hours before single-variable clinical threshold breach).",
      safetyNote: "AI-generated monitoring signal, not a medical diagnosis. Medical Officer review recommended.",
    },
  },
  {
    id: "AST-003",
    name: "James Wilson",
    role: "Payload Specialist",
    avatar: "JW",
    mission: "Ares Mission 01",
    missionDay: 45,
    missionPhase: "Lunar Surface",
    status: "Post-EVA Recovery",
    anomalyScore: 42,
    riskLevel: "Watch",
    deviationStarted: "Mission Day 44, 21:10 UTC",
    confidence: 91.5,
    model: "Multi-Variate Isolation Forest",
    healthMetrics: {
      heartRate: { value: 79, unit: "BPM", status: "Mild Elevation", change: "+9.2%", trend: "Recovering" },
      spo2: { value: 97.2, unit: "%", status: "Normal", change: "-0.8%", trend: "Stable" },
      sleep: { value: 6.5, unit: "hrs", status: "Fair", change: "-0.9 hrs", trend: "Improving" },
      activity: { value: 78, unit: "%", status: "High (EVA)", change: "+15.0%", trend: "Tapering" },
    },
    baselineComparison: {
      personal: { heartRate: "71 BPM", spo2: "98.0%", sleep: "7.5 hrs", activity: "68%" },
      mission: { heartRate: "74 BPM", spo2: "97.0%", sleep: "7.0 hrs", activity: "72%" },
      personalDev: 0.38,
      missionDev: 0.22,
      trendDev: 0.44,
    },
    anomalyContributors: [
      { signal: "Activity Level", change: "+15.0%", impact: "Moderate", percentage: 48, description: "High physical output following 6-hour Lunar Surface EVA" },
      { signal: "Heart Rate", change: "+9.2%", impact: "Moderate", percentage: 38, description: "Normal post-exertion cardiovascular elevation" },
      { signal: "Sleep Disruption", change: "-0.9 hrs", impact: "Low", percentage: 24, description: "Post-shift circadian shift" },
      { signal: "SpO₂ Oxygen", change: "-0.8%", impact: "Normal", percentage: 12, description: "Nominal recovery oxygenation" },
    ],
    explanation: {
      headline: "Post-EVA Exertion & Recovery Curve",
      summary: "Mild anomaly score (42/100) reflects expected physical fatigue and cardiovascular recovery following Lunar EVA operations. Cross-referenced successfully with mission EVA timeline.",
      changePointDetails: "Deviation onset: Mission Day 44, 21:10 UTC (Matches EVA egress event).",
      safetyNote: "AI-generated monitoring signal, not a medical diagnosis. Expected return to personal baseline within 18 hours.",
    },
  },
];

// Active default profile
export const astronaut = astronauts[0];
export const healthMetrics = astronaut.healthMetrics;
export const anomalyData = {
  score: astronaut.anomalyScore,
  status: astronaut.riskLevel,
  confidence: astronaut.confidence,
  model: astronaut.model,
};
export const anomalyContributors = astronaut.anomalyContributors;
export const baselineComparison = astronaut.baselineComparison;

export const alerts = [
  {
    id: 1,
    astronaut: "Sarah Chen",
    title: "Multi-Signal Cross-Divergence",
    description: "Resting heart rate elevation (+18%) co-occurring with acute activity collapse (-42%) and SpO₂ decrease (-3.5%).",
    severity: "Critical",
    time: "Mission Day 18, 14:20 UTC",
    score: 87,
  },
  {
    id: 2,
    astronaut: "Sarah Chen",
    title: "Sleep Architecture Fragmentation",
    description: "Deep sleep duration reduced by 2.1 hours below 30-day personal baseline.",
    severity: "Warning",
    time: "6 hours ago",
    score: 65,
  },
  {
    id: 3,
    astronaut: "James Wilson",
    title: "Post-EVA Cardiovascular Recovery",
    description: "Heart rate elevation aligned with scheduled Lunar Surface EVA egress.",
    severity: "Watch",
    time: "Mission Day 44, 21:10 UTC",
    score: 42,
  },
  {
    id: 4,
    astronaut: "Alex Morgan",
    title: "Nominal Orbital Baseline",
    description: "All telemetry within 95% confidence corridor of calibrated personal resting baseline.",
    severity: "Normal",
    time: "10 minutes ago",
    score: 18,
  },
];

export const missionPhases = [
  { id: "all", label: "All Phases" },
  { id: "Transit", label: "Phase 1: Transit" },
  { id: "Orbital Ops", label: "Phase 2: Orbital Ops" },
  { id: "Lunar Surface", label: "Phase 3: Lunar Surface" },
  { id: "Deep Space", label: "Phase 4: Deep Space" },
];