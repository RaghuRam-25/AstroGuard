import mongoose, { Document, Schema } from "mongoose";

export type ClinicalRiskLevel = "LOW" | "WATCH" | "WARNING" | "CRITICAL";

export interface IClinicalReview extends Document {
  astronautId: string;
  reviewerId: string;
  reviewerEmail: string;
  riskLevel: ClinicalRiskLevel;
  clinicalDiagnosis: string;
  countermeasure: string;
  forwardedToAuthority: boolean;
  forwardReason?: string;
  recommendedAuthorityAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalReviewSchema = new Schema<IClinicalReview>(
  {
    astronautId: { type: String, required: true, index: true, trim: true },
    reviewerId: { type: String, required: true },
    reviewerEmail: { type: String, required: true },
    riskLevel: { type: String, enum: ["LOW", "WATCH", "WARNING", "CRITICAL"], required: true },
    clinicalDiagnosis: { type: String, required: true, trim: true, maxlength: 4000 },
    countermeasure: { type: String, required: true, trim: true, maxlength: 4000 },
    forwardedToAuthority: { type: Boolean, default: false },
    forwardReason: { type: String, trim: true, maxlength: 2000 },
    recommendedAuthorityAction: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

ClinicalReviewSchema.index({ astronautId: 1, createdAt: -1 });
export const ClinicalReview = mongoose.model<IClinicalReview>("ClinicalReview", ClinicalReviewSchema);
