"use client";

import React from "react";
import Link from "next/link";
import { useAuth, UserRole } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/dashboard",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin",
  };

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    const dashboardHref = user ? (ROLE_REDIRECTS[user.role] || "/login") : "/login";

    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto my-12">
        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-8 text-center space-y-5 backdrop-blur-md shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-red-400">
              Security Protocol 403
            </span>
            <h2 className="text-2xl font-bold text-white">Access Denied</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Your security clearance role (<span className="text-red-300 font-semibold font-mono">{user?.role || "anonymous"}</span>) does not have authorization to view this mission area.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400 font-mono">
            Required Clearance: {allowedRoles.join(" • ")}
          </div>

          <div className="pt-2">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
