import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  onClick,
  tone = "neutral",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const toneRing =
    tone === "good"
      ? "hover:ring-accent-teal/50"
      : tone === "warn"
        ? "hover:ring-accent-gold/50"
        : tone === "bad"
          ? "hover:ring-accent-orange/50"
          : "hover:ring-accent-royal/40";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl bg-surface-panel p-4 text-left shadow-soft ring-1 ring-surface-border transition",
        "hover:shadow-lift hover:ring-2",
        onClick ? "cursor-pointer" : "cursor-default",
        toneRing,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-surface-soft">{title}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-surface-on">{value}</div>
          {subtitle ? <div className="mt-1 text-xs text-surface-soft">{subtitle}</div> : null}
        </div>
        {Icon ? (
          <div className="rounded-lg bg-surface-raised p-2 text-accent-ice-soft ring-1 ring-surface-border group-hover:bg-surface-charcoal">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </button>
  );
}
