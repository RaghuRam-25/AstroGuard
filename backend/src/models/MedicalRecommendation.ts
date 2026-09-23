import mongoose, { Document, Schema } from "mongoose";

export type RecommendationSource = "AI" | "Doctor";
export type RecommendationTone = "calm" | "preventive" | "urgent";

export interface IMedicalRecommendation extends Document {
  astronautId: string;
  doctorId: string;
  doctorName: string;
  message: string;
  source: RecommendationSource;
  tone: RecommendationTone;
  approvedByDoctor?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecommendationSchema = new Schema<IMedicalRecommendation>(
  {
    astronautId: { type: String, required: true, index: true, trim: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    source: { type: String, enum: ["AI", "Doctor"], default: "Doctor" },
    tone: { type: String, enum: ["calm", "preventive", "urgent"], default: "calm" },
    approvedByDoctor: { type: String, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MedicalRecommendationSchema.index({ astronautId: 1, createdAt: -1 });
MedicalRecommendationSchema.index({ astronautId: 1, readAt: 1 });

export const MedicalRecommendation = mongoose.model<IMedicalRecommendation>(
  "MedicalRecommendation",
  MedicalRecommendationSchema
);