import mongoose, { Document, Schema } from "mongoose";

export type AuthorityDirectiveType = "EARTH_RETURN_EMERGENCY" | "EVA_ABORT" | "MEDICAL_QUARANTINE" | "PROTOCOL_APPROVED";

export interface IAuthorityDirective extends Document {
  astronautId: string;
  issuedBy: string;
  issuedByEmail: string;
  directiveType: AuthorityDirectiveType;
  orders: string;
  status: "ISSUED" | "ACTIVE_ORDER" | "EXECUTING" | "RESOLVED";
  issuedByRole?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorityDirectiveSchema = new Schema<IAuthorityDirective>({
  astronautId: { type: String, required: true, index: true, trim: true },
  issuedBy: { type: String, required: true },
  issuedByEmail: { type: String, required: true },
  directiveType: { type: String, enum: ["EARTH_RETURN_EMERGENCY", "EVA_ABORT", "MEDICAL_QUARANTINE", "PROTOCOL_APPROVED"], required: true },
  orders: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ["ISSUED", "ACTIVE_ORDER", "EXECUTING", "RESOLVED"], default: "ISSUED" },
  issuedByRole: String,
  updatedBy: String,
}, { timestamps: true });

AuthorityDirectiveSchema.index({ astronautId: 1, createdAt: -1 });
export const AuthorityDirective = mongoose.model<IAuthorityDirective>("AuthorityDirective", AuthorityDirectiveSchema);
