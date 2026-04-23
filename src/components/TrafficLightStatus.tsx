import type { Traffic } from "../types/domain";
import { cn } from "../lib/cn";

export function TrafficLightStatus({ value }: { value: Traffic }) {
  const map: Record<Traffic, { label: string; className: string }> = {
    green: { label: "Green", className: "bg-accent-teal" },
    amber: { label: "Amber", className: "bg-accent-gold" },
    red: { label: "Red", className: "bg-accent-orange" },
    unknown: { label: "Unknown", className: "bg-surface-muted" },
  };
  const m = map[value] ?? map.unknown;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium text-surface-dim">
      <span className={cn("h-2.5 w-2.5 rounded-full", m.className)} />
      {m.label}
    </span>
  );
}
