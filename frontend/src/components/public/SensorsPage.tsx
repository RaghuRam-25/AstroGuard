import {
  Activity,
  Bed,
  Droplet,
  Flame,
  Microscope,
  ScanLine,
  ShieldCheck,
  TestTube,
  Thermometer,
  Watch,
} from "lucide-react";
import PublicShell from "./PublicShell";

type Tone = "cyan" | "emerald" | "amber";

interface SensorSpec {
  name: string;
  category: string;
  icon: typeof Watch;
  function: string;
  mechanism: string;
  tone: Tone;
}

const TONES: Record<Tone, { border: string; bg: string; text: string; glow: string }> = {
  cyan: {
    border: "border-cyan-400/30",
    bg: "bg-cyan-400/10",
    text: "text-cyan-300",
    glow: "group-hover:shadow-[0_18px_50px_rgba(34,211,238,0.14)]",
  },
  emerald: {
    border: "border-emerald-400/30",
    bg: "bg-emerald-400/10",
    text: "text-emerald-300",
    glow: "group-hover:shadow-[0_18px_50px_rgba(52,211,153,0.14)]",
  },
  amber: {
    border: "border-amber-400/30",
    bg: "bg-amber-400/10",
    text: "text-amber-300",
    glow: "group-hover:shadow-[0_18px_50px_rgba(251,191,36,0.14)]",
  },
};

const SENSORS: SensorSpec[] = [
  {
    name: "Smart Biosensor Watch / Bio-Band",
    category: "Wearable Telemetry",
    icon: Watch,
    function: "Continuous Heart Rate, SpO₂ (oxygen saturation) and digital Blood Pressure (BP) monitoring.",
    mechanism:
      "Optical and capacitive electrodes sit against the wrist and stream signals to the cabin telemetry bus — no watch-to-app pairing, no manual sync.",
    tone: "cyan",
  },
  {
    name: "Micro-Fluidic Sweat Sensor",
    category: "Wearable Telemetry",
    icon: Droplet,
    function: "Real-time Hydration level, Sweat Rate, Electrolytes and Sodium analysis.",
    mechanism:
      "A skin patch wicks passive sweat through capillary channels into colorimetric wells that auto-read under UV — quantifies hydration every 30 seconds unattended.",
    tone: "amber",
  },
  {
    name: "Digital Non-Contact Infrared Thermometer",
    category: "Vitals Monitor",
    icon: Thermometer,
    function: "Continuous Body Temperature and Thermal Balance tracking.",
    mechanism:
      "IR thermopile arrays sweep the cabin habitat and the astronaut's skin patch edge, transmitting core-trend surface temperature without any instrument handling.",
    tone: "amber",
  },
  {
    name: "Urine & Metabolic Diagnostic Module",
    category: "Clinical Diagnostics",
    icon: TestTube,
    function: "Automated urine analysis: glucose, kidney-health markers, hydration status and protein traces.",
    mechanism:
      "A smart collector dip-tests each void via reagent strips and photometric readback, then auto-labels results to the astronaut record before flushing.",
    tone: "emerald",
  },
  {
    name: "Stool & Digestive Health Bio-Analyzer",
    category: "Clinical Diagnostics",
    icon: Flame,
    function: "Gut microbiome health, digestive tracking and metabolic waste analysis.",
    mechanism:
      "Automated collectors run DNA-probe and enzyme assays on samples, logging microbiome diversity and absorption efficiency without crew interaction.",
    tone: "emerald",
  },
  {
    name: "Lab-on-a-Chip Saliva Analyzer",
    category: "Clinical Diagnostics",
    icon: Activity,
    function: "Vitamin deficiencies (A, B, C, D, E, K), Calcium, Zinc, Iron and Cortisol (stress) screening.",
    mechanism:
      "A saliva droplet is drawn into microfluidic immunoassay chambers; integrated optics classify the full panel and push a structured result to Mission Control.",
    tone: "cyan",
  },
  {
    name: "RFID Space-Meal & Drink Scanner",
    category: "Nutrition Tracker",
    icon: ScanLine,
    function: "Instant scanning of food packets for Protein, Calories, Fiber and Water intake.",
    mechanism:
      "RFID tags on each meal and drink carton are read the moment they pass the galley portal, attributing macros and hydration automatically — no barcode typing.",
    tone: "emerald",
  },
  {
    name: "Smart Muscle & Kinetic Sleep Pad",
    category: "Recovery Monitor",
    icon: Bed,
    function: "Muscle Fatigue Index during exercise and Sleep Quality / Duration scores.",
    mechanism:
      "Mattress pressure arrays and exercise load cells detect micro-movement and force output all night, reconstructing fatigue and sleep curves on a rolling schedule.",
    tone: "cyan",
  },
];

export default function SensorsPage() {
  return (
    <PublicShell>
      <section className="mx-auto min-h-[calc(100vh-9.5rem)] w-full max-w-7xl px-5 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="public-glow mt-3 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl">
            AstroGuard BioSensor &amp; <span className="text-primary">Diagnostic Hardware</span>
          </h1>
        </div>

        {/* Sensor grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SENSORS.map((sensor) => {
            const tone = TONES[sensor.tone];
            const Icon = sensor.icon;
            return (
              <article
                key={sensor.name}
                className={`group relative overflow-hidden rounded-2xl border border-primary/15 bg-[#080C14]/80 p-4 shadow-lg shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-primary/40 ${tone.glow}`}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.12),transparent_70%)] blur-xl" />

                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone.border} ${tone.bg} ${tone.text}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[12px] font-bold leading-snug text-slate-100">
                      {sensor.name}
                    </h3>
                    <span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                      {sensor.category}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[11px] leading-4.5 text-slate-300">{sensor.function}</p>
                <p className="mt-2 text-[11px] leading-4.5 text-slate-500">{sensor.mechanism}</p>

                <div className="mt-3 flex items-center gap-2 border-t border-white/[0.07] pt-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.text} bg-current animate-pulse`} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.14em] ${tone.text}`}>
                    ATTACHED · AUTO-CAPTURE
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}