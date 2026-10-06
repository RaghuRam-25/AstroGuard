import mongoose, { Document, Schema } from "mongoose";

export type DeviceType =
  | "bio_patch"
  | "smartwatch"
  | "cgm"
  | "bp_monitor"
  | "pulse_oximeter"
  | "rfid_scanner"
  | "other";

export type ConnectionProtocol = "ble" | "usb" | "wifi" | "gateway";
export type DeviceStatus = "connected" | "offline" | "unstable" | "stale" | "pairing";
export type SignalQuality = "excellent" | "good" | "weak" | "offline";

export interface IAstronautDevice {
  _id?: string;
  deviceId: string;
  astronautId: string;
  deviceType: DeviceType;
  name: string;
  manufacturer: string;
  model: string;
  firmwareVersion: string;
  connectionType: ConnectionProtocol;
  status: DeviceStatus;
  batteryLevel: number;
  signalStrength: SignalQuality;
  rssiDbm?: number;
  lastSeen: Date;
  pairedAt: Date;
  isActive: boolean;
  isSimulated: boolean;
  calibrationStatus?: string;
  assignedSensors: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AstronautDeviceSchema: Schema = new Schema(
  {
    deviceId: {
      type: String,
      required: [true, "Device ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    astronautId: {
      type: String,
      required: [true, "Astronaut ID is required"],
      trim: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: [
        "bio_patch",
        "smartwatch",
        "cgm",
        "bp_monitor",
        "pulse_oximeter",
        "rfid_scanner",
        "other",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    firmwareVersion: {
      type: String,
      default: "v2.4.1-space-rtos",
      trim: true,
    },
    connectionType: {
      type: String,
      enum: ["ble", "usb", "wifi", "gateway"],
      default: "ble",
    },
    status: {
      type: String,
      enum: ["connected", "offline", "unstable", "stale", "pairing"],
      default: "connected",
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 95,
    },
    signalStrength: {
      type: String,
      enum: ["excellent", "good", "weak", "offline"],
      default: "excellent",
    },
    rssiDbm: {
      type: Number,
      default: -54,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pairedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
    calibrationStatus: {
      type: String,
      default: "Calibrated · Zero-G Certified",
    },
    assignedSensors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AstronautDeviceSchema.index({ astronautId: 1, isActive: 1 });

export const AstronautDevice = mongoose.model<IAstronautDevice>(
  "AstronautDevice",
  AstronautDeviceSchema
);
