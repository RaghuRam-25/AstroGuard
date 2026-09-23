"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";

export default function DiagnosticStationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/astronaut/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 animate-pulse">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
      <p className="text-sm font-mono tracking-widest text-slate-400 uppercase">
        Autonomous Telemetry Cockpit Active · Redirecting to Health Dashboard HUD...
      </p>
    </div>
  );
}
