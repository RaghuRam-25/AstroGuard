import mongoose, { Document, Schema } from "mongoose";

export interface IChatMessage extends Document {
  astronautId: string;
  role: "user" | "assistant";
  text?: string;
  analysis?: Record<string, unknown>;
  voice: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    astronautId: { type: String, required: true, trim: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    text: { type: String, default: "" },
    analysis: { type: Schema.Types.Mixed },
    voice: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ astronautId: 1, createdAt: -1 });
export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
