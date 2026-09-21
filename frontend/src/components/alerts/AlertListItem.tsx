import { HeartPulse, Moon, Activity, Droplet, Clock, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HealthAlert } from "@/data/mockData";
import AlertSeverityBadge from "./AlertSeverityBadge";

const SIGNAL_ICONS: Record<string, LucideIcon> = {
  "Heart Rate": HeartPulse,
  Sleep: Moon,
  Activity: Activity,
  "SpO₂": Droplet,
};

export default function AlertListItem({
  alert,
  selected,
  onClick,
}: {
  alert: HealthAlert;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = SIGNAL_ICONS[alert.signal] ?? HeartPulse;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-primary/40 bg-primary/10 shadow-[0_0_18px_rgba(56,189,248,0.14)]"
          : "border-sky-400/10 bg-card-secondary/40 hover:border-primary/25 hover:bg-card-secondary/70"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            selected
              ? "border-primary/30 bg-primary/15 text-primary"
              : "border-sky-400/15 bg-sky-500/10 text-slate-300"
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                "text-sm font-semibold leading-snug",
                selected ? "text-white" : "text-slate-200"
              )}
            >
              {alert.title}
            </h3>
            <AlertSeverityBadge severity={alert.severity} className="shrink-0" />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{alert.description}</p>
          <span className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <Clock className="h-3 w-3" />
            {alert.time}
            <ChevronRight
              className={cn("ml-auto h-3.5 w-3.5 transition-colors", selected ? "text-primary" : "text-slate-600")}
            />
          </span>
        </div>
      </div>
    </button>
  );
}