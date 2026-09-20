"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";

const ROLE_DASHBOARDS: Record<string, string> = {
  astronaut: "/astronaut/dashboard",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin/dashboard",
};

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const dashboardUrl = user?.role ? ROLE_DASHBOARDS[user.role] || "/login" : "/login";

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full rounded-2xl border border-red-500/20 bg-[#06111e]/90 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest font-semibold text-red-400">
            Access Restricted (HTTP 403)
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Unauthorized Clearance Level
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current credential clearance ({user?.role?.replace("_", " ").toUpperCase() || "UNKNOWN"}) does not authorize access to this operational sector.
          </p>
        </div>

        {user && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-left space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Authenticated Subject:</span>
              <span className="font-semibold text-white">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Role:</span>
              <span className="font-mono text-amber-300 capitalize">{user.role.replace("_", " ")}</span>
            </div>
            {user.astronautId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Callsign / ID:</span>
                <span className="font-mono text-blue-400">{user.astronautId}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={dashboardUrl}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 transition-all"
          >
            <Home className="w-4 h-4" />
            My Dashboard
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
