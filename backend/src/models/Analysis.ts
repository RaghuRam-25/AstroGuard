import mongoose, { Document, Schema } from "mongoose";

export interface IContributor {
  signal: string;
  change: string;
  impact: "High" | "Moderate" | "Low" | "Normal";
  percentage?: number;
  description?: string;
}

export interface IBaselineMetrics {
  heartRate: string | number;
  spo2: string | number;
  sleep: string | number;
  activity: string | number;
}

export interface IAnalysisExplanation {
  headline: string;
  summary: string;
  changePointDetails?: string;
  safetyNote?: string;
}

export interface IAnalysis {
  _id?: mongoose.Types.ObjectId;
  astronautId: string;
  healthDataId?: mongoose.Types.ObjectId;
  anomalyScore: number;
  riskLevel: "Low" | "Watch" | "Warning" | "Critical";
  confidence: number;
  model: string;
  contributors: IContributor[];
  personalBaseline: IBaselineMetrics;
  missionBaseline: IBaselineMetrics;
  explanation: IAnalysisExplanation;
  recommendations: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ContributorSchema = new Schema(
  {
    signal: { type: String, required: true },
    change: { type: String, required: true },
    impact: {
      type: String,
      enum: ["High", "Moderate", "Low", "Normal"],
      default: "Normal",
    },
    percentage: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const BaselineSchema = new Schema(
  {
    heartRate: { type: Schema.Types.Mixed, required: true },
    spo2: { type: Schema.Types.Mixed, required: true },
    sleep: { type: Schema.Types.Mixed, required: true },
    activity: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ExplanationSchema = new Schema(
  {
    headline: { type: String, required: true },
    summary: { type: String, required: true },
    changePointDetails: { type: String, default: "" },
    safetyNote: {
      type: String,
      default: "AI-generated monitoring signal, not a medical diagnosis.",
    },
  },
  { _id: false }
);

const AnalysisSchema: Schema = new Schema(
  {
    astronautId: {
      type: String,
      required: [true, "Astronaut ID is required"],
      trim: true,
      index: true,
    },
    healthDataId: {
      type: Schema.Types.ObjectId,
      ref: "HealthData",
    },
    anomalyScore: {
      type: Number,
      required: [true, "Anomaly score is required"],
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Watch", "Warning", "Critical"],
      required: true,
      default: "Low",
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 90.0,
    },
    model: {
      type: String,
      default: "Multi-Variate Isolation Forest",
    },
    contributors: {
      type: [ContributorSchema],
      default: [],
    },
    personalBaseline: {
      type: BaselineSchema,
      required: true,
    },
    missionBaseline: {
      type: BaselineSchema,
      required: true,
    },
    explanation: {
      type: ExplanationSchema,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AnalysisSchema.index({ astronautId: 1, createdAt: -1 });

export const Analysis = mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
