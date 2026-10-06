import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "../context/AuthContext";
import { RegistrationProvider } from "../context/RegistrationContext";
import { CallProvider } from "../context/CallContext";
import AppLayout from "./components/AppLayout";
import CosmicSpaceBackground from "../components/shared/CosmicSpaceBackground";
import "./index.css";

export const metadata: Metadata = {
  title: "AstroGuard - Healthier Astronauts. Safer Missions.",
  description: "AI-powered astronaut health monitoring, anomaly detection, and explainable health insights for deep space missions.",
  keywords: ["NASA", "Space Apps", "AstroGuard", "Astronaut Health", "AI Anomaly Detection"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#020817] text-white relative">
        <CosmicSpaceBackground />
        <AuthProvider>
          <CallProvider>
            <RegistrationProvider>
              <AppLayout>{children}</AppLayout>
            </RegistrationProvider>
          </CallProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
