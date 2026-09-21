import Link from "next/link";
import { HeartPulse, Moon, Activity, Wind, Bell, ArrowRight } from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge, { getSeverityTone } from "@/components/shared/StatusBadge";
import { alerts } from "@/data/mockData";

const ALERT_META = [
  { icon: HeartPulse, tone: "text-rose-400", bg: "border-rose-400/20 bg-rose-400/10" },
  { icon: Moon, tone: "text-indigo-400", bg: "border-indigo-400/20 bg-indigo-400/10" },
  { icon: Activity, tone: "text-cyan-400", bg: "border-cyan-400/20 bg-cyan-400/10" },
  { icon: Wind, tone: "text-sky-400", bg: "border-sky-400/20 bg-sky-400/10" },
];

export default function RecentAlerts() {
  return (
    <Card
      icon={Bell}
      title="Recent Alerts"
      className="h-full"
      bodyClassName="p-0"
      action={
        <Link
          href="/astronaut/alerts"
          className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-cyan-300"
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <ul className="divide-y divide-sky-400/[0.07]">
        {alerts.map((alert, index) => {
          const meta = ALERT_META[index % ALERT_META.length];
          const Icon = meta.icon;
          return (
            <li
              key={alert.id}
              className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-sky-500/[0.04]"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}
              >
                <Icon className={`h-4 w-4 ${meta.tone}`} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-white">{alert.title}</p>
                  <StatusBadge label={alert.severity} tone={getSeverityTone(alert.severity)} />
                </div>
                <p className="mt-0.5 truncate text-[11px] leading-relaxed text-slate-400">
                  {alert.description}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">{alert.time}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}