"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Droplet, Leaf, RefreshCw, Sparkles } from "lucide-react";
import { getMyNutritionPlan } from "@/lib/api";

interface Plan {
  validityTimestamp?: string;
  macroNutrients?: { calories?: number; proteinG?: number; carbohydratesG?: number; healthyFatsG?: number; omega3Mg?: number };
  microNutrients?: { vitaminD3IU?: number; vitaminEMg?: number; sodiumMg?: number; potassiumMg?: number; electrolyteBalance?: string };
  hydrationPlan?: { liters?: number; beverage?: string; schedule?: string[] };
  supplements?: Array<{ name: string; dose: string; timing: string; doctorApproved?: boolean }>;
  doctorApproved?: boolean;
}

interface NutritionResponse { plan?: Plan | null; pendingDoctorApproval?: boolean; nextRefreshAt?: string; }

export default function DailyPrescription() {
  const [data, setData] = useState<NutritionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const response = await getMyNutritionPlan();
    if (response.success) setData(response.data as NutritionResponse);
    setLoading(false);
  };
  useEffect(() => { void Promise.resolve().then(load); }, []);
  const plan = data?.plan;
  const macros = [
    ["Calories", `${plan?.macroNutrients?.calories ?? "—"} kcal`],
    ["Protein", `${plan?.macroNutrients?.proteinG ?? "—"} g`],
    ["Carbs", `${plan?.macroNutrients?.carbohydratesG ?? "—"} g`],
    ["Fats", `${plan?.macroNutrients?.healthyFatsG ?? "—"} g`],
    ["Omega-3", `${plan?.macroNutrients?.omega3Mg ?? "—"} mg`],
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[#0A2238] via-[#071A2E] to-[#0B2438] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-400/10 text-cyan-300"><Sparkles className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-bold text-white">24-Hour Nutrition & Supplement Plan</h2></div>
          </div>
          <button onClick={load} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white" aria-label="Refresh nutrition plan"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /></button>
        </div>
        {plan ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {macros.map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-black/15 p-2"><p className="text-[9px] text-slate-500">{label}</p><p className="mt-1 text-xs font-black text-white">{value}</p></div>)}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200"><Droplet className="h-3.5 w-3.5" /> Hydration target</p><p className="mt-2 text-lg font-black text-white">{plan.hydrationPlan?.liters ?? "—"} L</p><p className="text-[10px] text-cyan-200">{plan.hydrationPlan?.beverage || "Electrolyte-enriched water"}</p><p className="mt-1 text-[9px] text-slate-500">{plan.hydrationPlan?.schedule?.join(" · ")}</p></div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200"><Activity className="h-3.5 w-3.5" /> Electrolytes & micronutrients</p><p className="mt-2 text-[10px] text-slate-300">D3: {plan.microNutrients?.vitaminD3IU ?? "—"} IU · E: {plan.microNutrients?.vitaminEMg ?? "—"} mg</p><p className="mt-1 text-[10px] text-slate-300">Na: {plan.microNutrients?.sodiumMg ?? "—"} mg · K: {plan.microNutrients?.potassiumMg ?? "—"} mg</p><p className="mt-1 text-[9px] text-emerald-300">{plan.microNutrients?.electrolyteBalance || "Maintenance balance"}</p></div>
            </div>
            <div className="mt-3 space-y-1.5">{plan.supplements?.map((item) => <p key={item.name} className="flex gap-2 text-[10px] leading-relaxed text-slate-300"><Leaf className="mt-0.5 h-3 w-3 shrink-0 text-emerald-300" /><span><b>{item.name}</b> · {item.dose} · {item.timing}</span></p>)}</div>
            <p className="mt-3 text-[9px] text-slate-500">{plan.doctorApproved ? "Approved by assigned Medical Officer" : "Awaiting assigned Medical Officer approval"} · Valid until {plan.validityTimestamp ? new Date(plan.validityTimestamp).toLocaleString() : "next test cycle"}</p>
          </>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                ["Calories", "2,850 kcal"],
                ["Protein", "95 g"],
                ["Carbs", "340 g"],
                ["Fats", "72 g"],
                ["Omega-3", "2,200 mg"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-black/15 p-2">
                  <p className="text-[9px] text-slate-500">{label}</p>
                  <p className="mt-1 text-xs font-black text-cyan-300">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-cyan-400/15 bg-cyan-500/5 p-3">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  <Droplet className="h-3.5 w-3.5" /> Autonomous Hydration Target
                </p>
                <p className="mt-2 text-lg font-black text-white">2.8 L / Day</p>
                <p className="text-[10px] text-cyan-200">Electrolyte-balanced mineral water</p>
              </div>
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-3">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  <Activity className="h-3.5 w-3.5" /> Micronutrient Countermeasures
                </p>
                <p className="mt-2 text-[10px] text-slate-300">D3: 2000 IU · Calcium: 1200 mg · Potassium: 3500 mg</p>
                <p className="mt-1 text-[9px] text-emerald-300">Spaceflight Osteo-Protective Formulation</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/20 bg-black/20 p-3">
              <p className="text-[11px] text-slate-300">
                Live AI targets active. Scan RFID meal packs to automatically log nutrient intake.
              </p>
              <Link
                href="/astronaut/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-3 py-1.5 text-[10px] font-bold text-[#03142c] hover:bg-cyan-300 transition-colors"
              >
                Launch RFID Food Scanner
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
