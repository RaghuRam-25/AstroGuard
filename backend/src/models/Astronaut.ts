import mongoose, { Document, Schema } from "mongoose";

export interface IAstronaut extends Document {
  name: string;
  astronautId: string;
  role: string;
  mission: string;
  missionDay: number;
  missionPhase: "Transit" | "Orbital Ops" | "Lunar Surface" | "Deep Space";
  status: "Nominal" | "Elevated Deviation" | "Post-EVA Recovery" | "Active";
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AstronautSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Astronaut name is required"],
      trim: true,
    },
    astronautId: {
      type: String,
      required: [true, "Astronaut ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      default: "Mission Specialist",
      trim: true,
    },
    mission: {
      type: String,
      required: [true, "Mission name is required"],
      trim: true,
    },
    missionDay: {
      type: Number,
      required: [true, "Mission day is required"],
      min: [0, "Mission day cannot be negative"],
    },
    missionPhase: {
      type: String,
      enum: ["Transit", "Orbital Ops", "Lunar Surface", "Deep Space"],
      default: "Transit",
    },
    status: {
      type: String,
      enum: ["Nominal", "Elevated Deviation", "Post-EVA Recovery", "Active"],
      default: "Active",
    },
    avatar: {
      type: String,
      default: "AM",
    },
  },
  {
    timestamps: true,
  }
);

export const Astronaut = mongoose.model<IAstronaut>("Astronaut", AstronautSchema);
