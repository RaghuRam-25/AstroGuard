"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  Droplet,
  Moon,
  Activity,
  PenLine,
  Microscope,
  UploadCloud,
  ScanLine,
  Lock,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Eraser,
  History,
  ShieldCheck,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "manual" | "cbc" | "upload";

const MODES: { key: Mode; label: string; icon: typeof PenLine }[] = [
  { key: "manual", label: "Manual Input", icon: PenLine },
  { key: "cbc", label: "CBC Scanner", icon: Microscope },
  { key: "upload", label: "Upload File", icon: UploadCloud },
];

const HEADINGS: Record<Mode, { tag: string; title: string; subtitle: string }> = {
  manual: {
    tag: "Telemetry Uplink Console",
    title: "Enter Health Data",
    subtitle: "Fill in your latest health metrics. All fields are required except notes.",
  },
  cbc: {
    tag: "CBC / Lab Uplink Console",
    title: "CBC Scanner",
    subtitle: "Scan your Complete Blood Count report and get AI-powered analysis.",
  },
  upload: {
    tag: "Telemetry Uplink Console",
    title: "Upload Data File",
    subtitle: "Batch upload raw health telemetry or sensor log files.",
  },
};

const FIELDS = [
  {
    key: "heartRate" as const,
    label: "Heart Rate",
    unit: "BPM",
    placeholder: "72",
    hint: "Normal range: 60 - 100 BPM",
    icon: Heart,
    accent: "text-rose-400",
    required: true,
  },
  {
    key: "spo2" as const,
    label: "SpO₂",
    unit: "%",
    placeholder: "98",
    hint: "Normal range: 95% - 100%",
    icon: Droplet,
    accent: "text-sky-400",
    required: true,
  },
  {
    key: "sleep" as const,
    label: "Sleep Duration",
    unit: "hrs",
    placeholder: "7.4",
    hint: "Recommended rest: 7.0 - 8.5 hrs",
    icon: Moon,
    accent: "text-indigo-400",
    required: true,
  },
  {
    key: "activity" as const,
    label: "Activity Level",
    unit: "%",
    placeholder: "68",
    hint: "Mission standard: 50% - 85%",
    icon: Activity,
    accent: "text-cyan-400",
    required: true,
  },
];

const CBC_FEATURES = [
  {
    title: "Secure & Private",
    description: "Your data is encrypted and secure.",
    icon: Lock,
    accent: "text-sky-400",
    tile: "border-purple-400/20 bg-purple-400/10",
  },
  {
    title: "AI Powered",
    description: "Get instant analysis and insights.",
    icon: Sparkles,
    accent: "text-primary",
    tile: "border-primary/20 bg-primary/10",
  },
  {
    title: "Fast Results",
    description: "Detailed results in seconds.",
    icon: Zap,
    accent: "text-emerald-400",
    tile: "border-emerald-400/20 bg-emerald-400/10",
  },
];

const CBC_REFERENCE = [
  { name: "WBC", range: "4.0 - 11.0 x10³/µL", dot: "bg-primary" },
  { name: "RBC", range: "4.2 - 5.9 x10⁶/µL", dot: "bg-sky-400" },
  { name: "HGB", range: "13.5 - 17.5 g/dL", dot: "bg-danger" },
  { name: "PLT", range: "150 - 450 x10³/µL", dot: "bg-success" },
];

const CBC_RESULTS = [
  { id: 1, date: "Apr 28, 2025", status: "Normal", wbc: "6.8", rbc: "4.9", hgb: "14.5", plt: "260" },
  { id: 2, date: "Apr 21, 2025", status: "Normal", wbc: "7.1", rbc: "5.0", hgb: "14.8", plt: "252" },
  { id: 3, date: "Apr 14, 2025", status: "Watch", wbc: "11.4", rbc: "4.6", hgb: "13.9", plt: "231" },
];

interface RecentEntry {
  id: number;
  time: string;
  heartRate: string;
  spo2: string;
  sleep: string;
  activity: string;
}

const DEFAULT_FORM = { heartRate: "72", spo2: "98", sleep: "7.4", activity: "68" };

