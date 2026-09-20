import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  userId: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      index: true,
    },
    userEmail: {
      type: String,
      trim: true,
    },
    userRole: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      trim: true,
      index: true,
      // e.g. USER_LOGIN, USER_LOGOUT, USER_CREATED, ROLE_CHANGED, USER_DEACTIVATED,
      //      MISSION_CREATED, ASTRONAUT_ASSIGNED, HEALTH_DATA_ACCESSED
    },
    resource: {
      type: String,
      required: [true, "Resource is required"],
      trim: true,
      // e.g. User, Mission, Astronaut, HealthData
    },
    resourceId: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    success: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
