import { cn } from "@/lib/utils";

type Tone = "blue" | "cyan" | "green" | "amber" | "red" | "slate";

const TONES: Record<Tone, string> = {
  blue: "border-primary/25 bg-primary/10 text-primary",
  cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
  green: "border-success/25 bg-success/10 text-success",
  amber: "border-warning/25 bg-warning/10 text-warning",
  red: "border-danger/25 bg-danger/10 text-danger",
  slate: "border-slate-500/25 bg-slate-500/10 text-slate-300",
};

export function getSeverityTone(severity: string): Tone {
  switch (severity.toLowerCase()) {
    case "critical":
      return "red";
    case "warning":
      return "amber";
    case "normal":
      return "green";
    case "watch":
    case "low":
      return "blue";
    case "good":
      return "green";
    default:
      return "slate";
  }
}

export function getSeverityDot(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-danger";
    case "warning":
      return "bg-warning";
    case "normal":
      return "bg-success";
    case "watch":
    case "low":
      return "bg-primary";
    case "good":
      return "bg-success";
    default:
      return "bg-slate-500";
  }
}

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}

export default function StatusBadge({ label, tone = "slate", className, dot }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        TONES[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", getSeverityDot(label))} />}
      {label}
    </span>
  );
}