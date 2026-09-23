"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { getMedicalNutritionPlans, updateMedicalNutritionPlan } from "../../lib/api";

interface Plan { _id?: string; id?: string; validityTimestamp?: string; doctorApproved?: boolean; macroNutrients: { calories?: number; proteinG?: number; carbohydratesG?: number; healthyFatsG?: number; omega3Mg?: number }; hydrationPlan: { liters?: number; beverage?: string }; supplements?: Array<{ name: string; dose: string; timing: string }> ; doctorNotes?: string; }

export default function NutritionReviewPanel({ astronautId }: { astronautId: string }) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [calories, setCalories] = useState("");
  const [liters, setLiters] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { const response = await getMedicalNutritionPlans(astronautId); if (response.success && response.data) { const current = ((response.data as { plans?: Plan[] }).plans || [])[0] || null; setPlan(current); if (current) { setCalories(String(current.macroNutrients.calories ?? "")); setLiters(String(current.hydrationPlan.liters ?? "")); setNotes(current.doctorNotes || ""); } } }, [astronautId]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  if (!plan) return null;
  const approve = async () => { if (!plan._id && !plan.id) return; setSaving(true); const response = await updateMedicalNutritionPlan(plan._id || plan.id || "", { doctorApproved: true, doctorNotes: notes, macroNutrients: { calories: Number(calories) || plan.macroNutrients.calories }, hydrationPlan: { liters: Number(liters) || plan.hydrationPlan.liters } }); if (response.success) await load(); setSaving(false); };
  return <section className="mt-4 rounded-xl border border-violet-400/20 bg-violet-500/5 p-3"><div className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-violet-300" /><div><h3 className="text-xs font-bold text-violet-100">24-Hour Prescription Review</h3><p className="text-[9px] text-slate-500">{plan.doctorApproved ? "Approved and synced to astronaut" : "AI plan awaiting approval"}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-[9px] text-slate-500">Calories<input value={calories} onChange={(event) => setCalories(event.target.value)} type="number" className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-white outline-none" /></label><label className="text-[9px] text-slate-500">Hydration liters<input value={liters} onChange={(event) => setLiters(event.target.value)} type="number" step="0.1" className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-white outline-none" /></label></div><p className="mt-2 text-[9px] text-slate-400">Supplements: {plan.supplements?.map((item) => item.name).join(" · ") || "None"}</p><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} placeholder="Doctor notes or medication override..." className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/25 p-2 text-[10px] text-white outline-none" /><button type="button" disabled={saving || plan.doctorApproved} onClick={() => void approve()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500/80 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />{plan.doctorApproved ? "Approved 24-Hour Prescription" : "Approve 24-Hour Prescription"}</button></section>;
}
