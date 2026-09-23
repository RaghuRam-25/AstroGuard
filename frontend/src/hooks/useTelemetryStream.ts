"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────
export interface TelemetryVital {
  id: string;
  label: string;
  value: number;
  unit: string;
  /** nominal / watch / critical */
  status: "nominal" | "watch" | "critical";
  min: number;
  max: number;
  nominalMin: number;
  nominalMax: number;
  precision: number;
}

export interface TelemetryState {
  connected: boolean;
  hz: number;
  tickCount: number;
  vitals: TelemetryVital[];
  lastUpdatedAt: number;
  streamSource: "live-sse" | "simulation";
}

// ─── Baseline definitions ────────────────────────────────
const VITAL_DEFS: Omit<TelemetryVital, "value" | "status" | "precision">[] = [
  { id: "hr",      label: "Heart Rate",         unit: "BPM",  min: 45,   max: 130,  nominalMin: 58,  nominalMax: 95  },
  { id: "spo2",    label: "SpO₂",               unit: "%",    min: 90,   max: 100,  nominalMin: 95,  nominalMax: 100 },
  { id: "hydrat",  label: "Hydration",           unit: "%",    min: 45,   max: 100,  nominalMin: 62,  nominalMax: 95  },
  { id: "fatigue", label: "Muscle Fatigue Idx",  unit: "MFI",  min: 0,    max: 100,  nominalMin: 0,   nominalMax: 55  },
  { id: "temp",    label: "Body Temp",           unit: "°C",   min: 36.0, max: 38.5, nominalMin: 36.3,nominalMax: 37.5 },
];

const PRECISIONS: Record<string, number> = {
  hr: 0,
  spo2: 1,
  hydrat: 1,
  fatigue: 1,
  temp: 2,
};

const BASE_VALUES: Record<string, number> = {
  hr: 74,
  spo2: 97.8,
  hydrat: 78,
  fatigue: 31,
  temp: 36.9,
};

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function jitter(base: number, amplitude: number) {
  return base + (Math.random() - 0.5) * 2 * amplitude;
}

function classify(v: number, def: (typeof VITAL_DEFS)[0]): "nominal" | "watch" | "critical" {
  if (v >= def.nominalMin && v <= def.nominalMax) return "nominal";
  const watchBand = (def.nominalMax - def.nominalMin) * 0.2;
  if (v >= def.nominalMin - watchBand && v <= def.nominalMax + watchBand) return "watch";
  return "critical";
}

/**
 * useTelemetryStream
 * Connects to live Backend IoT Telemetry Stream (SSE) with seamless fallback
 * to local 100 Hz simulation.
 */
export function useTelemetryStream(astronautId?: string, intervalMs = 1200) {
  const baseRef = useRef({ ...BASE_VALUES });
  const tickRef = useRef(0);
  const sseActiveRef = useRef(false);

  const buildVitals = useCallback((overrides?: Partial<Record<string, number>>): TelemetryVital[] => {
    const bases: Record<string, number | undefined> = { ...baseRef.current, ...(overrides || {}) };
    return VITAL_DEFS.map((def) => {
      const precision = PRECISIONS[def.id] ?? 0;
      let value: number;
      if (overrides && overrides[def.id] !== undefined) {
        value = parseFloat(clamp(overrides[def.id]!, def.min, def.max).toFixed(precision));
      } else {
        const amplitudes: Record<string, number> = {
          hr: 3.5, spo2: 0.3, hydrat: 0.8, fatigue: 1.2, temp: 0.08,
        };
        const baseVal = bases[def.id] ?? BASE_VALUES[def.id] ?? 50;
        const raw = jitter(baseVal, amplitudes[def.id] ?? 1);
        value = parseFloat(clamp(raw, def.min, def.max).toFixed(precision));
      }
      return {
        ...def,
        precision,
        value,
        status: classify(value, def),
      };
    });
  }, []);

  const [state, setState] = useState<TelemetryState>(() => ({
    connected: false,
    hz: 100,
    tickCount: 0,
    vitals: buildVitals(),
    lastUpdatedAt: Date.now(),
    streamSource: "simulation",
  }));

  // Slow drift – simulation wanders realistically when SSE is idle
  const driftBases = useCallback(() => {
    const bases = baseRef.current;
    const drifts: Record<string, number> = {
      hr: 0.05, spo2: 0.01, hydrat: -0.03, fatigue: 0.04, temp: 0.003,
    };
    VITAL_DEFS.forEach((def) => {
      bases[def.id] = clamp(bases[def.id] + (Math.random() - 0.5) * drifts[def.id], def.min, def.max);
    });
  }, []);

  // Connect to SSE Endpoint if in browser
  useEffect(() => {
    let eventSource: EventSource | null = null;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const targetId = astronautId || "AST-001";
    const sseUrl = `${backendUrl}/api/telemetry/stream/${encodeURIComponent(targetId)}`;

    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        sseActiveRef.current = true;
        setState((prev) => ({
          ...prev,
          connected: true,
          streamSource: "live-sse",
        }));
      };

      eventSource.addEventListener("telemetry", (e) => {
        try {
          const data = JSON.parse(e.data);
          tickRef.current += 1;

          const mapping: Partial<Record<string, number>> = {};
          if (data.heartRate !== undefined) mapping.hr = data.heartRate;
          if (data.spo2 !== undefined) mapping.spo2 = data.spo2;
          if (data.hydrationLevel !== undefined) mapping.hydrat = data.hydrationLevel;
          if (data.muscleFatigueIndex !== undefined) mapping.fatigue = data.muscleFatigueIndex;
          if (data.bodyTemp !== undefined || data.coreTemperatureC !== undefined) {
            mapping.temp = data.bodyTemp ?? data.coreTemperatureC;
          }

          // Update bases
          Object.assign(baseRef.current, mapping);

          setState((prev) => ({
            ...prev,
            connected: true,
            tickCount: tickRef.current,
            vitals: buildVitals(mapping),
            lastUpdatedAt: Date.now(),
            streamSource: "live-sse",
          }));
        } catch {
          // Ignore malformed packet
        }
      });

      eventSource.onerror = () => {
        sseActiveRef.current = false;
        // Keep connected status true on fallback simulation
        setState((prev) => ({
          ...prev,
          streamSource: "simulation",
        }));
      };
    } catch {
      sseActiveRef.current = false;
    }

    // Interval heartbeat/drift simulation for smooth visual ticking
    const fallbackTimer = setInterval(() => {
      tickRef.current += 1;
      driftBases();

      if (!sseActiveRef.current) {
        setState((prev) => ({
          ...prev,
          connected: true,
          tickCount: tickRef.current,
          vitals: buildVitals(),
          lastUpdatedAt: Date.now(),
          streamSource: "simulation",
        }));
      }
    }, intervalMs);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(fallbackTimer);
    };
  }, [astronautId, intervalMs, buildVitals, driftBases]);

  /** Force-inject real backend readings as new baselines */
  const inject = useCallback(
    (overrides: Partial<Record<string, number>>) => {
      Object.entries(overrides).forEach(([k, v]) => {
        if (v !== undefined && baseRef.current[k] !== undefined) {
          baseRef.current[k] = v;
        }
      });
    },
    []
  );

  return { ...state, inject };
}
