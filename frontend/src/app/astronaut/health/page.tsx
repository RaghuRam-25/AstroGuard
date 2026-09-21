import HealthMetricCard from "@/components/health/HealthMetricCard";
import AnomalyScore from "@/components/health/AnomalyScore";
import HealthTrendChart from "@/components/health/HealthTrendChart";
import OverallHealthStatus from "@/components/health/OverallHealthStatus";
import RecentAlerts from "@/components/health/RecentAlerts";
import HealthMetricsBreakdown from "@/components/health/HealthMetricsBreakdown";
import AnomalyAnalysis from "@/components/health/AnomalyAnalysis";
import AIHealthInsight from "@/components/health/AIHealthInsight";
import MissionInformation from "@/components/health/MissionInformation";
import { healthMetrics } from "@/data/mockData";

export const metadata = {
  title: "My Health - AstroGuard",
};

export default function AstronautHealthPage() {
  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <SpaceBackdrop />

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {healthMetrics.map((metric) => (
          <HealthMetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Anomaly score + Health trends */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <AnomalyScore />
        </div>
        <div className="lg:col-span-8">
          <HealthTrendChart />
        </div>
      </div>

      {/* Overall status + Recent alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <OverallHealthStatus />
        </div>
        <div className="lg:col-span-8">
          <RecentAlerts />
        </div>
      </div>

      {/* Breakdown + anomaly analysis */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <HealthMetricsBreakdown />
        </div>
        <div className="lg:col-span-5">
          <AnomalyAnalysis />
        </div>
      </div>

      {/* AI insight + mission info */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <AIHealthInsight />
        </div>
        <div className="lg:col-span-4">
          <MissionInformation />
        </div>
      </div>
    </div>
  );
}

function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Top-right atmospheric glow */}
      <div className="absolute -right-40 -top-44 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.09),transparent_65%)] blur-2xl" />

      {/* Lower-left Earth visual */}
      <div className="absolute -bottom-80 -left-44 h-[44rem] w-[56rem] rounded-full bg-[radial-gradient(circle_at_45%_15%,rgba(56,189,248,0.18),rgba(14,165,233,0.10)_40%,transparent_72%)] blur-md" />
      <div className="absolute -bottom-44 -left-24 h-80 w-[48rem] rounded-[50%] border border-t-2 border-sky-400/10" />
      <div className="absolute -bottom-32 -left-16 h-56 w-[44rem] rounded-[50%] border border-sky-400/[0.07]" />

      {/* Tiny stars */}
      <span className="absolute left-[16%] top-[20%] h-1 w-1 rounded-full bg-white/30" />
      <span className="absolute left-[30%] top-[10%] h-0.5 w-0.5 rounded-full bg-white/40" />
      <span className="absolute left-[24%] top-[64%] h-0.5 w-0.5 rounded-full bg-white/25" />
      <span className="absolute left-[42%] top-[8%] h-1 w-1 rounded-full bg-cyan-300/30" />
      <span className="absolute right-[18%] top-[18%] h-0.5 w-0.5 rounded-full bg-white/30" />
      <span className="absolute right-[32%] top-[6%] h-1 w-1 rounded-full bg-white/25" />
      <span className="absolute bottom-[30%] left-[52%] h-0.5 w-0.5 rounded-full bg-white/20" />
      <span className="absolute bottom-[14%] left-[68%] h-1 w-1 rounded-full bg-cyan-300/25" />
    </div>
  );
}