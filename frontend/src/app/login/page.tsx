"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginForm from "../../components/auth/LoginForm";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/shared/LoadingState";
import { Shield } from "lucide-react";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/health",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(ROLE_REDIRECTS[user.role] || "/dashboard");
    }
  }, [loading, router, user]);

  if (loading || user) {
    return <LoadingState message="Verifying existing mission clearance..." />;
  }

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Neon Space Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/40 p-2 shadow-xl shadow-blue-500/20">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={32} height={32} priority />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">
            Astro<span className="text-blue-400">Guard</span>
          </span>
        </Link>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Mission Health Gateway
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Secure biometric & telemetry cryptographic authorization.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-3xl border border-white/10 bg-[#07111f]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Clearance Level Authentication
            </span>
          </div>

          <LoginForm />

          <div className="border-t border-white/5 pt-5 text-center">
            <p className="text-xs text-slate-400">New astronaut applicant?</p>
            <Link
              href="/register"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-300/60 hover:bg-blue-500/20"
            >
              Create Astronaut Account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>AstroGuard Autonomous Biosensor Protocol • Ares Mission 01</span>
        </div>
      </div>
    </div>
  );
}
