import Image from "next/image";

export default function RootBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src="/homebg.png"
        alt=""
        fill
        priority
        className="object-cover object-center"
      />
      {/* Gradient overlays for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#020817]/95 via-[#020817]/60 to-[#020817]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-[#020817]/70" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,8,23,0.72)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      {/* Cyan atmospheric lighting */}
      <div className="absolute -right-40 -top-44 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_65%)] blur-2xl" />
      <div className="absolute -bottom-80 -left-44 h-[46rem] w-[58rem] rounded-full bg-[radial-gradient(circle_at_45%_15%,rgba(56,189,248,0.16),rgba(14,165,233,0.10)_40%,transparent_72%)] blur-md" />
      {/* Earth horizon */}
      <div className="absolute -bottom-44 -left-24 h-80 w-[48rem] rounded-[50%] border border-t-2 border-sky-400/10" />
      <div className="absolute -bottom-32 -left-16 h-56 w-[44rem] rounded-[50%] border border-sky-400/[0.07]" />
      {/* Floating stars */}
      <span className="absolute left-[16%] top-[22%] h-1 w-1 rounded-full bg-white/30" />
      <span className="absolute left-[30%] top-[12%] h-0.5 w-0.5 rounded-full bg-white/40" />
      <span className="absolute left-[24%] top-[66%] h-0.5 w-0.5 rounded-full bg-white/25" />
      <span className="absolute left-[46%] top-[10%] h-1 w-1 rounded-full bg-cyan-300/30" />
      <span className="absolute right-[18%] top-[20%] h-0.5 w-0.5 rounded-full bg-white/30" />
      <span className="absolute right-[34%] top-[8%] h-1 w-1 rounded-full bg-white/25" />
      <span className="absolute bottom-[24%] right-[14%] h-1 w-1 rounded-full bg-white/35" />
      <span className="absolute left-[8%] top-[38%] h-24 w-px bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent" />
      <span className="absolute right-[10%] top-[48%] h-32 w-px bg-gradient-to-b from-transparent via-blue-300/20 to-transparent" />
    </div>
  );
}
