"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-3xl border border-primary/20 bg-card/70 p-8 text-center text-sm text-muted">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </span>
        <p className="text-base font-semibold text-foreground">Message transmitted</p>
        <p>We&apos;ll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card space-y-5 rounded-3xl p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Full Name</label>
          <input
            type="text"
            required
            placeholder="Alex Morgan"
            className="w-full rounded-xl border border-white/10 bg-[#020817]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Email</label>
          <input
            type="email"
            required
            placeholder="alex@astroguard.space"
            className="w-full rounded-xl border border-white/10 bg-[#020817]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Subject</label>
        <input
          type="text"
          required
          placeholder="Mission health monitoring inquiry"
          className="w-full rounded-xl border border-white/10 bg-[#020817]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">Message</label>
        <textarea
          required
          rows={5}
          placeholder="Tell us about your mission or question..."
          className="w-full resize-none rounded-xl border border-white/10 bg-[#020817]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-cyan-bright px-6 py-3 text-sm font-bold text-[#020817] shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-[0.99]"
      >
        <Send className="h-4 w-4" />
        Send Message
      </button>

      <p className="text-center text-[11px] text-slate-500">
        We&apos;ll get back to you as soon as possible.
      </p>
    </form>
  );
}