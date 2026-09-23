"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, CheckCircle2, ShieldAlert, ShieldCheck, Stethoscope, UserCheck, Waves } from "lucide-react";
import { getAstronautAlerts, getMedicalCommunicationPeers, getMyAssignedAstronauts, submitClinicalReview } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../shared/LoadingState";
import AssignedCrewSelector from "./AssignedCrewSelector";
import ClinicalTriageHub from "./ClinicalTriageHub";
import RecommendationSender from "./RecommendationSender";
import TelemedicinePanel from "./TelemedicinePanel";
import CallModal from "./CallModal";
import ChatErrorBoundary from "../shared/ChatErrorBoundary";
import { CommunicationPeer, CrewMember, MedicalAlert, triageFromRisk } from "./types";

const riskMap: Record<string, "LOW" | "WATCH" | "WARNING" | "CRITICAL"> = {
  Critical: "CRITICAL",
  Warning: "WARNING",
  Watch: "WATCH",
  Normal: "LOW",
};

export default function MedicalOfficerDashboard() {
  const { user } = useAuth();
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<MedicalAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [peers, setPeers] = useState<CommunicationPeer[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiKeys, setAiKeys] = useState(0);
  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState<"Audio" | "Video">("Audio");
  const [callSequence, setCallSequence] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const senderRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const loadCrew = useCallback(async () => {
    const [crewRes, peersRes] = await Promise.all([getMyAssignedAstronauts(), getMedicalCommunicationPeers()]);
    if (crewRes.success) {
      const next = ((crewRes.data as { astronauts?: CrewMember[] })?.astronauts || []);
      setCrew(next);
      setSelectedId((current) => current && next.some((item) => item.astronautId === current) ? current : next[0]?.astronautId || null);
    }
    if (peersRes.success) setPeers(((peersRes.data as { peers?: CommunicationPeer[] })?.peers || []));
  }, []);

  useEffect(() => { void Promise.resolve().then(() => loadCrew()); }, [loadCrew]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void (async () => {
      setAlertsLoading(true);
      const response = await getAstronautAlerts(selectedId);
      if (!active) return;
      setAlertsLoading(false);
      if (response.success) setAlerts((response.data as MedicalAlert[] | undefined) || []);
    })();
    return () => { active = false; };
  }, [selectedId]);

  const selectedCrew = useMemo(() => crew.find((member) => member.astronautId === selectedId) || null, [crew, selectedId]);
  const selectedPeer = useMemo(() => peers.find((peer) => peer.astronautId === selectedId) || null, [peers, selectedId]);

  const kpis = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let nominal = 0;
    let alertsOpen = 0;
    crew.forEach((member) => {
      const level = triageFromRisk(member.latestAnalysis?.riskLevel);
      if (level === "CRITICAL") critical += 1;
      else if (level === "WARNING") warning += 1;
      else nominal += 1;
      alertsOpen += member.unresolvedAlerts || 0;
    });
    return { critical, warning, nominal, alertsOpen };
  }, [crew]);

  const openCall = (type: "Audio" | "Video") => {
    if (!selectedPeer) { showToast("No active comms channel for this astronaut."); return; }
    setCallType(type);
    setCallSequence((current) => current + 1);
    setCallOpen(true);
  };

  const handleAiPrescription = (alert: MedicalAlert) => {
    const brief = (alert.description || "A calm clinical review is suggested.").slice(0, 140);
    setAiSuggestion(`Immediate calm guidance: ${alert.title.toLowerCase()} — ${brief} Prioritise the gentle recovery protocol and check in with your Flight Surgeon at the next sync.`);
    setAiKeys((current) => current + 1);
    senderRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleFlagMissionControl = async (alert: MedicalAlert) => {
    if (!selectedCrew) return;
    const response = await submitClinicalReview(selectedCrew.astronautId, {
      riskLevel: riskMap[alert.severity] || "WATCH",
      clinicalDiagnosis: alert.title,
      countermeasure: "Escalate to Mission Control authority per Flight Surgeon protocol.",
      forwardedToAuthority: true,
      forwardReason: alert.description,
      recommendedAuthorityAction: "Priority medical review by Mission Control.",
    });
    const key = alert._id || alert.id || `${alert.astronautId}-${alert.title}`;
    if (response.success) {
      setFlaggedIds((current) => (current.includes(key) ? current : [...current, key]));
      showToast(`Anomaly flagged to Mission Control for ${selectedCrew.name}.`);
    } else {
      showToast(response.message || "Failed to flag the anomaly.");
    }
  };

  if (!crew.length) {
    return <LoadingState message="Loading your assigned astronaut roster…" />;
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-[#0a141f]/95 via-[#0c2233] to-[#0a141f]/95 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> Assigned-Only Clinical Scope Active
          </div>
          <h1 className="mt-2 flex items-center gap-2.5 text-2xl font-black text-white">
            <Stethoscope className="h-6 w-6 text-cyan-300" /> Medical Officer Command
          </h1>
          <p className="mt-1 text-xs text-cyan-200/80">
            Assigned astronaut management · Real-time anomaly triage · Telemedicine & AI-guided care
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right font-mono text-xs">
            <p className="text-[10px] uppercase text-slate-400">Flight Surgeon</p>
            <p className="font-bold text-cyan-300">{user?.name || "Dr. Sarah Wilson"}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-400/10 font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            {(user?.name || "SW")
              .split(" ")
              .filter((word) => word.length > 1)
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-[10px] font-bold text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            AUTHENTICATED · SECURE CHANNEL
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-[#0a1f1a]/95 px-4 py-3 text-xs font-semibold text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-xl">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi icon={UserCheck} label="Assigned Astronauts" value={crew.length} tone="cyan" />
        <Kpi icon={Activity} label="Advisory Watch" value={kpis.warning} tone="amber" />
        <Kpi icon={ShieldAlert} label="Critical Triage" value={kpis.critical} tone="rose" />
        <Kpi icon={Waves} label="Open Anomaly Alerts" value={kpis.alertsOpen} tone="emerald" />
      </div>

      <AssignedCrewSelector crew={crew} selectedId={selectedId || ""} onSelect={setSelectedId} />

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="space-y-5 xl:col-span-3">
          <ClinicalTriageHub
            astronaut={selectedCrew}
            alerts={alerts}
            loading={alertsLoading}
            flaggedIds={flaggedIds}
            onVoiceCall={() => openCall("Audio")}
            onAiPrescription={handleAiPrescription}
            onFlagMissionControl={(alert) => void handleFlagMissionControl(alert)}
          />
          <div ref={senderRef} id="recommendation-sender">
            <RecommendationSender
              astronaut={selectedCrew}
              aiSuggestion={aiSuggestion}
              suggestionKey={aiKeys}
              onPushed={(recommendation) =>
                showToast(`Guidance pushed to ${selectedCrew?.name || recommendation.astronautId} as a calm, non-alarm notice.`)
              }
            />
          </div>
        </div>
        <div className="xl:col-span-2">
          <ChatErrorBoundary>
            <TelemedicinePanel
              peer={selectedPeer}
              astronautName={selectedCrew?.name || (selectedPeer?.name ?? "Assigned Astronaut")}
              onInitiateCall={openCall}
            />
          </ChatErrorBoundary>
        </div>
      </div>

      {selectedPeer && (
        <CallModal
          key={callSequence}
          open={callOpen}
          peerId={selectedPeer.id}
          peerName={selectedCrew?.name || selectedPeer.name}
          callType={callType}
          onClose={() => setCallOpen(false)}
        />
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof UserCheck; label: string; value: number; tone: "cyan" | "emerald" | "amber" | "rose" }) {
  const tones = {
    cyan: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200",
    emerald: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-current/10">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[9px]">{label}</p>
          <p className="text-xl font-black text-white">{value}</p>
        </div>
        <Waves className="ml-auto h-3 w-3 opacity-40" />
      </div>
    </div>
  );
}