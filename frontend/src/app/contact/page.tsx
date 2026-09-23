import { Code2, Globe, Mail, MessageCircle, Radio } from "lucide-react";
import PublicShell from "../../components/public/PublicShell";
import ContactForm from "../../components/public/ContactForm";
import { contactLinks } from "../../components/public/contactLinks";

const CONTACT_CHANNELS = [
  { label: "GitHub", detail: "View our project", href: contactLinks.github, icon: Code2 },
  { label: "Facebook", detail: "Connect with us", href: contactLinks.facebook, icon: Globe },
  { label: "WhatsApp", detail: "Chat with the team", href: contactLinks.whatsapp, icon: MessageCircle },
  { label: "Email", detail: "Send us an email", href: contactLinks.email, icon: Mail },
  { label: "Website", detail: "Visit our website", href: contactLinks.website, icon: Globe },
];

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="mx-auto flex min-h-[calc(100vh-9.5rem)] max-w-7xl items-center px-5 py-7 sm:px-8">
        <div className="w-full">
          <div className="mb-6 text-center">
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Contact <span className="text-primary">AstroGuard</span></h1>
          </div>
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <ContactForm />
            <div className="glass-card rounded-2xl p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Contact Channels</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">AstroGuard Space Health Intelligence</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {CONTACT_CHANNELS.map(({ label, detail, href, icon: Icon }) => (
                  <a key={label} href={href} target={label === "Email" ? undefined : "_blank"} rel={label === "Email" ? undefined : "noreferrer"} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#020817]/65 p-3 transition hover:border-primary/35 hover:bg-primary/5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                    <span><span className="block text-xs font-bold text-foreground">{label}</span><span className="block text-[10px] text-muted">{detail}</span></span>
                  </a>
                ))}
              </div>
              <p className="mt-5 text-[10px] leading-relaxed text-slate-500">External channels are configuration placeholders. Replace the values in <code className="text-primary/80">src/components/public/contactLinks.ts</code> with official URLs before publishing.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
