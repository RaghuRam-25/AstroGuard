import mongoose from "mongoose";
import dns from "node:dns";
import { env } from "./env.js";

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    if (env.MONGODB_URI.startsWith("mongodb+srv://") && env.NODE_ENV !== "production") {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    }

    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`🌌 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    if (conn.connection.name !== "AstroGuard") {
      throw new Error(
        `Connected database must be AstroGuard. Current database: ${conn.connection.name || "unknown"}`
      );
    }

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB connection lost. Reconnecting...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected successfully.");
});
