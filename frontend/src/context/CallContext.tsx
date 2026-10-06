"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import {
  API_BASE_URL,
  getStoredAccessToken,
  createMedicalCommunicationCall,
} from "../lib/api";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Satellite,
  ShieldCheck,
  User,
  Radio,
  X,
  Volume2,
  Sparkles,
} from "lucide-react";

export type CallState =
  | "IDLE"
  | "CALLING"
  | "RINGING"
  | "CONNECTING"
  | "CONNECTED"
  | "REJECTED"
  | "BUSY"
  | "TIMEOUT"
  | "ENDED"
  | "FAILED";

export type CallType = "Audio" | "Video";

export interface CallPeer {
  id: string;
  name: string;
  email?: string;
  role: "astronaut" | "medical_officer";
  astronautId?: string;
}

interface IncomingCallPayload {
  callId: string;
  callerId: string;
  callerName: string;
  callerRole: "astronaut" | "medical_officer";
  callerAstronautId?: string;
  callType: CallType;
  roomSlug?: string;
  offer?: RTCSessionDescriptionInit;
  timestamp: string;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  activePeer: CallPeer | null;
  incomingCall: IncomingCallPayload | null;
  callDuration: number;
  muted: boolean;
  cameraOff: boolean;
  callErrorMessage: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (peer: CallPeer, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  const [callState, setCallState] = useState<CallState>("IDLE");
  const [callType, setCallType] = useState<CallType>("Audio");
  const [activePeer, setActivePeer] = useState<CallPeer | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [callErrorMessage, setCallErrorMessage] = useState<string | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const callConnectedAtRef = useRef<number | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callIdRef = useRef<string | null>(null);
  const currentPeerRef = useRef<CallPeer | null>(null);
  const callStateRef = useRef<CallState>("IDLE");
  const isCallerRef = useRef<boolean>(false);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs
  useEffect(() => {
    currentPeerRef.current = activePeer;
  }, [activePeer]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Establish persistent communication socket for authenticated Astronaut / Doctor
  useEffect(() => {
    if (!user || !["astronaut", "medical_officer"].includes(user.role)) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = getStoredAccessToken();
    const socket = io(API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : ""), {
      auth: { token },
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("call:incoming", (payload: IncomingCallPayload) => {
      // If already in a call, notify caller that we're busy
      if (callState !== "IDLE" && callState !== "ENDED") {
        socket.emit("call:busy", {
          callId: payload.callId,
          receiverId: payload.callerId,
          roomSlug: payload.roomSlug,
        });
        return;
      }

      setIncomingCall(payload);
      setCallType(payload.callType);
      setActivePeer({
        id: payload.callerId,
        name: payload.callerName,
        role: payload.callerRole,
        astronautId: payload.callerAstronautId,
      });
      callIdRef.current = payload.callId;
      isCallerRef.current = false;
      setCallState("RINGING");

      // Set 30s auto-dismiss timeout for unanswered incoming call
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = setTimeout(() => {
        setIncomingCall(null);
        setCallState("IDLE");
      }, 30000);
    });

    socket.on("call:accepted", async (payload: { callId?: string; answer?: RTCSessionDescriptionInit }) => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      const pc = pcRef.current;
      if (!pc) return;

      if (payload.answer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          // Drain queued ICE candidates
          for (const cand of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidatesRef.current = [];
          setCallState("CONNECTING");
        } catch (e) {
          console.error("Error setting remote description on accept:", e);
        }
      }
    });

    socket.on("call:rejected", (payload: { reason?: string }) => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      setCallErrorMessage(payload.reason || "Call was declined by participant.");
      setCallState("REJECTED");
      void teardownCall(false);
      setTimeout(() => {
        setCallState("IDLE");
        setCallErrorMessage(null);
      }, 3000);
    });

    socket.on("call:busy", (payload: { message?: string }) => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      setCallErrorMessage(payload.message || "Participant is currently on another call.");
      setCallState("BUSY");
      void teardownCall(false);
      setTimeout(() => {
        setCallState("IDLE");
        setCallErrorMessage(null);
      }, 3500);
    });

    socket.on("call:ended", (payload: { endedBy?: string; duration?: number }) => {
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      setCallErrorMessage(`Call ended by ${payload.endedBy || "remote participant"}.`);
      setCallState("ENDED");
      void teardownCall(false);
      setTimeout(() => {
        setCallState("IDLE");
        setCallErrorMessage(null);
      }, 2500);
    });

    socket.on("call:signal", async (payload: { senderId: string; signal: { type: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit } }) => {
      const pc = pcRef.current;
      if (!pc) return;

      try {
        if (payload.signal.type === "answer" && payload.signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.signal.sdp));
          for (const cand of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidatesRef.current = [];
        } else if (payload.signal.type === "candidate" && payload.signal.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.signal.candidate));
          } else {
            pendingCandidatesRef.current.push(payload.signal.candidate);
          }
        }
      } catch (err) {
        console.error("Signal processing error:", err);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, callState]);

  // Synchronized Call Timer (Ticks ONLY when CONNECTED)
  useEffect(() => {
    if (callState !== "CONNECTED" || !callConnectedAtRef.current) {
      return;
    }

    const interval = setInterval(() => {
      if (callConnectedAtRef.current) {
        const elapsed = Math.max(0, Math.floor((Date.now() - callConnectedAtRef.current) / 1000));
        setCallDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [callState]);

  // Cleanup WebRTC & Media Resources
  const teardownCall = useCallback(async (emitEnd = true) => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    const duration = callConnectedAtRef.current
      ? Math.max(0, Math.round((Date.now() - callConnectedAtRef.current) / 1000))
      : 0;

    const peer = currentPeerRef.current;
    const callId = callIdRef.current;

    if (emitEnd && socketRef.current && peer?.id) {
      socketRef.current.emit("call:end", {
        callId,
        receiverId: peer.id,
        duration,
      });
    }

    // Save call log in database
    if (peer?.id && (isCallerRef.current || duration > 0)) {
      try {
        await createMedicalCommunicationCall({
          receiverId: peer.id,
          callType,
          duration,
          status: duration > 0 ? "Completed" : "Cancelled",
        });
      } catch {}
    }

    // Stop and release all local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Clear remote media
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    // Close and clean PeerConnection
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    pendingCandidatesRef.current = [];
    callConnectedAtRef.current = null;
    setIncomingCall(null);
    setMuted(false);
    setCameraOff(false);
  }, [callType]);

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback((targetPeerId: string, type: CallType) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetPeerId) {
        socketRef.current.emit("call:signal", {
          receiverId: targetPeerId,
          signal: {
            type: "candidate",
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);

      if (remoteVideoRef.current && type === "Video") {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (["connected"].includes(pc.connectionState)) {
        if (!callConnectedAtRef.current) {
          callConnectedAtRef.current = Date.now();
        }
        setCallState("CONNECTED");
        if (timeoutTimerRef.current) {
          clearTimeout(timeoutTimerRef.current);
          timeoutTimerRef.current = null;
        }
      } else if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        if (callState === "CONNECTED" || callState === "CONNECTING") {
          setCallErrorMessage("Telemedicine connection link closed.");
          setCallState("ENDED");
          void teardownCall(true);
          setTimeout(() => {
            setCallState("IDLE");
            setCallErrorMessage(null);
          }, 2500);
        }
      }
    };

    return pc;
  }, [callState, teardownCall]);

  // 1. Initiate Outgoing Call (Astronaut -> Doctor OR Doctor -> Astronaut)
  const startCall = async (peer: CallPeer, type: CallType) => {
    if (!peer?.id) {
      setCallErrorMessage("No valid communication peer selected.");
      return;
    }
    if (callState !== "IDLE") return;

    try {
      setCallErrorMessage(null);
      setActivePeer(peer);
      setCallType(type);
      isCallerRef.current = true;
      setCallDuration(0);
      setMuted(false);
      setCameraOff(false);

      const generatedCallId = `CALL-2026-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      callIdRef.current = generatedCallId;
      setCallState("CALLING");

      // Set 30s timeout for unanswered call
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = setTimeout(() => {
        if (callStateRef.current === "CALLING" || callStateRef.current === "CONNECTING") {
          setCallErrorMessage("No answer from remote participant. Call timed out.");
          setCallState("TIMEOUT");
          void teardownCall(true);
          setTimeout(() => {
            setCallState("IDLE");
            setCallErrorMessage(null);
          }, 3000);
        }
      }, 30000);

      // Acquire user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "Video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current && type === "Video") {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      // Prepare PeerConnection and add tracks
      const pc = createPeerConnection(peer.id, type);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create Offer and dispatch via socket
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === "Video",
      });
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("call:invite", {
        callId: generatedCallId,
        receiverId: peer.id,
        callType: type,
        roomSlug: `telemedicine-${user?.id}-${peer.id}`,
        offer,
      });
    } catch (err: unknown) {
      console.error("Start call error:", err);
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Microphone / Camera access was denied. Please allow permissions in browser settings."
          : "Unable to start media devices. Check hardware connections.";
      setCallErrorMessage(msg);
      setCallState("FAILED");
      void teardownCall(false);
      setTimeout(() => {
        setCallState("IDLE");
        setCallErrorMessage(null);
      }, 4000);
    }
  };

  // 2. Accept Incoming Call
  const acceptCall = async () => {
    if (!incomingCall) return;
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);

    try {
      const call = incomingCall;
      setCallErrorMessage(null);
      setCallType(call.callType);
      setCallState("CONNECTING");
      setCallDuration(0);
      setMuted(false);
      setCameraOff(false);

      // Acquire local media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.callType === "Video" ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (localVideoRef.current && call.callType === "Video") {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      const pc = createPeerConnection(call.callerId, call.callType);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (call.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
        for (const cand of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit("call:accept", {
          callId: call.callId,
          receiverId: call.callerId,
          roomSlug: call.roomSlug,
          answer,
        });

        socketRef.current?.emit("call:signal", {
          receiverId: call.callerId,
          roomSlug: call.roomSlug,
          signal: { type: "answer", sdp: answer },
        });
      }

      setIncomingCall(null);
    } catch (err: unknown) {
      console.error("Accept call error:", err);
      setCallErrorMessage("Unable to accept call due to device permission issue.");
      setCallState("FAILED");
      void teardownCall(true);
      setTimeout(() => {
        setCallState("IDLE");
        setCallErrorMessage(null);
      }, 3500);
    }
  };

  // 3. Decline Incoming Call
  const declineCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit("call:reject", {
        callId: incomingCall.callId,
        receiverId: incomingCall.callerId,
        roomSlug: incomingCall.roomSlug,
        reason: "Call declined by user.",
      });
    }
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    setIncomingCall(null);
    setCallState("IDLE");
    void teardownCall(false);
  };

  // 4. Hang up / End Active Call
  const endCall = async () => {
    setCallState("ENDED");
    await teardownCall(true);
    setTimeout(() => {
      setCallState("IDLE");
    }, 1500);
  };

  // 5. Toggle Microphone
  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  };

  // 6. Toggle Camera
  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOff(!videoTrack.enabled);
    }
  };

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (totalSeconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        activePeer,
        incomingCall,
        callDuration,
        muted,
        cameraOff,
        callErrorMessage,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}

      {/* Hidden Audio Element for WebRTC Remote Audio Playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ─────────────────────────────────────────────────────────────
          A. GLOBAL INCOMING CALL MODAL (Visible across all routes)
      ───────────────────────────────────────────────────────────── */}
      {incomingCall && callState === "RINGING" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-cyan-400/40 bg-gradient-to-b from-[#081528] to-[#040914] p-7 text-center shadow-[0_0_80px_rgba(6,182,212,0.35)]">
            
            {/* Top Badge */}
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-cyan-300">
                Incoming {incomingCall.callType} Call
              </span>
            </div>

            {/* Glowing Avatar */}
            <div className="relative mx-auto mt-6 flex h-28 w-28 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500/20 via-[#0d223a] to-emerald-500/20 border border-cyan-300/40 text-cyan-200 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                {incomingCall.callType === "Video" ? (
                  <Video className="h-10 w-10 text-cyan-300" />
                ) : (
                  <Phone className="h-10 w-10 text-emerald-300 animate-bounce" />
                )}
              </div>
            </div>

            {/* Caller Information */}
            <h3 className="mt-5 text-xl font-black text-white">{incomingCall.callerName}</h3>
            <p className="mt-1 font-mono text-xs text-slate-300">
              {incomingCall.callerRole === "medical_officer"
                ? "Flight Surgeon · Medical Command"
                : `Astronaut · ${incomingCall.callerAstronautId || "Crew Member"}`}
            </p>
            <p className="mt-2 text-[11px] text-cyan-300/80 font-mono">
              Encrypted Deep-Space Telemedicine Channel
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={declineCall}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-500/40 bg-rose-600/25 text-rose-300 hover:bg-rose-600/40 hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                title="Decline Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={acceptCall}
                className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse"
                title="Accept Call"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          B. GLOBAL ACTIVE AUDIO / VIDEO CALL HUD MODAL
      ───────────────────────────────────────────────────────────── */}
      {(callState === "CALLING" ||
        callState === "CONNECTING" ||
        callState === "CONNECTED" ||
        callState === "REJECTED" ||
        callState === "BUSY" ||
        callState === "TIMEOUT" ||
        callState === "ENDED" ||
        callState === "FAILED") &&
        activePeer && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-2xl animate-fade-in">
            <div className="relative flex h-[min(680px,94vh)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#050C17] shadow-[0_0_100px_rgba(6,182,212,0.25)]">
              
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-[#081324]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/10 border border-cyan-300/30 text-cyan-300">
                    {callType === "Video" ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{activePeer.name}</h2>
                      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-mono text-cyan-300 uppercase">
                        {activePeer.role === "medical_officer" ? "Flight Surgeon" : activePeer.astronautId || "Astronaut"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      {callState === "CALLING" && "Transmitting satellite handshake…"}
                      {callState === "CONNECTING" && "Negotiating WebRTC stream…"}
                      {callState === "CONNECTED" && "Secure Deep-Space Link · Quantum AES-256"}
                      {callState === "ENDED" && "Call Ended"}
                      {callState === "REJECTED" && "Call Declined"}
                      {callState === "BUSY" && "Line Busy"}
                      {callState === "TIMEOUT" && "No Answer"}
                      {callState === "FAILED" && "Connection Interrupted"}
                    </p>
                  </div>
                </div>

                {/* Duration & Close Button */}
                <div className="flex items-center gap-4">
                  {callState === "CONNECTED" && (
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-sm font-bold text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void endCall()}
                    className="rounded-xl border border-white/10 p-2 text-slate-400 hover:border-rose-400/40 hover:text-rose-300 transition"
                    title="Terminate Call"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Main Media Canvas */}
              <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-[#060e1c] via-[#081528] to-[#040914] overflow-hidden">
                
                {/* 1. Video Call Mode */}
                {callType === "Video" && (
                  <div className="relative h-full w-full flex items-center justify-center">
                    {/* Remote Video */}
                    {callState === "CONNECTED" && remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 animate-pulse">
                          <Satellite className="h-12 w-12" />
                        </div>
                        <p className="mt-4 text-base font-bold text-white">
                          {callState === "CALLING" && `Calling ${activePeer.name}…`}
                          {callState === "CONNECTING" && "Synchronizing live camera feed…"}
                          {callState === "REJECTED" && (callErrorMessage || "Call was declined.")}
                          {callState === "BUSY" && (callErrorMessage || "Participant is busy on another call.")}
                          {callState === "TIMEOUT" && "No answer from remote terminal."}
                          {callState === "ENDED" && `Call completed · ${formatDuration(callDuration)}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 font-mono">
                          Relay Gateway: Lunar Orbit Deep-Space Station (BLG-001)
                        </p>
                      </div>
                    )}

                    {/* Local Camera Picture-in-Picture Preview */}
                    <div className="absolute bottom-4 right-4 z-20 h-28 w-40 sm:h-36 sm:w-56 overflow-hidden rounded-2xl border-2 border-cyan-400/40 bg-black/70 shadow-2xl backdrop-blur-md">
                      {cameraOff ? (
                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-400">
                          <VideoOff className="h-7 w-7 text-rose-400 mb-1" />
                          <span className="text-[10px] font-mono">Camera Off</span>
                        </div>
                      ) : (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-cyan-200">
                        Self View
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Audio Call Mode */}
                {callType === "Audio" && (
                  <div className="text-center p-8">
                    <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                      {callState === "CONNECTED" && (
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
                      )}
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500/20 via-[#0a233a] to-cyan-500/20 border-2 border-emerald-400/40 text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                        <User className="h-14 w-14" />
                      </div>
                    </div>

                    <h3 className="mt-6 text-2xl font-black text-white">{activePeer.name}</h3>
                    <p className="mt-1 font-mono text-xs text-cyan-300">
                      {activePeer.role === "medical_officer" ? "Flight Surgeon Command" : "Onboard Telemedicine Session"}
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          callState === "CONNECTED" ? "bg-emerald-400 animate-pulse" : "bg-cyan-400 animate-ping"
                        }`}
                      />
                      <span className="font-mono text-sm font-semibold text-slate-200">
                        {callState === "CALLING" && "Ringing remote terminal…"}
                        {callState === "CONNECTING" && "Establishing encrypted audio channel…"}
                        {callState === "CONNECTED" && `Connected (${formatDuration(callDuration)})`}
                        {callState === "REJECTED" && (callErrorMessage || "Call declined.")}
                        {callState === "BUSY" && (callErrorMessage || "Participant busy.")}
                        {callState === "TIMEOUT" && "No answer."}
                        {callState === "ENDED" && `Call ended · Duration: ${formatDuration(callDuration)}`}
                      </span>
                    </div>

                    {/* Audio Wave Visualizer Simulation */}
                    {callState === "CONNECTED" && (
                      <div className="mt-8 flex items-center justify-center gap-1.5 h-10">
                        {[40, 65, 85, 50, 95, 70, 45, 90, 60, 80, 55, 75].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-emerald-400 animate-pulse"
                            style={{
                              height: `${h}%`,
                              animationDelay: `${(i * 0.1).toFixed(1)}s`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Call Control Bar */}
              <div className="flex items-center justify-center gap-5 border-t border-white/10 bg-[#081324] px-6 py-4">
                {/* Microphone Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={callState !== "CONNECTED" && callState !== "CONNECTING"}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                    muted
                      ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                      : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                  title={muted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {/* Camera Toggle (For Video Calls) */}
                {callType === "Video" && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    disabled={callState !== "CONNECTED" && callState !== "CONNECTING"}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                      cameraOff
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                        : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                    title={cameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                )}

                {/* End Call Button */}
                <button
                  type="button"
                  onClick={() => void endCall()}
                  className="flex h-14 w-28 items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-600 font-bold text-white shadow-[0_0_25px_rgba(244,63,94,0.4)] hover:bg-rose-500 active:scale-95 transition-all"
                  title="End Call"
                >
                  <PhoneOff className="h-5 w-5" />
                  <span className="text-xs">END</span>
                </button>
              </div>

            </div>
          </div>
        )}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
