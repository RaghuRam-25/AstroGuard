import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

const requiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

const requireAtlasMongoUri = (): string => {
  const mongoUri = requiredEnv("MONGODB_URI");
  const lowerUri = mongoUri.toLowerCase();

  if (
    lowerUri.includes("localhost") ||
    lowerUri.includes("127.0.0.1") ||
    lowerUri.includes("0.0.0.0")
  ) {
    throw new Error("MONGODB_URI must point to MongoDB Atlas, not a local MongoDB server.");
  }

  return mongoUri;
};

const requireAstroGuardDatabase = () => {
  const dbName = mongoose.connection.name;
  if (dbName !== "AstroGuard") {
    throw new Error(`Connected database must be AstroGuard. Current database: ${dbName || "unknown"}`);
  }
};

const seedInitialAdmin = async () => {
  try {
    requireAtlasMongoUri();
    const name = requiredEnv("ADMIN_NAME");
    const email = requiredEnv("ADMIN_EMAIL").toLowerCase();
    const password = requiredEnv("ADMIN_PASSWORD");

    await connectDB();
    requireAstroGuardDatabase();

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log(`Admin initialization skipped. An admin account already exists: ${existingAdmin.email}`);
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error(`Cannot create initial admin. A non-admin user already exists with email: ${email}`);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      isActive: true,
    });

    console.log("Initial admin account created successfully.");
    console.log(`Admin email: ${admin.email}`);
  } catch (error) {
    console.error("Initial admin creation failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedInitialAdmin();
