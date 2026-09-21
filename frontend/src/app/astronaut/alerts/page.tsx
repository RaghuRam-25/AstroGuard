"use client";

import { useEffect, useMemo, useState } from "react";
import { Wrench, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { astronaut } from "@/data/mockData";
import {
  alertFilters,
  healthAlerts,
  type HealthAlert,
} from "@/data/mockData";
import { getMyAlerts, markAlertRead } from "@/lib/api";
import AlertListItem from "@/components/alerts/AlertListItem";
import AlertDetailsPanel from "@/components/alerts/AlertDetailsPanel";
import { Card } from "@/components/shared/Card";

type Filter = (typeof alertFilters)[number];

export default function AstronautAlertsPage() {
  const [alerts, setAlerts] = useState<HealthAlert[]>(healthAlerts);
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState<number | null>(healthAlerts[0]?.id ?? null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getMyAlerts(astronaut.id);
        if (active && res.success && res.data) {
          const payload = res.data as { alerts?: HealthAlert[] } | HealthAlert[];
          const list = Array.isArray(payload) ? payload : payload.alerts;
          if (list && list.length > 0) {
            setAlerts(list);
            setSelectedId(list[0].id);
          }
        }
      } catch {
        // mock fallback already in place
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: alerts.length };
    for (const a of alerts) result[a.severity] = (result[a.severity] ?? 0) + 1;
    return result;
  }, [alerts]);

  const filtered = useMemo(
    () => (filter === "All" ? alerts : alerts.filter((a) => a.severity === filter)),
    [alerts, filter]
  );

  const selected =
    alerts.find((a) => a.id === selectedId) ?? filtered[0] ?? alerts[0] ?? null;

  const handleFilter = (next: Filter) => {
    setFilter(next);
    const first = next === "All" ? alerts[0] : alerts.find((a) => a.severity === next);
    setSelectedId(first?.id ?? null);
  };

  const handleSelect = (alert: HealthAlert) => {
    setSelectedId(alert.id);
    void markAlertRead(alert.id); // fire-and-forget; mocked/fallible
  };

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <SpaceBackdrop />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Alert list */}
        <div className="flex flex-col lg:col-span-7">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-400/10 bg-card-secondary/40 p-2">
            {alertFilters.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFilter(f)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                    active
                      ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_14px_rgba(56,189,248,0.2)]"
                      : "border-sky-400/10 bg-background/40 text-slate-400 hover:border-primary/25 hover:text-white"
                  )}
                >
                  {f}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      active ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-500"
                    )}
                  >
                    {counts[`${f}`] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List header */}
          <div className="flex items-center justify-between gap-2 px-1">
            <h2 className="flex items-center gap-2 text-sm font-bold text-white">
              <BellRing className="h-4 w-4 text-primary" />
              Alert Feed
            </h2>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
              <Wrench className="h-3 w-3" />
              API-ready · {filtered.length} alert{filtered.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* List */}
          <div className="space-y-2.5">
            {filtered.map((alert) => (
              <AlertListItem
                key={alert.id}
                alert={alert}
                selected={selected?.id === alert.id}
                onClick={() => handleSelect(alert)}
              />
            ))}
            {filtered.length === 0 && (
              <Card>
                <p className="py-6 text-center text-sm text-slate-400">
                  No {filter.toLowerCase() === "all" ? "" : `${filter} `}alerts right now.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Selected alert details */}
        <div className="flex flex-col lg:self-start lg:sticky lg:top-[88px] lg:col-span-5">
          {selected ? (
            <AlertDetailsPanel alert={selected} key={selected.id} />
          ) : (
            <Card>
              <p className="py-10 text-center text-sm text-slate-500">
                Select an alert to view its details.
              </p>
            </Card>
          )}
        </div>
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