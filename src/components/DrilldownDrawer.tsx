import { X } from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/cn";

export function DrilldownDrawer({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-40 transition",
        open ? "pointer-events-auto" : "opacity-0",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn("absolute inset-0 bg-black/55 transition", open ? "opacity-100" : "opacity-0")}
        onClick={onClose}
        aria-label="Close drawer overlay"
      />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-xl bg-surface-panel shadow-lift ring-1 ring-surface-border transition",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border/80 px-5 py-4">
          <div>
            <div className="text-xs font-medium text-surface-soft">Drilldown</div>
            <div className="mt-1 text-base font-semibold text-surface-on">{title}</div>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="h-[calc(100%-64px)] overflow-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-surface-border/80 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
