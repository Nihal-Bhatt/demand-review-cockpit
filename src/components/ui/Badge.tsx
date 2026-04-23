import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "brand" | "good" | "warn" | "bad";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-surface-charcoal text-surface-subtle ring-surface-border",
    brand: "bg-accent-ice/20 text-accent-ice-tint ring-accent-ice/35",
    good: "bg-accent-teal/20 text-accent-teal-light ring-accent-teal/40",
    warn: "bg-accent-gold/20 text-accent-gold-tint ring-accent-gold/40",
    bad: "bg-accent-orange/20 text-accent-orange-tint ring-accent-orange/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
