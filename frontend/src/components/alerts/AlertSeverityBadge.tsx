import { cn } from "@/lib/utils";
import type { Severity } from "@/data/mockData";

const TONE: Record<Severity, { badge: string; dot: string }> = {
  Watch: {
    badge: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  Warning: {
    badge: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
  Critical: {
    badge: "border-danger/40 bg-danger/15 text-danger",
    dot: "bg-danger",
  },
  Normal: {
    badge: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
};

export default function AlertSeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  const tone = TONE[severity];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        tone.badge,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
      {severity}
    </span>
  );
}