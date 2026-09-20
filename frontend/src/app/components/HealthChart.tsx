interface HealthChartProps {
  title: string;
  data: number[];
  labels: string[];
  unit?: string;
}

const HealthChart = ({
  title,
  data,
  labels,
  unit = "",
}: HealthChartProps) => {
  const maxValue = Math.max(...data, 1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur-sm shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Continuous rolling stream</p>
        </div>

        {unit && (
          <span className="rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs font-mono text-slate-400">
            Unit: {unit}
          </span>
        )}
      </div>

      <div className="flex h-44 items-end gap-2 sm:gap-3 pt-4">
        {data.map((value, index) => {
          const heightPercent = Math.min(Math.max((value / maxValue) * 100, 10), 100);

          return (
            <div
              key={`${labels[index]}-${index}`}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 hidden rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-white shadow group-hover:block z-20">
                {value}
                {unit}
              </div>

              <div className="flex h-full w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-blue-500/60 transition-all duration-300 group-hover:bg-blue-400 group-hover:scale-y-105 origin-bottom shadow-sm"
                  style={{ height: `${heightPercent}%` }}
                />
              </div>

              <span className="mt-2 text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HealthChart;