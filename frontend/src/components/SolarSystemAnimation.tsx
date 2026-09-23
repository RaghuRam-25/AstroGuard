"use client";

import { useEffect, useRef } from "react";

interface PlanetConfig {
  name: string;
  /** Orbital radius as a fraction of the max orbit radius. */
  orbit: number;
  /** Planet radius in CSS px. */
  radiusPx: number;
  /** Core body color. */
  color: string;
  /** Glow / trail color (rgba). */
  trail: string;
  /** Orbital period in Earth days (true relative values). */
  periodDays: number;
  /** Initial angle offset (radians) so planets don't start aligned. */
  phase: number;
  hasRing?: boolean;
}

const PLANETS: PlanetConfig[] = [
  {
    name: "Mercury",
    orbit: 0.24,
    radiusPx: 2.2,
    color: "#c9b99a",
    trail: "rgba(201,185,154,0.14)",
    periodDays: 87.97,
    phase: 0.4,
  },
  {
    name: "Venus",
    orbit: 0.33,
    radiusPx: 3.4,
    color: "#eac787",
    trail: "rgba(234,199,135,0.15)",
    periodDays: 224.7,
    phase: 2.1,
  },
  {
    name: "Earth",
    orbit: 0.42,
    radiusPx: 3.8,
    color: "#4f8ff7",
    trail: "rgba(79,143,247,0.20)",
    periodDays: 365.25,
    phase: 4.6,
  },
  {
    name: "Mars",
    orbit: 0.51,
    radiusPx: 3.0,
    color: "#e0524b",
    trail: "rgba(224,82,75,0.16)",
    periodDays: 686.98,
    phase: 5.4,
  },
  {
    name: "Jupiter",
    orbit: 0.68,
    radiusPx: 6.8,
    color: "#d8a56a",
    trail: "rgba(216,165,106,0.15)",
    periodDays: 4332.59,
    phase: 1.2,
  },
  {
    name: "Saturn",
    orbit: 0.86,
    radiusPx: 5.8,
    color: "#e0c080",
    trail: "rgba(224,192,128,0.18)",
    periodDays: 10759.22,
    phase: 3.3,
    hasRing: true,
  },
];

// Seconds of animation per real Earth-day of planet orbit. Earth completes a
// full revolution every ~18s, so each planet's motion is clearly visible.
const TIME_BASE = 0.05;
const SPEED_FLOOR_S = 40;

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  tw: number;
}

const TWO_PI = Math.PI * 2;

function orbitSeconds(periodDays: number) {
  return Math.max(periodDays * TIME_BASE, SPEED_FLOOR_S);
}

function generateStars(width: number, height: number): Star[] {
  const count = Math.max(24, Math.floor((width * height) / 9000));
  const stars: Star[] = [];
  for (let i = 0; i < count; i += 1) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.4 + Math.random() * 0.9,
      phase: Math.random() * TWO_PI,
      tw: 0.6 + Math.random() * 1.6,
    });
  }
  return stars;
}

function drawSaturnRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  planetR: number
) {
  const rx = planetR * 2.5;
  const ry = planetR * 0.95;
  const tilt = -0.42;

  // Back half of the ring (behind the planet) — full ellipse, dimmer.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.strokeStyle = "rgba(224,200,160,0.35)";
  ctx.lineWidth = planetR * 0.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function drawSaturnRingFront(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  planetR: number
) {
  const rx = planetR * 2.5;
  const ry = planetR * 0.95;
  const tilt = -0.42;

  // Front half (passes in front of the lower half of the planet).
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.rect(-rx, 0, rx * 2, ry * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(235,214,178,0.8)";
  ctx.lineWidth = planetR * 0.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

export interface SolarSystemAnimationProps {
  className?: string;
}

/**
 * Continuous 2D solar-system orbit simulation rendered on a responsive
 * HTML5 canvas. Authentic relative periods/distances, glowing sun core,
 * planet glow trails and a tilted ring for Saturn.
 */
export default function SolarSystemAnimation({ className }: SolarSystemAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTime = 0;
    let simTime = 0;
    let stars: Star[] = [];
    let disposed = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = generateStars(width, height);
    };

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);
    resize();

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      if (width <= 0 || height <= 0) return;

      const cx = width / 2;
      const cy = height / 2;
      const sunR = Math.min(width, height) * 0.07;
      const maxOrbit = Math.min(width, height) / 2 - sunR - 10;
      if (maxOrbit < 30) return;

      // Starfield
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(now * s.tw + s.phase);
        ctx.globalAlpha = 0.12 + twinkle * 0.55;
        ctx.fillStyle = "#dbe9ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Glowing orbital trails
      for (const p of PLANETS) {
        ctx.beginPath();
        ctx.arc(cx, cy, p.orbit * maxOrbit, 0, TWO_PI);
        ctx.strokeStyle = p.trail;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Sun outer glow
      const glow = ctx.createRadialGradient(cx, cy, sunR * 0.2, cx, cy, sunR * 4.2);
      glow.addColorStop(0, "rgba(255,245,157,0.55)");
      glow.addColorStop(0.35, "rgba(245,124,0,0.20)");
      glow.addColorStop(1, "rgba(245,124,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR * 4.2, 0, TWO_PI);
      ctx.fill();

      // Sun core
      const core = ctx.createRadialGradient(cx, cy, sunR * 0.05, cx, cy, sunR);
      core.addColorStop(0, "#fffde7");
      core.addColorStop(0.55, "#fff59d");
      core.addColorStop(1, "#f57c00");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, sunR, 0, TWO_PI);
      ctx.fill();

      // Planets
      for (const p of PLANETS) {
        const rad = p.orbit * maxOrbit;
        const omega = TWO_PI / orbitSeconds(p.periodDays);
        const angle = p.phase + now * omega;
        const x = cx + Math.cos(angle) * rad;
        const y = cy + Math.sin(angle) * rad;

        if (p.hasRing) drawSaturnRing(ctx, x, y, p.radiusPx);

        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.hasRing ? 14 : 12;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.radiusPx, 0, TWO_PI);
        ctx.fill();
        ctx.restore();

        if (p.hasRing) drawSaturnRingFront(ctx, x, y, p.radiusPx);
      }
    };

    const frame = (time: number) => {
      if (disposed) return;
      if (lastTime === 0) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.12);
      lastTime = time;
      simTime += dt;
      draw(simTime);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`h-full w-full ${className ?? ""}`}
    />
  );
}