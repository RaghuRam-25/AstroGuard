import { BellRing, Eye, TriangleAlert, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "warning" | "danger" | "success";

const TONE_STYLES: Record<Tone, string> = {
  primary: "border-primary/25 bg-primary/10 text-primary",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  success: "border-success/25 bg-success/10 text-success",
};

const TONE_ICONS: Record<Tone, LucideIcon> = {
  primary: BellRing,
  warning: Eye,
  danger: TriangleAlert,
  success: ShieldCheck,
};

export default function AlertSummaryCard({
  label,
  count,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone: Tone;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = TONE_ICONS[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "glass-card group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-300",
        active
          ? "shadow-[0_0_20px_rgba(56,189,248,0.18)] ring-1 ring-primary/40"
          : "hover:ring-1 hover:ring-sky-400/20"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
          TONE_STYLES[tone]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold text-slate-300">{label}</span>
        <span
          className={cn(
            "block font-mono text-base font-bold leading-tight",
            active ? "text-white" : "text-slate-100"
          )}
        >
          {count}
        </span>
      </span>
    </button>
  );
}