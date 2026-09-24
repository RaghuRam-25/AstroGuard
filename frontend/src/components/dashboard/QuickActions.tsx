import Link from "next/link";
import { Zap, ScanLine, Brain, History } from "lucide-react";
import { Card } from "@/components/shared/Card";

const ACTIONS = [
  { label: "Scan RFID Meal Pack", href: "/astronaut/dashboard", icon: ScanLine },
  { label: "View AI Analysis", href: "/astronaut/ai-analysis", icon: Brain },
  { label: "View Health History", href: "/astronaut/dashboard", icon: History },
  { label: "Enter Health Data", href: "/astronaut/data-input", icon: History },
];

export default function QuickActions() {
  return (
    <Card icon={Zap} title="Quick Actions" className="h-full">
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-2.5 rounded-xl border border-sky-400/15 bg-card-secondary/40 px-3.5 py-3 text-xs font-semibold text-slate-200 transition-all duration-200 hover:border-primary/35 hover:bg-primary/10 hover:text-white"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sky-400/15 bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                <Icon className="h-4 w-4" />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>
    </Card>
  );
}