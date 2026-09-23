import { IUser } from "../models/User.js";
import { User } from "../models/User.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";

export interface CommunicationPeer { id: string; name: string; email: string; role: "astronaut" | "medical_officer"; astronautId?: string; }

function peerFromUser(user: IUser): CommunicationPeer {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role as "astronaut" | "medical_officer", astronautId: user.astronautId };
}

export async function getCommunicationPeers(user: IUser): Promise<CommunicationPeer[]> {
  if (user.role === "astronaut" && user.astronautId) {
    const assignment = await MedicalAssignment.findOne({ astronautIds: user.astronautId }).sort({ updatedAt: -1 }).lean();
    if (!assignment) return [];
    const doctor = await User.findOne({ role: "medical_officer", $or: [{ _id: assignment.medicalOfficerId }, { email: assignment.medicalOfficerId }] });
    return doctor ? [peerFromUser(doctor)] : [];
  }
  if (user.role === "medical_officer") {
    const assignments = await MedicalAssignment.find({ $or: [{ medicalOfficerId: user._id.toString() }, { medicalOfficerId: user.email }] }).lean();
    const astronautIds = [...new Set(assignments.flatMap((assignment) => assignment.astronautIds))];
    const astronauts = await User.find({ role: "astronaut", astronautId: { $in: astronautIds } }).sort({ name: 1 });
    return astronauts.map(peerFromUser);
  }
  return [];
}

export async function getCommunicationPeer(user: IUser, peerId: string): Promise<CommunicationPeer | null> {
  const peers = await getCommunicationPeers(user);
  return peers.find((peer) => peer.id === peerId) || null;
}
