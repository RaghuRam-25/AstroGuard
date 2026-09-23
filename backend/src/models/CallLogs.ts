import mongoose, { Document, Schema } from "mongoose";

export interface ICallLogs extends Document {
  callerId: string;
  receiverId: string;
  callType: "Audio" | "Video";
  duration: number;
  status: "Completed" | "Rejected" | "Missed" | "Cancelled";
  timestamp: Date;
}

const CallLogsSchema = new Schema<ICallLogs>({
  callerId: { type: String, required: true, index: true },
  receiverId: { type: String, required: true, index: true },
  callType: { type: String, enum: ["Audio", "Video"], required: true },
  duration: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["Completed", "Rejected", "Missed", "Cancelled"], default: "Completed" },
  timestamp: { type: Date, default: Date.now, index: true },
});
CallLogsSchema.index({ callerId: 1, receiverId: 1, timestamp: -1 });
export const CallLogs = mongoose.model<ICallLogs>("CallLogs", CallLogsSchema);
