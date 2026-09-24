import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { Mission } from "../models/Mission.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";

/**
 * Demo-account restore script (safe / idempotent).
 *
 * The three TEMPORARY demo login options shown on the Login page:
 *   - Alex Morgan          (astronaut)        alex@astroguard.local
 *   - Dr. Evelyn Vance     (medical_officer)  medical@astroguard.local
 *   - Flight Dynamics Lead (mission_control)  mission@astroguard.local
 *   password (all three): AstroGuard@2025!
 *
 * Behaviour:
 *   - Connects ONLY to the database in MONGODB_URI (never hardcodes credentials).
 *   - connectDB() refuses to run against any database that is not "AstroGuard".
 *   - Aborts (with a warning) if the host looks like local MongoDB, so it cannot
 *     silently seed the local dev database instead of the Atlas cluster.
 *   - Creates ONLY the accounts that are missing. Never overwrites an existing
 *     user's password. Never deletes data.
 *   - If an existing account matches the expected role/astronautId, it is left
 *     untouched and reported as "existing". If it differs, a conflict is reported
 *     and the account is NOT modified.
 *   - Passwords are stored bcrypt-hashed with the same cost (12) as the app's
 *     registration flow. Plaintext is never persisted.
 *   - Lightweight supporting demo data (mission + astronaut profiles) is created
 *     ONLY if those collections are empty, so Mission Control / Medical dashboards
 *     have crew to show. Heavy telemetry is intentionally NOT seeded.
 */

type DemoRole = "astronaut" | "medical_officer" | "mission_control";

interface DemoAccount {
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  astronautId?: string;
  missionIds?: string[];
  assignedAstronautIds?: string[];
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: "Alex Morgan",
    email: "alex@astroguard.local",
    password: "AstroGuard@2025!",
    role: "astronaut",
    astronautId: "AST-001",
    missionIds: ["Ares Mission 01"],
  },
  {
    name: "Dr. Evelyn Vance",
    email: "medical@astroguard.local",
    password: "AstroGuard@2025!",
    role: "medical_officer",
    assignedAstronautIds: ["AST-001", "AST-002"],
    missionIds: ["Ares Mission 01"],
  },
  {
    name: "Flight Dynamics Lead",
    email: "mission@astroguard.local",
    password: "AstroGuard@2025!",
    role: "mission_control",
    missionIds: ["Ares Mission 01"],
  },
];

const ASTRONAUT_PROFILES = [
  { name: "Alex Morgan", astronautId: "AST-001", role: "Commander", mission: "Ares Mission 01", missionDay: 142, missionPhase: "Transit", status: "Active", avatar: "AM" },
  { name: "Sarah Chen", astronautId: "AST-002", role: "Flight Engineer", mission: "Ares Mission 01", missionDay: 142, missionPhase: "Orbital Ops", status: "Elevated Deviation", avatar: "SC" },
  { name: "James Wilson", astronautId: "AST-003", role: "Payload Specialist", mission: "Ares Mission 01", missionDay: 142, missionPhase: "Transit", status: "Post-EVA Recovery", avatar: "JW" },
  { name: "Michael Lee", astronautId: "AST-004", role: "Mission Specialist", mission: "Ares Mission 01", missionDay: 142, missionPhase: "Transit", status: "Active", avatar: "ML" },
];

