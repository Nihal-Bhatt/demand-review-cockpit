import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-surface-border bg-surface-charcoal px-3 py-2 text-sm text-surface-hint shadow-sm outline-none ring-0 transition focus:border-accent-royal-soft focus:ring-2 focus:ring-accent-royal/30",
        className,
      )}
      {...props}
    />
  );
}
