import mongoose, { Document, Schema } from "mongoose";

export interface IRegistrationWindow extends Document {
  isRegistrationOpen: boolean;
  registrationExpiresAt?: Date;
  openedBy?: string;
  openedById?: string;
  durationMinutes?: number;
  updatedAt: Date;
}

const RegistrationWindowSchema: Schema = new Schema(
  {
    isRegistrationOpen: {
      type: Boolean,
      default: false,
    },
    registrationExpiresAt: {
      type: Date,
    },
    openedBy: { type: String, trim: true },
    openedById: { type: String },
    durationMinutes: { type: Number },
  },
  { timestamps: true }
);

export const RegistrationWindow =
  mongoose.models.RegistrationWindow ||
  mongoose.model<IRegistrationWindow>("RegistrationWindow", RegistrationWindowSchema);