import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/DataTable";
import { TrafficLightStatus } from "../components/TrafficLightStatus";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { Badge } from "../components/ui/Badge";
import type { NpdReadinessRow, Traffic } from "../types/domain";
import { thresholds } from "../config/thresholds";
import { labels } from "../config/labels";

function isRedProject(r: NpdReadinessRow) {
  const signals: Traffic[] = [r.capacityReadiness, r.rmPackagingReadiness, r.qaArtworkReadiness, r.commercialReadiness];
  return signals.filter((s) => s === "red").length >= 1 || r.confidence === "Pipeline" || r.confidence === "Stretch";
}

export function NpdReadinessView() {
  const { datasets } = useDashboard();
  const [onlyRisk, setOnlyRisk] = useState(false);

  const rows = useMemo(() => {
    const r = datasets.npdReadiness;
    return onlyRisk ? r.filter((x) => isRedProject(x) || ["amber", "red"].includes(x.capacityReadiness)) : r;
  }, [datasets.npdReadiness, onlyRisk]);

  const summary = useMemo(() => {
    const totalVol = datasets.npdReadiness.reduce((a, b) => a + b.monthlyVolume, 0);
    const coreVol = datasets.demandOutlook.reduce((a, b) => a + b.currentForecastVolume, 0) || 1;
    const ratio = totalVol / coreVol;
    const red = datasets.npdReadiness.filter(isRedProject).length;
    const soon = datasets.npdReadiness.filter((p) => {
      const d = new Date(`${p.firstShipmentMonth}-01`);
      const now = new Date("2026-04-23");
      const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= thresholds.npd.daysNearLaunch;
    }).length;
    return { totalVol, ratio, red, soon };
  }, [datasets.npdReadiness, datasets.demandOutlook]);

  const columns = useMemo<ColumnDef<NpdReadinessRow, any>[]>(
    () => [
      { header: "Customer", accessorKey: "customer" },
      { header: "Project", accessorKey: "project" },
      { header: "First ship month", accessorKey: "firstShipmentMonth" },
      { header: "Monthly volume", accessorKey: "monthlyVolume" },
      { header: "Packaging", accessorKey: "packagingType" },
      { header: "Plant", accessorKey: "plant" },
      {
        header: "Confidence",
        accessorKey: "confidence",
        cell: (c) => <ConfidenceBadge value={c.row.original.confidence} />,
      },
      {
        header: "Capacity",
        accessorKey: "capacityReadiness",
        cell: (c) => <TrafficLightStatus value={c.row.original.capacityReadiness} />,
      },
      {
        header: "RM / pack",
        accessorKey: "rmPackagingReadiness",
        cell: (c) => <TrafficLightStatus value={c.row.original.rmPackagingReadiness} />,
      },
      {
        header: "QA / artwork",
        accessorKey: "qaArtworkReadiness",
        cell: (c) => <TrafficLightStatus value={c.row.original.qaArtworkReadiness} />,
      },
      {
        header: "Commercial",
        accessorKey: "commercialReadiness",
        cell: (c) => <TrafficLightStatus value={c.row.original.commercialReadiness} />,
      },
      { header: "Risk", accessorKey: "riskFlag" },
      { header: "Owner", accessorKey: "owner" },
      { header: "Due", accessorKey: "dueDate" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">NPD readiness</h1>
          <p className="mt-1 text-sm text-surface-soft">Launch readiness before NPD demand is accepted into plan.</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-surface-panel px-4 py-2 text-xs font-semibold text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised"
          onClick={() => setOnlyRisk((v) => !v)}
        >
          {onlyRisk ? "Show all projects" : "Show red / amber only"}
        </button>
      </div>

      {datasets.npdReadiness.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total NPD volume</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-surface-on">{Math.round(summary.totalVol).toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>NPD ratio</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-surface-on">{(summary.ratio * 100).toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Red / high-risk projects</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-surface-on">{summary.red}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>First shipments ≤ {thresholds.npd.daysNearLaunch}d</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-surface-on">{summary.soon}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mini timeline to first shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((p) => {
            const anchor = new Date("2026-01-01").getTime();
            const ship = new Date(`${p.firstShipmentMonth}-01`).getTime();
            const monthsOut = Math.max(0, Math.round((ship - anchor) / (1000 * 3600 * 24 * 30)));
            return (
              <div key={p.project} className="rounded-xl bg-surface-raised p-4 ring-1 ring-surface-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-surface-on">{p.project}</div>
                    <div className="text-xs text-surface-soft">
                      {p.customer} · first ship {p.firstShipmentMonth}
                    </div>
                  </div>
                  <Badge tone={isRedProject(p) ? "bad" : "good"}>{isRedProject(p) ? "Risk" : "On track"}</Badge>
                </div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-surface-panel ring-1 ring-surface-border">
                    <div className="h-2 rounded-full bg-accent-teal" style={{ width: `${Math.min(100, monthsOut * 8)}%` }} />
                  </div>
                  <div className="mt-2 text-xs text-surface-soft">Relative horizon (illustrative)</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readiness register</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={rows} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
