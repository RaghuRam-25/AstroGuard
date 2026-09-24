import mongoose, { Schema } from "mongoose";

/**
 * Global singleton system settings record. The public registration gate
 * is persisted here so toggling survives restarts and is read consistently
 * by every route (Mission Control, Admin, and the public status endpoint).
 */
export interface ISystemSetting {
  _id: string; // "global"
  isRegistrationOpen: boolean;
  registrationExpiresAt: Date | null;
  durationMinutes: number | null;
  openedBy?: string;
  openedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    _id: { type: String, required: true },
    isRegistrationOpen: { type: Boolean, default: false },
    registrationExpiresAt: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    openedBy: { type: String, default: null },
    openedById: { type: String, default: null },
  },
  { timestamps: true }
);

export const SystemSetting =
  mongoose.models.SystemSetting ||
  mongoose.model<ISystemSetting>("SystemSetting", SystemSettingSchema);