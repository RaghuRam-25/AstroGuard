interface HealthCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: string;
  change?: string;
  icon?: string;
}

const HealthCard = ({
  title,
  value,
  unit,
  status,
  change,
  icon,
}: HealthCardProps) => {
  const isElevated = status.toLowerCase().includes("elevated") || status.toLowerCase().includes("disrupt") || status.toLowerCase().includes("decrease") || status.toLowerCase().includes("suppress");
  const isWarning = status.toLowerCase().includes("warning") || status.toLowerCase().includes("critical");

  return (
    <div className="group relative rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:border-blue-500/30 hover:bg-slate-900/80 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-base group-hover:scale-110 transition-transform">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        <span className="text-xs font-medium text-slate-400">{unit}</span>
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isWarning
              ? "bg-red-500/15 text-red-300"
              : isElevated
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isWarning ? "bg-red-400" : isElevated ? "bg-amber-400" : "bg-emerald-400"
            }`}
          />
          {status}
        </span>

        {change && (
          <span className="text-xs font-mono text-slate-400 font-medium">{change}</span>
        )}
      </div>
    </div>
  );
};

export default HealthCard;