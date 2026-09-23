import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "astronaut" | "medical_officer" | "mission_control";

export interface IUser extends Document {
  name: string;
  email: string;
  username?: string;
  passwordHash: string;
  role: UserRole;
  astronautId?: string;
  nasaBadgeId?: string;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say";
  profileImage?: string;
  assignedAstronautIds?: string[];
  missionIds?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false, // Never return passwordHash in standard queries
    },
    role: {
      type: String,
      enum: ["astronaut", "medical_officer", "mission_control"],
      default: "astronaut",
      index: true,
    },
    astronautId: {
      type: String,
      trim: true,
      index: true,
    },
    nasaBadgeId: { type: String, trim: true, uppercase: true, unique: true, sparse: true, index: true },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    country: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["female", "male", "non_binary", "prefer_not_to_say"],
    },
    profileImage: {
      type: String,
      trim: true,
    },
    assignedAstronautIds: {
      type: [String],
      default: [],
    },
    missionIds: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret: any) => {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Method to verify passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model<IUser>("User", UserSchema);
