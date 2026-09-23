import mongoose, { Document, Schema } from "mongoose";

export interface IScannedPack {
  packId: string;
  name: string;
  scannedAt: Date;
}

export interface IDailyNutrientIntake extends Document {
  astronautId: string;
  date: string; // Format: YYYY-MM-DD
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  hydrationMl: number;
  sodiumMg: number;
  potassiumMg: number;
  vitaminCMg: number;
  omega3Mg: number;
  scannedPacks: IScannedPack[];
  createdAt: Date;
  updatedAt: Date;
}

const DailyNutrientIntakeSchema = new Schema<IDailyNutrientIntake>(
  {
    astronautId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    caloriesKcal: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG: { type: Number, default: 0 },
    fatsG: { type: Number, default: 0 },
    hydrationMl: { type: Number, default: 0 },
    sodiumMg: { type: Number, default: 0 },
    potassiumMg: { type: Number, default: 0 },
    vitaminCMg: { type: Number, default: 0 },
    omega3Mg: { type: Number, default: 0 },
    scannedPacks: [
      {
        packId: { type: String, required: true },
        name: { type: String, required: true },
        scannedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

DailyNutrientIntakeSchema.index({ astronautId: 1, date: 1 }, { unique: true });

export const DailyNutrientIntake = mongoose.model<IDailyNutrientIntake>(
  "DailyNutrientIntake",
  DailyNutrientIntakeSchema
);
