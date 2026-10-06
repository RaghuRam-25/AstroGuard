import type { Metadata } from "next";
import AstroCrewApp from "@/components/astrocrew/AstroCrewApp";

export const metadata: Metadata = {
  title: "AstroCrew Health - Space Medicine & Crew Monitoring",
  description:
    "Comprehensive Astronaut & Crew Health Monitoring System with realistic space-medicine diagnostic stations, physiological telemetry, and deep-space latency handling.",
};

export default function AstroCrewPage() {
  return <AstroCrewApp />;
}
