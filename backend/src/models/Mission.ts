import mongoose, { Document, Schema } from "mongoose";

export interface IMission extends Document {
  missionId: string;
  name: string;
  status: "Active" | "Completed" | "Planned" | "Aborted";
  missionDay: number;
  startDate?: Date;
  endDate?: Date;
  astronautIds: string[];
  missionControlUserIds: string[];
  medicalOfficerIds: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MissionSchema: Schema = new Schema(
  {
    missionId: {
      type: String,
      required: [true, "Mission ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Mission name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Planned", "Aborted"],
      default: "Active",
      index: true,
    },
    missionDay: {
      type: Number,
      default: 0,
      min: [0, "Mission day cannot be negative"],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    astronautIds: {
      type: [String],
      default: [],
    },
    missionControlUserIds: {
      type: [String],
      default: [],
    },
    medicalOfficerIds: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Mission = mongoose.model<IMission>("Mission", MissionSchema);
