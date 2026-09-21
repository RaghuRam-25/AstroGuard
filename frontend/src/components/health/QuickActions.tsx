import Link from "next/link";
import { ClipboardPlus, Brain, Bell, History, Rocket, ArrowRight } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { quickActions } from "@/data/mockData";

const ACTIONS = [
  { icon: ClipboardPlus, tone: "text-cyan-400", bg: "border-cyan-400/20 bg-cyan-400/10" },
  { icon: Brain, tone: "text-indigo-300", bg: "border-indigo-400/20 bg-indigo-400/10" },
  { icon: Bell, tone: "text-rose-400", bg: "border-rose-400/20 bg-rose-400/10" },
  { icon: History, tone: "text-emerald-400", bg: "border-emerald-400/20 bg-emerald-400/10" },
];

export default function QuickActions() {
  return (
    <Card icon={Rocket} title="Quick Actions" className="h-full">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action, index) => {
          const meta = ACTIONS[index % ACTIONS.length];
          const Icon = meta.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl border border-sky-400/15 bg-[#081C30]/70 px-4 py-3.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-primary/30 hover:bg-[#0A2033]/80 hover:shadow-[0_0_20px_rgba(56,189,248,0.12)]"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${meta.bg}`}
              >
                <Icon className={`h-4 w-4 ${meta.tone}`} />
              </span>
              <span className="truncate">{action.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}