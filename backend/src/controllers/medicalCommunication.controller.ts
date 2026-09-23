import { Request, Response, NextFunction } from "express";
import { MedicalChat } from "../models/MedicalChat.js";
import { CallLogs } from "../models/CallLogs.js";
import { getCommunicationPeers, getCommunicationPeer } from "../services/medicalCommunication.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

const validCallTypes = ["Audio", "Video"] as const;
const validCallStatuses = ["Completed", "Rejected", "Missed", "Cancelled"] as const;

export class MedicalCommunicationController {
  static async getPeers(req: Request, res: Response, next: NextFunction) {
    try { return successResponse(res, { peers: await getCommunicationPeers(req.user!) }, 200); } catch (error) { next(error); }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const peerId = String(req.query.peerId || "");
      if (!(await getCommunicationPeer(req.user!, peerId))) return errorResponse(res, "Forbidden: this communication peer is not assigned to you.", 403);
      const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 200);
      const messages = await MedicalChat.find({ $or: [{ senderId: req.user!._id.toString(), receiverId: peerId }, { senderId: peerId, receiverId: req.user!._id.toString() }] }).sort({ timestamp: -1 }).limit(limit).lean();
      return successResponse(res, { messages: messages.reverse() }, 200);
    } catch (error) { next(error); }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const receiverId = String(req.body?.receiverId || "");
      if (!(await getCommunicationPeer(req.user!, receiverId))) return errorResponse(res, "Forbidden: this communication peer is not assigned to you.", 403);
      const attachments = Array.isArray(req.body?.attachments) ? req.body.attachments.slice(0, 5).filter((item: any) => item && typeof item.name === "string" && typeof item.type === "string" && typeof item.url === "string" && item.url.length <= 4_000_000) : [];
      const message = typeof req.body?.message === "string" ? req.body.message.trim().slice(0, 10000) : "";
      const messageType = req.body?.messageType === "voice" ? "voice" : attachments.length && !message ? "file" : "text";
      if (!message && !attachments.length) return errorResponse(res, "A message or attachment is required.", 400);
      const saved = await MedicalChat.create({ senderId: req.user!._id.toString(), receiverId, message, attachments, messageType });
      return successResponse(res, saved, 201, "Medical message sent.");
    } catch (error) { next(error); }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const peerId = String(req.body?.peerId || "");
      if (!(await getCommunicationPeer(req.user!, peerId))) return errorResponse(res, "Forbidden: this communication peer is not assigned to you.", 403);
      await MedicalChat.updateMany({ senderId: peerId, receiverId: req.user!._id.toString(), readAt: { $exists: false } }, { $set: { readAt: new Date() } });
      return successResponse(res, { updated: true }, 200);
    } catch (error) { next(error); }
  }

  static async getCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const peerId = String(req.query.peerId || "");
      if (!(await getCommunicationPeer(req.user!, peerId))) return errorResponse(res, "Forbidden: this communication peer is not assigned to you.", 403);
      const calls = await CallLogs.find({ $or: [{ callerId: req.user!._id.toString(), receiverId: peerId }, { callerId: peerId, receiverId: req.user!._id.toString() }] }).sort({ timestamp: -1 }).limit(50).lean();
      return successResponse(res, { calls }, 200);
    } catch (error) { next(error); }
  }

  static async createCall(req: Request, res: Response, next: NextFunction) {
    try {
      const receiverId = String(req.body?.receiverId || "");
      if (!(await getCommunicationPeer(req.user!, receiverId))) return errorResponse(res, "Forbidden: this communication peer is not assigned to you.", 403);
      const callType = req.body?.callType;
      const status = req.body?.status || "Completed";
      if (!validCallTypes.includes(callType)) return errorResponse(res, "Call type must be Audio or Video.", 400);
      if (!validCallStatuses.includes(status)) return errorResponse(res, "Invalid call status.", 400);
      const call = await CallLogs.create({ callerId: req.user!._id.toString(), receiverId, callType, duration: Math.max(0, Number(req.body?.duration || 0)), status });
      return successResponse(res, call, 201, "Call log saved.");
    } catch (error) { next(error); }
  }
}
