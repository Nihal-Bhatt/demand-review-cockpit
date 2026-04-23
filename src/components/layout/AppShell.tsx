import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BarChart3, ClipboardList, Factory, LineChart, PackageSearch, ShieldAlert, Sparkles, Upload } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { DrilldownDrawer } from "../DrilldownDrawer";
import { Button } from "../ui/Button";
import { labels } from "../../config/labels";
import { captureElementToPdf, captureElementToPng } from "../../lib/export";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/executive", label: "Executive Summary", icon: Sparkles },
  { to: "/outlook", label: "Demand Outlook", icon: LineChart },
  { to: "/forecast", label: "Forecast Performance", icon: BarChart3 },
  { to: "/exceptions", label: "Demand Exceptions", icon: ShieldAlert },
  { to: "/capacity", label: "Capacity / Constrained", icon: Factory },
  { to: "/npd", label: "NPD Readiness", icon: PackageSearch },
  { to: "/issues", label: "Upside / Risks / Strategic", icon: ShieldAlert },
  { to: "/actions", label: "Action Tracker", icon: ClipboardList },
  { to: "/data", label: "Data Admin", icon: Upload },
] as const;

export function AppShell() {
  const { exportPaneRef, drilldownRow, closeDrilldown, applyDrilldownFilters } = useDashboard();
  const location = useLocation();

  const exportShot = async (kind: "png" | "pdf") => {
    const el = exportPaneRef.current;
    if (!el) return;
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    const name = `demand_review_${location.pathname.replaceAll("/", "_")}_${stamp}`;
    if (kind === "png") await captureElementToPng(el, `${name}.png`);
    else await captureElementToPdf(el, `${name}.pdf`);
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-surface-app to-surface-charcoal">
      <header className="sticky top-0 z-30 border-b border-surface-border bg-surface-panel/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-start justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-accent-ice-soft">{labels.appSubtitle}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-surface-on">{labels.appTitle}</div>
            <div className="mt-1 max-w-2xl text-sm text-surface-soft">
              Purpose-built cockpit for monthly Demand Review, Supply Review handoff, and S&OP decisions.
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Button variant="secondary" onClick={() => exportShot("png")}>
              Export PNG
            </Button>
            <Button variant="secondary" onClick={() => exportShot("pdf")}>
              Export PDF
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-[1600px] px-6 pb-3">
          <nav className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                    isActive
                      ? "bg-accent-royal text-surface-on ring-accent-royal-soft"
                      : "bg-surface-panel text-surface-dim ring-surface-border hover:bg-surface-raised",
                  )
                }
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <GlobalFilterBar />

      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div ref={exportPaneRef} className="rounded-2xl">
          <Outlet />
        </div>
      </main>

      <DrilldownDrawer
        open={!!drilldownRow}
        onClose={closeDrilldown}
        title={drilldownRow ? `${drilldownRow.customer} · ${drilldownRow.month}` : ""}
        footer={
          drilldownRow ? (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  applyDrilldownFilters(drilldownRow);
                  closeDrilldown();
                }}
              >
                Apply filters
              </Button>
              <Button variant="primary" onClick={closeDrilldown}>
                Close
              </Button>
            </div>
          ) : null
        }
      >
        {drilldownRow ? (
          <div className="space-y-3 text-sm text-surface-dim">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-raised p-3 ring-1 ring-surface-border">
                <div className="text-xs font-semibold text-surface-soft">Current forecast</div>
                <div className="mt-1 text-lg font-semibold text-surface-on">
                  {Math.round(drilldownRow.currentForecastValue).toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg bg-surface-raised p-3 ring-1 ring-surface-border">
                <div className="text-xs font-semibold text-surface-soft">Budget</div>
                <div className="mt-1 text-lg font-semibold text-surface-on">
                  {Math.round(drilldownRow.budgetValue).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-xs text-surface-soft">
              <div>
                <span className="font-semibold text-surface-dim">Driver:</span> {drilldownRow.driver ?? "—"}
              </div>
              <div className="mt-2">
                <span className="font-semibold text-surface-dim">Confidence:</span> {drilldownRow.confidence}
              </div>
              <div className="mt-2">
                <span className="font-semibold text-surface-dim">Owner:</span> {drilldownRow.owner ?? "—"}
              </div>
            </div>
          </div>
        ) : null}
      </DrilldownDrawer>
    </div>
  );
}
