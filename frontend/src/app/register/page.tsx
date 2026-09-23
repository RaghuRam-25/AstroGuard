"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  Globe2,
  Loader2,
  Lock,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Timer,
  Upload,
  User,
  UserRound,
  ArrowRight,
  Satellite,
} from "lucide-react";
import { registerAstronaut } from "../../lib/api";
import { useRegistration } from "../../context/RegistrationContext";
import SolarSystemAnimation from "../../components/SolarSystemAnimation";
import RootBackground from "../../components/public/RootBackground";

type GenderValue = "" | "female" | "male" | "non_binary" | "prefer_not_to_say";

type FormState = {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  gender: GenderValue;
  profileImage: string;
  agreeToTerms: boolean;
};

const initialForm: FormState = {
  name: "",
  email: "",
  username: "",
  password: "",
  phone: "",
  dateOfBirth: "",
  country: "",
  gender: "",
  profileImage: "",
  agreeToTerms: false,
};

const passwordRules = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Uppercase", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Lowercase", test: (value: string) => /[a-z]/.test(value) },
  { label: "Number", test: (value: string) => /[0-9]/.test(value) },
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const inputBase =
  "w-full rounded-xl border border-white/10 bg-[#020817]/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20";

const iconInputBase = `${inputBase} pl-11`;

