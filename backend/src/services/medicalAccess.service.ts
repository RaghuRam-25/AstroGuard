import { IUser } from "../models/User.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";

export async function isAssignedMedicalOfficer(user: IUser, astronautId: string): Promise<boolean> {
  if (user.role !== "medical_officer") return false;
  const assignment = await MedicalAssignment.findOne({ astronautIds: astronautId }).sort({ updatedAt: -1 }).lean();
  if (!assignment) return false;
  const assignedDoctor = String(assignment.medicalOfficerId);
  return assignedDoctor === user._id.toString() || assignedDoctor === user.email;
}

/**
 * Strict assigned-astronaut scope for a Medical Officer / Flight Surgeon.
 * Access is granted ONLY when the astronaut appears in the officer's
 * `User.assignedAstronautIds` roster OR in a current MedicalAssignment
 * pointing at this officer. Anything outside that scope is forbidden.
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
  return [...new Set([...fromUser, ...fromAssignments])];
}

export async function canAccessRawMedicalData(user: IUser, astronautId: string): Promise<boolean> {
  if (user.role === "astronaut") return user.astronautId === astronautId;
  if (user.role === "medical_officer") return isAssignedMedicalOfficer(user, astronautId);
  return false;
}