function formatTimestamp(date: Date): string {
  const hh = date.getUTCHours().toString().padStart(2, "0");
  const mm = date.getUTCMinutes().toString().padStart(2, "0");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${hh}:${mm} UTC · ${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function buildSeedRecent(): RecentEntry[] {
  const now = Date.now();
  const seed: Omit<RecentEntry, "time">[] = [
    { id: 3, heartRate: "69", spo2: "99", sleep: "7.8", activity: "62" },
    { id: 2, heartRate: "74", spo2: "98", sleep: "7.1", activity: "71" },
    { id: 1, heartRate: "71", spo2: "97", sleep: "6.9", activity: "58" },
  ];
  return seed.map((entry, i) => ({
    ...entry,
    time: formatTimestamp(new Date(now - (i + 1) * 15 * 60 * 1000)),
  }));
}

function readModeFromUrl(): Mode {
  const params = new URLSearchParams(window.location.search);
  const m = params.get("mode");
  if (m === "cbc" || m === "upload") return m;
  return "manual";
}

export default function AstronautDataInputPage() {
  const [mode, setMode] = useState<Mode>("manual");
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>(() => buildSeedRecent());

  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cbcSubmitting, setCbcSubmitting] = useState(false);
  const [cbcSubmitted, setCbcSubmitted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadSubmitted, setUploadSubmitted] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => setMode(readModeFromUrl()));

    const onPopState = () => setMode(readModeFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectMode = (next: Mode) => {
    setMode(next);
    const url = next === "manual" ? "/astronaut/data-input" : `/astronaut/data-input?mode=${next}`;
    window.history.pushState(null, "", url);
  };

  const startScan = () => {
    setScanning(true);
    window.setTimeout(() => {
      setScanning(false);
      setScanned(true);
    }, 2400);
  };

  const resetScan = () => {
    setScanned(false);
    setError(null);
    setCbcSubmitted(false);
  };

  const handleCbcSubmit = () => {
    setCbcSubmitting(true);
    window.setTimeout(() => {
      setCbcSubmitting(false);
      setCbcSubmitted(true);
    }, 700);
  };

  const handleUploadSubmit = () => {
    setUploadSubmitting(true);
    window.setTimeout(() => {
      setUploadSubmitting(false);
      setUploadSubmitted(true);
    }, 700);
  };

  const nextRecentId = useMemo(
    () => (recent.length > 0 ? Math.max(...recent.map((r) => r.id)) + 1 : 1),
    [recent]
  );

  const heading = HEADINGS[mode];

  const handleChange = (key: keyof typeof DEFAULT_FORM, value: string) => {
    setFormData({ ...formData, [key]: value });
    setError(null);
    setSuccess(null);
  };

  const handleClear = () => {
    setFormData(DEFAULT_FORM);
    setNotes("");
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const values = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [key, parseFloat(value)])
    ) as Record<keyof typeof DEFAULT_FORM, number>;

    const invalid = Object.keys(values).some(
      (key) => Number.isNaN(values[key as keyof typeof DEFAULT_FORM])
    );
    if (invalid) {
      setError("All required fields must contain valid numeric values.");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      const timestamp = new Date();
      const entry: RecentEntry = {
        id: nextRecentId,
        time: formatTimestamp(timestamp),
        heartRate: formData.heartRate,
        spo2: formData.spo2,
        sleep: formData.sleep,
        activity: formData.activity,
      };
      setRecent((prev) => [entry, ...prev]);
      setSuccess(`Telemetry recorded automatically at ${entry.time}.`);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="animate-fade-in mx-auto max-w-6xl space-y-5 lg:space-y-6">
      <SpaceBackdrop />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: mode content */}
        <div className="lg:col-span-8">
          <section className="glass-card rounded-2xl p-3.5 sm:p-4">
            <div className="border-b border-sky-400/10 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                {heading.tag}
              </span>
              <h2 className="mt-0.5 text-lg font-bold tracking-tight text-white lg:text-xl">
                {heading.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">{heading.subtitle}</p>
            </div>

            {mode === "manual" && (
              <form
                onSubmit={handleSubmit}
                className="mt-3.5 flex min-h-[360px] flex-col justify-between gap-4"
              >
                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {FIELDS.map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.key} className="space-y-1.5">
                        <label
                          htmlFor={`data-${field.key}`}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200"
                        >
                          <Icon className={cn("h-3.5 w-3.5", field.accent)} />
                          {field.label}
                          {field.required && (
                            <span className="text-danger" aria-hidden="true">
                              *
                            </span>
                          )}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`data-${field.key}`}
                            type="number"
                            step="any"
                            required={field.required}
                            value={formData[field.key]}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 font-mono text-xs font-semibold text-white transition focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                          />
                          <span className="shrink-0 rounded-lg bg-white/[0.06] px-2.5 py-2 text-[11px] font-semibold text-slate-400">
                            {field.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">{field.hint}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <label
                    htmlFor="data-notes"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200"
                  >
                    <StickyNote className="h-3.5 w-3.5 text-amber-300" />
                    Notes
                    <span className="text-[10px] font-normal text-slate-500">(optional)</span>
                  </label>
                  <textarea
                    id="data-notes"
                    rows={4}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setError(null);
                      setSuccess(null);
                    }}
                    placeholder="Add context for this reading (e.g. post-EVA, sleep quality, symptoms)..."
                    className="w-full flex-1 resize-none rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-xs text-white transition placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-[11px] text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/[0.06] px-3 py-2.5 text-[11px] text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div>
                      <p className="font-bold text-white">Health Data Submitted</p>
                      <p className="mt-0.5 text-slate-400">{success}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 px-4 py-2.5 text-xs font-semibold text-background transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Health Data
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg border border-sky-400/15 bg-card-secondary/40 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:border-primary/30 hover:text-white disabled:opacity-60"
                  >
                    <Eraser className="h-4 w-4" />
                    Clear Form
                  </button>
                </div>
              </form>
            )}

            {mode === "cbc" && (
              <div className="mt-3.5 flex min-h-[360px] flex-col justify-between gap-3.5">
                {/* Scanner panel */}
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-card-secondary/40 p-4 text-center sm:p-5">
                  <span className="animate-scan-beam pointer-events-none absolute left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent shadow-[0_0_14px_rgba(34,211,238,0.9)]" />

                  {!scanning && !scanned && (
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10 shadow-[0_0_36px_rgba(56,189,248,0.25)]">
                        <ScanLine className="h-8 w-8 text-primary" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-white">
                          Ready to Scan
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                          Use the scanner to capture and analyze your CBC report.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={startScan}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 px-4 py-2 text-xs font-semibold text-background transition-all hover:brightness-110"
                      >
                        <ScanLine className="h-4 w-4" />
                        Open Scanner
                      </button>
                    </div>
                  )}

                  {scanning && (
                    <div className="flex flex-col items-center gap-3">
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-400/25 bg-sky-500/10 shadow-[0_0_36px_rgba(56,189,248,0.35)]">
                        <ScanLine className="h-8 w-8 animate-pulse text-primary" />
                        <span className="animate-ping absolute inset-0 rounded-2xl border border-primary/30" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-white">
                          Scanning Report...
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                          Reading cell counts and biomarkers. Please hold still.
                        </p>
                      </div>
                      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary to-cyan-400" />
                      </div>
                    </div>
                  )}

                  {scanned && (
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-success/25 bg-success/10 shadow-[0_0_36px_rgba(34,197,94,0.25)]">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                      </span>
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-white">
                          Scan Complete
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                          WBC, RBC, HGB and PLT markers detected. Analysis generated in 1.4s.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetScan}
                        className="flex items-center gap-2 rounded-lg border border-sky-400/15 bg-card-secondary/40 px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-primary/30 hover:text-white"
                      >
                        <ScanLine className="h-4 w-4" />
                        Scan Another Report
                      </button>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {CBC_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3 transition-colors hover:border-primary/25"
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border",
                            feature.tile
                          )}
                        >
                          <Icon className={cn("h-4 w-4", feature.accent)} />
                        </span>
                        <h4 className="mt-2 text-[11px] font-bold text-white">{feature.title}</h4>
                        <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Submit CBC data */}
                <button
                  type="button"
                  onClick={handleCbcSubmit}
                  disabled={!scanned || cbcSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 px-4 py-2.5 text-xs font-semibold text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {cbcSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Health Data
                    </>
                  )}
                </button>

                {cbcSubmitted && (
                  <p className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2 text-[11px] text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    CBC report submitted to mission health records.
                  </p>
                )}
              </div>
            )}

            {mode === "upload" && (
              <div className="mt-3.5 flex min-h-[360px] flex-col justify-between gap-3.5">
                <label
                  htmlFor="data-file"
                  className="glass-card flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border border-dashed border-primary/30 bg-card-secondary/40 px-6 py-8 text-center transition-colors hover:border-primary/50"
                >
                  <input
                    id="data-file"
                    type="file"
                    accept=".csv,.json,.log,.txt"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setUploadedFile(file ? file.name : null);
                      setUploadSubmitted(false);
                    }}
                  />
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </span>
                  <h3 className="text-sm font-bold text-white">Upload File Interface</h3>
                  <p className="max-w-sm text-[11px] text-slate-400">
                    {uploadedFile
                      ? `Selected: ${uploadedFile}`
                      : "Batch telemetry file upload is in preparation for sensor log downlink integration."}
                  </p>
                  <span className="rounded-lg border border-sky-400/15 bg-card-secondary/40 px-3 py-1.5 text-[11px] font-semibold text-sky-300">
                    Choose File
                  </span>
                </label>

                <div className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3 text-[11px] text-slate-400">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    Batch Requirements
                  </p>
                  <ul className="space-y-1.5">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Supported formats: CSV, JSON, LOG
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                      Maximum 10 MB per file
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                      Encrypted before uplink transmission
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={!uploadedFile || uploadSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-cyan-500 px-4 py-2.5 text-xs font-semibold text-background transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {uploadSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Health Data
                    </>
                  )}
                </button>

                {uploadSubmitted && (
                  <p className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2 text-[11px] text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    Telemetry file uploaded to mission health records.
                  </p>
                )}
              </div>
            )}

            {/* Input mode segmented navigation (below the mode content) */}
            <div className="mt-4 border-t border-sky-400/10 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Input Mode
              </p>
              <div
                role="tablist"
                aria-label="Input mode"
                className="grid grid-cols-1 gap-1.5 rounded-xl border border-sky-400/10 bg-card-secondary/40 p-1.5 sm:grid-cols-3"
              >
                {MODES.map((item) => {
                  const Icon = item.icon;
                  const active = mode === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectMode(item.key)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-primary to-cyan-500 text-background shadow-lg shadow-primary/25"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Right: mode-specific panel */}
        <aside className="space-y-5 lg:col-span-4">
          {mode === "cbc" ? (
            <>
              {/* Recent CBC results */}
              <section className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-white">Recent CBC Results</h3>
                </div>

                <div className="mt-3.5 space-y-3">
                  {CBC_RESULTS.map((result) => (
                    <div
                      key={result.id}
                      className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3.5 transition-colors hover:border-primary/25"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-mono text-[11px] font-semibold text-slate-300">
                          {result.date}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            result.status === "Normal"
                              ? "border border-success/25 bg-success/10 text-success"
                              : "border border-warning/25 bg-warning/10 text-warning"
                          )}
                        >
                          {result.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          WBC {result.wbc}
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          RBC {result.rbc}
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          HGB {result.hgb}
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          PLT {result.plt}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* CBC reference ranges */}
              <section className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-white">CBC Reference Ranges</h3>
                </div>

                <ul className="mt-3.5 space-y-2.5">
                  {CBC_REFERENCE.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-3.5 py-2.5"
                    >
                      <span className="flex items-center gap-2.5 text-xs font-bold text-white">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", item.dot)} />
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{item.range}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          ) : (
            <>
              {/* Recent data */}
              <section className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
                  <History className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-white">Recent Data</h3>
                </div>

                <div className="mt-3.5 space-y-3">
                  {recent.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-sky-400/10 bg-card-secondary/40 p-3.5 transition-colors hover:border-primary/25"
                    >
                      <p className="font-mono text-[11px] font-semibold text-slate-300">
                        {entry.time}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          HR {entry.heartRate}
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          SpO₂ {entry.spo2}%
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          Sleep {entry.sleep}h
                        </span>
                        <span className="rounded-md border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                          Act {entry.activity}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Data guidelines */}
              <section className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 border-b border-sky-400/10 pb-3.5">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-white">Data Guidelines</h3>
                </div>

                <ul className="mt-3.5 space-y-2.5 text-xs text-slate-300">
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    <span>
                      <span className="font-bold text-white">Heart Rate:</span> keep 60 - 100
                      BPM at rest.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <span className="font-bold text-white">SpO₂:</span> maintain saturation at
                      or above 95%.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    <span>
                      <span className="font-bold text-white">Sleep:</span> target 7 - 8 hours of
                      rest.
                    </span>
                  </li>
                  <li className="flex gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>
                      <span className="font-bold text-white">Activity:</span> aim for 50 - 85% of
                      mission standard.
                    </span>
                  </li>
                </ul>

                <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.08] p-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-xs font-medium leading-relaxed text-sky-100/90">
                    Your data fuels a healthier mission.
                  </p>
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function SpaceBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -right-40 -top-44 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.09),transparent_65%)] blur-2xl" />
      <div className="absolute -bottom-80 -left-44 h-[44rem] w-[56rem] rounded-full bg-[radial-gradient(circle_at_45%_15%,rgba(56,189,248,0.18),rgba(14,165,233,0.10)_40%,transparent_72%)] blur-md" />
      <div className="absolute -bottom-44 -left-24 h-80 w-[48rem] rounded-[50%] border border-t-2 border-sky-400/10" />
      <div className="absolute -bottom-32 -left-16 h-56 w-[44rem] rounded-[50%] border border-sky-400/[0.07]" />
      <span className="absolute left-[16%] top-[20%] h-1 w-1 rounded-full bg-white/30" />
      <span className="absolute left-[30%] top-[10%] h-0.5 w-0.5 rounded-full bg-white/40" />
      <span className="absolute left-[24%] top-[64%] h-0.5 w-0.5 rounded-full bg-white/25" />
      <span className="absolute left-[42%] top-[8%] h-1 w-1 rounded-full bg-cyan-300/30" />
      <span className="absolute right-[18%] top-[18%] h-0.5 w-0.5 rounded-full bg-white/30" />
      <span className="absolute right-[32%] top-[6%] h-1 w-1 rounded-full bg-white/25" />
      <span className="absolute bottom-[30%] left-[52%] h-0.5 w-0.5 rounded-full bg-white/20" />
      <span className="absolute bottom-[14%] left-[68%] h-1 w-1 rounded-full bg-cyan-300/25" />
    </div>
  );
}