const seedDemo = async () => {
  try {
    console.log("🌱 AstroGuard demo-account restore (safe/idempotent)...");
    await connectDB();

    const dbName = mongoose.connection.name;
    const dbHost = mongoose.connection.host;
    console.log(`   Connected database : '${dbName}'`);
    console.log(`   Connected host     : ${dbHost}`);

    const looksLocal = /(?:127\.0\.0\.1|localhost|::1)/i.test(dbHost);
    if (looksLocal && process.env.SEED_DEMO_ALLOW_LOCAL !== "1") {
      console.warn("⚠️  Host looks like LOCAL MongoDB, not MongoDB Atlas.");
      console.warn("    Refusing to seed to protect local data.");
      console.warn("    Point MONGODB_URI at the Atlas cluster and re-run, or set SEED_DEMO_ALLOW_LOCAL=1 to allow local seeding.");
      await mongoose.disconnect();
      process.exit(1);
    }

    // ── Accounts ─────────────────────────────────────────────────────────
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(DEMO_ACCOUNTS[0].password, salt);

    const created: string[] = [];
    const existing: string[] = [];
    const conflicts: Array<Record<string, string | boolean | undefined>> = [];

    for (const acc of DEMO_ACCOUNTS) {
      const email = acc.email.toLowerCase();
      const found = await User.findOne({ email }).lean();

      if (!found) {
        await User.create({
          name: acc.name,
          email,
          passwordHash,
          role: acc.role,
          astronautId: acc.astronautId,
          missionIds: acc.missionIds,
          assignedAstronautIds: acc.assignedAstronautIds,
          isActive: true,
        });
        created.push(email);
        continue;
      }

      const matches =
        found.role === acc.role &&
        found.isActive === true &&
        (acc.astronautId === undefined || found.astronautId === acc.astronautId);

      if (matches) {
        existing.push(email);
      } else {
        conflicts.push({
          email,
          expectedRole: acc.role,
          actualRole: String(found.role),
          isActive: found.isActive,
          astronautId: found.astronautId || undefined,
        });
      }
    }

    // ── Lightweight supporting demo data (only when empty) ───────────────
    let missionCreated = false;
    let profileCount = 0;
    let assignmentCount = 0;

    if ((await Mission.countDocuments()) === 0) {
      await Mission.create({
        missionId: "ARES-01",
        name: "Ares Mission 01",
        status: "Active",
        missionDay: 142,
        startDate: new Date("2026-04-30"),
        astronautIds: ASTRONAUT_PROFILES.map((a) => a.astronautId),
        missionControlUserIds: ["mission@astroguard.local"],
        medicalOfficerIds: ["medical@astroguard.local"],
        description: "First crewed Ares mission — deep space transit and Martian orbit insertion",
      });
      missionCreated = true;
    }

    if ((await Astronaut.countDocuments()) === 0) {
      await Astronaut.insertMany(ASTRONAUT_PROFILES);
      profileCount = ASTRONAUT_PROFILES.length;
    }

    const medicalUser = await User.findOne({ email: "medical@astroguard.local" }).lean();
    if (medicalUser && (await MedicalAssignment.countDocuments({ medicalOfficerId: String(medicalUser._id) })) === 0) {
      await MedicalAssignment.create({
        missionId: "Ares Mission 01",
        medicalOfficerId: String(medicalUser._id),
        astronautIds: ["AST-001", "AST-002"],
        updatedBy: "seed-demo",
      });
      assignmentCount = 1;
    }

    // ── Report ───────────────────────────────────────────────────────────
    console.log("\n📊 RESULT");
    console.log(`   Database      : '${dbName}' (${dbHost})`);
    console.log(`   Demo accounts created   : ${created.length}`);
    created.forEach((email) => console.log(`     + ${email}`));
    console.log(`   Demo accounts existing (untouched): ${existing.length}`);
    existing.forEach((email) => console.log(`     = ${email}`));
    console.log(`   Role/state conflicts (NOT modified): ${conflicts.length}`);
    conflicts.forEach((c) =>
      console.log(`     ! ${c.email} expected role=${c.expectedRole}, found role=${c.actualRole}, isActive=${c.isActive}, astronautId=${c.astronautId ?? "-"}`)
    );
    if (missionCreated) console.log(`   Supporting: mission "Ares Mission 01" created`);
    if (profileCount) console.log(`   Supporting: ${profileCount} astronaut profiles created`);
    if (assignmentCount) console.log(`   Supporting: medical assignment created for medical@astroguard.local`);

    if (conflicts.length > 0) {
      console.warn("\n⚠️  Conflicts were reported. Review them above — nothing was overwritten.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Demo seed failed:", error);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
};

seedDemo();