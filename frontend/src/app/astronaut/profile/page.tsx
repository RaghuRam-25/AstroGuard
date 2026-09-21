import Image from "next/image";
import {
  ChevronRight,
  FileDown,
  HelpCircle,
  KeyRound,
  Mail,
  Pencil,
  Rocket,
  User,
} from "lucide-react";
import { Card } from "@/components/shared/Card";
import StatusBadge from "@/components/shared/StatusBadge";
import { astronaut, missionInfo } from "@/data/mockData";

export const metadata = {
  title: "Profile - AstroGuard",
};

const PERSONAL = [
  { label: "Full Name", value: astronaut.name },
  { label: "Astronaut ID", value: astronaut.id },
  { label: "Role", value: "Astronaut" },
  { label: "Date of Birth", value: astronaut.dob },
  { label: "Nationality", value: astronaut.nationality },
  { label: "Height", value: astronaut.height },
  { label: "Weight", value: astronaut.weight },
  { label: "Blood Type", value: astronaut.bloodType },
];

const CONTACT = [
  { label: "Email", value: astronaut.email },
  { label: "Phone", value: astronaut.phone },
  { label: "Emergency Contact", value: astronaut.emergencyContact },
  { label: "Emergency Phone", value: astronaut.emergencyPhone },
];

const MISSION = [
  { label: "Mission", value: missionInfo.mission },
  { label: "Mission Day", value: String(missionInfo.missionDay) },
  { label: "Mission Status", value: missionInfo.statusLabel },
  { label: "Mission Phase", value: missionInfo.phase },
];

const MISSION_PROGRESS = Math.round((missionInfo.missionDay / 365) * 100);

const QUICK_ACTIONS = [
  { label: "Edit Profile", icon: Pencil },
  { label: "Change Password", icon: KeyRound },
  { label: "Download Report", icon: FileDown },
  { label: "Help & Support", icon: HelpCircle },
];

export default function AstronautProfilePage() {
  return (
    <div className="animate-fade-in grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <SpaceBackdrop />

      <div className="space-y-5">
        {/* ONE single profile header */}
        <section className="glass-card rounded-2xl transition-all duration-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
            <div className="relative shrink-0">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-primary/40 shadow-[0_0_45px_rgba(56,189,248,0.25)]">
                <Image
                  src="/astronaut-avatar.png"
                  alt={`${astronaut.name} portrait`}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
              <span
                title="Online"
                className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-success"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-white/90" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-3xl font-bold tracking-tight text-white">
                  {astronaut.name}
                </h2>
                <StatusBadge label="Astronaut" tone="blue" />
              </div>
              <p className="mt-1 text-sm text-slate-400">
                <span className="font-mono font-semibold text-primary">{astronaut.id}</span>
                <span className="mx-2 text-slate-600">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Online
                </span>
              </p>
              <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-400/15 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-sky-300">
                <Rocket className="h-3.5 w-3.5" />
                {astronaut.mission}
              </p>
              <p className="mt-4 max-w-xl text-sm italic leading-relaxed text-slate-400">
                &ldquo;{astronaut.bio}&rdquo;
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/15 px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary/25 hover:shadow-[0_0_30px_rgba(56,189,248,0.25)]"
              >
                <Pencil className="h-4 w-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </section>

        {/* Personal information */}
        <Card icon={User} title="Personal Information" bodyClassName="p-5 sm:p-6">
          <dl className="grid grid-cols-1 divide-y divide-sky-400/10 sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
            {PERSONAL.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4 py-3 sm:border-b sm:border-sky-400/10"
              >
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {item.label}
                </dt>
                <dd className="text-sm font-semibold text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Contact + Mission information */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card
            icon={Mail}
            title="Contact Information"
            bodyClassName="p-5"
          >
            <div className="flex flex-col gap-3">
              {CONTACT.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {item.label}
                  </span>
                  <span className="truncate text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            icon={Rocket}
            title="Mission Information"
            bodyClassName="p-5"
          >
            <div className="flex flex-col gap-3">
              {MISSION.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    {item.label}
                  </span>
                  <span className="truncate text-sm font-semibold text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Right column */}
      <aside className="space-y-5">
        {/* Mission status */}
        <Card icon={Rocket} title="Mission Status" bodyClassName="p-5">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">{missionInfo.mission}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Mission Day
              </span>
              <span className="text-lg font-bold text-primary">{missionInfo.missionDay}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Status
              </span>
              <StatusBadge label="Active" tone="green" dot />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Mission Progress</span>
                <span className="font-mono font-semibold text-primary">{MISSION_PROGRESS}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                  style={{ width: `${MISSION_PROGRESS}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <Card icon={Pencil} title="Quick Actions" bodyClassName="p-3">
          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  className="flex items-center gap-3 rounded-xl border border-sky-400/10 bg-card-secondary/40 px-4 py-3 text-sm font-medium text-slate-200 transition-all duration-300 hover:border-primary/30 hover:bg-primary/10 hover:text-white"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              );
            })}
          </div>
        </Card>
      </aside>
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
      <span className="absolute bottom-[22%] right-[12%] h-1 w-1 rounded-full bg-white/35" />
    </div>
  );
}