export default function AstronautRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { isRegistrationOpen, expiresInMs, remainingLabel, loading: registrationLoading } =
    useRegistration();
  const [gateReady, setGateReady] = useState(false);

  // Registration window gate — only render the form once the gate state is hydrated.
  const gateOpen = gateReady && isRegistrationOpen && expiresInMs > 0;

  const passedRules = useMemo(
    () => passwordRules.filter((rule) => rule.test(form.password)).length,
    [form.password]
  );

  useMemo(() => {
    if (!registrationLoading && !gateReady) {
      // Hydrate the gate on first non-loading render.
      requestAnimationFrame(() => setGateReady(true));
    }
    return;
  }, [registrationLoading, gateReady]);

  const strengthLabel = ["Weak", "Weak", "Fair", "Good", "Strong"][passedRules];
  const strengthColor =
    passedRules <= 1 ? "bg-red-500" : passedRules === 2 ? "bg-amber-400" : "bg-emerald-400";

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitMessage(null);
  };

  const validateClient = () => {
    const nextErrors: Record<string, string> = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernamePattern = /^[a-zA-Z0-9_]+$/;

    if (form.name.trim().length < 2) nextErrors.name = "Full name is required.";
    if (!emailPattern.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (form.username.trim().length < 3 || !usernamePattern.test(form.username)) {
      nextErrors.username = "Use at least 3 letters, numbers, or underscores.";
    }
    if (passedRules < passwordRules.length) {
      nextErrors.password = "Password must meet all strength requirements.";
    }
    if (form.phone.trim().length < 7) nextErrors.phone = "Phone number is required.";
    if (!form.dateOfBirth) nextErrors.dateOfBirth = "Date of birth is required.";
    if (!form.country.trim()) nextErrors.country = "Country is required.";
    if (!form.agreeToTerms) nextErrors.agreeToTerms = "Terms agreement is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleProfileImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, profileImage: "Please upload an image file." }));
      return;
    }
    if (file.size > 900_000) {
      setErrors((current) => ({ ...current, profileImage: "Image must be under 900 KB." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("profileImage", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const applyServerErrors = (serverErrors: unknown) => {
    if (!Array.isArray(serverErrors)) return;
    const nextErrors: Record<string, string> = {};
    serverErrors.forEach((issue) => {
      if (
        issue &&
        typeof issue === "object" &&
        "field" in issue &&
        "message" in issue &&
        typeof issue.field === "string" &&
        typeof issue.message === "string"
      ) {
        nextErrors[issue.field] = issue.message;
      }
    });
    if (Object.keys(nextErrors).length) setErrors(nextErrors);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitMessage(null);
    setSuccessMessage(null);

    if (!validateClient()) return;

    setLoading(true);
    try {
      const res = await registerAstronaut({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.password,
        phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth,
        country: form.country.trim(),
        gender: form.gender || undefined,
        profileImage: form.profileImage || undefined,
        agreeToTerms: form.agreeToTerms,
      });

      if (!res.success) {
        applyServerErrors(res.errors);
        setSubmitMessage(res.message || "Registration could not be completed.");
        return;
      }

      setSuccessMessage("Registration successful. Redirecting to your mission portal...");
      setForm(initialForm);
      setTimeout(() => router.push("/login"), 900);
    } catch (error: unknown) {
      setSubmitMessage(
        error instanceof Error ? error.message : "Unexpected registration error."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Shared public astronomy background (matches login page) */}
      <RootBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 p-2 shadow-lg shadow-primary/15">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={30} height={30} priority />
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            Astro<span className="text-primary">Guard</span>
          </span>
        </Link>
        <Link
          href="/login"
          className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-primary/40 hover:text-white"
        >
          Existing Crew Login
        </Link>
      </header>

      {/* Split-screen flight deck */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8 lg:px-10">
        <section className="grid min-h-[calc(100vh-6.5rem)] items-stretch gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          {/* LEFT — Space hero deck */}
          <aside className="hidden lg:flex flex-col gap-5">
            <div className="flex max-w-lg flex-1 flex-col space-y-5">
              {/* Astronaut hero image + live solar telemetry (side by side) */}
              <div className="flex flex-1 items-stretch gap-4 min-h-[20rem]">
                <div className="w-[14rem] shrink-0 overflow-hidden rounded-3xl border border-primary/25 shadow-2xl shadow-primary/10">
                  <Image
                    src="/astronaut-avatar.png"
                    alt="Astronaut avatar"
                    width={640}
                    height={640}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* SOLAR ORBIT TELEMETRY — live canvas simulation next to the image */}
                <div className="relative flex-1 min-h-[18rem] overflow-hidden rounded-3xl border border-primary/20 bg-[#080C14]/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
                  <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(56,189,248,0.12),transparent_68%)]"
                    aria-hidden="true"
                  />
                  <SolarSystemAnimation className="absolute inset-0" />
                </div>
              </div>

              {/* Window status panel */}
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[#020817]/55 p-6 backdrop-blur-xl shadow-2xl shadow-black/40">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)] blur-xl"
                  aria-hidden="true"
                />
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                    gateOpen
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-red-400/40 bg-red-400/10 text-red-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      gateOpen ? "bg-emerald-300 animate-pulse" : "bg-red-300"
                    }`}
                  />
                  {gateOpen ? "Enrollment window open" : "Enrollment window closed"}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                    <Timer className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Countdown to window close
                    </p>
                    <p
                      className={`font-mono text-3xl font-black tabular-nums ${
                        gateOpen && expiresInMs < 30_000
                          ? "text-red-400 animate-pulse"
                          : gateOpen
                          ? "text-primary"
                          : "text-slate-600"
                      }`}
                    >
                      {gateOpen ? remainingLabel : "00:00:00"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {gateOpen
                    ? "Mission Control has opened a time-limited enrollment window. Complete intake before the countdown expires."
                    : "Public enrollment is time-limited. Mission Control will broadcast the next opening window."}
                </p>
              </div>

              {/* Hero copy */}
              <div className="space-y-5">
                <CrewTag />
                <h1 className="public-glow text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                  Report for <span className="text-primary">duty.</span>
                </h1>
                <p className="text-base leading-7 text-slate-300">
                  Join the astrognation health programme. Your biometric baseline, AI anomaly
                  detection and mission-critical vitals — sealed behind astronaut-grade identity
                  and session encryption.
                </p>
              </div>

              {/* Trust badges */}
              <div className="grid gap-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Role locked server-side",
                    detail: "Astronaut role enforced by the backend, never the browser.",
                  },
                  {
                    icon: Lock,
                    title: "Encrypted session cookies",
                    detail: "Secure HTTP-only sessions after successful registration.",
                  },
                  {
                    icon: Satellite,
                    title: "Crew telemetry archive",
                    detail: "Bio-signals streamed to the AstroGuard atlas database.",
                  },
                ].map(({ icon: Icon, title, detail }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020817]/40 px-4 py-3 backdrop-blur-md"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100">{title}</p>
                      <p className="text-[11px] leading-5 text-slate-400">{detail}</p>
                    </div>
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-300/80" />
                  </div>
                ))}
              </div>
              </div>
          </aside>

          {/* RIGHT — Form deck */}
          <div>
            {gateOpen ? (
              <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[#07111f]/80 p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-7">
                <div
                  className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.16),transparent_70%)] blur-xl"
                  aria-hidden="true"
                />
                <div className="relative mb-4 flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Satellite className="h-4 w-4" />
                      Crew Identity Intake
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight">Create astronaut account</h2>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-xs text-slate-300">
                    Default role: <span className="font-semibold text-emerald-300">astronaut</span>
                  </div>
                </div>

                <div className="relative">
                  {(submitMessage || successMessage) && (
                    <div
                      className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                        successMessage
                          ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                          : "border-red-500/30 bg-red-950/30 text-red-200"
                      }`}
                    >
                      {successMessage ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <span>{successMessage || submitMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Full Name" error={errors.name}>
                        <IconInput icon={User} value={form.name} onChange={(value) => updateField("name", value)} placeholder="Alex Morgan" autoComplete="name" />
                      </Field>

                      <Field label="Email" error={errors.email}>
                        <IconInput icon={Mail} type="email" value={form.email} onChange={(value) => updateField("email", value)} placeholder="alex@astroguard.local" autoComplete="email" />
                      </Field>

                      <Field label="Username" error={errors.username}>
                        <IconInput icon={Fingerprint} value={form.username} onChange={(value) => updateField("username", value)} placeholder="alex_morgan" autoComplete="username" />
                      </Field>

                      <Field label="Phone Number" error={errors.phone}>
                        <IconInput icon={Phone} type="tel" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="+1 555 0134" autoComplete="tel" />
                      </Field>

                      <Field label="Date of Birth" error={errors.dateOfBirth}>
                        <IconInput icon={Calendar} type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
                      </Field>

                      <Field label="Country" error={errors.country}>
                        <IconInput icon={Globe2} list="country-list" value={form.country} onChange={(value) => updateField("country", value)} placeholder="United States" autoComplete="country-name" />
                        <datalist id="country-list">
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country} />
                          ))}
                        </datalist>
                      </Field>

                      <Field label="Gender" error={errors.gender}>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <select
                            value={form.gender}
                            onChange={(event) => updateField("gender", event.target.value as GenderValue)}
                            className={`${iconInputBase} appearance-none`}
                          >
                            <option value="">Select gender</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="non_binary">Non-binary</option>
                            <option value="prefer_not_to_say">Prefer not to say</option>
                          </select>
                        </div>
                      </Field>

                      <Field label="Password" error={errors.password}>
                        <PasswordInput
                          value={form.password}
                          onChange={(value) => updateField("password", value)}
                          visible={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          autoComplete="new-password"
                        />
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Password strength</span>
                            <span className="font-semibold text-slate-200">{strengthLabel}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {passwordRules.map((rule, index) => (
                              <span
                                key={rule.label}
                                className={`h-1 rounded-full ${index < passedRules ? strengthColor : "bg-white/10"}`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {passwordRules.map((rule) => (
                              <span
                                key={rule.label}
                                className={`rounded-full border px-2 py-1 text-[10px] ${
                                  rule.test(form.password)
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                    : "border-white/10 bg-white/[0.03] text-slate-400"
                                }`}
                              >
                                {rule.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Field>
                    </div>

                    <Field label="Profile Image" error={errors.profileImage}>
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center transition hover:border-primary/40 hover:bg-primary/5 sm:flex-row sm:justify-start sm:text-left">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                          <Upload className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-100">
                            {form.profileImage ? "Profile image ready" : "Upload optional crew image"}
                          </span>
                          <span className="block text-xs text-slate-400">PNG, JPG, or WEBP under 900 KB</span>
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(event) => handleProfileImage(event.target.files?.[0])}
                        />
                      </label>
                    </Field>

                    <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.agreeToTerms}
                        onChange={(event) => updateField("agreeToTerms", event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-[#020817] accent-emerald-500"
                      />
                      <span>
                        I agree to the AstroGuard terms, mission data handling policy, and astronaut
                        safety monitoring requirements.
                        {errors.agreeToTerms && (
                          <span className="mt-1 block text-xs font-medium text-red-300">{errors.agreeToTerms}</span>
                        )}
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-bright px-4 py-3.5 text-sm font-black text-[#020817] shadow-lg shadow-primary/25 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting Registration...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" />
                          Register Astronaut
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-amber-500/25 bg-[#07111f]/80 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-2xl">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_70%)] blur-xl"
                  aria-hidden="true"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
                  <LockKeyhole className="h-8 w-8 text-amber-300" />
                </div>
                <h2 className="mt-6 text-2xl font-black tracking-tight text-white">
                  Registration window is closed
                </h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                  Public enrollment is time-limited and only opens when Mission Control broadcasts
                  a registration window. Check back when the next window opens.
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 font-mono text-sm text-slate-400">
                  <Timer className="h-4 w-4" />00:00:00
                </div>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:text-white"
                >
                  Back to Home
                </Link>
              </div>
            )}

            {/* Mobile gate status */}
            <div className="mt-5 flex items-center gap-2 lg:hidden">
              <span
                className={`h-1.5 w-1.5 rounded-full ${gateOpen ? "bg-emerald-300 animate-pulse" : "bg-red-300"}`}
              />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                {gateOpen ? `Enrollment open · ${remainingLabel} remaining` : "Enrollment window closed"}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function CrewTag() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      Astronaut Health Intelligence
    </span>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      {children}
      {error && <p className="text-xs font-medium text-red-300">{error}</p>}
    </div>
  );
}

function IconInput({
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  list,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  list?: string;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        list={list}
        className={iconInputBase}
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter secure password"
        autoComplete={autoComplete}
        className={`${iconInputBase} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}