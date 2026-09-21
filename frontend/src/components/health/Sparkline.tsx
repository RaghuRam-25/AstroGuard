interface SparklineProps {
  data: number[];
  color: string;
  className?: string;
}

export default function Sparkline({ data, color, className }: SparklineProps) {
  if (data.length < 2) return null;

  const W = 120;
  const H = 36;
  const PAD = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - PAD * 2) + PAD;
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const first = points[0].split(",");
  const last = points[points.length - 1].split(",");
  const areaPath = `M ${first[0]} ${H} L ${points.map((p) => ` ${p}`).join(" L")} L ${last[0]} ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className ?? "h-full w-full"}
      aria-hidden="true"
    >
      <path d={areaPath} fill={color} fillOpacity="0.1" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}