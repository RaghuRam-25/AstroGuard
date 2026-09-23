"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Radio, SkipForward } from "lucide-react";

interface SpaceLaunchOverlayProps {
  onClose: () => void;
}

const ROCKET_PHASE_END = 2.5;
const TOTAL_DURATION = 7.0;
const TWO_PI = Math.PI * 2;

const OVERLAY_GRADIENT =
  "radial-gradient(ellipse at 50% 58%, rgba(2,8,23,0.35) 0%, rgba(2,8,23,0.82) 55%, rgba(2,8,23,0.98) 100%)";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(p: number) {
  return 1 - Math.pow(1 - p, 3);
}

export default function SpaceLaunchOverlay({ onClose }: SpaceLaunchOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<"rocket" | "space">("rocket");
  const elapsedRef = useRef(0);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const [stage, setStage] = useState<"rocket" | "space">("rocket");
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => onCloseRef.current(), 600);
  };

  useEffect(() => {
    const t = window.setTimeout(handleClose, TOTAL_DURATION * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = 0;
    let lastTime = 0;
    let disposed = false;
    let stars: { x: number; y: number; r: number; tw: number; ph: number }[] = [];
    let smoke: { x: number; y: number; r: number; vx: number; vy: number; life: number }[] = [];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.max(80, Math.floor((width * height) / 9000)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 1.1,
        tw: 0.6 + Math.random() * 1.8,
        ph: Math.random() * TWO_PI,
      }));
    };

    const drawStarfield = (t: number, warp: number) => {
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.tw * (1 + warp) + s.ph));
        ctx.fillStyle = "#dbe9ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TWO_PI);
        ctx.fill();
        if (warp > 0.4) {
          ctx.globalAlpha *= 0.55;
          ctx.strokeStyle = "#9cc6ff";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x, s.y - s.r * 2 * (1 + warp));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const drawNebula = () => {
      const n1 = ctx.createRadialGradient(
        width * 0.22,
        height * 0.18,
        0,
        width * 0.22,
        height * 0.18,
        Math.min(width, height) * 0.55
      );
      n1.addColorStop(0, "rgba(139,92,246,0.16)");
      n1.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = n1;
      ctx.fillRect(0, 0, width, height);

      const n2 = ctx.createRadialGradient(
        width * 0.82,
        height * 0.8,
        0,
        width * 0.82,
        height * 0.8,
        Math.min(width, height) * 0.6
      );
      n2.addColorStop(0, "rgba(34,211,238,0.12)");
      n2.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = n2;
      ctx.fillRect(0, 0, width, height);
    };

    const drawSmoke = (dt: number) => {
      for (const p of smoke) {
        p.life -= dt / 1.1;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += dt * 22;
      }
      smoke = smoke.filter((p) => p.life > 0);
      for (const p of smoke) {
        ctx.globalAlpha = Math.max(0, p.life) * 0.32;
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawRocket = (t: number) => {
      const p = Math.min(t / ROCKET_PHASE_END, 1);
      const ease = easeOutCubic(p);
      const rw = 30;
      const rh = 92;
      const cx = width / 2;
      const cy = lerp(height * 1.2, height * 0.12, ease);
      const scale = 1 - p * 0.35;
      const flick = Math.sin(t * 38) * 4 + Math.random() * 4;
      const shake = p < 0.9 ? Math.random() * 2.4 : 0;

      ctx.save();
      ctx.translate(cx + (Math.random() - 0.5) * shake, cy + (Math.random() - 0.5) * shake);
      ctx.scale(scale, scale);

      const flame = ctx.createLinearGradient(0, -rh, 0, rh + 80);
      flame.addColorStop(0, "rgba(253,186,116,0.95)");
      flame.addColorStop(0.5, "rgba(251,146,60,0.85)");
      flame.addColorStop(1, "rgba(103,232,249,0.8)");
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-rw * 0.22, -6);
      ctx.quadraticCurveTo(-rw * 0.34, 24 + flick, -rw * 0.24, 72 + flick * 2.4);
      ctx.quadraticCurveTo(0, 30 + flick * 1.4, rw * 0.24, 72 + flick * 2.4);
      ctx.quadraticCurveTo(rw * 0.34, 24 + flick, rw * 0.22, -6);
      ctx.closePath();
      ctx.fill();

      smoke.push({
        x: (Math.random() - 0.5) * 10,
        y: 70,
        r: 5 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 30,
        vy: 46 + Math.random() * 40,
        life: 1,
      });
      if (smoke.length > 110) smoke.shift();

      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#f4f7fb";
      ctx.beginPath();
      ctx.roundRect(-rw / 2, -rh, rw, rh, [rw / 2, rw / 2, 5, 5]);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#0891b2";
      ctx.beginPath();
      ctx.roundRect(-rw / 2 + 6, -8, rw - 12, 7, 2);
      ctx.fill();

      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * rw / 2, -8);
        ctx.lineTo(side * (rw / 2 + 7), 14);
        ctx.lineTo(side * rw / 2, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = "#0ea5e9";
      ctx.beginPath();
      ctx.arc(0, -rh * 0.62, rw * 0.25, 0, TWO_PI);
      ctx.fill();
      ctx.strokeStyle = "rgba(224,242,254,0.9)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, -rh * 0.62, rw * 0.25, 0, TWO_PI);
      ctx.stroke();

      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(0, -rh - 18);
      ctx.lineTo(-rw / 2 + 3, -rh + 2);
      ctx.lineTo(rw / 2 - 3, -rh + 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const drawEarth = (t: number) => {
      const r = Math.min(width, height) * 0.17;
      const cx = width / 2;
      const cy = height * 0.5;
      const rot = t * 0.12;
      const wrap = 2 * r;

      ctx.save();
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 34;
      ctx.fillStyle = "#1e3a5f";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TWO_PI);
      ctx.clip();

      const ocean = ctx.createRadialGradient(cx - r * 0.45, cy - r * 0.4, r * 0.2, cx, cy, r);
      ocean.addColorStop(0, "#0b5f9e");
      ocean.addColorStop(0.6, "#0a3d74");
      ocean.addColorStop(1, "#041a33");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      const drawLand = (off: number) => {
        ctx.fillStyle = "rgba(52,211,153,0.5)";
        ctx.beginPath();
        ctx.ellipse(cx - r + off + r * 0.22, cy - r * 0.32, r * 0.3, r * 0.22, 0.3, 0, TWO_PI);
        ctx.ellipse(cx - r + off + r * 0.6, cy + r * 0.1, r * 0.36, r * 0.24, -0.4, 0, TWO_PI);
        ctx.ellipse(cx - r + off + r * 0.9, cy - r * 0.5, r * 0.2, r * 0.16, 0.5, 0, TWO_PI);
        ctx.fill();
      };

      const off = ((rot % 1) + 1) % 1;
      const shift = -r + off * wrap;
      drawLand(shift);
      drawLand(shift - wrap);
      drawLand(shift + wrap);

      ctx.fillStyle = "rgba(255,255,255,0.10)";
      ctx.beginPath();
      ctx.ellipse(cx + r * 0.1, cy - r * 0.45, r * 0.55, r * 0.14, 0.15, 0, TWO_PI);
      ctx.fill();

      ctx.restore();

      ctx.strokeStyle = "rgba(125,211,252,0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.06, r, 0, TWO_PI);
      ctx.stroke();

      const shade = ctx.createRadialGradient(cx - r * 0.7, cy + r * 0.5, r * 0.4, cx, cy, r * 1.02);
      shade.addColorStop(0, "rgba(2,6,23,0.85)");
      shade.addColorStop(0.7, "rgba(2,6,23,0)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.002, 0, TWO_PI);
      ctx.fill();

      ctx.fillStyle = "transparent";
    };

    const drawSatellites = (t: number) => {
      const earthR = Math.min(width, height) * 0.17;
      const cx = width / 2;
      const cy = height * 0.5;
      const orbits = [
        { rx: earthR * 1.7, ry: earthR * 0.62, tilt: 0.35, speed: 0.5, phase: 0.4, hue: "#22d3ee" },
        { rx: earthR * 2.05, ry: earthR * 0.72, tilt: -0.5, speed: -0.34, phase: 2.2, hue: "#a78bfa" },
        { rx: earthR * 2.4, ry: earthR * 0.8, tilt: 0.12, speed: 0.24, phase: 4.0, hue: "#34d399" },
      ];

      for (const o of orbits) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.tilt);
        ctx.strokeStyle = `${o.hue}22`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, TWO_PI);
        ctx.stroke();

        const ang = o.phase + t * o.speed * TWO_PI;
        const sx = Math.cos(ang) * o.rx;
        const sy = Math.sin(ang) * o.ry;

        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = o.hue;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, o.rx * 0.94 + Math.abs(sx) * 0.1, o.phase, ang, true);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.shadowColor = o.hue;
        ctx.shadowBlur = 10;
        ctx.fillStyle = o.hue;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, TWO_PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = o.hue;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - 5, sy);
        ctx.lineTo(sx + 5, sy);
        ctx.moveTo(sx, sy - 5);
        ctx.lineTo(sx, sy + 5);
        ctx.stroke();

        ctx.restore();
      }
    };

    const drawScanSweep = (t: number) => {
      if (stageRef.current !== "space") return;
      const progress = (t - ROCKET_PHASE_END) / (TOTAL_DURATION - ROCKET_PHASE_END);
      ctx.save();
      ctx.strokeStyle = "rgba(34,211,238,0.7)";
      ctx.lineWidth = 1;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, height * progress);
      ctx.lineTo(width, height * progress);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "rgba(34,211,238,0.9)";
      ctx.beginPath();
      ctx.arc(width / 2, height * progress, 4, 0, TWO_PI);
      ctx.fill();
    };

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(0.55, "#060d1f");
      bg.addColorStop(1, "#0b1326");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const warp = stageRef.current === "space" ? 0.55 * (Math.min(t - ROCKET_PHASE_END, 1.2) / 1.2) : 0.12;

      drawNebula();
      drawStarfield(t, warp);
      if (stageRef.current === "rocket") {
        drawSmoke(dt);
        drawRocket(t);
      } else {
        drawEarth(t);
        drawSatellites(t);
        drawScanSweep(t);
      }
    };

    const frame = (time: number) => {
      if (disposed) return;
      if (lastTime === 0) lastTime = time;
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      elapsedRef.current += dt;
      const elapsed = elapsedRef.current;

      if (stageRef.current === "rocket" && elapsed >= ROCKET_PHASE_END) {
        stageRef.current = "space";
        setStage("space");
      }

      draw(elapsed, dt);
      rafId = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    rafId = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const isSpace = stage === "space";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#020817]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0" style={{ background: OVERLAY_GRADIENT }} />

      {/* Phase 1 HUD */}
      {!isSpace && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
        >
        </motion.div>
      )}

      {/* Phase 2 telemetry HUD */}
      {isSpace && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="pointer-events-none absolute left-5 top-20 max-w-sm space-y-1.5 sm:left-8 sm:top-24"
        >
        </motion.div>
      )}

      {/* Phase 3 focal text */}
      {isSpace && (
        <motion.h2
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center"
        >
        </motion.h2>
      )}

      {/* Skip / Return Home */}
      <motion.button
        type="button"
        onClick={handleClose}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md transition hover:border-cyan-400/40 hover:text-white sm:right-8 sm:top-6"
      >
        <SkipForward className="h-3.5 w-3.5" />
        Skip / Return Home
      </motion.button>

      <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.24em] text-emerald-300/80">
        <Radio className="h-3 w-3 animate-pulse" />
        AstroGuard Orbital Uplink
      </div>
    </motion.div>
  );
}