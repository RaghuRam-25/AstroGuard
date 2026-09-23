"use client";

import MissionCardGrid from "../../../components/mission-control/MissionCardGrid";
import { Rocket } from "lucide-react";

export default function MissionControlMissionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-purple-400">
            Spaceflight Operations Registry
          </span>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white mt-1">
            <Rocket className="w-6 h-6 text-purple-400" />
            Active Spaceflight Missions
          </h1>
          <p className="text-sm text-slate-400">
            Mission cards and crew deployment status for your Mission Control operational console.
          </p>
        </div>
      </div>

      <MissionCardGrid />
    </div>
  );
}