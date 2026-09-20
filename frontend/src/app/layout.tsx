import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from "../context/AuthContext";
import AppLayout from "./components/AppLayout";
import "./index.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#020817] text-white">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
