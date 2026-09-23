import mongoose, { Document, Schema } from "mongoose";

export interface IBioSample extends Document {
  astronautId: string;
  source: "manual" | "json" | "pdf";
  urine: { hydrationLevel?: number; specificGravity?: number; calciumExcretionMgDay?: number; protein?: number; microalbumin?: number; leukocytes?: number; erythrocytes?: number; ph?: number; ketones?: number; glucose?: number; sodiumLoss?: number };
  stool: { microbiomeDiversityIndex?: number; giInflammationMarkers?: number };
  saliva: { cortisol?: number; alphaAmylase?: number; radiationDnaMarkers?: number };
  cbcScan?: { hemoglobin?: number; hematocrit?: number; whiteBloodCells?: number; neutrophils?: number; platelets?: number; bloodSmearMorphology?: string; status?: string };
  symptomLog?: { spaceMotionSickness?: number; cephaladFluidShift?: number; headPressure?: number; visualBlurring?: number; musculoskeletalFatigue?: number; sleepQuality?: number };
  notes?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BioSampleSchema = new Schema<IBioSample>({
  astronautId: { type: String, required: true, index: true, trim: true },
  source: { type: String, enum: ["manual", "json", "pdf"], default: "manual" },
  urine: { hydrationLevel: Number, specificGravity: Number, calciumExcretionMgDay: Number, protein: Number, microalbumin: Number, leukocytes: Number, erythrocytes: Number, ph: Number, ketones: Number, glucose: Number, sodiumLoss: Number },
  stool: { microbiomeDiversityIndex: Number, giInflammationMarkers: Number },
  saliva: { cortisol: Number, alphaAmylase: Number, radiationDnaMarkers: Number },
  cbcScan: { hemoglobin: Number, hematocrit: Number, whiteBloodCells: Number, neutrophils: Number, platelets: Number, bloodSmearMorphology: String, status: String },
  symptomLog: { spaceMotionSickness: Number, cephaladFluidShift: Number, headPressure: Number, visualBlurring: Number, musculoskeletalFatigue: Number, sleepQuality: Number },
  notes: String,
  fileName: String,
}, { timestamps: true });

BioSampleSchema.index({ astronautId: 1, createdAt: -1 });
export const BioSample = mongoose.model<IBioSample>("BioSample", BioSampleSchema);
