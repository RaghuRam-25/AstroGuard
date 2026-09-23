"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Radio, UserPlus, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegistration } from "@/context/RegistrationContext";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/sensors", label: "AstroSensors" },
];

export default function PublicNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isRegistrationOpen, expiresInMs, remainingLabel } = useRegistration();
  const joiningEnabled = isRegistrationOpen && expiresInMs > 0;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-[#030c1a]/65 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:h-[4.5rem]">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/15 p-1 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <Image src="/logo.svg" alt="AstroGuard Logo" width={26} height={26} priority />
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Astro<span className="text-primary">Guard</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                isActive(item.href)
                  ? "border border-primary/25 bg-primary/10 text-primary shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="mr-1 hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300 xl:flex"><Radio className="h-3 w-3" /> Systems nominal</div>
          <Link
            href="/login"
            className="rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2 text-sm font-semibold text-slate-200 transition-all hover:border-primary/40 hover:text-white"
          >
            Login
          </Link>
          {joiningEnabled ? (
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-bright px-5 py-2 text-sm font-bold text-[#020817] shadow-lg shadow-emerald-400/25 transition-all hover:brightness-110 active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              Register
              <span className="rounded-full bg-black/15 px-1.5 py-0.5 font-mono text-[10px]">
                {remainingLabel}
              </span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-semibold text-slate-500"
              title="Public enrollment is currently closed"
            >
              <Lock className="h-4 w-4" />
              Enrollment Closed
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Toggle navigation menu"
          className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-white lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#06111f]/95 px-5 pb-5 pt-3 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  isActive(item.href)
                    ? "border border-primary/25 bg-primary/10 text-primary"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-center text-sm font-semibold text-slate-200"
              >
                Login
              </Link>
              {joiningEnabled ? (
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-bright px-5 py-2.5 text-center text-sm font-bold text-[#020817]"
                >
                  Register / Join Crew
                </Link>
              ) : (
                <span className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-center text-sm font-semibold text-slate-500">
                  Enrollment Closed
                </span>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
