import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Start Express Server
    const server = app.listen(env.PORT, () => {
      console.log(`
🚀 ==========================================
🛰️  AstroGuard Backend API Server Online
📡  Port: http://localhost:${env.PORT}
🌍  Environment: ${env.NODE_ENV}
🧬  Python ML Service: ${env.ML_SERVICE_URL}
🖥️  Frontend URL: ${env.FRONTEND_URL}
==========================================
      `);
    });

    // Handle Unhandled Promise Rejections
    process.on("unhandledRejection", (err: any) => {
      console.error("❌ Unhandled Promise Rejection:", err);
      server.close(() => process.exit(1));
    });

    // Handle Graceful Shutdown
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("💥 Process terminated.");
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
