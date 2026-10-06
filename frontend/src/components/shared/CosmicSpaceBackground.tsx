"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

export default function CosmicSpaceBackground() {
  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic twinkling stars and subtle floating space dust particle system
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Generate stars
    const starCount = Math.min(180, Math.floor((width * height) / 8000));
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.4 ? "#38bdf8" : Math.random() > 0.5 ? "#ffffff" : "#818cf8",
    }));

    let t = 0;
    const render = () => {
      t += 0.02;
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

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* ── 1 · Base High-Res Deep Space Nebula & Galaxy Background ── */}
      <div className="absolute inset-0">
        <Image
          src="/space-bg.jpg"
          alt="Deep Space Galaxy Nebula"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-90"
        />
      </div>

      {/* ── 2 · Animated Twinkling Particle Starfield Canvas ── */}
      <canvas
        ref={starsCanvasRef}
        className="absolute inset-0 h-full w-full opacity-65"
      />

      {/* ── 3 · Solar Flare / Blue Starburst on Top Left ── */}
      <div className="absolute left-[12%] top-[15%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {/* Core bright light */}
        <div className="h-28 w-28 rounded-full bg-cyan-100/90 blur-xl animate-pulse" />
        {/* Outer solar corona */}
        <div className="absolute -inset-16 rounded-full bg-cyan-400/40 blur-3xl animate-pulse-soft" />
        <div className="absolute -inset-32 rounded-full bg-blue-600/30 blur-[90px]" />
      </div>

      {/* ── 4 · 3D Rotating Earth & Orbiting Moon System ── */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        {/* Celestial System Container */}
        <div className="relative w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] md:w-[540px] md:h-[540px] lg:w-[620px] lg:h-[620px] flex items-center justify-center">
          
          {/* Earth Outer Atmospheric Corona & Soft Blue Glow */}
          <div className="absolute inset-2 sm:inset-4 rounded-full bg-cyan-400/25 blur-3xl animate-pulse-soft" />
          <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl" />

          {/* ── Realistic 3D Rotating Earth Globe ── */}
          <div className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_90px_rgba(56,189,248,0.5),inset_-45px_-45px_90px_rgba(0,0,0,0.95),inset_25px_25px_50px_rgba(186,230,253,0.45)] border border-cyan-400/30">
            {/* Seamless High-Res NASA Earth Surface with Smooth Axial Spin */}
            <div
              className="absolute inset-0 w-full h-full bg-repeat-x animate-earth-spin"
              style={{
                backgroundImage: "url('/earth-texture.jpg')",
                backgroundSize: "200% 100%",
                backgroundRepeat: "repeat-x",
              }}
            />

            {/* Earth Day / Night Terminator Shading & Deep Space Shadow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/95 via-black/45 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_28%,rgba(224,242,254,0.25)_0%,rgba(56,189,248,0.1)_45%,rgba(2,6,23,0.95)_80%)]" />
            
            {/* Atmospheric Rim Highlight */}
            <div className="absolute inset-0 rounded-full ring-2 ring-cyan-300/40 ring-inset" />
          </div>

          {/* ── 3D Orbiting Realistic Moon (Separate Body, Seamless 3D Trajectory) ── */}
          <div className="absolute inset-0 flex items-center justify-center animate-moon-orbit pointer-events-none">
            {/* Moon Sphere with realistic lunar texture */}
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full shadow-[0_0_35px_rgba(0,0,0,0.95),inset_-18px_-18px_35px_rgba(0,0,0,0.98),inset_12px_12px_22px_rgba(255,255,255,0.35)] border border-white/20 overflow-hidden">
              {/* Moon Texture Map */}
              <div
                className="absolute inset-0 w-full h-full bg-cover bg-center opacity-90"
                style={{
                  backgroundImage: "url('/moon-texture.jpg')",
                }}
              />
              {/* Moon Crater Lighting & 3D Shading */}
              <div className="absolute inset-0 bg-gradient-to-tr from-black/90 via-black/35 to-transparent mix-blend-multiply" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.35)_0%,rgba(100,116,139,0.2)_50%,rgba(2,6,23,0.98)_85%)]" />
              {/* Moon Rim Glow */}
              <div className="absolute inset-0 rounded-full ring-1 ring-cyan-200/30 ring-inset" />
            </div>
          </div>

        </div>
      </div>

      {/* ── 5 · Subtle Legibility Vignette Gradient Overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020817]/60 via-transparent to-[#020817]/80" />
      <div className="absolute inset-0 bg-radial-vignette opacity-50" />
    </div>
  );
}
