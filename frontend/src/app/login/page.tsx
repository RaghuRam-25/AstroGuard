"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginForm from "../../components/auth/LoginForm";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../../components/shared/LoadingState";
import { Shield } from "lucide-react";
import RootBackground from "../../components/public/RootBackground";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/health",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Shared public astronomy background (matches register page) */}
      <RootBackground />

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
        </div>
      </div>
    </div>
  );
}
