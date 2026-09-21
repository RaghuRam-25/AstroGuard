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
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  User,
  UserRound,
} from "lucide-react";
import { registerAstronaut } from "../../lib/api";

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
  "w-full rounded-xl border border-white/10 bg-[#020817]/85 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";

const iconInputBase = `${inputBase} pl-11`;

export default function AstronautRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passedRules = useMemo(
    () => passwordRules.filter((rule) => rule.test(form.password)).length,
    [form.password]
  );

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
    <div className="min-h-screen overflow-hidden bg-[#020817] text-white">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 18%, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 78% 34%, rgba(16,185,129,0.12), transparent 24%), radial-gradient(#ffffff 0.7px, transparent 0.7px)",
          backgroundSize: "auto, auto, 44px 44px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-600/20 p-2 shadow-lg shadow-blue-500/15">
              <Image src="/logo.svg" alt="AstroGuard Logo" width={30} height={30} priority />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Astro<span className="text-blue-400">Guard</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-blue-400/40 hover:text-white"
          >
            Existing Crew Login
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.82fr_1.18fr] lg:py-10">
          <aside className="hidden lg:block">
            <div className="max-w-md space-y-7">
              <div className="overflow-hidden rounded-3xl border border-blue-400/25 shadow-2xl shadow-blue-500/10">
                <Image
                  src="/astronaut-avatar.png"
                  alt="Astronaut avatar"
                  width={640}
                  height={640}
                  className="aspect-square w-full max-w-[19rem] object-cover"
                />
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                Public Astronaut Enrollment
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                  Astronaut Registration
                </h1>
                <p className="text-sm leading-6 text-slate-300">
                  Create a secure AstroGuard astronaut account for mission health monitoring,
                  telemetry review, and AI-assisted crew safety workflows.
                </p>
              </div>
              <div className="grid gap-3 text-sm text-slate-300">
                {[
                  "Encrypted session cookies after successful registration",
                  "Astronaut role locked by the backend",
                  "MongoDB Atlas user document in the existing AstroGuard database",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="rounded-3xl border border-white/10 bg-[#07111f]/90 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300">
                  <ShieldCheck className="h-4 w-4" />
                  Crew Identity Intake
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Create astronaut account</h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-300">
                Default role: <span className="font-semibold text-emerald-300">astronaut</span>
              </div>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
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

                <Field label="Password" error={errors.password}>
                  <PasswordInput
                    value={form.password}
                    onChange={(value) => updateField("password", value)}
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                    autoComplete="new-password"
                  />
                  <div className="mt-3 space-y-2">
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
              </div>

              <Field label="Profile Image" error={errors.profileImage}>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center transition hover:border-blue-400/40 hover:bg-blue-500/5 sm:flex-row sm:justify-start sm:text-left">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-blue-300">
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
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-[#020817] accent-blue-500"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
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
    <div className="space-y-1.5">
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
