"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

export default function SidebarSpacewalkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic twinkling stars and sparkling cosmic light particles (matching main space background)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 240);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 800);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Generate twinkling starry field
    const stars = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.03 + 0.008,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? "#38bdf8" : Math.random() > 0.5 ? "#ffffff" : "#a5b4fc",
    }));

    let t = 0;
    const render = () => {
      t += 0.025;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const currentAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.speed * 10 + star.phase));
        ctx.fillStyle = star.color;
        ctx.globalAlpha = currentAlpha * star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
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
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
    >
      {/* ── 1 · Base High-Res Deep Space Galaxy Nebula Background (Exact same as main background) ── */}
      <div className="absolute inset-0">
        <Image
          src="/space-bg.jpg"
          alt="Sidebar Deep Space Nebula"
          fill
          priority
          sizes="300px"
          className="object-cover object-[15%_center] opacity-90 brightness-110"
        />
      </div>

      {/* ── 2 · Animated Twinkling Particle Starfield Canvas (Small sparkling lights & stars) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-85 z-10 pointer-events-none"
      />

      {/* ── 3 · Solar Flare / Cyan Starburst Ambient Light on Top-Left ── */}
      <div className="absolute left-[20%] top-[12%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="h-16 w-16 rounded-full bg-cyan-200/80 blur-lg animate-pulse" />
        <div className="absolute -inset-10 rounded-full bg-cyan-400/30 blur-2xl animate-pulse-soft" />
        <div className="absolute -inset-16 rounded-full bg-blue-600/20 blur-3xl" />
      </div>

      {/* ── 4 · Orbital Satellite / Space Station (Clearly Visible in Mid-Upper Space) ── */}
      <div className="absolute top-[22%] -right-1 pointer-events-none animate-[satellite-fly_8s_ease-in-out_infinite] z-10">
        <div className="relative w-28 h-24 filter drop-shadow-[0_0_18px_rgba(56,189,248,0.7)]">
          <Image
            src="/satellite-floating.png"
            alt="Floating Orbital Satellite"
            fill
            sizes="120px"
            className="object-contain brightness-120"
          />
          {/* Active Satellite Signal Beacon (Pulsing Green/Cyan LED) */}
          <div className="absolute top-2 right-4 flex items-center justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </div>
        </div>
      </div>

      {/* ── 5 · Pure Transparent Floating Astronaut in Zero-G (Positioned directly above user profile card) ── */}
      <div className="absolute inset-x-0 bottom-[16%] flex items-center justify-center pointer-events-none z-10">
        <div className="relative w-[190px] h-[210px] animate-[astronaut-float_6s_ease-in-out_infinite] filter drop-shadow-[0_15px_35px_rgba(56,189,248,0.45)]">
          <Image
            src="/astronaut-floating.png"
            alt="Spacewalking Astronaut"
            fill
            priority
            sizes="220px"
            className="object-contain brightness-115 contrast-105"
          />
          {/* Specular helmet visor reflection glow */}
          <div className="absolute top-7 left-[38%] h-6 w-8 rounded-full bg-cyan-300/30 blur-md pointer-events-none" />
        </div>
      </div>

      {/* ── 6 · Subtle Atmospheric Deep Space Vignette Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020814]/40 via-transparent to-[#020814]/70 pointer-events-none z-10" />
    </div>
  );
}
