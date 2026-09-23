import mongoose, { Document, Schema } from "mongoose";

export type DiagnosticOrderType = "URINALYSIS" | "ULTRASOUND" | "VENOUS_BLOOD_DRAW" | "ECG" | "VISION_CHECK";
export interface IDiagnosticOrder extends Document { astronautId: string; orderedBy: string; type: DiagnosticOrderType; priority: "ROUTINE" | "URGENT" | "STAT"; instructions: string; status: "ORDERED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; result?: Record<string, unknown>; createdAt: Date; updatedAt: Date; }
const DiagnosticOrderSchema = new Schema<IDiagnosticOrder>({ astronautId: { type: String, required: true, index: true }, orderedBy: { type: String, required: true }, type: { type: String, enum: ["URINALYSIS", "ULTRASOUND", "VENOUS_BLOOD_DRAW", "ECG", "VISION_CHECK"], required: true }, priority: { type: String, enum: ["ROUTINE", "URGENT", "STAT"], default: "ROUTINE" }, instructions: { type: String, required: true, maxlength: 3000 }, status: { type: String, enum: ["ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"], default: "ORDERED" }, result: Schema.Types.Mixed }, { timestamps: true });
DiagnosticOrderSchema.index({ astronautId: 1, createdAt: -1 });
export const DiagnosticOrder = mongoose.model<IDiagnosticOrder>("DiagnosticOrder", DiagnosticOrderSchema);

export interface ICountermeasureExecution extends Document { astronautId: string; prescribedBy: string; protocol: "LBNP" | "CEVIS" | "ELECTROLYTE_REHYDRATION" | "VITAMIN_D" | "BISPHOSPHONATE"; parameters: string; status: "PRESCRIBED" | "IN_PROGRESS" | "COMPLETED" | "HELD"; notes?: string; createdAt: Date; updatedAt: Date; }
const CountermeasureSchema = new Schema<ICountermeasureExecution>({ astronautId: { type: String, required: true, index: true }, prescribedBy: { type: String, required: true }, protocol: { type: String, enum: ["LBNP", "CEVIS", "ELECTROLYTE_REHYDRATION", "VITAMIN_D", "BISPHOSPHONATE"], required: true }, parameters: { type: String, required: true, maxlength: 2000 }, status: { type: String, enum: ["PRESCRIBED", "IN_PROGRESS", "COMPLETED", "HELD"], default: "PRESCRIBED" }, notes: String }, { timestamps: true });
CountermeasureSchema.index({ astronautId: 1, createdAt: -1 });
export const CountermeasureExecution = mongoose.model<ICountermeasureExecution>("CountermeasureExecution", CountermeasureSchema);
