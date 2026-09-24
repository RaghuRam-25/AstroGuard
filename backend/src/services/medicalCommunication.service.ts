import { IUser } from "../models/User.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";
import { assignedAstronautIdsForDoctor } from "./medicalAccess.service.js";
import mongoose from "mongoose";

export interface CommunicationPeer { id: string; name: string; email: string; role: "astronaut" | "medical_officer"; astronautId?: string; }

type LeanUser = { _id: unknown; name: string; email: string; role: string; astronautId?: string };

function peerFromLean(user: LeanUser): CommunicationPeer {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role as "astronaut" | "medical_officer", astronautId: user.astronautId };
}

async function doctorFromAssignmentOrField(astronautId: string): Promise<LeanUser | null> {
  const astronaut = await Astronaut.findOne({ astronautId }).select("assignedDoctorId").lean();
  if (astronaut?.assignedDoctorId) {
    const doctor = await User.findOne({ role: "medical_officer", $or: [{ _id: astronaut.assignedDoctorId }, { email: astronaut.assignedDoctorId }], isActive: true })
      .select("name email role astronautId")
      .lean() as LeanUser | null;
    if (doctor) return doctor;
  }
  const assignment = await MedicalAssignment.findOne({ astronautIds: astronautId }).sort({ updatedAt: -1 }).lean();
  if (!assignment) return null;
  return await User.findOne({ role: "medical_officer", $or: [{ _id: assignment.medicalOfficerId }, { email: assignment.medicalOfficerId }], isActive: true })
    .select("name email role astronautId")
    .lean() as LeanUser | null;
}

export async function getCommunicationPeers(user: IUser): Promise<CommunicationPeer[]> {
  // Astronaut → assigned Flight Surgeon: prefer the canonical
  // Astronaut.assignedDoctorId relation, then fall back to MedicalAssignment.
  if (user.role === "astronaut" && user.astronautId) {
    const doctor = await doctorFromAssignmentOrField(user.astronautId);
    return doctor ? [peerFromLean(doctor)] : [];
  }
  // Medical Officer → assigned astronauts: resolve through the same unified
  // scope used by /my-astronauts (User.assignedAstronautIds ∪ MedicalAssignment
  // ∪ Astronaut.assignedDoctorId) so a freshly assigned astronaut always has
  // an active telemedicine peer, regardless of which store MC wrote to.
  if (user.role === "medical_officer") {
    const astronautIds = await assignedAstronautIdsForDoctor(user);
    const astronauts = await User.find({ role: "astronaut", astronautId: { $in: astronautIds } }).select("name email role astronautId").sort({ name: 1 }).lean() as LeanUser[];
    return astronauts.map(peerFromLean);
  }
  return [];
}

export async function getCommunicationPeer(user: IUser, peerId: string): Promise<CommunicationPeer | null> {
  if (!peerId || !mongoose.isValidObjectId(peerId)) return null;
  const peers = await getCommunicationPeers(user);
  return peers.find((peer) => peer.id === peerId) || null;
}
