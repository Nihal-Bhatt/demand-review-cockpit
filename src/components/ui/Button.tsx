import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "secondary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary:
      "bg-accent-royal text-surface-on hover:bg-accent-royal-dark shadow-sm disabled:opacity-40 disabled:hover:bg-accent-royal",
    secondary:
      "bg-surface-panel text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised shadow-sm disabled:opacity-40",
    ghost: "bg-transparent text-surface-dim hover:bg-surface-raised disabled:opacity-40",
    danger:
      "bg-accent-orange text-surface-on hover:bg-accent-orange-dark shadow-sm disabled:opacity-40 disabled:hover:bg-accent-orange",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
