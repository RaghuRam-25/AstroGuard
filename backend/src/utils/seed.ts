import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { HealthData } from "../models/HealthData.js";
import { Analysis } from "../models/Analysis.js";
import { Alert } from "../models/Alert.js";
import { Mission } from "../models/Mission.js";
import { AuditLog } from "../models/AuditLog.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting AstroGuard database seed v2.0...");
    await connectDB();

    // 1. Clear existing collections
    console.log("🧹 Clearing existing data...");
    await User.deleteMany({});
    await Astronaut.deleteMany({});
    await HealthData.deleteMany({});
    await Analysis.deleteMany({});
    await Alert.deleteMany({});
    await Mission.deleteMany({});
    await AuditLog.deleteMany({});
    await MedicalAssignment.deleteMany({});

    // 2. Create Demo Users with Hashed Passwords
    console.log("👥 Creating demo role-based users...");
    const salt = await bcrypt.genSalt(10);
    const defaultPasswordHash = await bcrypt.hash("AstroGuard@2025!", salt);

    const users = await User.insertMany([
      // ─── Medical Officers ─────────────────
      {
        name: "Dr. Evelyn Vance",
        email: "medical@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "medical_officer",
        assignedAstronautIds: ["AST-001", "AST-002"],
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      {
        name: "Dr. Marcus Reeves",
        email: "medical2@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "medical_officer",
        assignedAstronautIds: ["AST-003", "AST-004"],
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      // ─── Mission Control ──────────────────
      {
        name: "Flight Dynamics Lead",
        email: "mission@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "mission_control",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      {
        name: "Systems Engineer",
        email: "mission2@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "mission_control",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      // ─── Astronauts ───────────────────────
      {
        name: "Alex Morgan",
        email: "alex@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "astronaut",
        astronautId: "AST-001",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      {
        name: "Sarah Chen",
        email: "sarah@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "astronaut",
        astronautId: "AST-002",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      {
        name: "James Wilson",
        email: "james@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "astronaut",
        astronautId: "AST-003",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
      {
        name: "Michael Lee",
        email: "michael@astroguard.local",
        passwordHash: defaultPasswordHash,
        role: "astronaut",
        astronautId: "AST-004",
        missionIds: ["Ares Mission 01"],
        isActive: true,
      },
    ]);

    console.log(`✅ Seeded ${users.length} role-based user accounts.`);

    // 3. Create Mission Document
    console.log("🚀 Creating mission record...");
    const mission = await Mission.create({
      missionId: "ARES-01",
      name: "Ares Mission 01",
      status: "Active",
      missionDay: 142,
      startDate: new Date("2026-04-30"),
      astronautIds: ["AST-001", "AST-002", "AST-003", "AST-004"],
      missionControlUserIds: ["mission@astroguard.local", "mission2@astroguard.local"],
      medicalOfficerIds: ["medical@astroguard.local", "medical2@astroguard.local"],
      description: "First crewed Ares mission — deep space transit and Martian orbit insertion",
    });
    console.log(`✅ Created mission: ${mission.name}`);
    await MedicalAssignment.insertMany([
      { missionId: mission.name, medicalOfficerId: users[0]._id.toString(), astronautIds: ["AST-001", "AST-002"], updatedBy: users[2]._id.toString() },
      { missionId: mission.name, medicalOfficerId: users[1]._id.toString(), astronautIds: ["AST-003", "AST-004"], updatedBy: users[2]._id.toString() },
    ]);

    // 4. Create Astronaut Profiles
    console.log("🧑‍🚀 Creating astronaut profiles...");
    const astronauts = await Astronaut.insertMany([
      {
        name: "Alex Morgan",
        astronautId: "AST-001",
        role: "Commander",
        mission: "Ares Mission 01",
        missionDay: 142,
        missionPhase: "Transit",
        status: "Active",
        avatar: "AM",
      },
      {
        name: "Sarah Chen",
        astronautId: "AST-002",
        role: "Flight Engineer",
        mission: "Ares Mission 01",
        missionDay: 142,
        missionPhase: "Orbital Ops",
        status: "Elevated Deviation",
        avatar: "SC",
      },
      {
        name: "James Wilson",
        astronautId: "AST-003",
        role: "Payload Specialist",
        mission: "Ares Mission 01",
        missionDay: 142,
        missionPhase: "Transit",
        status: "Post-EVA Recovery",
        avatar: "JW",
      },
      {
        name: "Michael Lee",
        astronautId: "AST-004",
        role: "Mission Specialist",
        mission: "Ares Mission 01",
        missionDay: 142,
        missionPhase: "Transit",
        status: "Active",
        avatar: "ML",
      },
    ]);

    console.log(`✅ Created ${astronauts.length} astronaut profiles.`);

    // 5. Generate Historical Health Telemetry (30 days each)
    console.log("📊 Generating 30 days of historical health telemetry for 4 astronauts...");
    const healthRecords: any[] = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // AST-001: Alex Morgan — Stable Nominal
    for (let day = 30; day >= 0; day--) {
      const timestamp = new Date(now - day * oneDay);
      healthRecords.push({
        astronautId: "AST-001",
        heartRate: Math.round(68 + Math.sin(day * 0.5) * 4 + (Math.random() * 4 - 2)),
        spo2: Number((98.0 + (Math.random() * 0.8 - 0.4)).toFixed(1)),
        sleep: Number((7.5 + Math.sin(day * 0.3) * 0.4 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        activity: Math.round(65 + Math.cos(day * 0.4) * 6 + (Math.random() * 6 - 3)),
        source: "sensor",
        timestamp,
      });
    }

    // AST-002: Sarah Chen — Recent Anomaly (Critical)
    for (let day = 30; day >= 0; day--) {
      const timestamp = new Date(now - day * oneDay);
      const isAnomalyPeriod = day <= 3;
      healthRecords.push({
        astronautId: "AST-002",
        heartRate: isAnomalyPeriod
          ? Math.round(88 + Math.random() * 6)
          : Math.round(68 + (Math.random() * 4 - 2)),
        spo2: isAnomalyPeriod
          ? Number((94.5 + Math.random() * 0.8).toFixed(1))
          : Number((98.5 + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        sleep: isAnomalyPeriod
          ? Number((5.2 + Math.random() * 0.4).toFixed(1))
          : Number((7.4 + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        activity: isAnomalyPeriod
          ? Math.round(38 + Math.random() * 5)
          : Math.round(70 + (Math.random() * 6 - 3)),
        source: "sensor",
        timestamp,
      });
    }

    // AST-003: James Wilson — Post-EVA Watch
    for (let day = 30; day >= 0; day--) {
      const timestamp = new Date(now - day * oneDay);
      const isEvaPeriod = day <= 2;
      healthRecords.push({
        astronautId: "AST-003",
        heartRate: isEvaPeriod
          ? Math.round(79 + Math.random() * 4)
          : Math.round(71 + (Math.random() * 4 - 2)),
        spo2: Number((97.2 + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        sleep: isEvaPeriod
          ? Number((6.5 + Math.random() * 0.4).toFixed(1))
          : Number((7.5 + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        activity: isEvaPeriod
          ? Math.round(78 + Math.random() * 6)
          : Math.round(68 + (Math.random() * 6 - 3)),
        source: "sensor",
        timestamp,
      });
    }

    // AST-004: Michael Lee — Warning (Sleep deprivation + elevated HR)
    for (let day = 30; day >= 0; day--) {
      const timestamp = new Date(now - day * oneDay);
      const isIssuePeriod = day <= 5;
      healthRecords.push({
        astronautId: "AST-004",
        heartRate: isIssuePeriod
          ? Math.round(82 + Math.random() * 5)
          : Math.round(73 + (Math.random() * 4 - 2)),
        spo2: Number((96.5 + (Math.random() * 0.8)).toFixed(1)),
        sleep: isIssuePeriod
          ? Number((5.8 + Math.random() * 0.4).toFixed(1))
          : Number((7.3 + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        activity: isIssuePeriod
          ? Math.round(52 + Math.random() * 6)
          : Math.round(67 + (Math.random() * 6 - 3)),
        source: "sensor",
        timestamp,
      });
    }

    const insertedHealth = await HealthData.insertMany(healthRecords);
    console.log(`✅ Generated ${insertedHealth.length} health telemetry data points.`);

    // 6. Create AI Analyses
    console.log("🧠 Creating AI Analysis records...");
    await Analysis.insertMany([
      {
        astronautId: "AST-001",
        anomalyScore: 18,
        riskLevel: "Low",
        confidence: 94.2,
        model: "Multi-Variate Isolation Forest",
        contributors: [
          { signal: "Heart Rate", change: "+2.8%", impact: "Low", percentage: 22, description: "Minimal drift within normal resting window" },
          { signal: "Sleep Duration", change: "-2.6%", impact: "Low", percentage: 18, description: "Sleep stages aligned with circadian rhythm" },
          { signal: "Activity Level", change: "+3.1%", impact: "Low", percentage: 14, description: "Consistent daily exercise protocol" },
          { signal: "SpO₂ Oxygen", change: "+0.2%", impact: "Normal", percentage: 8, description: "Oxygenation levels perfectly stable" },
        ],
        personalBaseline: { heartRate: "70 BPM", spo2: "98.0%", sleep: "7.6 hrs", activity: "65%" },
        missionBaseline: { heartRate: "72 BPM", spo2: "97.8%", sleep: "7.8 hrs", activity: "62%" },
        explanation: {
          headline: "Nominal Physiological Baseline",
          summary: "Current physiological markers are tightly aligned with Alex Morgan's calibrated 90-day personal baseline.",
          changePointDetails: "No statistically significant change-point detected in the last 72 hours.",
          safetyNote: "AI-generated monitoring signal, not a medical diagnosis.",
        },
        recommendations: [
          "Maintain standard fluid and electrolyte hydration protocol.",
          "Continue prescribed daily cardiovascular countermeasure routine.",
          "Target 7–8 hours of unfragmented deep rest before next operational shift.",
        ],
      },
      {
        astronautId: "AST-002",
        anomalyScore: 87,
        riskLevel: "Critical",
        confidence: 96.8,
        model: "Multi-Variate Isolation Forest + Change-Point",
        contributors: [
          { signal: "Activity Level", change: "-42.0%", impact: "High", percentage: 78, description: "Sharp drop in routine mobility and EVA prep stamina" },
          { signal: "Heart Rate", change: "+18.0%", impact: "High", percentage: 68, description: "Resting tachycardia while physical activity is suppressed" },
          { signal: "SpO₂ Oxygen", change: "-3.5%", impact: "High", percentage: 55, description: "Consistent downward drift below personal threshold" },
          { signal: "Sleep Duration", change: "-2.1 hrs", impact: "Moderate", percentage: 42, description: "Severe deep-sleep deprivation over last 48 hours" },
        ],
        personalBaseline: { heartRate: "68 BPM", spo2: "98.5%", sleep: "7.4 hrs", activity: "70%" },
        missionBaseline: { heartRate: "72 BPM", spo2: "97.5%", sleep: "7.2 hrs", activity: "65%" },
        explanation: {
          headline: "EARLY PHYSIOLOGICAL DEVIATION DETECTED",
          summary: "Multi-signal anomaly detected: Persistent cross-signal divergence between elevated resting heart rate (+18%) and severe activity reduction (-42%).",
          changePointDetails: "Deviation began: Mission Day 139, 14:20 UTC.",
          safetyNote: "AI-generated monitoring signal. Medical Officer review recommended.",
        },
        recommendations: [
          "Notify Flight Surgeon or Medical Officer for telemetry review.",
          "Initiate secondary pulse oximetry confirmation.",
          "Pause high-strain extravehicular training until baseline stabilizes.",
        ],
      },
      {
        astronautId: "AST-003",
        anomalyScore: 42,
        riskLevel: "Watch",
        confidence: 91.5,
        model: "Multi-Variate Isolation Forest",
        contributors: [
          { signal: "Activity Level", change: "+15.0%", impact: "Moderate", percentage: 48, description: "High physical output following 6-hour EVA" },
          { signal: "Heart Rate", change: "+9.2%", impact: "Moderate", percentage: 38, description: "Normal post-exertion cardiovascular elevation" },
          { signal: "Sleep Duration", change: "-0.9 hrs", impact: "Low", percentage: 24, description: "Post-shift circadian shift" },
          { signal: "SpO₂ Oxygen", change: "-0.8%", impact: "Normal", percentage: 12, description: "Nominal recovery oxygenation" },
        ],
        personalBaseline: { heartRate: "71 BPM", spo2: "98.0%", sleep: "7.5 hrs", activity: "68%" },
        missionBaseline: { heartRate: "74 BPM", spo2: "97.0%", sleep: "7.0 hrs", activity: "72%" },
        explanation: {
          headline: "Post-EVA Exertion & Recovery Curve",
          summary: "Mild anomaly score (42/100) reflects expected physical fatigue following EVA operations.",
          changePointDetails: "Deviation onset: Mission Day 140, 21:10 UTC (matches EVA egress).",
          safetyNote: "AI-generated monitoring signal. Expected return to baseline within 18 hours.",
        },
        recommendations: [
          "Prioritize scheduled sleep cycle to facilitate recovery.",
          "Monitor post-exertion recovery curve following high activity.",
          "Ensure scheduled hydration intake.",
        ],
      },
      {
        astronautId: "AST-004",
        anomalyScore: 61,
        riskLevel: "Warning",
        confidence: 88.3,
        model: "Multi-Variate Isolation Forest",
        contributors: [
          { signal: "Sleep Duration", change: "-1.5 hrs", impact: "Moderate", percentage: 52, description: "Persistent sleep shortfall across last 5 days" },
          { signal: "Heart Rate", change: "+12.3%", impact: "Moderate", percentage: 45, description: "Mild resting tachycardia trend" },
          { signal: "Activity Level", change: "-18.0%", impact: "Moderate", percentage: 38, description: "Reduced daily activity consistent with fatigue" },
          { signal: "SpO₂ Oxygen", change: "-1.2%", impact: "Low", percentage: 15, description: "Slight oxygenation dip within acceptable range" },
        ],
        personalBaseline: { heartRate: "73 BPM", spo2: "97.8%", sleep: "7.3 hrs", activity: "67%" },
        missionBaseline: { heartRate: "72 BPM", spo2: "97.5%", sleep: "7.2 hrs", activity: "65%" },
        explanation: {
          headline: "Cumulative Fatigue Signal Detected",
          summary: "Multi-day sleep deficit combined with elevated resting HR suggests accumulated mission fatigue.",
          changePointDetails: "Gradual trend onset: Mission Day 137.",
          safetyNote: "AI-generated monitoring signal. Consider scheduling rest period.",
        },
        recommendations: [
          "Schedule dedicated rest period with reduced duty load.",
          "Review sleep hygiene protocol and light environment.",
          "Monitor trend — escalate to medical review if anomaly score exceeds 75.",
        ],
      },
    ]);
    console.log("✅ Seeded AI Analysis records.");

    // 7. Create Alerts
    console.log("🚨 Creating alert records...");
    await Alert.insertMany([
      {
        astronautId: "AST-002",
        title: "Multi-Signal Cross-Divergence",
        description: "Resting heart rate elevation (+18%) co-occurring with acute activity collapse (-42%) and SpO₂ decrease (-3.5%).",
        severity: "Critical",
        signal: "Heart Rate",
        value: "89 BPM",
        baseline: "68 BPM",
        resolved: false,
      },
      {
        astronautId: "AST-002",
        title: "Sleep Architecture Fragmentation",
        description: "Deep sleep duration reduced by 2.1 hours below 30-day personal baseline.",
        severity: "Warning",
        signal: "Sleep Duration",
        value: "5.3 hrs",
        baseline: "7.4 hrs",
        resolved: false,
      },
      {
        astronautId: "AST-003",
        title: "Post-EVA Cardiovascular Recovery",
        description: "Heart rate elevation aligned with scheduled EVA egress.",
        severity: "Watch",
        signal: "Heart Rate",
        value: "79 BPM",
        baseline: "71 BPM",
        resolved: false,
      },
      {
        astronautId: "AST-004",
        title: "Cumulative Fatigue Warning",
        description: "5-day sleep deficit trend combined with resting tachycardia approaching warning threshold.",
        severity: "Warning",
        signal: "Sleep Duration",
        value: "5.8 hrs",
        baseline: "7.3 hrs",
        resolved: false,
      },
      {
        astronautId: "AST-001",
        title: "Nominal Orbital Baseline",
        description: "All telemetry within 95% confidence corridor of calibrated personal baseline.",
        severity: "Normal",
        signal: "Telemetry Stream",
        value: "Nominal",
        baseline: "Calibrated",
        resolved: false,
      },
    ]);
    console.log("✅ Seeded alert records.");

    // 8. Seed AuditLog entries
    console.log("📋 Seeding audit log entries...");
    const opsUserId = users[2]._id.toString();
    const auditEntries = [
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "USER_CREATED", resource: "User", metadata: { email: "alex@astroguard.local", role: "astronaut" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "USER_CREATED", resource: "User", metadata: { email: "medical@astroguard.local", role: "medical_officer" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "MISSION_CREATED", resource: "Mission", metadata: { name: "Ares Mission 01" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "ASTRONAUT_ASSIGNED", resource: "Mission", resourceId: "ARES-01", metadata: { astronautId: "AST-001" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "ASTRONAUT_ASSIGNED", resource: "Mission", resourceId: "ARES-01", metadata: { astronautId: "AST-002" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "USER_CREATED", resource: "User", metadata: { email: "mission@astroguard.local", role: "mission_control" }, success: true },
      { userId: opsUserId, userEmail: "mission@astroguard.local", userRole: "mission_control", action: "ROLE_CHANGED", resource: "User", metadata: { from: "astronaut", to: "mission_control", email: "mission@astroguard.local" }, success: true },
    ];
    await AuditLog.insertMany(
      auditEntries.map((e) => ({
        ...e,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }))
    );
    console.log("✅ Seeded audit log entries.");

    console.log(`
🎉 AstroGuard Secure Database Seeding v2.0 Completed!

🔑 DEMO LOGIN CREDENTIALS (Password: AstroGuard@2025!):
-------------------------------------------------------------------
ROLE              EMAIL                          ASTRONAUT ID
-------------------------------------------------------------------
Medical Officer:  medical@astroguard.local       (assigned: AST-001..004)
Medical Officer:  medical2@astroguard.local      (assigned: AST-003..004)
Mission Control:  mission@astroguard.local       (mission: Ares Mission 01)
Mission Control:  mission2@astroguard.local      (mission: Ares Mission 01)
Astronaut:        alex@astroguard.local          AST-001  Score: 18 (Normal)
Astronaut:        sarah@astroguard.local         AST-002  Score: 87 (Critical)
Astronaut:        james@astroguard.local         AST-003  Score: 42 (Watch)
Astronaut:        michael@astroguard.local       AST-004  Score: 61 (Warning)
-------------------------------------------------------------------
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedDatabase();
