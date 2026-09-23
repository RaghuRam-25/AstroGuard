"use client";

import { useCallback, useEffect, useState } from "react";
import { getNutritionIntake, scanMealPack } from "@/lib/api";

// ─── Catalogue (mirrors backend) ─────────────────────────
export interface MealPack {
  packId: string;
  name: string;
  emoji: string;
  desc: string;
  nutrients: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatsG: number;
    hydrationMl: number;
    sodiumMg: number;
    potassiumMg: number;
    vitaminCMg: number;
    omega3Mg: number;
  };
}

export const MEAL_PACKS: MealPack[] = [
  {
    packId: "RFID-HMP-002",
    name: "Hydration Mix Pack #2",
    emoji: "💧",
    desc: "Electrolyte-enriched hydration sachet — 500 mL equivalent",
    nutrients: { caloriesKcal: 80, proteinG: 2, carbsG: 18, fatsG: 0, hydrationMl: 500, sodiumMg: 310, potassiumMg: 150, vitaminCMg: 60, omega3Mg: 0 },
  },
  {
    packId: "RFID-HPB-B",
    name: "High-Protein Bar B",
    emoji: "💪",
    desc: "25 g whey protein, sustained-energy complex carbs",
    nutrients: { caloriesKcal: 290, proteinG: 25, carbsG: 24, fatsG: 8, hydrationMl: 50, sodiumMg: 220, potassiumMg: 180, vitaminCMg: 10, omega3Mg: 800 },
  },
  {
    packId: "RFID-DCS-001",
    name: "Dehydrated Chicken Stew",
    emoji: "🍲",
    desc: "High-calorie freeze-dried meal, rehydrated at 70°C",
    nutrients: { caloriesKcal: 380, proteinG: 34, carbsG: 28, fatsG: 12, hydrationMl: 300, sodiumMg: 560, potassiumMg: 420, vitaminCMg: 4, omega3Mg: 200 },
  },
  {
    packId: "RFID-VBG-001",
    name: "Veggie Grain Bowl",
    emoji: "🥗",
    desc: "Plant-based fibre + complex carbs for gut health",
    nutrients: { caloriesKcal: 260, proteinG: 12, carbsG: 42, fatsG: 5, hydrationMl: 200, sodiumMg: 380, potassiumMg: 510, vitaminCMg: 28, omega3Mg: 100 },
  },
  {
    packId: "RFID-RP3-003",
    name: "Recovery Pack #3",
    emoji: "🔬",
    desc: "Post-exercise protein + omega-3 + electrolytes",
    nutrients: { caloriesKcal: 340, proteinG: 30, carbsG: 22, fatsG: 10, hydrationMl: 250, sodiumMg: 290, potassiumMg: 340, vitaminCMg: 40, omega3Mg: 1200 },
  },
];

export interface IntakeTotals {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  hydrationMl: number;
  sodiumMg: number;
  potassiumMg: number;
  vitaminCMg: number;
  omega3Mg: number;
  scannedPacks: { packId: string; name: string; scannedAt: string }[];
}

const EMPTY_INTAKE: IntakeTotals = {
  caloriesKcal: 0, proteinG: 0, carbsG: 0, fatsG: 0,
  hydrationMl: 0, sodiumMg: 0, potassiumMg: 0, vitaminCMg: 0, omega3Mg: 0,
  scannedPacks: [],
};

export interface ScanEvent {
  packId: string;
  name: string;
  ts: number;
  ok: boolean;
}

export function useMealScanner() {
  const [intake, setIntake] = useState<IntakeTotals>(EMPTY_INTAKE);
  const [scanning, setScanning] = useState<string | null>(null); // packId being scanned
  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanEvent[]>([]);

  // Bootstrap from server-side intake on mount
  useEffect(() => {
    getNutritionIntake()
      .then((r) => {
        if (r.success && r.data) {
          const d = r.data as { intake?: IntakeTotals };
          if (d.intake) setIntake(d.intake);
        }
      })
      .catch(() => {/* offline — start from 0 */});
  }, []);

  const scan = useCallback(async (packId: string) => {
    if (scanning) return; // debounce simultaneous scans
    setScanning(packId);
    try {
      const res = await scanMealPack(packId);
      const ok = res.success;
      const ev: ScanEvent = { packId, name: MEAL_PACKS.find((p) => p.packId === packId)?.name ?? packId, ts: Date.now(), ok };
      setLastScan(ev);
      setScanHistory((h) => [ev, ...h].slice(0, 20));

      if (ok && res.data) {
        const d = res.data as { intake?: IntakeTotals };
        if (d.intake) {
          setIntake(d.intake);
        } else {
          // Optimistic local accumulation if backend didn't return intake
          const pack = MEAL_PACKS.find((p) => p.packId === packId);
          if (pack) {
            setIntake((prev) => ({
              ...prev,
              caloriesKcal: prev.caloriesKcal + pack.nutrients.caloriesKcal,
              proteinG: prev.proteinG + pack.nutrients.proteinG,
              carbsG: prev.carbsG + pack.nutrients.carbsG,
              fatsG: prev.fatsG + pack.nutrients.fatsG,
              hydrationMl: prev.hydrationMl + pack.nutrients.hydrationMl,
              sodiumMg: prev.sodiumMg + pack.nutrients.sodiumMg,
              potassiumMg: prev.potassiumMg + pack.nutrients.potassiumMg,
              vitaminCMg: prev.vitaminCMg + pack.nutrients.vitaminCMg,
              omega3Mg: prev.omega3Mg + pack.nutrients.omega3Mg,
              scannedPacks: [...prev.scannedPacks, { packId, name: pack.name, scannedAt: new Date().toISOString() }],
            }));
          }
        }
      } else {
        // If endpoint not reachable, still do optimistic update
        const pack = MEAL_PACKS.find((p) => p.packId === packId);
        if (pack) {
          setIntake((prev) => ({
            ...prev,
            caloriesKcal: prev.caloriesKcal + pack.nutrients.caloriesKcal,
            proteinG: prev.proteinG + pack.nutrients.proteinG,
            carbsG: prev.carbsG + pack.nutrients.carbsG,
            fatsG: prev.fatsG + pack.nutrients.fatsG,
            hydrationMl: prev.hydrationMl + pack.nutrients.hydrationMl,
            sodiumMg: prev.sodiumMg + pack.nutrients.sodiumMg,
            potassiumMg: prev.potassiumMg + pack.nutrients.potassiumMg,
            vitaminCMg: prev.vitaminCMg + pack.nutrients.vitaminCMg,
            omega3Mg: prev.omega3Mg + pack.nutrients.omega3Mg,
            scannedPacks: [...prev.scannedPacks, { packId, name: pack.name, scannedAt: new Date().toISOString() }],
          }));
        }
      }
    } catch {
      setLastScan({ packId, name: packId, ts: Date.now(), ok: false });
    } finally {
      // Keep scanning state visible for animation duration
      setTimeout(() => setScanning(null), 1000);
    }
  }, [scanning]);

  return { intake, scanning, lastScan, scanHistory, scan };
}
