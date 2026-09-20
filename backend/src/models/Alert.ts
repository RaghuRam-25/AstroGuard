import mongoose, { Document, Schema } from "mongoose";

export interface IAlert extends Document {
  astronautId: string;
  title: string;
  description: string;
  severity: "Normal" | "Watch" | "Warning" | "Critical";
  signal?: string;
  value?: number | string;
  baseline?: number | string;
  resolved: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema: Schema = new Schema(
  {
    astronautId: {
      type: String,
      required: [true, "Astronaut ID is required"],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Alert title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Alert description is required"],
      trim: true,
    },
    severity: {
      type: String,
      enum: ["Normal", "Watch", "Warning", "Critical"],
      required: true,
      default: "Normal",
      index: true,
    },
    signal: {
      type: String,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
    },
    baseline: {
      type: Schema.Types.Mixed,
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

AlertSchema.index({ astronautId: 1, createdAt: -1 });

export const Alert = mongoose.model<IAlert>("Alert", AlertSchema);
