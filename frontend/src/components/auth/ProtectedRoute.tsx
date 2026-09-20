"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Loader2, Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center p-8 space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-950/20 shadow-xl shadow-blue-500/10">
          <Shield className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Authenticating Mission Clearance...</span>
        </div>
        <p className="text-xs text-slate-500 font-mono">Verifying telemetry cryptographic credentials</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
