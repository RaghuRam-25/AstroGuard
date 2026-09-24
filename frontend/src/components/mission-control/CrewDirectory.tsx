"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserX,
  Trash2,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Ban,
  Radio,
  UserRound,
} from "lucide-react";
import {
  getMissionControlCrew,
  deleteMissionControlUser,
  type CrewMember,
} from "../../lib/api";

type Filter = "all" | "astronaut" | "medical_officer";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Personnel" },
  { key: "astronaut", label: "Astronauts" },
  { key: "medical_officer", label: "Medical Officers" },
];

const ROLE_BADGE: Record<CrewMember["role"], { label: string; className: string }> = {
  astronaut: {
    label: "ASTRONAUT",
    className: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  medical_officer: {
    label: "DOCTOR",
    className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
};

export interface RevokeTarget {
  name: string;
  crewId: string;
  userId: string;
}

export default function CrewDirectory() {
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<RevokeTarget | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  // The directory is database-backed; an empty response is a valid empty roster.
  useEffect(() => {
    getMissionControlCrew()
      .then((res) => {
        if (res.success && res.data) {
          setCrew(res.data.crew);
          setLive(true);
        } else {
          setLive(false);
        }
      })
      .catch(() => {
        setLive(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = crew;
    if (filter !== "all") rows = rows.filter((m) => m.role === filter);
    if (query) {
      rows = rows.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.crewId.toLowerCase().includes(query) ||
          m.email.toLowerCase().includes(query)
      );
    }
    return rows;
  }, [crew, filter, search]);

  const counts = useMemo(
    () => ({
      all: crew.length,
      astronaut: crew.filter((m) => m.role === "astronaut").length,
      medical_officer: crew.filter((m) => m.role === "medical_officer").length,
    }),
    [crew]
  );

  const confirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    setError(null);
    setNotice(null);
    try {
      const res = await deleteMissionControlUser(revokeTarget.userId);
      if (res.success) {
        setCrew((current) => current.filter((m) => m.userId !== revokeTarget.userId));
        setNotice(`Access revoked for ${revokeTarget.name} (${revokeTarget.crewId}).`);
        setRevokeTarget(null);
      } else {
        setError(res.message || "Revocation failed. Account left active.");
        setRevokeTarget(null);
      }
    } catch {
      setError("The crew directory could not revoke this account.");
      setRevokeTarget(null);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
            <Users className="h-4 w-4" />
            Crew Management Directory
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Unified Crew Roster
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review personnel identity, assignment status, and revoke access for astronauts and
            medical officers.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
            live
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "border-amber-400/30 bg-amber-400/10 text-amber-300"
          }`}
        >
          <Radio className="h-3 w-3 animate-pulse" />
          {live ? "LIVE DATALINK" : "SIMULATED DATALINK"}
        </span>
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-200">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-sm text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
                <span className="ml-2 rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]">
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, crew ID, or email..."
            className="w-full rounded-xl border border-white/10 bg-[#0a0418]/80 py-2 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40 lg:w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c061f]/60">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Personnel</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned Status</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Controls</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    No crew members match the current filter.
                  </td>
                </tr>
              )}
              {filtered.map((member) => {
                const badge = ROLE_BADGE[member.role];
                return (
                  <tr
                    key={member.userId}
                    className="border-b border-white/5 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">
                      {member.userId.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xs font-bold text-white">
                          {member.avatar || member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{member.name}</p>
                          <p className="truncate text-[11px] text-slate-500">
                            {member.crewId} · {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold tracking-wider ${badge.className}`}
                      >
                        {member.role === "astronaut" ? (
                          <UserRound className="h-3 w-3" />
                        ) : (
                          <ShieldCheck className="h-3 w-3" />
                        )}
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-300">{member.assigned}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold ${
                          member.accountStatus === "Active"
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                            : "border-red-400/30 bg-red-400/10 text-red-300"
                        }`}
                      >
                        {member.accountStatus === "Active" ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <Ban className="h-3 w-3" />
                        )}
                        {member.accountStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setRevokeTarget({
                            name: member.name,
                            crewId: member.crewId,
                            userId: member.userId,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:border-red-500/60 hover:bg-red-500/20 hover:text-red-200 active:scale-95"
                        title={`Delete / revoke access for ${member.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete / Revoke
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-xs text-slate-500">
            {filtered.length} of {crew.length} personnel displayed
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Revocation is irreversible
          </p>
        </div>
      </div>

      {/* Confirmation modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/25 bg-[#0a0418] p-6 shadow-2xl shadow-red-500/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400">
              <UserX className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">Revoke crew access?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              You are about to permanently delete the account for{" "}
              <span className="font-semibold text-white">{revokeTarget.name}</span>{" "}
              (<span className="font-mono text-cyan-400">{revokeTarget.crewId}</span>). They will
              immediately lose all system access, and this action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] py-2.5 text-sm font-semibold text-slate-200 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevoke}
                disabled={revoking}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {revoking ? (
                  <UserX className="h-4 w-4 animate-pulse" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {revoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}