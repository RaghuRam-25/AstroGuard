import mongoose, { Document, Schema } from "mongoose";

export interface IMedicalAssignment extends Document {
  missionId: string;
  medicalOfficerId: string;
  astronautIds: string[];
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalAssignmentSchema = new Schema<IMedicalAssignment>({
  missionId: { type: String, required: true, index: true },
  medicalOfficerId: { type: String, required: true, index: true },
  astronautIds: { type: [String], default: [] },
  updatedBy: { type: String, required: true },
}, { timestamps: true });

MedicalAssignmentSchema.index({ missionId: 1, medicalOfficerId: 1 }, { unique: true });
export const MedicalAssignment = mongoose.model<IMedicalAssignment>("MedicalAssignment", MedicalAssignmentSchema);
