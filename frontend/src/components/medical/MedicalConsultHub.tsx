"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import {
  API_BASE_URL,
  getStoredAccessToken,
  createMedicalCommunicationCall,
  getMedicalCommunicationCalls,
  getMedicalCommunicationMessages,
  getMedicalCommunicationPeers,
  markMedicalCommunicationRead,
  sendMedicalCommunicationMessage,
} from "../../lib/api";
import {
  AlertCircle,
  Camera,
  Check,
  CheckCheck,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Phone,
  PhoneOff,
  ScreenShare,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  UserRound,
  Video,
  VideoOff,
  Volume2,
  X,
} from "lucide-react";

type Peer = {
  id: string;
  name: string;
  email: string;
  role: "astronaut" | "medical_officer";
  astronautId?: string;
};

type Attachment = {
  name: string;
  type: string;
  url: string;
  size?: number;
};

type Message = {
  _id?: string;
  id?: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: "text" | "voice" | "file";
  attachments?: Attachment[];
  timestamp: string;
  readAt?: string;
};

type CallType = "Audio" | "Video";
type Signal = {
  type: "answer" | "candidate";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

export default function MedicalConsultHub() {
  const { user } = useAuth();
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [calls, setCalls] = useState<
    Array<{ _id?: string; callType: CallType; duration: number; status: string; timestamp: string }>
  >([]);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<Attachment[]>([]);
  const [typing, setTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [incoming, setIncoming] = useState<{
    callerId: string;
    callerName: string;
    callType: CallType;
    offer: RTCSessionDescriptionInit;
    roomSlug?: string;
  } | null>(null);
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
  const incomingRef = useRef<string | undefined>(undefined);
  const chatFeedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const loadPeers = useCallback(async () => {
    const response = await getMedicalCommunicationPeers();
    if (response.success) {
      const nextPeers = ((response.data as { peers?: Peer[] })?.peers || []);
      setPeers(nextPeers);
      socketRef.current?.emit("presence:check", { userIds: nextPeers.map((item) => item.id) });
      setPeer((current) => (current && nextPeers.some((item) => item.id === current.id) ? current : nextPeers[0] || null));
    } else if (response.message) {
      setError(response.message);
    }
  }, []);

  const loadConversation = useCallback(async (nextPeer: Peer) => {
    const [history, callHistory] = await Promise.all([
      getMedicalCommunicationMessages(nextPeer.id),
      getMedicalCommunicationCalls(nextPeer.id),
    ]);
    if (history.success) {
      setMessages(((history.data as { messages?: Message[] })?.messages || []));
    }
    if (callHistory.success) {
      setCalls(((callHistory.data as { calls?: typeof calls })?.calls || []));
    }
    await markMedicalCommunicationRead(nextPeer.id);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadPeers());
  }, [loadPeers]);

  useEffect(() => {
    if (peer) void Promise.resolve().then(() => loadConversation(peer));
  }, [peer, loadConversation]);

  useEffect(() => {
    if (socketReady && peers.length) {
      socketRef.current?.emit("presence:check", { userIds: peers.map((item) => item.id) });
    }
  }, [socketReady, peers]);

  const emitSignal = useCallback((signal: Signal, receiverId = peerRef.current?.id) => {
    if (receiverId) {
      socketRef.current?.emit("call:signal", { receiverId, roomSlug: incomingRef.current, signal });
    }
  }, []);

  const closeCall = useCallback(async (status: "Completed" | "Rejected" | "Cancelled" = "Completed") => {
    const currentPeer = peerRef.current;
    const seconds = callStartedRef.current ? Math.round((Date.now() - callStartedRef.current) / 1000) : 0;
    if (currentPeer && (callerRef.current || status !== "Completed")) {
      await createMedicalCommunicationCall({
        receiverId: currentPeer.id,
        callType: callTypeRef.current,
        duration: seconds,
        status,
      });
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setActiveCall(null);
    setIncoming(null);
    setCallSeconds(0);
    callerRef.current = false;
    callStartedRef.current = 0;
  }, []);

  const preparePeerConnection = useCallback(
    (receiverId: string, type: CallType) => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun.cloudflare.com:3478" },
        ],
      });
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emitSignal({ type: "candidate", candidate: event.candidate.toJSON() }, receiverId);
        }
      };
      pc.ontrack = (event) => {
        if (type === "Video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        if (type === "Audio" && remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          void closeCall("Cancelled");
        }
      };
      pcRef.current = pc;
      callTypeRef.current = type;
      return pc;
    },
    [closeCall, emitSignal]
  );

  const getLocalMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "Video" });
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
    }
    stream.getTracks().forEach((track) => pcRef.current?.addTrack(track, stream));
  }, []);

  const startCall = async (type: CallType) => {
    if (!peer || activeCall) return;
    try {
      callerRef.current = true;
      callStartedRef.current = Date.now();
      callTypeRef.current = type;
      const pc = preparePeerConnection(peer.id, type);
      await getLocalMedia(type);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const roomSlug = user?.id ? `telemedicine-${user.id}-${peer.id}` : undefined;
      socketRef.current?.emit("call:invite", { receiverId: peer.id, callType: type, roomSlug, offer });
      setActiveCall({ type, caller: true });
    } catch {
      setError("Camera or microphone permission was not available.");
      await closeCall("Cancelled");
    }
  };

  const acceptCall = async () => {
    if (!incoming) return;
    try {
      const call = incoming;
      callerRef.current = false;
      callStartedRef.current = Date.now();
      callTypeRef.current = call.callType;
      const pc = preparePeerConnection(call.callerId, call.callType);
      await getLocalMedia(call.callType);
      await pc.setRemoteDescription(call.offer);
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(candidate);
      }
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit("call:signal", {
        receiverId: call.callerId,
        roomSlug: call.roomSlug,
        signal: { type: "answer", sdp: answer },
      });
      setPeer((current) =>
        current?.id === call.callerId ? current : peers.find((item) => item.id === call.callerId) || current
      );
      setActiveCall({ type: call.callType, caller: false });
      setIncoming(null);
    } catch {
      setError("Unable to accept the medical call.");
      await closeCall("Cancelled");
    }
  };

  useEffect(() => {
    if (!user || peers.length === 0) {
      return;
    }
    const token = getStoredAccessToken();
    const socket = io(API_BASE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: { token },
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });
    socketRef.current = socket;
    socket.on("connect", () => setSocketReady(true));
    socket.on("disconnect", () => setSocketReady(false));
    socket.on("communication:error", (payload: { message?: string }) =>
      setError(payload.message || "Communication error.")
    );
    socket.on("presence:update", (payload: { userId: string; online: boolean }) => {
      if (payload.userId === peerRef.current?.id) setOnline(payload.online);
    });
    socket.on("chat:message", (message: Message) => {
      if (message.senderId === peerRef.current?.id || message.receiverId === peerRef.current?.id) {
        setMessages((current) =>
          current.some((item) => (item._id || item.id) === (message._id || message.id))
            ? current
            : [...current, message]
        );
        if (message.senderId === peerRef.current?.id) void markMedicalCommunicationRead(peerRef.current.id);
      }
    });
    socket.on("chat:typing", (payload: { senderId: string; typing: boolean }) => {
      if (payload.senderId === peerRef.current?.id) setTyping(payload.typing);
    });
    socket.on(
      "call:incoming",
      (payload: {
        callerId: string;
        callerName: string;
        callType: CallType;
        offer: RTCSessionDescriptionInit;
        roomSlug?: string;
      }) => {
        incomingRef.current = payload.roomSlug;
        setIncoming(payload);
      }
    );
    socket.on("call:signal", async (payload: { senderId: string; signal: Signal }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (payload.signal.type === "answer" && payload.signal.sdp) {
        await pc.setRemoteDescription(payload.signal.sdp);
      }
      if (payload.signal.type === "candidate" && payload.signal.candidate) {
        if (pc.remoteDescription) await pc.addIceCandidate(payload.signal.candidate);
        else pendingCandidatesRef.current.push(payload.signal.candidate);
      }
    });
    socket.on("call:status", (payload: { status?: string }) => {
      if (payload.status === "Rejected") {
        setError("The assigned Flight Surgeon rejected the call.");
        void closeCall("Rejected");
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
      void closeCall("Cancelled");
    };
  }, [closeCall, peers.length, user]);

  useEffect(() => {
    if (!activeCall) return;
    const timer = window.setInterval(
      () => setCallSeconds(callStartedRef.current ? Math.round((Date.now() - callStartedRef.current) / 1000) : 0),
      1000
    );
    return () => window.clearInterval(timer);
  }, [activeCall]);

  const sendMessage = async (
    message = draft,
    attachments = pendingFiles,
    messageType: "text" | "voice" | "file" = "text"
  ) => {
    if (!peer || (!message.trim() && !attachments.length)) return;
    const payload = { receiverId: peer.id, message: message.trim(), attachments, messageType };
    if (socketReady) {
      socketRef.current?.emit("chat:send", payload);
    } else {
      const response = await sendMedicalCommunicationMessage(payload);
      if (response.success && response.data) setMessages((current) => [...current, response.data as Message]);
    }
    setDraft("");
    setPendingFiles([]);
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/") || file.type === "application/pdf")
      .slice(0, 5);
    const attachments = await Promise.all(
      files.map(
        (file) =>
          new Promise<Attachment>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ name: file.name, type: file.type, size: file.size, url: String(reader.result) });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );
    setPendingFiles(attachments);
  };

  const toggleVoiceNote = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onload = () =>
          void sendMessage(
            "Voice note",
            [{ name: `voice-note-${Date.now()}.webm`, type: blob.type, size: blob.size, url: String(reader.result) }],
            "voice"
          );
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone permission was not available for the voice note.");
    }
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMuted(!track.enabled);
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOff(!track.enabled);
    }
  };

  const shareScreen = async () => {
    if (!pcRef.current || callTypeRef.current !== "Video") return;
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const sender = pcRef.current.getSenders().find((item) => item.track?.kind === "video");
      if (sender && screen.getVideoTracks()[0]) {
        await sender.replaceTrack(screen.getVideoTracks()[0]);
        screen.getVideoTracks()[0].onended = () => {
          const camera = localStreamRef.current?.getVideoTracks()[0];
          if (camera) void sender.replaceTrack(camera);
        };
      }
    } catch {
      /* screen share is optional */
    }
  };

  const rejectCall = () => {
    if (incoming) {
      socketRef.current?.emit("call:status", {
        receiverId: incoming.callerId,
        roomSlug: incoming.roomSlug,
        status: "Rejected",
      });
    }
    setIncoming(null);
  };

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-3 py-1 sm:py-2 text-slate-100 animate-fade-in" onClick={() => error && setError(null)}>
      {/* ─────────────────────────────────────────────────────────
          1. HEADER (Compact)
      ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-400/10 pb-2.5">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-xs">
            <span className={`h-2 w-2 rounded-full ${socketReady ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`} />
            {socketReady ? "Channel Active" : "Connecting…"}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          2. MAIN CONSULTATION INTERFACE
      ───────────────────────────────────────────────────────── */}
      <div className="grid min-h-[480px] lg:min-h-[540px] gap-3.5 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_320px] items-stretch">
        
        {/* Left Chat & Call Area */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#071324]/60 backdrop-blur-md">
          {/* Channel Top Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5 bg-slate-900/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                <UserRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white">{peer?.name || "Assigned Medical Officer"}</h2>
                <p className="text-[10.5px] text-slate-400">
                  {peer ? `${online ? "Online" : "Offline"} · Flight Surgeon Station` : "Select a consult channel"}
                </p>
              </div>
            </div>

            {peer && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void startCall("Audio")}
                  disabled={!!activeCall}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-40"
                  title="Audio consultation"
                >
                  <Phone className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void startCall("Video")}
                  disabled={!!activeCall}
                  className="rounded-xl border border-sky-400/20 bg-sky-500/10 p-2 text-sky-300 hover:bg-sky-500/20 transition disabled:opacity-40"
                  title="Video consultation"
                >
                  <Video className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Messages Feed */}
          <div
            ref={chatFeedRef}
            className="flex-1 space-y-3 overflow-y-auto p-3.5 sm:p-4 [scrollbar-width:thin]"
          >
            {!peer ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-slate-500">
                Choose an assigned Flight Surgeon to begin medical consultation.
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-2">
                <ShieldCheck className="h-10 w-10 text-sky-400/60" />
                <p className="text-sm font-bold text-white">Encrypted Channel Established</p>
                <p className="max-w-sm text-xs text-slate-400">
                  Voice notes, telemetry uploads, and clinical recommendations are securely routed to your assigned Medical Officer.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const mine = message.senderId === user?.id;
                return (
                  <div
                    key={message._id || message.id || message.timestamp}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        mine
                          ? "rounded-br-sm border border-sky-400/30 bg-sky-500/20 text-slate-100"
                          : "rounded-bl-sm border border-white/[0.08] bg-slate-900/80 text-slate-200"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.message}</p>
                      {message.attachments?.map((attachment) =>
                        attachment.type.startsWith("audio/") ? (
                          <audio
                            key={attachment.url}
                            controls
                            src={attachment.url}
                            className="mt-2 h-8 max-w-full"
                          />
                        ) : (
                          <a
                            key={attachment.url}
                            href={attachment.url}
                            download={attachment.name}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-[11px] text-sky-300 hover:text-white transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span className="truncate">{attachment.name}</span>
                          </a>
                        )
                      )}
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {mine &&
                          (message.readAt ? (
                            <CheckCheck className="h-3 w-3 text-sky-400" />
                          ) : (
                            <Check className="h-3 w-3" />
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {typing && <p className="text-xs italic text-sky-400">{peer?.name} is typing…</p>}
          </div>

          {/* Chat Input Bar */}
          <div className="border-t border-white/[0.06] p-3.5 bg-slate-900/30">
            {pendingFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingFiles.map((file) => (
                  <span
                    key={file.url}
                    className="flex items-center gap-1 rounded-md bg-sky-500/15 border border-sky-400/20 px-2 py-1 text-[10px] text-sky-200"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() =>
                        setPendingFiles((current) => current.filter((item) => item.url !== file.url))
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <label className="cursor-pointer rounded-xl border border-white/10 bg-slate-900/40 p-2.5 text-slate-400 hover:text-sky-300 transition">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  hidden
                  onChange={(event) => void handleFiles(event.target.files)}
                />
              </label>

              <button
                type="button"
                onClick={() => void toggleVoiceNote()}
                className={`rounded-xl border p-2.5 transition ${
                  recording
                    ? "border-rose-400 bg-rose-500/20 text-rose-300 animate-pulse"
                    : "border-white/10 bg-slate-900/40 text-slate-400 hover:text-sky-300"
                }`}
                title="Record voice note"
              >
                {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <textarea
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  if (peer) socketRef.current?.emit("chat:typing", { receiverId: peer.id, typing: true });
                }}
                onBlur={() => peer && socketRef.current?.emit("chat:typing", { receiverId: peer.id, typing: false })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                rows={1}
                placeholder={peer ? "Message Flight Surgeon…" : "Select a channel"}
                disabled={!peer}
                className="min-h-10 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-sky-400/40"
              />

              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!peer || (!draft.trim() && !pendingFiles.length)}
                className="rounded-xl bg-sky-500 p-2.5 text-[#03142c] font-bold hover:bg-sky-400 disabled:opacity-40 transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Assigned Surgeons & Call History */}
        <aside className="rounded-2xl border border-white/[0.08] bg-[#071324]/60 p-3.5 backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assigned Staff
              </h2>
              <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            </div>

            {peers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-slate-500">
                No active assignment available. Mission Control assigns your Flight Surgeon automatically.
              </div>
            ) : (
              <div className="space-y-1.5">
                {peers.map((item) => {
                  const isSelected = peer?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPeer(item)}
                      className={`flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition ${
                        isSelected
                          ? "border border-sky-400/30 bg-sky-500/15 text-white"
                          : "border border-transparent bg-slate-900/40 text-slate-300 hover:bg-slate-900/80 hover:text-white"
                      }`}
                    >
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        <UserRound className="h-4 w-4" />
                        {online && isSelected && (
                          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-[#071324] bg-emerald-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">{item.name}</p>
                        <p className="truncate text-[10px] text-sky-400">
                          {item.role === "astronaut" ? "Astronaut" : "Flight Surgeon"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Calls Log */}
          <div className="border-t border-white/[0.06] pt-2.5 mt-3 space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Recent Consults
            </p>
            {calls.length === 0 ? (
              <p className="text-[10.5px] text-slate-500">No previous calls logged.</p>
            ) : (
              calls.slice(0, 3).map((call) => (
                <div
                  key={call._id || call.timestamp}
                  className="flex items-center justify-between text-[10.5px] text-slate-400"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {call.callType === "Video" ? (
                      <Video className="h-3 w-3 text-sky-400" />
                    ) : (
                      <Phone className="h-3 w-3 text-emerald-400" />
                    )}
                    {call.status}
                  </span>
                  <span className="font-mono text-[9.5px] text-slate-400">{formatTime(call.duration || 0)}</span>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. INCOMING CALL MODAL
      ───────────────────────────────────────────────────────── */}
      {incoming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-2xl border border-sky-400/30 bg-[#071324] p-6 text-center shadow-2xl space-y-4">
            <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
              <Phone className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Incoming Medical Call</p>
              <h2 className="mt-1 text-xl font-bold text-white">{incoming.callerName}</h2>
              <p className="text-xs text-slate-400">{incoming.callType} consultation · Assigned channel</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={rejectCall}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 py-2.5 text-xs font-bold text-rose-200 hover:bg-rose-500/30 transition"
              >
                <PhoneOff className="h-4 w-4" /> Reject
              </button>
              <button
                type="button"
                onClick={() => void acceptCall()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-[#03142c] hover:bg-emerald-400 transition"
              >
                <Phone className="h-4 w-4" /> Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          4. ACTIVE CALL OVERLAY
      ───────────────────────────────────────────────────────── */}
      {activeCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-lg">
          <div className="relative flex h-[min(720px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[#071324] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3.5 bg-slate-900/50">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Live Medical {activeCall.type} Call
                </p>
                <h2 className="text-sm font-bold text-white">{peer?.name}</h2>
              </div>
              <span className="font-mono text-xs text-sky-300 font-semibold">{formatTime(callSeconds)}</span>
            </div>

            <div className="relative flex flex-1 items-center justify-center bg-slate-950">
              {activeCall.type === "Video" ? (
                <>
                  <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-white/20 bg-black/60 object-cover shadow-xl"
                  />
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40">
                    <UserRound className="h-9 w-9" />
                  </div>
                  <p className="text-sm font-bold text-white">{peer?.name}</p>
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <span
                        key={bar}
                        className="h-3 w-1 animate-pulse rounded-full bg-sky-400"
                        style={{ animationDelay: `${bar * 90}ms` }}
                      />
                    ))}
                  </div>
                  <audio ref={remoteAudioRef} autoPlay />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 border-t border-white/[0.08] bg-slate-900/60 p-4">
              <button
                type="button"
                onClick={toggleMute}
                className={`rounded-full p-3 transition ${
                  muted ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Mute microphone"
              >
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {activeCall.type === "Video" && (
                <>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    className={`rounded-full p-3 transition ${
                      cameraOff ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title="Toggle camera"
                  >
                    {cameraOff ? <VideoOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareScreen()}
                    className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20 transition"
                    title="Share screen"
                  >
                    <ScreenShare className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => void closeCall("Completed")}
                className="rounded-full bg-rose-500 p-3 text-white hover:bg-rose-600 transition shadow-lg"
                title="End consultation"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
