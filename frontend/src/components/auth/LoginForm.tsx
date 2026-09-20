"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Lock, Mail, Loader2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";

const ROLE_REDIRECTS: Record<string, string> = {
  astronaut: "/astronaut/dashboard",
  medical_officer: "/medical/dashboard",
  mission_control: "/mission-control/dashboard",
  admin: "/admin/dashboard",
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const demoAccounts = [
    {
      label: "Alex Morgan",
      role: "Astronaut",
      email: "alex@astroguard.local",
      password: "AstroGuard@2025!",
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    {
      label: "Dr. Evelyn Vance",
      role: "Medical Officer",
      email: "medical@astroguard.local",
      password: "AstroGuard@2025!",
      badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    },
    {
      label: "Flight Dynamics Lead",
      role: "Mission Control",
      email: "mission@astroguard.local",
      password: "AstroGuard@2025!",
      badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    },
    {
      label: "Mission Administrator",
      role: "Admin",
      email: "admin@astroguard.local",
      password: "AstroGuard@2025!",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
  ];

  const handleSelectDemo = (acc: (typeof demoAccounts)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        const dest = ROLE_REDIRECTS[res.user.role] || "/dashboard";
        router.push(dest);
      } else {
        setErrorMessage(res.message || "Invalid credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-xs text-red-300 flex items-start gap-3 backdrop-blur-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Authentication Failure</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Mission Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="astronaut@astroguard.local"
              className="w-full rounded-xl border border-white/10 bg-[#020817] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Security Clearance Key</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#020817] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Clearance...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Authenticate Session</span>
            </>
          )}
        </button>
      </form>

      {/* Demo Quick-Select Chips */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-slate-400">Quick Demo Login:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleSelectDemo(acc)}
              className="text-left rounded-xl border border-white/5 bg-white/[0.03] p-2.5 hover:bg-blue-600/10 hover:border-blue-500/30 transition text-xs space-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white truncate">{acc.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${acc.badge}`}>
                  {acc.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">{acc.email}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
