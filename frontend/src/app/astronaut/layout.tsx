import type { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata: Metadata = {
  title: "AstroGuard - Astronaut Portal",
  description:
    "AI-powered astronaut health monitoring, anomaly detection, and explainable health insights for deep space missions.",
};

export default function AstronautLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}