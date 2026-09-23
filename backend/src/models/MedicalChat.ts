import mongoose, { Document, Schema } from "mongoose";

export interface ChatAttachment { name: string; type: string; url: string; size?: number; }
export interface IMedicalChat extends Document {
  senderId: string;
  receiverId: string;
  message: string;
  messageType: "text" | "voice" | "file";
  attachments: ChatAttachment[];
  timestamp: Date;
  readAt?: Date;
}

const attachmentSchema = new Schema<ChatAttachment>({ name: String, type: String, url: String, size: Number }, { _id: false });
const MedicalChatSchema = new Schema<IMedicalChat>({
  senderId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },
  message: { type: String, default: "", maxlength: 10000 },
  messageType: { type: String, enum: ["text", "voice", "file"], default: "text" },
  attachments: { type: [attachmentSchema], default: [] },
  timestamp: { type: Date, default: Date.now, index: true },
  readAt: Date,
}, { timestamps: true });
MedicalChatSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
export const MedicalChat = mongoose.model<IMedicalChat>("MedicalChat", MedicalChatSchema);
