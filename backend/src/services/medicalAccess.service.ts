import { IUser } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";

export async function isAssignedMedicalOfficer(user: IUser, astronautId: string): Promise<boolean> {
  if (user.role !== "medical_officer") return false;
  const assignment = await MedicalAssignment.findOne({ astronautIds: astronautId }).sort({ updatedAt: -1 }).lean();
  if (assignment) {
    const assignedDoctor = String(assignment.medicalOfficerId);
    if (assignedDoctor === user._id.toString() || assignedDoctor === user.email) return true;
  }
  // Canonical relation written by Mission Control's assign-doctor endpoint.
  const astronaut = await Astronaut.findOne({ astronautId }).select("assignedDoctorId").lean();
  return Boolean(astronaut?.assignedDoctorId && String(astronaut.assignedDoctorId) === user._id.toString());
}

/**
 * Assigned-astronaut scope for a Medical Officer / Flight Surgeon.
 * Access is granted when the astronaut appears in the officer's
 * `User.assignedAstronautIds` roster, in a current MedicalAssignment
 * pointing at this officer, OR on the Astronaut record's `assignedDoctorId`.
 */
export async function canDoctorManageAstronaut(user: IUser, astronautId: string): Promise<boolean> {
  if (user.role !== "medical_officer") return false;
  if (Array.isArray(user.assignedAstronautIds) && user.assignedAstronautIds.includes(astronautId)) return true;
  return isAssignedMedicalOfficer(user, astronautId);
}

export async function assignedAstronautIdsForDoctor(user: IUser): Promise<string[]> {
  const fromUser = Array.isArray(user.assignedAstronautIds) ? user.assignedAstronautIds : [];
  const assignments = await MedicalAssignment.find({ $or: [{ medicalOfficerId: user._id.toString() }, { medicalOfficerId: user.email }] }).select("astronautIds").lean();
  const fromAssignments = assignments.flatMap((assignment) => assignment.astronautIds);
  const astronautDocs = await Astronaut.find({ assignedDoctorId: user._id.toString() }).select("astronautId").lean();
  const fromAstronautField = astronautDocs.map((ast) => ast.astronautId);
  return [...new Set([...fromUser, ...fromAssignments, ...fromAstronautField])];
}

export async function canAccessRawMedicalData(user: IUser, astronautId: string): Promise<boolean> {
  if (user.role === "astronaut") return user.astronautId === astronautId;
  if (user.role === "medical_officer") return isAssignedMedicalOfficer(user, astronautId);
  return false;
}