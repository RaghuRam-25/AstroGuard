import { IUser } from "../models/User.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";
import { assignedAstronautIdsForDoctor } from "./medicalAccess.service.js";
import mongoose from "mongoose";

export interface CommunicationPeer {
  id: string;
  name: string;
  email: string;
  role: "astronaut" | "medical_officer";
  astronautId?: string;
}

type LeanUser = { _id: unknown; name: string; email: string; role: string; astronautId?: string };

function peerFromLean(user: LeanUser): CommunicationPeer {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as "astronaut" | "medical_officer",
    astronautId: user.astronautId,
  };
}

async function doctorFromAssignmentOrField(astronautId: string): Promise<LeanUser | null> {
  const astronaut = await Astronaut.findOne({ astronautId }).select("assignedDoctorId").lean();
  if (astronaut?.assignedDoctorId) {
    const doctor = await User.findOne({
      role: "medical_officer",
      $or: [{ _id: mongoose.isValidObjectId(astronaut.assignedDoctorId) ? astronaut.assignedDoctorId : undefined }, { email: astronaut.assignedDoctorId }].filter(Boolean),
      isActive: true,
    })
      .select("name email role astronautId")
      .lean() as LeanUser | null;
    if (doctor) return doctor;
  }
  const assignment = await MedicalAssignment.findOne({ astronautIds: astronautId }).sort({ updatedAt: -1 }).lean();
  if (assignment) {
    const doctor = await User.findOne({
      role: "medical_officer",
      $or: [{ _id: mongoose.isValidObjectId(assignment.medicalOfficerId) ? assignment.medicalOfficerId : undefined }, { email: assignment.medicalOfficerId }].filter(Boolean),
      isActive: true,
    })
      .select("name email role astronautId")
      .lean() as LeanUser | null;
    if (doctor) return doctor;
  }
  // Fallback to active Flight Surgeon if no explicit assignment exists
  const defaultDoctor = await User.findOne({ role: "medical_officer", isActive: true })
    .select("name email role astronautId")
    .sort({ createdAt: 1 })
    .lean() as LeanUser | null;
  return defaultDoctor;
}

export async function getCommunicationPeers(user: IUser): Promise<CommunicationPeer[]> {
  // Astronaut → assigned Flight Surgeon:
  if (user.role === "astronaut") {
    const doctor = await doctorFromAssignmentOrField(user.astronautId || "");
    return doctor ? [peerFromLean(doctor)] : [];
  }
  // Medical Officer → assigned astronauts:
  if (user.role === "medical_officer") {
    const astronautIds = await assignedAstronautIdsForDoctor(user);
    let astronauts = await User.find({
      role: "astronaut",
      isActive: true,
      ...(astronautIds.length ? { astronautId: { $in: astronautIds } } : {}),
    })
      .select("name email role astronautId")
      .sort({ name: 1 })
      .lean() as LeanUser[];

    // Fallback to all active astronauts if no roster is mapped yet
    if (!astronauts.length) {
      astronauts = await User.find({ role: "astronaut", isActive: true })
        .select("name email role astronautId")
        .sort({ name: 1 })
        .lean() as LeanUser[];
    }
    return astronauts.map(peerFromLean);
  }
  return [];
}

export async function getCommunicationPeer(user: IUser, peerId: string): Promise<CommunicationPeer | null> {
  if (!peerId) return null;
  const peers = await getCommunicationPeers(user);
  const matched = peers.find(
    (peer) =>
      peer.id === peerId ||
      (peer.astronautId && peer.astronautId.toLowerCase() === peerId.toLowerCase()) ||
      peer.email.toLowerCase() === peerId.toLowerCase()
  );
  if (matched) return matched;

  // Check direct DB lookup if valid ObjectId
  if (mongoose.isValidObjectId(peerId)) {
    const target = await User.findById(peerId).select("name email role astronautId isActive").lean() as LeanUser | null;
    if (target && target.role !== user.role && ["astronaut", "medical_officer"].includes(target.role)) {
      return peerFromLean(target);
    }
  }

  return null;
}
