import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <section
      className={cn(
        "glass-card rounded-2xl transition-all duration-300 hover:shadow-[0_14px_50px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {(title || action || Icon) && (
        <header className="flex items-start justify-between gap-3 border-b border-sky-400/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/15 bg-sky-500/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div>
              {title && (
                <h2 className="text-sm font-semibold text-white">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>
          {action}
        </header>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}