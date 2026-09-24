import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { User, IUser } from "./models/User.js";
import { MedicalChat } from "./models/MedicalChat.js";
import { getCommunicationPeer, getCommunicationPeers } from "./services/medicalCommunication.service.js";
import { verifyAccessToken } from "./utils/token.js";
import { env } from "./config/env.js";

function cookieToken(header?: string) {
  const match = header?.match(/(?:^|;\s*)astro_token=([^;]+)/);
  return match?.[1];
}

export function attachCommunicationSocket(server: HttpServer) {
  const configuredFrontendOrigins = (env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaultAllowedOrigins = [
    ...configuredFrontendOrigins,
    "https://astro-guard-liart.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ];

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const clean = origin.trim().replace(/\/+$/, "");
        if (
          defaultAllowedOrigins.includes(clean) ||
          clean.endsWith(".vercel.app")
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
      const token =
        socket.handshake.auth?.token ||
        bearerToken ||
        cookieToken(socket.handshake.headers.cookie);

      if (!token) return next(new Error("Authentication required"));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.id);
      if (!user || !user.isActive || !["astronaut", "medical_officer", "mission_control", "admin"].includes(user.role)) {
        return next(new Error("Communication access denied"));
      }
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid communication session"));
    }
  });

  const emitPresence = async (user: IUser, online: boolean) => {
    const peers = await getCommunicationPeers(user);
    peers.forEach((peer) => io.to(`user:${peer.id}`).emit("presence:update", { userId: user._id.toString(), online }));
  };

  io.on("connection", async (socket) => {
    const user = socket.data.user as IUser;
    const userId = user._id.toString();
    socket.join(`user:${userId}`);
    await emitPresence(user, true);
    socket.emit("communication:ready", { userId });

    socket.on("chat:send", async (payload: { receiverId?: string; message?: string; messageType?: string; attachments?: unknown[] }) => {
      const receiverId = String(payload?.receiverId || "");
      if (!(await getCommunicationPeer(user, receiverId))) return socket.emit("communication:error", { message: "Communication peer is not assigned to you." });
      const attachments = Array.isArray(payload.attachments) ? payload.attachments.slice(0, 5) : [];
      const message = typeof payload.message === "string" ? payload.message.trim().slice(0, 10000) : "";
      if (!message && !attachments.length) return;
      const saved = await MedicalChat.create({ senderId: userId, receiverId, message, messageType: payload.messageType === "voice" ? "voice" : attachments.length && !message ? "file" : "text", attachments });
      const messagePayload = saved.toObject();
      io.to(`user:${userId}`).to(`user:${receiverId}`).emit("chat:message", messagePayload);
    });

    socket.on("chat:typing", async (payload: { receiverId?: string; typing?: boolean }) => {
      const receiverId = String(payload?.receiverId || "");
      if (await getCommunicationPeer(user, receiverId)) io.to(`user:${receiverId}`).emit("chat:typing", { senderId: userId, typing: Boolean(payload.typing) });
    });

    socket.on("presence:check", async (payload: { userIds?: string[] }) => {
      const allowedIds = new Set((await getCommunicationPeers(user)).map((peer) => peer.id));
      (payload.userIds || []).filter((id) => allowedIds.has(id)).forEach((id) => {
        socket.emit("presence:update", { userId: id, online: Boolean(io.sockets.adapter.rooms.get(`user:${id}`)?.size) });
      });
    });

    socket.on("call:invite", async (payload: { receiverId?: string; callerId?: string; callType?: "Audio" | "Video"; roomSlug?: string; offer?: unknown }) => {
      const receiverId = String(payload?.receiverId || "");
      if (!(await getCommunicationPeer(user, receiverId))) return socket.emit("communication:error", { message: "Call peer is not assigned to you." });
      const roomSlug = typeof payload?.roomSlug === "string" ? payload.roomSlug.slice(0, 160) : undefined;
      io.to(`user:${receiverId}`).emit("call:incoming", { callerId: userId, callerName: user.name, callType: payload.callType === "Video" ? "Video" : "Audio", roomSlug, offer: payload.offer });
    });

    socket.on("call:signal", async (payload: { receiverId?: string; callerId?: string; roomSlug?: string; signal?: unknown }) => {
      const receiverId = String(payload?.receiverId || "");
      if (await getCommunicationPeer(user, receiverId)) io.to(`user:${receiverId}`).emit("call:signal", { senderId: userId, roomSlug: payload?.roomSlug, signal: payload.signal });
    });

    socket.on("call:status", async (payload: { receiverId?: string; callerId?: string; roomSlug?: string; status?: string }) => {
      const receiverId = String(payload?.receiverId || "");
      if (await getCommunicationPeer(user, receiverId)) io.to(`user:${receiverId}`).emit("call:status", { senderId: userId, roomSlug: payload?.roomSlug, status: payload.status });
    });

    socket.on("disconnect", async () => { await emitPresence(user, false); });
  });
  return io;
}
