"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, MessageSquare, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMedicalConsultationReports, updateMedicalConsultationReport } from "../../lib/api";

interface Report {
  _id?: string;
  id?: string;
  astronautId: string;
  timestamp: string;
  symptoms: string;
  vitalsSnapshot: Record<string, unknown>;
  aiAdviceSummary: string;
  fullTranscript: Array<{ role: string; text?: string; createdAt?: string }>;
  riskLevel: "Low" | "Moderate" | "Critical";
  anomalyScore: number;
  status: "Unreviewed" | "Reviewed";
  doctorNotes?: string;
  doctorDecision?: "Approved" | "Overridden";
}

export default function ConsultationReportPanel({ astronautId }: { astronautId?: string }) {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState<Report | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const response = await getMedicalConsultationReports(user.id);
    if (response.success && response.data) setReports(((response.data as { reports?: Report[] }).reports || []));
  }, [user]);

  useEffect(() => { void Promise.resolve().then(load); const timer = window.setInterval(() => void load(), 10000); return () => window.clearInterval(timer); }, [load]);

  const astronautReports = useMemo(() => reports.filter((report) => !astronautId || report.astronautId === astronautId), [astronautId, reports]);
  const unreviewed = astronautReports.find((report) => report.status === "Unreviewed");
  const openReport = (report: Report) => { setOpen(report); setNotes(report.doctorNotes || ""); };
  const review = async (doctorDecision: "Approved" | "Overridden") => {
    if (!open?._id && !open?.id) return;
    setSaving(true);
    const response = await updateMedicalConsultationReport(open._id || open.id || "", { status: "Reviewed", doctorNotes: notes, doctorDecision });
    if (response.success) { setOpen(null); await load(); }
    setSaving(false);
  };

  return <>
    {unreviewed && <button type="button" onClick={() => openReport(unreviewed)} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-left text-[10px] font-bold text-amber-200 transition hover:bg-amber-500/20"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-70" /><span className="relative h-2 w-2 rounded-full bg-amber-300" /></span><FileText className="h-3.5 w-3.5" />New AI Consultation Report <span className="ml-auto">Review →</span></button>}
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020b20]/80 p-4 backdrop-blur-sm"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-400/25 bg-[#061735] p-5 shadow-2xl shadow-cyan-950/40"><div className="flex items-start justify-between gap-4 border-b border-sky-400/10 pb-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300"><FileText className="h-3.5 w-3.5" /> Consultation Summary & Transcript</p><h2 className="mt-1 text-xl font-black text-white">{open.astronautId}</h2><p className="mt-1 text-[10px] text-slate-500">{new Date(open.timestamp).toLocaleString()} · {open.status}</p></div><button type="button" onClick={() => setOpen(null)} className="rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-sky-400/10 bg-black/20 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-500">Clinical risk</p><p className={`mt-1 text-lg font-black ${open.riskLevel === "Critical" ? "text-rose-300" : open.riskLevel === "Moderate" ? "text-amber-300" : "text-emerald-300"}`}>{open.riskLevel}</p></div><div className="rounded-xl border border-sky-400/10 bg-black/20 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-500">Anomaly score</p><p className="mt-1 font-mono text-lg font-black text-white">{open.anomalyScore}/100</p></div><div className="rounded-xl border border-sky-400/10 bg-black/20 p-3"><p className="text-[9px] uppercase tracking-wider text-slate-500">SpO₂ / HR</p><p className="mt-1 font-mono text-lg font-black text-cyan-200">{String(open.vitalsSnapshot.spo2 ?? "—")}% / {String(open.vitalsSnapshot.heartRate ?? "—")}</p></div></div><div className="mt-4 space-y-3"><div className="rounded-xl border border-cyan-400/10 bg-black/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Chief complaint / symptoms</p><p className="mt-2 text-xs leading-relaxed text-slate-300">{open.symptoms}</p></div><div className="rounded-xl border border-cyan-400/10 bg-black/20 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">AI preliminary guidance</p><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">{open.aiAdviceSummary}</p></div><div className="rounded-xl border border-cyan-400/10 bg-black/20 p-3"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-200"><MessageSquare className="h-3.5 w-3.5" /> Full chat transcript</p><div className="mt-2 max-h-52 space-y-2 overflow-y-auto">{open.fullTranscript.map((message, index) => <div key={`${message.createdAt || "message"}-${index}`} className={`rounded-lg px-3 py-2 text-xs ${message.role === "user" ? "ml-8 bg-cyan-500/10 text-cyan-100" : "mr-8 bg-white/[0.04] text-slate-300"}`}><span className="mr-2 text-[9px] font-bold uppercase text-slate-500">{message.role}</span>{message.text}</div>)}</div></div><label className="block rounded-xl border border-cyan-400/10 bg-black/20 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">Doctor clinical notes</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Document review findings or override rationale..." className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-[#020b20] p-2 text-xs text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/60" /></label></div><div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-sky-400/10 pt-4"><button type="button" disabled={saving} onClick={() => void review("Overridden")} className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 disabled:opacity-50">Override AI Guidance</button><button type="button" disabled={saving} onClick={() => void review("Approved")} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-xs font-bold text-[#03142c] disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Approve & Close</button></div></section></div>}
  </>;
}
