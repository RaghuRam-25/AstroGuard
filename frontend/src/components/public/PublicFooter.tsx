import Image from "next/image";
import logo from "../../../public/logo.svg";

export default function PublicFooter() {
  return (
    <footer className="relative z-10 border-t border-cyan-500/10 bg-[#070C18]/80 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-xs text-slate-400 sm:flex-row">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Image src={logo.src} alt="Logo" width={24} height={24} />
          <span className="font-bold tracking-wider text-white">
            Astro<span className="text-cyan-400">Guard</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-300/80">NASA Space Apps 2026</span>
        </div>

        {/* Copyright */}
        <p className="text-slate-500">
          © {new Date().getFullYear()} AstroGuard. All rights reserved.
        </p>

      </div>
    </footer>
  );
}