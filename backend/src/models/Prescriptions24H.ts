import mongoose, { Document, Schema } from "mongoose";

export interface IPrescriptions24H extends Document {
  astronautId: string;
  doctorId: string;
  validityTimestamp: Date;
  macroNutrients: { calories: number; proteinG: number; carbohydratesG: number; healthyFatsG: number; omega3Mg: number };
  microNutrients: { vitaminD3IU: number; vitaminEMg: number; sodiumMg: number; potassiumMg: number; electrolyteBalance: string };
  hydrationPlan: { liters: number; beverage: string; schedule: string[] };
  supplements: Array<{ name: string; dose: string; timing: string; doctorApproved: boolean }>;
  doctorApproved: boolean;
  source: "AI" | "Doctor";
  doctorNotes?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Prescriptions24HSchema = new Schema<IPrescriptions24H>({
  astronautId: { type: String, required: true, index: true, trim: true },
  doctorId: { type: String, required: true, index: true, trim: true },
  validityTimestamp: { type: Date, required: true, index: true },
  macroNutrients: { type: Object, required: true },
  microNutrients: { type: Object, required: true },
  hydrationPlan: { type: Object, required: true },
  supplements: { type: [Object], default: [] },
  doctorApproved: { type: Boolean, default: false, index: true },
  source: { type: String, enum: ["AI", "Doctor"], default: "AI" },
  doctorNotes: String,
  updatedBy: String,
}, { timestamps: true });

Prescriptions24HSchema.index({ astronautId: 1, validityTimestamp: -1 });
export const Prescriptions24H = mongoose.model<IPrescriptions24H>("Prescriptions24H", Prescriptions24HSchema);
