"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  CheckCheck,
  Lock,
  Phone,
  Radio,
  Satellite,
  Send,
  ShieldCheck,
  Video,
  Wifi,
} from "lucide-react";
import { API_BASE_URL, getMedicalCommunicationMessages, markMedicalCommunicationRead, sendMedicalCommunicationMessage } from "../../lib/api";
import { ChatMessage, CommunicationPeer } from "./types";

export interface TelemedicinePanelProps {
  peer: CommunicationPeer | null;
  astronautName: string;
  onInitiateCall: (type: "Audio" | "Video") => void;
}

const quickReplies = [
  "I'll review your latest anomaly and get back to you shortly.",
  "All assigned astronauts are on an encrypted channel now.",
  "How are you feeling after the last EVA block?",
  "Confirmed — continuing to monitor your bio-patch stream.",
];

export default function TelemedicinePanel({ peer, astronautName, onInitiateCall }: TelemedicinePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<CommunicationPeer | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { peerRef.current = peer; }, [peer]);

  useEffect(() => {
    const currentPeer = peer;
    if (!currentPeer) return;
    let active = true;
    void (async () => {
      const response = await getMedicalCommunicationMessages(currentPeer.id);
      if (!active || currentPeer.id !== peerRef.current?.id) return;
      setMessages(response.success ? ((response.data as { messages?: ChatMessage[] })?.messages || []) : []);
      await markMedicalCommunicationRead(currentPeer.id);
    })();
    return () => { active = false; };
  }, [peer]);

  useEffect(() => {
    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;
    socket.on("connect", () => { setSocketReady(true); });
    socket.on("disconnect", () => setSocketReady(false));
    socket.on("communication:error", (payload: { message?: string }) => setError(payload.message || "Communication channel error."));
    socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
      if (payload.userId === peerRef.current?.id) setOnline(payload.online);
    });
    socket.on("chat:message", (message: ChatMessage) => {
      if (message.senderId === peerRef.current?.id || message.receiverId === peerRef.current?.id) {
        setMessages((current) =>
          current.some((item) => (item._id || item.id) === (message._id || message.id)) ? current : [...current, message]
        );
        if (message.senderId === peerRef.current?.id && peerRef.current) void markMedicalCommunicationRead(peerRef.current.id);
      }
    });
    socket.on("chat:typing", (payload: { senderId: string; typing: boolean }) => {
      if (payload.senderId === peerRef.current?.id) setTyping(payload.typing);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, []);

  useEffect(() => {
    if (peer && socketReady) socketRef.current?.emit("presence:check", { userIds: [peer.id] });
  }, [peer, socketReady]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const send = async (message = draft) => {
    if (!peer || !message.trim()) return;
    const payload = { receiverId: peer.id, message: message.trim() };
    if (socketReady) socketRef.current?.emit("chat:send", payload);
    else {
      const response = await sendMedicalCommunicationMessage(payload);
      if (response.success && response.data) setMessages((current) => [...current, response.data as ChatMessage]);
      else if (response.message) setError(response.message);
    }
    setDraft("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const mine = (senderId: string) => senderId !== peer?.id;

  return (
    <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0a141f]/85 shadow-[0_0_30px_rgba(6,182,212,0.06)] backdrop-blur-xl">
      <div className="border-b border-cyan-400/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <Satellite className="h-4 w-4 text-cyan-300" /> Deep-Space Telemedicine Link
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {peer ? `${astronautName} · end-to-end encrypted clinical channel` : "Nothing connected yet"}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-[9px] font-bold text-emerald-300">
            <span className={`h-1.5 w-1.5 rounded-full ${socketReady ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
            {socketReady ? (peer ? (online ? "LIVE · ONLINE" : "LIVE · OFFLINE") : "CHANNEL READY") : "CONNECTING"}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <StatusPill icon={<Wifi className="h-3 w-3" />} label="Uplink 99.2%" tone="cyan" />
          <StatusPill icon={<Radio className="h-3 w-3" />} label="Latency 42ms" tone="emerald" />
          <StatusPill icon={<Lock className="h-3 w-3" />} label="AES-256" tone="emerald" />
          <StatusPill icon={<ShieldCheck className="h-3 w-3" />} label="Role-scoped access" tone="cyan" />
        </div>
      </div>

      {error && <p className="border-b border-rose-400/20 bg-rose-500/10 px-4 py-2 text-[10px] text-rose-200">{error}</p>}

      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-4" onClick={() => setError(null)}>
        {!peer ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Satellite className="h-8 w-8 text-cyan-300/50" />
            <p className="mt-3 text-xs font-bold text-white">Select an assigned astronaut</p>
            <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-500">
              Chat, calls, and vitals share come from your assigned roster only.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-[10px] text-slate-500">
            No messages yet. Use a quick reply or start a voice link.
          </div>
        ) : (
          messages.map((message, index) => {
            const isMine = mine(message.senderId);
            return (
              <div key={message._id || message.id || `${message.timestamp}-${index}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${isMine ? "rounded-br-sm bg-cyan-400/15 text-cyan-50" : "rounded-bl-sm bg-white/[0.05] text-slate-200"}`}>
                  <p>{message.message}</p>
                  <p className={`mt-1 flex items-center gap-1 font-mono text-[8px] ${isMine ? "text-cyan-300/70" : "text-slate-500"}`}>
                    {message.readAt ? <CheckCheck className="h-2.5 w-2.5" /> : null}
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {typing && peer && <p className="text-[9px] italic text-slate-500">{astronautName} is typing…</p>}
      </div>

      {peer && (
        <div className="border-t border-cyan-400/10 p-3">
          <div className="mb-2 flex gap-1.5 overflow-x-auto">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => setDraft(reply)}
                className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-slate-400 transition hover:border-cyan-400/30 hover:text-white"
              >
                {reply}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(event) => { setDraft(event.target.value); socketRef.current?.emit("chat:typing", { receiverId: peer.id, typing: event.target.value.length > 0 }); }}
              placeholder="Type a secure message…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
            />
            <button type="submit" disabled={!draft.trim()} className="rounded-xl bg-cyan-400 p-2 text-[#01303a] transition hover:bg-cyan-300 disabled:opacity-30">
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => onInitiateCall("Audio")}
              disabled={!online}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 py-2.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-30"
            >
              <Phone className="h-3.5 w-3.5" /> Initiate Audio Link
            </button>
            <button
              onClick={() => onInitiateCall("Video")}
              disabled={!online}
              className="flex items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 py-2.5 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-30"
            >
              <Video className="h-3.5 w-3.5" /> Initiate Video Link
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusPill({ icon, label, tone }: { icon: React.ReactNode; label: string; tone: "cyan" | "emerald" }) {
  return (
    <span className={`flex items-center gap-1 rounded-lg border px-2 py-1 font-mono text-[9px] font-semibold ${tone === "cyan" ? "border-cyan-400/20 bg-cyan-400/5 text-cyan-300" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-300"}`}>
      {icon}
      {label}
    </span>
  );
}