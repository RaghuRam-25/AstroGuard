"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, createAdminUser, updateUserStatus, updateUserRole } from "../../../lib/api";
import { LoadingState, ErrorState, EmptyState } from "../../../components/shared/LoadingState";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  X,
  Lock,
  Mail,
  User,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "AstroGuard@2025!",
    role: "astronaut",
    astronautId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminUsers();
      if (res.success && res.data) {
        setUsers(res.data.users || []);
      } else {
        setError(res.message || "Failed to load users.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: any) => {
    const nextStatus = !user.isActive;
    try {
      const res = await updateUserStatus(user.id, nextStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeRole = async (user: any, newRole: string) => {
    try {
      const res = await updateUserRole(user.id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);
    try {
      const res = await createAdminUser(newUser);
      if (res.success) {
        setModalOpen(false);
        setNewUser({
          name: "",
          email: "",
          password: "AstroGuard@2025!",
          role: "astronaut",
          astronautId: "",
        });
        await fetchUsers();
      } else {
        setModalError(res.message || "Failed to create user.");
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="Querying platform security directory..." />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.astronautId && u.astronautId.toLowerCase().includes(search.toLowerCase()));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/10 pb-5">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
            Security Directory
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            User Credential Management
          </h1>
          <p className="text-sm text-slate-400">
            Assign security roles, toggle account clearance, and provision platform access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Provision New User
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/10 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or callsig..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-[#140e02] text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {["all", "astronaut", "medical_officer", "mission_control", "admin"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-[#140e02] text-slate-400 border border-white/5 hover:text-white"
              }`}
            >
              {r.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No Users Found" message="No user accounts match the current query." />
      ) : (
        <div className="rounded-2xl border border-white/5 bg-[#140e02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">User Identity</th>
                  <th className="px-4 py-3.5">Clearance Role</th>
                  <th className="px-4 py-3.5">Assigned Scopes</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filtered.map((u) => {
                  const isAstronaut = u.role === "astronaut";
                  const isMedical = u.role === "medical_officer";
                  const isMission = u.role === "mission_control";
                  const isAdmin = u.role === "admin";

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs font-semibold text-amber-200 focus:outline-none"
                        >
                          <option value="astronaut">Astronaut</option>
                          <option value="medical_officer">Medical Officer</option>
                          <option value="mission_control">Mission Control</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>

                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">
                        {u.astronautId && <span className="text-blue-400">{u.astronautId}</span>}
                        {u.assignedAstronautIds?.length > 0 && (
                          <span className="text-emerald-400">{u.assignedAstronautIds.join(", ")}</span>
                        )}
                        {u.missionIds?.length > 0 && (
                          <span className="text-purple-300">{u.missionIds.join(", ")}</span>
                        )}
                        {!u.astronautId && !u.assignedAstronautIds?.length && !u.missionIds?.length && "Global Access"}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            u.isActive !== false
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-400 border border-red-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.isActive !== false ? "bg-emerald-400" : "bg-red-400"
                            }`}
                          />
                          {u.isActive !== false ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            u.isActive !== false
                              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {u.isActive !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#150f02] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Provision User Credential
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-xs text-red-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Dr. Samantha Ray"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="e.g. samantha@astroguard.local"
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Initial Password</label>
                <input
                  type="text"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Assigned Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="astronaut">Astronaut</option>
                  <option value="medical_officer">Medical Officer</option>
                  <option value="mission_control">Mission Control</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {newUser.role === "astronaut" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Astronaut ID / Callsign</label>
                  <input
                    type="text"
                    placeholder="e.g. AST-005"
                    value={newUser.astronautId}
                    onChange={(e) => setNewUser({ ...newUser, astronautId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Provisioning..." : "Confirm Provisioning"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
