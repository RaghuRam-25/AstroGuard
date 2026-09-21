import { Satellite, CalendarDays, Users, Globe, ShieldCheck } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { missionInfo } from "@/data/mockData";

const ROWS = [
  { label: "Mission", value: missionInfo.mission, icon: Satellite },
  { label: "Mission Day", value: `Day ${missionInfo.missionDay}`, icon: CalendarDays },
  { label: "Crew", value: `${missionInfo.crew} Astronauts`, icon: Users },
  { label: "Mission Phase", value: missionInfo.phase, icon: Globe },
  { label: "Mission Status", value: missionInfo.status.toUpperCase(), icon: ShieldCheck, status: true },
];

export default function MissionInfo() {
  return (
    <Card icon={Satellite} title="Mission Information" className="h-full" bodyClassName="flex flex-col gap-3">
      {ROWS.map((row) => {
        const Icon = row.icon;
        return (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <Icon className="h-4 w-4 text-primary" />
              {row.label}
            </span>
            <span
              className={
                row.status
                  ? "flex items-center gap-1.5 text-xs font-bold text-success"
                  : "text-xs font-semibold text-slate-200"
              }
            >
              {row.status && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
              )}
              {row.value}
            </span>
          </div>
        );
      })}
    </Card>
  );
}