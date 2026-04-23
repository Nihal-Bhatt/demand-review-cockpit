import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/DataTable";
import { Button } from "../components/ui/Button";
import { utilizationTone } from "../config/thresholds";
import type { CapacityRow } from "../types/domain";
import { exportObjectsToCsv, exportObjectsToXlsx } from "../lib/export";
import { formatPct } from "../lib/format";
import { labels } from "../config/labels";
import { chartColors } from "../theme/chartColors";

const chartTick = { fontSize: 11, fill: chartColors.tick };

export function CapacityView() {
  const { capacityFiltered } = useDashboard();

  const monthly = useMemo(() => {
    const m = new Map<string, { month: string; demand: number; feasible: number }>();
    capacityFiltered.forEach((r) => {
      const cur = m.get(r.month) ?? { month: r.month, demand: 0, feasible: 0 };
      cur.demand += r.demand;
      cur.feasible += r.effectiveCapacity;
      m.set(r.month, cur);
    });
    return [...m.values()].sort((a, b) => a.month.localeCompare(b.month));
  }, [capacityFiltered]);

  const columns = useMemo<ColumnDef<CapacityRow, any>[]>(
    () => [
      { header: "Format", accessorKey: "format" },
      { header: "Plant", accessorKey: "plant" },
      { header: "Month", accessorKey: "month" },
      { header: "Demand", accessorKey: "demand" },
      { header: "Rated cap.", accessorKey: "ratedCapacity" },
      { header: "Effective cap.", accessorKey: "effectiveCapacity" },
      {
        header: "Utilization",
        accessorKey: "utilization",
        cell: (c) => {
          const u = Number(c.getValue());
          const tone = utilizationTone(u);
          const cls =
            tone === "red"
              ? "text-accent-orange"
              : tone === "amber"
                ? "text-accent-gold"
                : tone === "blue"
                  ? "text-accent-ice-soft"
                  : "text-accent-teal-light";
          return <span className={cls}>{formatPct(u)}</span>;
        },
      },
      {
        header: "Gap / surplus",
        accessorFn: (r) => r.effectiveCapacity - r.demand,
      },
      { header: "Affected customers", accessorKey: "affectedCustomers" },
      { header: "Revenue at risk", accessorKey: "revenueAtRisk" },
      { header: "Volume at risk", accessorKey: "volumeAtRisk" },
      { header: "Mitigation", accessorKey: "mitigation" },
      { header: "Owner", accessorKey: "owner" },
    ],
    [],
  );

  const handoff = () => {
    const rows = capacityFiltered
      .filter((c) => c.utilization > 1)
      .map((c) => ({
        month: c.month,
        plant: c.plant,
        format: c.format,
        utilization: c.utilization,
        revenueAtRisk: c.revenueAtRisk ?? 0,
        mitigation: c.mitigation ?? "",
        affectedCustomers: c.affectedCustomers ?? "",
      }));
    exportObjectsToXlsx(`supply_review_handoff_capacity.xlsx`, "Handoff", rows);
  };

  const exportCsv = () => {
    exportObjectsToCsv(
      `capacity_view.csv`,
      capacityFiltered.map((c) => ({ ...c })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">Capacity / constrained demand</h1>
          <p className="mt-1 text-sm text-surface-soft">
            Translate demand into feasible supply implications for Supply Review. Utilization tone uses `thresholds.json`.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportCsv} disabled={!capacityFiltered.length}>
            Download CSV
          </Button>
          <Button variant="primary" onClick={handoff} disabled={!capacityFiltered.length}>
            Handoff to Supply Review (Excel)
          </Button>
        </div>
      </div>

      {capacityFiltered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Demand vs feasible capacity by month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="month" tick={chartTick} axisLine={false} tickLine={false} />
                <YAxis tick={chartTick} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    color: chartColors.tooltipLabel,
                  }}
                />
                <Legend wrapperStyle={{ color: chartColors.tick, fontSize: 12 }} />
                <Bar dataKey="demand" name="Demand" fill={chartColors.capacityDemand} radius={[6, 6, 0, 0]} />
                <Bar dataKey="feasible" name="Effective capacity" fill={chartColors.capacityFeasible} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Constrained demand table</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={capacityFiltered} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
