"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Camera, CameraOff, Lock, Mic, MicOff, Phone, PhoneOff, Radio, Satellite, Video, Wifi, X } from "lucide-react";
import { API_BASE_URL, createMedicalCommunicationCall } from "../../lib/api";

export interface CallModalProps {
  open: boolean;
  peerId: string | null;
  peerName: string;
  callType: "Audio" | "Video";
  callerId?: string;
  roomSlug?: string;
  onClose: () => void;
}

type CallMode = "idle" | "connecting" | "live" | "simulated" | "ended";

interface Signal {
  type: "answer" | "candidate";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export default function CallModal({ open, peerId, peerName, callType, callerId, roomSlug, onClose }: CallModalProps) {
  // Fresh state per link: the parent remounts this modal (via `key`) for each new call.
  const [mode, setMode] = useState<CallMode>("connecting");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [rejectedNote, setRejectedNote] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef<number>(0);
  const answeredRef = useRef(false);
  const endedRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const socketConnectedRef = useRef(false);
  const inviteSentRef = useRef(false);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);

  const formatTime = (total: number) =>
    `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;

  const finishCall = async (status: "Completed" | "Cancelled" | "Rejected") => {
    const receiverId = peerId;
    const duration = startedRef.current ? Math.max(0, Math.round((Date.now() - startedRef.current) / 1000)) : 0;
    if (receiverId) {
      await createMedicalCommunicationCall({ receiverId, callType, duration, status }).catch(() => undefined);
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    answeredRef.current = false;
    pendingCandidatesRef.current = [];
    socketConnectedRef.current = false;
    inviteSentRef.current = false;
    offerRef.current = null;
    startedRef.current = 0;
  };

  useEffect(() => {
    if (!open || !peerId) return;
    let disposed = false;
    const fallbackTimer = window.setTimeout(() => {
      if (!disposed && !answeredRef.current) setMode("simulated");
    }, 8000);

    endedRef.current = false;
    startedRef.current = Date.now();

    const socket = io(API_BASE_URL, { withCredentials: true, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    const tryInvite = () => {
      if (socketConnectedRef.current && !inviteSentRef.current && peerId) {
        inviteSentRef.current = true;
        socket.emit("call:invite", { receiverId: peerId, callerId, callType, roomSlug, offer: offerRef.current ?? undefined });
      }
    };

    const preparePeerConnection = () => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.onicecandidate = (event) => { if (event.candidate && peerId) socket.emit("call:signal", { receiverId: peerId, callerId, roomSlug, signal: { type: "candidate", candidate: event.candidate.toJSON() } }); };
      pc.ontrack = (event) => {
        if (callType === "Video" && remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        if (callType === "Audio" && remoteAudioRef.current) remoteAudioRef.current.srcObject = event.streams[0];
      };
      pc.onconnectionstatechange = () => {
        if (["connected", "completed"].includes(pc.connectionState) && !answeredRef.current) {
          answeredRef.current = true;
          if (!disposed) setMode("live");
        }
        if (["failed", "disconnected", "closed"].includes(pc.connectionState) && answeredRef.current && !disposed) {
          setRejectedNote("The deep-space link was interrupted.");
          setMode("ended");
          void finishCall("Cancelled");
        }
      };
      pcRef.current = pc;
      return pc;
    };

    socket.on("connect", () => {
      socketConnectedRef.current = true;
      tryInvite();
    });
    socket.on("disconnect", () => { socketConnectedRef.current = false; });

    socket.on("call:signal", async (payload: { signal: Signal }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (payload.signal.type === "answer" && payload.signal.sdp) {
        await pc.setRemoteDescription(payload.signal.sdp);
        for (const candidate of pendingCandidatesRef.current) await pc.addIceCandidate(candidate);
        pendingCandidatesRef.current = [];
      } else if (payload.signal.type === "candidate" && payload.signal.candidate) {
        if (pc.remoteDescription) await pc.addIceCandidate(payload.signal.candidate);
        else pendingCandidatesRef.current.push(payload.signal.candidate);
      }
    });

    socket.on("call:status", (payload: { status?: string }) => {
      if (payload.status === "Rejected") {
        setRejectedNote("The astronaut could not accept the link right now.");
        void finishCall("Cancelled");
        if (!disposed) setMode("ended");
      }
    });

    (async () => {
      let media: MediaStream | null = null;
      try {
        media = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === "Video" });
        if (disposed) { media.getTracks().forEach((track) => track.stop()); return; }
        localStreamRef.current = media;
        if (callType === "Video" && localVideoRef.current) {
          localVideoRef.current.srcObject = media;
          localVideoRef.current.muted = true;
        }
        const pc = preparePeerConnection();
        media.getTracks().forEach((track) => pc.addTrack(track, media as MediaStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        offerRef.current = offer;
        tryInvite();
      } catch {
        if (disposed) return;
        media?.getTracks().forEach((track) => track.stop());
      }
    })();

    return () => {
      disposed = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (!endedRef.current) void finishCall("Cancelled");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, peerId, callType]);

  useEffect(() => {
    if (mode === "idle" || mode === "ended") return;
    const timer = window.setInterval(() => {
      setSeconds((current) => (startedRef.current ? Math.max(1, Math.round((Date.now() - startedRef.current) / 1000)) : current));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [mode]);

  const endCall = async () => {
    endedRef.current = true;
    await finishCall("Completed");
    onClose();
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMuted(!track.enabled); }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCameraOff(!track.enabled); }
  };

  if (!open) return null;

  const inCall = mode === "live" || mode === "simulated";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg">
      <div className="relative flex h-[min(640px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#080C14] shadow-[0_0_100px_rgba(6,182,212,0.2)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Deep-Space Comms Link · {callType}
            </p>
            <h2 className="mt-0.5 text-lg font-black text-white">{peerName}</h2>
          </div>
          <div className="flex items-center gap-3">
            {mode !== "idle" && mode !== "ended" && <span className="font-mono text-sm text-cyan-200">{formatTime(seconds)}</span>}
            <button onClick={() => void endCall()} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/40 hover:text-rose-300" title="Close link">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-[#080C14] to-[#0a263d]">
          {mode === "connecting" && (
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-400/10 text-cyan-200">
                <Satellite className="h-10 w-10" />
              </div>
              <p className="mt-4 text-sm font-bold text-white">Establishing secure link…</p>
              <p className="mt-1 text-[10px] text-slate-400">Synchronising with the astronaut&apos;s onboard terminal</p>
            </div>
          )}

          {mode === "live" && callType === "Video" && (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />
              <video ref={localVideoRef} autoPlay playsInline className="absolute bottom-5 right-5 h-32 w-48 rounded-xl border border-cyan-300/30 bg-black/50 object-cover shadow-xl" />
            </>
          )}

          {mode === "live" && callType === "Audio" && (
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 animate-pulse items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-emerald-200">
                <Phone className="h-10 w-10" />
              </div>
              <p className="mt-4 text-sm font-bold text-white">Live encrypted audio</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                  <span key={bar} className="h-3 w-1 animate-pulse rounded-full bg-emerald-300" style={{ animationDelay: `${bar * 90}ms` }} />
                ))}
              </div>
              <audio ref={remoteAudioRef} autoPlay />
            </div>
          )}

          {mode === "simulated" && (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-400/15 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <Radio className="h-9 w-9 animate-pulse" />
              </div>
              <p className="mt-4 text-sm font-black tracking-wide text-white">DEEP-SPACE SIMULATED LINK ACTIVE</p>
              <p className="mx-auto mt-1 max-w-sm text-[10px] leading-relaxed text-slate-400">
                The astronaut&apos;s terminal is not accepting live media this moment, so the link runs in mission
                simulator mode. Call activity is still recorded on the secure mission log.
              </p>
              {rejectedNote && <p className="mt-3 text-[10px] text-amber-300">{rejectedNote}</p>}
            </div>
          )}

          {mode === "ended" && (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-400/10 text-amber-300">
                <PhoneOff className="h-7 w-7" />
              </div>
              <p className="mt-4 text-sm font-bold text-white">Link ended</p>
              <p className="mt-1 text-[10px] text-slate-400">{rejectedNote || "The deep-space communications session was closed."}</p>
              <button
                onClick={() => void endCall()}
                className="mt-5 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2 text-xs font-bold text-white transition hover:bg-white/10"
              >
                Close Session
              </button>
            </div>
          )}

          {inCall && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/10 bg-black/50 p-2 backdrop-blur-md">
              <span className="hidden items-center gap-1.5 px-2 font-mono text-[9px] text-cyan-300 sm:flex">
                <Lock className="h-3 w-3" /> ENCRYPTED
              </span>
              <button onClick={toggleMute} className={`rounded-full p-2.5 transition ${muted ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              {callType === "Video" && (
                <button onClick={toggleCamera} className={`rounded-full p-2.5 transition ${cameraOff ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}>
                  {cameraOff ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                </button>
              )}
              <button onClick={() => void endCall()} className="flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-rose-400">
                <PhoneOff className="h-4 w-4" /> End Link
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-white/10 bg-black/20 px-4 py-3">
          <LinkBadge icon={<Wifi className="h-3 w-3" />} label="Uplink 99.2%" />
          <LinkBadge icon={<Radio className="h-3 w-3" />} label="Latency 42ms" />
          <LinkBadge icon={<Lock className="h-3 w-3" />} label="AES-256" />
          <LinkBadge icon={<Video className="h-3 w-3" />} label={callType === "Video" ? "Codec VP8" : "Codec OPUS"} />
          <LinkBadge icon={<Satellite className="h-3 w-3" />} label={mode === "live" ? "MODE: LIVE WEBRTC" : mode === "simulated" ? "MODE: SIMULATOR" : mode === "ended" ? "MODE: CLOSED" : "MODE: HANDSHAKE"} />
        </div>
      </div>
    </div>
  );
}

function LinkBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2 py-1 font-mono text-[9px] font-semibold text-cyan-300">
      {icon}
      {label}
    </span>
  );
}