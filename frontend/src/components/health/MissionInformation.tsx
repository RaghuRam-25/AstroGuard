import { Satellite, Users, CalendarDays, Rocket, Activity } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { missionInfo } from "@/data/mockData";

export default function MissionInformation() {
  return (
    <Card icon={Satellite} title="Mission Information" className="h-full" bodyClassName="relative overflow-hidden">
      <div className="relative z-10 space-y-3">
        <Row label="Mission" value={missionInfo.mission} />
        <Row label="Mission Day" value={String(missionInfo.missionDay)} icon={CalendarDays} />
        <Row label="Crew" value={`${missionInfo.crew} Astronauts`} icon={Users} />
        <Row label="Mission Phase" value={missionInfo.phase} icon={Rocket} />
        <div className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <Activity className="h-4 w-4 text-primary" />
            Mission Status
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {missionInfo.statusLabel}
          </span>
        </div>
      </div>

      {/* Subtle space / earth visual */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_35%_25%,rgba(56,189,248,0.25),rgba(14,165,233,0.10)_45%,transparent_70%)] blur-sm" />
        <div className="absolute -bottom-10 -right-14 h-36 w-64 rounded-[50%] border border-t-2 border-sky-400/15" />
        <span className="absolute right-8 top-8 h-1 w-1 rounded-full bg-white/30" />
        <span className="absolute bottom-20 right-24 h-0.5 w-0.5 rounded-full bg-white/40" />
        <span className="absolute bottom-8 right-36 h-1 w-1 rounded-full bg-cyan-300/40" />
        <span className="absolute right-4 top-1/2 h-0.5 w-0.5 rounded-full bg-white/30" />
      </div>
    </Card>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: string; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        {label}
      </span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  );
}