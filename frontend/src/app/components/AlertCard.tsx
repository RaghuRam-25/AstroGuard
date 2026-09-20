interface AlertCardProps {
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  time: string;
}

const AlertCard = ({
  title,
  description,
  severity,
  time,
}: AlertCardProps) => {
  const styles = {
    Normal: {
      badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
      dot: "bg-emerald-400",
      border: "border-white/[0.08] hover:border-emerald-500/30",
    },
    Watch: {
      badge: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
      dot: "bg-yellow-400",
      border: "border-white/[0.08] hover:border-yellow-500/30",
    },
    Warning: {
      badge: "bg-orange-500/10 text-orange-300 border-orange-500/30",
      dot: "bg-orange-400",
      border: "border-white/[0.08] hover:border-orange-500/30",
    },
    Critical: {
      badge: "bg-red-500/10 text-red-300 border-red-500/30",
      dot: "bg-red-400 animate-ping",
      border: "border-red-500/30 bg-red-950/10 hover:border-red-500/50",
    },
  };

  const style = styles[severity] || styles.Normal;

  return (
    <div
      className={`group rounded-2xl border bg-slate-900/60 p-4 backdrop-blur-sm transition-all duration-200 ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            <h4 className="font-semibold text-white text-sm">{title}</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pl-4">
            {description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${style.badge}`}
        >
          {severity}
        </span>
      </div>

      <div className="mt-3 flex justify-between items-center border-t border-white/[0.04] pt-2.5 pl-4 text-[11px] text-slate-500">
        <span>Detected: {time}</span>
      </div>
    </div>
  );
};

export default AlertCard;