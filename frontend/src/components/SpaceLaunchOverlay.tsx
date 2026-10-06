"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface SpaceLaunchOverlayProps {
  onClose: () => void;
}

export default function SpaceLaunchOverlay({ onClose }: SpaceLaunchOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Twinkling stars and cosmic light particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle field
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.6,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.03 + 0.008,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? "#38bdf8" : Math.random() > 0.5 ? "#ffffff" : "#818cf8",
    }));

    let t = 0;
    const render = () => {
      t += 0.02;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const currentAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * s.speed * 10 + s.phase));
        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha * s.alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#020817] select-none animate-fade-in">
      {/* ── 1 · Deep Space Galaxy Nebula Background ── */}
      <div className="absolute inset-0">
        <Image
          src="/space-bg.jpg"
          alt="Deep Space Galaxy Nebula"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-95"
        />
      </div>

      {/* ── 2 · Animated Twinkling Particle Starfield Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-80 pointer-events-none z-10"
      />

      {/* ── 3 · Solar Flare / Blue Starburst on Top Left ── */}
      <div className="absolute left-[14%] top-[18%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
        <div className="h-32 w-32 rounded-full bg-cyan-100/90 blur-xl animate-pulse" />
        <div className="absolute -inset-20 rounded-full bg-cyan-400/40 blur-3xl animate-pulse-soft" />
        <div className="absolute -inset-36 rounded-full bg-blue-600/30 blur-[100px]" />
      </div>

      {/* ── 4 · Pure 3D Rotating Earth & Orbiting Moon System ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
        <div className="relative w-[340px] h-[340px] sm:w-[540px] sm:h-[540px] md:w-[620px] md:h-[620px] lg:w-[720px] lg:h-[720px] flex items-center justify-center">
          {/* Earth Atmospheric Glow */}
          <div className="absolute inset-2 sm:inset-4 rounded-full bg-cyan-400/25 blur-3xl animate-pulse-soft" />
          <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl" />

          {/* Earth Rotating Globe */}
          <div className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_100px_rgba(56,189,248,0.55),inset_-50px_-50px_95px_rgba(0,0,0,0.95),inset_30px_30px_55px_rgba(186,230,253,0.5)] border border-cyan-400/35">
            <div
              className="absolute inset-0 w-full h-full bg-repeat-x animate-earth-spin"
              style={{
                backgroundImage: "url('/earth-texture.jpg')",
                backgroundSize: "200% 100%",
                backgroundRepeat: "repeat-x",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/45 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_28%,rgba(224,242,254,0.25)_0%,rgba(56,189,248,0.1)_45%,rgba(2,6,23,0.95)_80%)]" />
            <div className="absolute inset-0 rounded-full ring-2 ring-cyan-300/40 ring-inset" />
          </div>

          {/* Orbiting Moon */}
          <div className="absolute inset-0 flex items-center justify-center animate-moon-orbit pointer-events-none">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.95),inset_-20px_-20px_40px_rgba(0,0,0,0.98),inset_14px_14px_25px_rgba(255,255,255,0.35)] border border-white/20 overflow-hidden">
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: "url('/moon-texture.jpg')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/35 to-transparent mix-blend-multiply" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35)_0%,rgba(100,116,139,0.2)_50%,rgba(2,6,23,0.98)_85%)]" />
              <div className="absolute inset-0 rounded-full ring-1 ring-cyan-200/30 ring-inset" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 · Minimalist Clean Exit Button on Top-Right ── */}
      <div className="absolute top-6 right-6 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#020817]/70 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-xl transition hover:bg-rose-500/30 hover:border-rose-400/60 active:scale-95 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span>Close</span>
        </button>
      </div>
    </div>
  );
}