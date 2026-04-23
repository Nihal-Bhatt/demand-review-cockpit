import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/DataTable";
import { WaterfallChart } from "../components/charts/WaterfallChart";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { Button } from "../components/ui/Button";
import { confidenceBuckets, rowBudget, rowPrior, rowValue, simpleOutlookBridge, sum } from "../lib/businessLogic";
import type { DemandOutlookRow } from "../types/domain";
import { exportObjectsToCsv, exportObjectsToXlsx } from "../lib/export";
import { formatCompactNumber, formatPct } from "../lib/format";
import { labels } from "../config/labels";

export function DemandOutlookView() {
  const { demandFiltered, filters, openDrilldown } = useDashboard();

  const wf = useMemo(() => simpleOutlookBridge(demandFiltered, filters.valueMode), [demandFiltered, filters.valueMode]);
  const buckets = useMemo(() => confidenceBuckets(demandFiltered, filters.valueMode), [demandFiltered, filters.valueMode]);

  const totals = useMemo(() => {
    const budget = sum(demandFiltered.map((r) => rowBudget(r, filters.valueMode)));
    const prior = sum(demandFiltered.map((r) => rowPrior(r, filters.valueMode)));
    const current = sum(demandFiltered.map((r) => rowValue(r, filters.valueMode)));
    return { budget, prior, current, varVsBudget: budget ? current / budget - 1 : null, varVsPrior: prior ? current / prior - 1 : null };
  }, [demandFiltered, filters.valueMode]);

  const columns = useMemo<ColumnDef<DemandOutlookRow, any>[]>(
    () => [
      { header: "Customer", accessorKey: "customer" },
      { header: "Market", accessorKey: "market" },
      {
        header: "Budget",
        accessorFn: (r) => rowBudget(r, filters.valueMode),
        cell: (ctx) => formatCompactNumber(Number(ctx.getValue())),
      },
      {
        header: "Prior FCST",
        accessorFn: (r) => rowPrior(r, filters.valueMode),
        cell: (ctx) => formatCompactNumber(Number(ctx.getValue())),
      },
      {
        header: "Current FCST",
        accessorFn: (r) => rowValue(r, filters.valueMode),
        cell: (ctx) => formatCompactNumber(Number(ctx.getValue())),
      },
      {
        header: "Variance vs budget",
        accessorFn: (r) => {
          const b = rowBudget(r, filters.valueMode);
          const c = rowValue(r, filters.valueMode);
          return b ? c / b - 1 : 0;
        },
        cell: (ctx) => formatPct(Number(ctx.getValue())),
      },
      { header: "Driver", accessorKey: "driver" },
      {
        header: "Confidence",
        accessorKey: "confidence",
        cell: (ctx) => <ConfidenceBadge value={ctx.row.original.confidence} />,
      },
      { header: "Owner", accessorKey: "owner" },
      { header: "Reconfirm", accessorKey: "reconfirmDate" },
      { header: "Notes", accessorKey: "notes" },
    ],
    [filters.valueMode],
  );

  const exportRows = () => {
    const rows = demandFiltered.map((r) => ({
      month: r.month,
      customer: r.customer,
      market: r.market,
      budget: rowBudget(r, filters.valueMode),
      prior: rowPrior(r, filters.valueMode),
      current: rowValue(r, filters.valueMode),
      varianceVsBudget: rowBudget(r, filters.valueMode)
        ? rowValue(r, filters.valueMode) / rowBudget(r, filters.valueMode) - 1
        : "",
      driver: r.driver ?? "",
      confidence: r.confidence,
      owner: r.owner ?? "",
      reconfirmDate: r.reconfirmDate ?? "",
      notes: r.notes ?? "",
    }));
    exportObjectsToCsv(`demand_outlook_export.csv`, rows);
  };

  const exportXlsx = () => {
    const rows = demandFiltered.map((r) => ({
      month: r.month,
      customer: r.customer,
      market: r.market,
      budget: rowBudget(r, filters.valueMode),
      prior: rowPrior(r, filters.valueMode),
      current: rowValue(r, filters.valueMode),
      varianceVsBudget: rowBudget(r, filters.valueMode)
        ? rowValue(r, filters.valueMode) / rowBudget(r, filters.valueMode) - 1
        : "",
      driver: r.driver ?? "",
      confidence: r.confidence,
      owner: r.owner ?? "",
      reconfirmDate: r.reconfirmDate ?? "",
      notes: r.notes ?? "",
    }));
    exportObjectsToXlsx(`demand_outlook_export.xlsx`, "DemandOutlook", rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">Demand outlook</h1>
          <p className="mt-1 text-sm text-surface-soft">
            Compare outlook vs budget and prior cycle. Global filters and{" "}
            <span className="font-semibold">{filters.valueMode === "value" ? "value" : "volume"}</span> mode apply here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportRows} disabled={!demandFiltered.length}>
            Download CSV
          </Button>
          <Button variant="secondary" onClick={exportXlsx} disabled={!demandFiltered.length}>
            Download Excel
          </Button>
        </div>
      </div>

      {demandFiltered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Actual QTD / YTD (proxy)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-surface-dim">
            <div className="text-2xl font-semibold text-surface-on">{formatCompactNumber(totals.current)}</div>
            <div className="mt-1 text-xs text-surface-soft">Uses current forecast where actuals are missing.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Full-year outlook vs budget</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-surface-dim">
            <div className="text-2xl font-semibold text-surface-on">
              {totals.varVsBudget === null ? "—" : formatPct(totals.varVsBudget)}
            </div>
            <div className="mt-1 text-xs text-surface-soft">Filtered dataset only.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prior vs current cycle</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-surface-dim">
            <div className="text-2xl font-semibold text-surface-on">
              {totals.varVsPrior === null ? "—" : formatPct(totals.varVsPrior)}
            </div>
            <div className="mt-1 text-xs text-surface-soft">Movement within filtered slice.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Confidence mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-surface-dim">
            {buckets.map((b) => (
              <div key={b.confidence} className="flex items-center justify-between gap-2">
                <span className="font-medium">{b.confidence}</span>
                <span>{formatCompactNumber(b.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outlook bridge</CardTitle>
        </CardHeader>
        <CardContent>
          <WaterfallChart data={wf} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outlook detail</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={demandFiltered}
            columns={columns}
            onRowClick={(r) => openDrilldown(r)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
