"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiagnosticSuitePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/astronaut/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-slate-400">
      <div className="space-y-2">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto" />
        <p className="text-xs font-mono text-cyan-300">
          Manual Diagnostic Suite Deprecated · Redirecting to Autonomous Cockpit HUD...
        </p>
      </div>
    </div>
  );
}
