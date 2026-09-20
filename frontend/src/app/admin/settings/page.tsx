"use client";

import { useState } from "react";
import { Settings, Shield, Cpu, Lock, CheckCircle2, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    contaminationRate: "0.05",
    anomalyThreshold: "0.55",
    sessionTimeout: "15",
    requireMFA: true,
    autoAlertResolution: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-amber-500/10 pb-5">
        <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
          Global Configurations
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Platform System Settings</h1>
        <p className="text-sm text-slate-400">
          Tune isolation forest parameters, telemetry timeouts, and organizational security policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ML Service Parameters */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#140e02] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            Machine Learning Engine Configuration
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Contamination Ratio</label>
              <input
                type="text"
                value={config.contaminationRate}
                onChange={(e) => setConfig({ ...config, contaminationRate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Expected anomaly proportion in training set</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Anomaly Warning Threshold</label>
              <input
                type="text"
                value={config.anomalyThreshold}
                onChange={(e) => setConfig({ ...config, anomalyThreshold: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/40 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Cutoff score above which Warning alert triggers</span>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#140e02] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            Platform Security & Token Lifetime
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">Enforce Role-Based Access Control (RBAC)</span>
                <span className="text-[11px] text-slate-400">Strict HTTP 403 enforcement across all API routes</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white block">HTTP-Only SameSite Cookies</span>
                <span className="text-[11px] text-slate-400">Protects access tokens against client-side XSS extraction</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">ENFORCED</span>
            </div>
          </div>
        </div>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Configuration committed successfully.
          </div>
        )}

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
        >
          <Save className="w-4 h-4" />
          Save System Configuration
        </button>
      </form>
    </div>
  );
}
