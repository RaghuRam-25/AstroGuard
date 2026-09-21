import mongoose, { Document, Schema } from "mongoose";

export interface IHealthData extends Document {
  astronautId: string;
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
  notes?: string;
  timestamp: Date;
  source: "manual" | "sensor" | "csv";
  createdAt: Date;
  updatedAt: Date;
}

const HealthDataSchema: Schema = new Schema(
  {
    astronautId: {
      type: String,
      required: [true, "Astronaut ID is required"],
      trim: true,
      index: true,
    },
    heartRate: {
      type: Number,
      required: [true, "Heart rate is required"],
      min: [30, "Heart rate cannot be below 30 BPM"],
      max: [220, "Heart rate cannot exceed 220 BPM"],
    },
    spo2: {
      type: Number,
      required: [true, "SpO2 level is required"],
      min: [50, "SpO2 cannot be below 50%"],
      max: [100, "SpO2 cannot exceed 100%"],
    },
    sleep: {
      type: Number,
      required: [true, "Sleep duration is required"],
      min: [0, "Sleep duration cannot be negative"],
      max: [24, "Sleep duration cannot exceed 24 hours"],
    },
    activity: {
      type: Number,
      required: [true, "Activity level is required"],
      min: [0, "Activity level cannot be negative"],
      max: [100, "Activity level cannot exceed 100%"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "sensor", "csv"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

HealthDataSchema.index({ astronautId: 1, timestamp: -1 });

export const HealthData = mongoose.model<IHealthData>("HealthData", HealthDataSchema);
