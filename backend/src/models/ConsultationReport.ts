import mongoose, { Document, Schema } from "mongoose";

export type ConsultationReportStatus = "Unreviewed" | "Reviewed";

export interface IConsultationReport extends Document {
  astronautId: string;
  assignedDoctorId: string;
  timestamp: Date;
  symptoms: string;
  vitalsSnapshot: Record<string, unknown>;
  aiAdviceSummary: string;
  fullTranscript: unknown;
  riskLevel: "Low" | "Moderate" | "Critical";
  anomalyScore: number;
  status: ConsultationReportStatus;
  doctorNotes?: string;
  doctorDecision?: "Approved" | "Overridden";
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationReportSchema = new Schema<IConsultationReport>(
  {
    astronautId: { type: String, required: true, index: true, trim: true },
    assignedDoctorId: { type: String, required: true, index: true, trim: true },
    timestamp: { type: Date, default: Date.now, index: true },
    symptoms: { type: String, required: true, default: "No specific symptom documented." },
    vitalsSnapshot: { type: Schema.Types.Mixed, required: true },
    aiAdviceSummary: { type: String, required: true },
    fullTranscript: { type: Schema.Types.Mixed, default: [] },
    riskLevel: { type: String, enum: ["Low", "Moderate", "Critical"], default: "Low" },
    anomalyScore: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ["Unreviewed", "Reviewed"], default: "Unreviewed", index: true },
    doctorNotes: { type: String, default: "" },
    doctorDecision: { type: String, enum: ["Approved", "Overridden"] },
    reviewedAt: Date,
    reviewedBy: String,
  },
  { timestamps: true }
);

ConsultationReportSchema.index({ assignedDoctorId: 1, status: 1, timestamp: -1 });
export const ConsultationReport = mongoose.model<IConsultationReport>("ConsultationReport", ConsultationReportSchema);
