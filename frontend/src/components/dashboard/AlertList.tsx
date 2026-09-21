import Link from "next/link";
import { Bell, AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge, { getSeverityTone } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { alerts } from "@/data/mockData";
import type { AlertItem } from "@/data/mockData";

const SEVERITY_ICON: Record<string, string> = {
  Watch: "border-primary/25 bg-primary/10 text-primary",
  Warning: "border-warning/25 bg-warning/10 text-warning",
  Critical: "border-danger/25 bg-danger/10 text-danger",
  Normal: "border-success/25 bg-success/10 text-success",
};

function AlertIcon({ severity }: { severity: AlertItem["severity"] }) {
  const isNormal = severity === "Normal";
  const Icon = isNormal ? CheckCircle2 : AlertTriangle;
  return (
    <span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", SEVERITY_ICON[severity])}>
      <Icon className="h-4 w-4" />
      {!isNormal && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-primary opacity-70" />
      )}
    </span>
  );
}

export default function AlertList() {
  return (
    <Card
      icon={Bell}
      title="Recent Alerts"
      className="h-full"
      bodyClassName="pb-4"
    >
      <div className="-mx-5 -mt-1 divide-y divide-sky-400/[0.07] px-1">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 py-3.5 first:pt-2">
            <AlertIcon severity={alert.severity} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold text-white">{alert.title}</p>
                <StatusBadge
                  label={alert.severity}
                  tone={getSeverityTone(alert.severity)}
                  className="shrink-0"
                />
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {alert.description}
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="h-3 w-3" />
                {alert.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 border-t border-sky-400/10 pt-3">
        <Link
          href="/astronaut/alerts"
          className="group flex items-center justify-center gap-1 rounded-lg border border-primary/15 bg-primary/5 py-2.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
        >
          View All Alerts
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </Card>
  );
}