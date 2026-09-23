"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL, createMedicalCommunicationCall, getMedicalCommunicationCalls, getMedicalCommunicationMessages, getMedicalCommunicationPeers, markMedicalCommunicationRead, sendMedicalCommunicationMessage } from "../../lib/api";
import { AlertCircle, Camera, Check, CheckCheck, FileText, Mic, MicOff, Paperclip, Phone, PhoneOff, ScreenShare, Send, ShieldCheck, Sparkles, Square, UserRound, Video, VideoOff, Volume2, X } from "lucide-react";

type Peer = { id: string; name: string; email: string; role: "astronaut" | "medical_officer"; astronautId?: string };
type Attachment = { name: string; type: string; url: string; size?: number };
type Message = { _id?: string; id?: string; senderId: string; receiverId: string; message: string; messageType: "text" | "voice" | "file"; attachments?: Attachment[]; timestamp: string; readAt?: string };
type CallType = "Audio" | "Video";
type Signal = { type: "answer" | "candidate"; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };

export default function MedicalConsultHub() {
  const { user } = useAuth();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<Array<{ _id?: string; callType: CallType; duration: number; status: string; timestamp: string }>>([]);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [incoming, setIncoming] = useState<{ callerId: string; callerName: string; callType: CallType; offer: RTCSessionDescriptionInit } | null>(null);
  const [activeCall, setActiveCall] = useState<{ type: CallType; caller: boolean } | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callStartedRef = useRef<number>(0);
  const callerRef = useRef(false);
  const callTypeRef = useRef<CallType>("Audio");

  useEffect(() => { peerRef.current = peer; }, [peer]);

  const loadPeers = useCallback(async () => {
    const response = await getMedicalCommunicationPeers();
    if (response.success) {
      const nextPeers = ((response.data as { peers?: Peer[] })?.peers || []);
      setPeers(nextPeers);
      socketRef.current?.emit("presence:check", { userIds: nextPeers.map((item) => item.id) });
      setPeer((current) => current && nextPeers.some((item) => item.id === current.id) ? current : nextPeers[0] || null);
    } else if (response.message) setError(response.message);
  }, []);

  const loadConversation = useCallback(async (nextPeer: Peer) => {
    const [history, callHistory] = await Promise.all([getMedicalCommunicationMessages(nextPeer.id), getMedicalCommunicationCalls(nextPeer.id)]);
    if (history.success) setMessages(((history.data as { messages?: Message[] })?.messages || []));
    if (callHistory.success) setCalls(((callHistory.data as { calls?: typeof calls })?.calls || []));
    await markMedicalCommunicationRead(nextPeer.id);
  }, []);

  useEffect(() => { void Promise.resolve().then(() => loadPeers()); }, [loadPeers]);
  useEffect(() => { if (peer) void Promise.resolve().then(() => loadConversation(peer)); }, [peer, loadConversation]);
  useEffect(() => { if (socketReady && peers.length) socketRef.current?.emit("presence:check", { userIds: peers.map((item) => item.id) }); }, [socketReady, peers]);

  const emitSignal = useCallback((signal: Signal, receiverId = peerRef.current?.id) => { if (receiverId) socketRef.current?.emit("call:signal", { receiverId, signal }); }, []);

  const closeCall = useCallback(async (status: "Completed" | "Rejected" | "Cancelled" = "Completed") => {
    const currentPeer = peerRef.current;
    const seconds = callStartedRef.current ? Math.round((Date.now() - callStartedRef.current) / 1000) : 0;
    if (currentPeer && (callerRef.current || status !== "Completed")) {
      await createMedicalCommunicationCall({ receiverId: currentPeer.id, callType: callTypeRef.current, duration: seconds, status });
    }
    pcRef.current?.close(); pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop()); localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setActiveCall(null); setIncoming(null); setCallSeconds(0); callerRef.current = false; callStartedRef.current = 0;
  }, []);

  const preparePeerConnection = useCallback((receiverId: string, type: CallType) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.onicecandidate = (event) => { if (event.candidate) emitSignal({ type: "candidate", candidate: event.candidate.toJSON() }, receiverId); };
    pc.ontrack = (event) => { if (type === "Video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]; if (type === "Audio" && remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0]; };
    pc.onconnectionstatechange = () => { if (["failed", "disconnected", "closed"].includes(pc.connectionState)) void closeCall("Cancelled"); };
    pcRef.current = pc; callTypeRef.current = type; return pc;
  }, [closeCall, emitSignal]);

  const getLocalMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "Video" });
    localStreamRef.current = stream;
    if (localVideoRef.current) { localVideoRef.current.srcObject = stream; localVideoRef.current.muted = true; }
    stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));
  }, []);

  const startCall = async (type: CallType) => {
    if (!peer || activeCall) return;
    try {
      callerRef.current = true; callStartedRef.current = Date.now(); callTypeRef.current = type;
      const pc = preparePeerConnection(peer.id, type); await getLocalMedia(type);
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      socketRef.current?.emit("call:invite", { receiverId: peer.id, callType: type, offer });
      setActiveCall({ type, caller: true });
    } catch { setError("Camera or microphone permission was not available."); await closeCall("Cancelled"); }
  };

  const acceptCall = async () => {
    if (!incoming) return;
    try {
      const call = incoming; callerRef.current = false; callStartedRef.current = Date.now(); callTypeRef.current = call.callType;
      const pc = preparePeerConnection(call.callerId, call.callType); await getLocalMedia(call.callType);
      await pc.setRemoteDescription(call.offer);
      for (const candidate of pendingCandidatesRef.current) await pc.addIceCandidate(candidate); pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer(); await pc.setLocalDescription(answer);
      socketRef.current?.emit("call:signal", { receiverId: call.callerId, signal: { type: "answer", sdp: answer } });
      setPeer((current) => current?.id === call.callerId ? current : peers.find((item) => item.id === call.callerId) || current);
      setActiveCall({ type: call.callType, caller: false }); setIncoming(null);
    } catch { setError("Unable to accept the medical call."); await closeCall("Cancelled"); }
  };

  useEffect(() => {
    if (!user) return;
    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket", "polling"] }); socketRef.current = socket;
    socket.on("connect", () => setSocketReady(true)); socket.on("disconnect", () => setSocketReady(false));
    socket.on("communication:error", (payload: { message?: string }) => setError(payload.message || "Communication error."));
    socket.on("presence:update", (payload: { userId: string; online: boolean }) => { if (payload.userId === peerRef.current?.id) setOnline(payload.online); });
    socket.on("chat:message", (message: Message) => { if (message.senderId === peerRef.current?.id || message.receiverId === peerRef.current?.id) { setMessages((current) => current.some((item) => (item._id || item.id) === (message._id || message.id)) ? current : [...current, message]); if (message.senderId === peerRef.current?.id) void markMedicalCommunicationRead(peerRef.current.id); } });
    socket.on("chat:typing", (payload: { senderId: string; typing: boolean }) => { if (payload.senderId === peerRef.current?.id) setTyping(payload.typing); });
    socket.on("call:incoming", (payload: { callerId: string; callerName: string; callType: CallType; offer: RTCSessionDescriptionInit }) => setIncoming(payload));
    socket.on("call:signal", async (payload: { senderId: string; signal: Signal }) => { const pc = pcRef.current; if (!pc) return; if (payload.signal.type === "answer" && payload.signal.sdp) await pc.setRemoteDescription(payload.signal.sdp); if (payload.signal.type === "candidate" && payload.signal.candidate) { if (pc.remoteDescription) await pc.addIceCandidate(payload.signal.candidate); else pendingCandidatesRef.current.push(payload.signal.candidate); } });
    socket.on("call:status", (payload: { status?: string }) => { if (payload.status === "Rejected") { setError("The assigned Medical Officer rejected the call."); void closeCall("Rejected"); } });
    return () => { socket.disconnect(); socketRef.current = null; void closeCall("Cancelled"); };
  }, [closeCall, user]);

  useEffect(() => { if (!activeCall) return; const timer = window.setInterval(() => setCallSeconds(callStartedRef.current ? Math.round((Date.now() - callStartedRef.current) / 1000) : 0), 1000); return () => window.clearInterval(timer); }, [activeCall]);

  const sendMessage = async (message = draft, attachments = pendingFiles, messageType: "text" | "voice" | "file" = "text") => {
    if (!peer || (!message.trim() && !attachments.length)) return;
    const payload = { receiverId: peer.id, message: message.trim(), attachments, messageType };
    if (socketReady) socketRef.current?.emit("chat:send", payload); else { const response = await sendMedicalCommunicationMessage(payload); if (response.success && response.data) setMessages((current) => [...current, response.data as Message]); }
    setDraft(""); setPendingFiles([]);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((file) => file.type.startsWith("image/") || file.type === "application/pdf").slice(0, 5);
    const attachments = await Promise.all(files.map((file) => new Promise<Attachment>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, url: String(reader.result) }); reader.onerror = reject; reader.readAsDataURL(file); })));
    setPendingFiles(attachments);
  };

  const toggleVoiceNote = async () => {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); audioChunksRef.current = []; recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data); recorder.onstop = async () => { const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" }); const reader = new FileReader(); reader.onload = () => void sendMessage("Voice note", [{ name: `voice-note-${Date.now()}.webm`, type: blob.type, size: blob.size, url: String(reader.result) }], "voice"); reader.readAsDataURL(blob); stream.getTracks().forEach((track) => track.stop()); }; recorder.start(); recorderRef.current = recorder; setRecording(true);
    } catch { setError("Microphone permission was not available for the voice note."); }
  };

  const toggleMute = () => { const track = localStreamRef.current?.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); } };
  const toggleCamera = () => { const track = localStreamRef.current?.getVideoTracks()[0]; if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); } };
  const shareScreen = async () => { if (!pcRef.current || callTypeRef.current !== "Video") return; try { const screen = await navigator.mediaDevices.getDisplayMedia({ video: true }); const sender = pcRef.current.getSenders().find((item) => item.track?.kind === "video"); if (sender && screen.getVideoTracks()[0]) { await sender.replaceTrack(screen.getVideoTracks()[0]); screen.getVideoTracks()[0].onended = () => { const camera = localStreamRef.current?.getVideoTracks()[0]; if (camera) void sender.replaceTrack(camera); }; } } catch { /* screen share is optional */ } };
  const rejectCall = () => { if (incoming) socketRef.current?.emit("call:status", { receiverId: incoming.callerId, status: "Rejected" }); setIncoming(null); };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return <div className="mx-auto flex max-w-6xl flex-col gap-4" onClick={() => error && setError(null)}>
    <header className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/15 bg-[#061426]/80 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300"><ShieldCheck className="h-4 w-4" /> Secure Medical Channel</div><h1 className="mt-2 text-2xl font-black text-white">Medical Consult Chat & Call</h1><p className="mt-1 text-xs text-slate-400">Private astronaut–assigned Flight Surgeon communication hub.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-[10px] font-bold text-emerald-300"><span className={`h-2 w-2 rounded-full ${socketReady ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />{socketReady ? "LIVE CHANNEL" : "CONNECTING"}</div></header>
    {error && <div className="flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"><AlertCircle className="h-4 w-4" />{error}</div>}
    <div className="grid min-h-[620px] gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-cyan-400/15 bg-[#07182a]/80 p-3 backdrop-blur-xl"><div className="mb-3 flex items-center justify-between px-2"><h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned channel</h2><Sparkles className="h-3.5 w-3.5 text-cyan-300" /></div>{peers.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[10px] leading-relaxed text-slate-500">No active assignment is available. Communication is disabled until Mission Control assigns a Flight Surgeon.</div> : peers.map((item) => <button key={item.id} onClick={() => setPeer(item)} className={`mb-2 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${peer?.id === item.id ? "border border-cyan-400/30 bg-cyan-400/10" : "border border-transparent hover:bg-white/[0.04]"}`}><span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200"><UserRound className="h-4 w-4" />{online && peer?.id === item.id && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#07182a] bg-emerald-400" />}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-white">{item.name}</span><span className="block truncate text-[10px] text-cyan-300">{item.role === "astronaut" ? "Astronaut" : "Flight Surgeon"}</span></span></button>)}<div className="mt-4 border-t border-white/5 pt-4"><p className="px-2 text-[9px] uppercase tracking-wider text-slate-500">Recent calls</p>{calls.slice(0, 4).map((call) => <div key={call._id || call.timestamp} className="mt-2 flex items-center justify-between px-2 text-[10px] text-slate-400"><span className="flex items-center gap-1.5">{call.callType === "Video" ? <Video className="h-3 w-3 text-cyan-300" /> : <Phone className="h-3 w-3 text-emerald-300" />}{call.status}</span><span>{formatTime(call.duration || 0)}</span></div>)}</div></aside>
      <section className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-[#061426]/85 shadow-2xl backdrop-blur-xl"><div className="flex items-center justify-between border-b border-cyan-400/10 px-4 py-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200"><UserRound className="h-5 w-5" /></span><div><h2 className="text-sm font-bold text-white">{peer?.name || "Assigned Medical Officer"}</h2><p className="text-[10px] text-slate-400">{peer ? `${online ? "Online" : "Offline"} · End-to-end assignment access` : "Select your assigned channel"}</p></div></div>{peer && <div className="flex items-center gap-2"><button onClick={() => void startCall("Audio")} disabled={!!activeCall} className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-40" title="Audio call"><Phone className="h-4 w-4" /></button><button onClick={() => void startCall("Video")} disabled={!!activeCall} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-40" title="Video call"><Video className="h-4 w-4" /></button></div>}</div><div className="flex-1 space-y-3 overflow-y-auto p-4">{!peer ? <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">Choose the assigned astronaut or Flight Surgeon channel to begin.</div> : messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><ShieldCheck className="h-8 w-8 text-cyan-300/60" /><p className="mt-3 text-xs font-bold text-white">Private clinical channel ready</p><p className="mt-1 max-w-xs text-[10px] leading-relaxed text-slate-500">Messages, voice notes, medical scans, and call logs are visible only to this assigned pair.</p></div> : messages.map((message) => { const mine = message.senderId === user?.id; return <div key={message._id || message.id || message.timestamp} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 ${mine ? "rounded-br-md bg-cyan-500/20 text-cyan-50" : "rounded-bl-md border border-white/10 bg-white/[0.05] text-slate-200"}`}><p className="whitespace-pre-wrap text-xs leading-relaxed">{message.message}</p>{message.attachments?.map((attachment) => attachment.type.startsWith("audio/") ? <audio key={attachment.url} controls src={attachment.url} className="mt-2 h-8 max-w-full" /> : <a key={attachment.url} href={attachment.url} download={attachment.name} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[10px] text-cyan-200"><FileText className="h-3.5 w-3.5" />{attachment.name}</a>)}<div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-500"><span>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>{mine && (message.readAt ? <CheckCheck className="h-3 w-3 text-cyan-300" /> : <Check className="h-3 w-3" />)}</div></div></div>; })}{typing && <p className="text-[10px] italic text-cyan-300">{peer?.name} is typing...</p>}</div><div className="border-t border-cyan-400/10 p-3"><div className="mb-2 flex flex-wrap gap-2">{pendingFiles.map((file) => <span key={file.url} className="flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-1 text-[9px] text-cyan-200">{file.name}<button onClick={() => setPendingFiles((current) => current.filter((item) => item.url !== file.url))}><X className="h-3 w-3" /></button></span>)}</div><div className="flex items-end gap-2"><label className="cursor-pointer rounded-xl border border-white/10 p-2 text-slate-400 hover:text-cyan-300"><Paperclip className="h-4 w-4" /><input type="file" accept="image/*,application/pdf" multiple hidden onChange={(event) => void handleFiles(event.target.files)} /></label><button onClick={() => void toggleVoiceNote()} className={`rounded-xl border p-2 ${recording ? "border-rose-400/30 bg-rose-500/10 text-rose-300" : "border-white/10 text-slate-400 hover:text-cyan-300"}`} title="Record voice note">{recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button><textarea value={draft} onChange={(event) => { setDraft(event.target.value); if (peer) socketRef.current?.emit("chat:typing", { receiverId: peer.id, typing: true }); }} onBlur={() => peer && socketRef.current?.emit("chat:typing", { receiverId: peer.id, typing: false })} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} rows={1} placeholder={peer ? "Message assigned medical channel..." : "Select a channel"} disabled={!peer} className="min-h-9 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white outline-none placeholder:text-slate-600" /><button onClick={() => void sendMessage()} disabled={!peer || (!draft.trim() && !pendingFiles.length)} className="rounded-xl bg-cyan-400 p-2 text-[#03142c] disabled:opacity-40"><Send className="h-4 w-4" /></button></div></div></section>
    </div>
    {incoming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"><div className="w-full max-w-sm rounded-3xl border border-cyan-300/30 bg-[#07182a]/95 p-6 text-center shadow-[0_0_80px_rgba(0,240,255,0.2)]"><div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200"><Phone className="h-7 w-7" /></div><p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Incoming Medical Call...</p><h2 className="mt-2 text-xl font-black text-white">{incoming.callerName}</h2><p className="mt-1 text-xs text-slate-400">{incoming.callType} consultation · assigned channel</p><div className="mt-6 flex gap-3"><button onClick={rejectCall} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/80 py-3 text-xs font-bold text-white"><PhoneOff className="h-4 w-4" /> Reject</button><button onClick={() => void acceptCall()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/80 py-3 text-xs font-bold text-white"><Phone className="h-4 w-4" /> Accept</button></div></div></div>}
    {activeCall && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg"><div className="relative flex h-[min(760px,90vh)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#061426] shadow-[0_0_100px_rgba(0,240,255,0.2)]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-300">Live Medical {activeCall.type} Call</p><h2 className="text-sm font-bold text-white">{peer?.name}</h2></div><span className="font-mono text-xs text-cyan-200">{formatTime(callSeconds)}</span></div><div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-[#061426] to-[#0a263d]">{activeCall.type === "Video" ? <><video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" /><video ref={localVideoRef} autoPlay playsInline className="absolute bottom-5 right-5 h-32 w-48 rounded-xl border border-cyan-300/30 bg-black/50 object-cover shadow-xl" /></> : <div className="text-center"><div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200"><UserRound className="h-10 w-10" /></div><p className="mt-4 text-sm font-bold text-white">{peer?.name}</p><div className="mt-3 flex items-center justify-center gap-1">{[1, 2, 3, 4, 5, 6].map((bar) => <span key={bar} className="h-3 w-1 animate-pulse rounded-full bg-cyan-300" style={{ animationDelay: `${bar * 80}ms` }} />)}</div><audio ref={remoteAudioRef} autoPlay /></div>}</div><div className="flex items-center justify-center gap-3 border-t border-white/10 bg-black/20 p-4"><button onClick={toggleMute} className={`rounded-full p-3 ${muted ? "bg-rose-500/80 text-white" : "bg-white/10 text-white"}`} title="Mute microphone">{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>{activeCall.type === "Video" && <><button onClick={toggleCamera} className={`rounded-full p-3 ${cameraOff ? "bg-rose-500/80 text-white" : "bg-white/10 text-white"}`} title="Toggle camera">{cameraOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}</button><button onClick={() => void shareScreen()} className="rounded-full bg-white/10 p-3 text-white" title="Share screen"><ScreenShare className="h-5 w-5" /></button></>}<button onClick={() => void closeCall("Completed")} className="rounded-full bg-rose-500/90 p-3 text-white" title="End call"><PhoneOff className="h-5 w-5" /></button><button className="rounded-full bg-white/10 p-3 text-white" title="Speaker"><Volume2 className="h-5 w-5" /></button></div></div></div>}
  </div>;
}
