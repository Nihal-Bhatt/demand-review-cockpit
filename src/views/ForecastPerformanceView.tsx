import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/DataTable";
import { HeatmapTable } from "../components/HeatmapTable";
import { Badge } from "../components/ui/Badge";
import { thresholds } from "../config/thresholds";
import { paretoShare } from "../lib/businessLogic";
import type { ForecastPerformanceRow } from "../types/domain";
import { exportObjectsToCsv } from "../lib/export";
import { formatPct } from "../lib/format";
import { labels } from "../config/labels";
import { chartColors } from "../theme/chartColors";

const chartTick = { fontSize: 11, fill: chartColors.tick };

function isRedException(r: ForecastPerformanceRow) {
  return r.fca < thresholds.forecast.fcaPoor || Math.abs(r.bias) > thresholds.forecast.biasMaterial;
}

export function ForecastPerformanceView() {
  const { forecastFiltered } = useDashboard();

  const trend = useMemo(() => {
    const by = new Map<string, { cycle: string; fca: number; bias: number; n: number }>();
    forecastFiltered.forEach((r) => {
      const cur = by.get(r.forecastCycle) ?? { cycle: r.forecastCycle, fca: 0, bias: 0, n: 0 };
      cur.fca += r.fca;
      cur.bias += r.bias;
      cur.n += 1;
      by.set(r.forecastCycle, cur);
    });
    return [...by.values()]
      .map((v) => ({ cycle: v.cycle, fca: v.n ? v.fca / v.n : 0, bias: v.n ? v.bias / v.n : 0 }))
      .sort((a, b) => a.cycle.localeCompare(b.cycle));
  }, [forecastFiltered]);

  const pareto = useMemo(
    () => paretoShare(forecastFiltered, (r) => isRedException(r)),
    [forecastFiltered],
  );

  const byCustomer = useMemo(() => {
    const m = new Map<string, { bias: number; n: number; fca: number; vol: number }>();
    forecastFiltered.forEach((r) => {
      const cur = m.get(r.customer) ?? { bias: 0, n: 0, fca: 0, vol: 0 };
      cur.bias += r.bias;
      cur.fca += r.fca;
      cur.vol += r.volatility;
      cur.n += 1;
      m.set(r.customer, cur);
    });
    const rows = [...m.entries()].map(([customer, v]) => ({
      customer,
      bias: v.n ? v.bias / v.n : 0,
      fca: v.n ? v.fca / v.n : 0,
      volatility: v.n ? v.vol / v.n : 0,
    }));
    const under = rows.slice().sort((a, b) => a.bias - b.bias).slice(0, 5);
    const over = rows.slice().sort((a, b) => b.bias - a.bias).slice(0, 5);
    return { under, over };
  }, [forecastFiltered]);

  const movement = useMemo(() => {
    const m = new Map<string, number>();
    forecastFiltered.forEach((r) => {
      m.set(r.skuGroup, (m.get(r.skuGroup) ?? 0) + Math.abs(r.forecast - r.actual));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [forecastFiltered]);

  const heatmapRows = useMemo(
    () =>
      forecastFiltered.map((r) => ({
        customer: r.customer,
        month: r.month,
        fca: r.fca,
      })),
    [forecastFiltered],
  );

  const scatterVolBias = useMemo(
    () =>
      forecastFiltered.map((r) => ({
        x: r.volatility,
        y: r.bias,
        name: r.customer,
      })),
    [forecastFiltered],
  );

  const scatterVolFca = useMemo(
    () =>
      forecastFiltered.map((r) => ({
        x: r.forecast,
        y: r.fca,
        name: r.customer,
      })),
    [forecastFiltered],
  );

  const redRows = useMemo(() => forecastFiltered.filter(isRedException), [forecastFiltered]);

  const columns = useMemo<ColumnDef<ForecastPerformanceRow, any>[]>(
    () => [
      { header: "Customer / SKU group", accessorFn: (r) => `${r.customer} · ${r.skuGroup}` },
      { header: "Forecast", accessorKey: "forecast" },
      { header: "Actual", accessorKey: "actual" },
      { header: "FCA", accessorKey: "fca", cell: (c) => formatPct(Number(c.getValue())) },
      { header: "Bias", accessorKey: "bias", cell: (c) => formatPct(Number(c.getValue())) },
      { header: "Volatility", accessorKey: "volatility", cell: (c) => formatPct(Number(c.getValue())) },
      {
        header: "Recommendation",
        accessorFn: (r) =>
          r.fca < thresholds.forecast.fcaPoor
            ? "validate"
            : Math.abs(r.bias) > thresholds.forecast.biasMaterial
              ? r.bias > 0
                ? "shape down"
                : "escalate to supply"
              : "hold",
      },
    ],
    [],
  );

  const exportRed = () => {
    exportObjectsToCsv(
      `forecast_red_exceptions.csv`,
      redRows.map((r) => ({
        customer: r.customer,
        skuGroup: r.skuGroup,
        month: r.month,
        forecast: r.forecast,
        actual: r.actual,
        fca: r.fca,
        bias: r.bias,
        volatility: r.volatility,
        recommendation: isRedException(r) ? "review" : "",
      })),
    );
  };

  const segmentMix = useMemo(() => {
    const m = new Map<string, number>();
    forecastFiltered.forEach((r) => m.set(r.segment, (m.get(r.segment) ?? 0) + r.forecast));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [forecastFiltered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">Forecast performance</h1>
          <p className="mt-1 text-sm text-surface-soft">
            Threshold-driven exceptioning using `thresholds.json` (FCA & bias rules).
          </p>
        </div>
        <button
          type="button"
          className="rounded-md bg-surface-panel px-3 py-2 text-sm font-semibold text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised disabled:opacity-40"
          onClick={exportRed}
          disabled={!redRows.length}
        >
          Export exception list
        </button>
      </div>

      {forecastFiltered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>FCA & bias trend by forecast cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis dataKey="cycle" tick={chartTick} axisLine={false} tickLine={false} />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(v) => formatPct(Number(v))}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => formatPct(v)}
                    contentStyle={{
                      background: chartColors.tooltipBg,
                      borderColor: chartColors.tooltipBorder,
                      color: chartColors.tooltipLabel,
                    }}
                  />
                  <Line type="monotone" dataKey="fca" stroke={chartColors.teal} strokeWidth={2} dot={false} name="FCA" />
                  <Line type="monotone" dataKey="bias" stroke={chartColors.orange} strokeWidth={2} dot={false} name="Bias" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pareto lens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-surface-dim">
            <div className="text-xs text-surface-soft">
              ~80% of forecast volume captured in top {pareto.skuCount80} SKU groups (of {pareto.totalSkus}).
            </div>
            <div className="rounded-lg bg-surface-raised p-3 ring-1 ring-surface-border">
              <div className="text-xs font-semibold text-surface-soft">Red exceptions outside pareto tail</div>
              <div className="mt-2 text-2xl font-semibold text-surface-on">{pareto.redOutsidePareto}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Segment mix (forecast volume)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {segmentMix.map(([seg, v]) => (
              <Badge key={seg} tone="neutral">
                {seg}: {Math.round(v).toLocaleString()}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top MoM movement (SKU groups)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {movement.map(([sku, v]) => (
              <div key={sku} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 ring-1 ring-surface-border">
                <div className="font-medium text-surface-on">{sku}</div>
                <div className="text-xs text-surface-soft">{Math.round(v).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top under-forecast customers (bias)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {byCustomer.under.map((r) => (
              <div key={r.customer} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 ring-1 ring-surface-border">
                <div className="font-medium">{r.customer}</div>
                <div className="text-xs text-surface-soft">{formatPct(r.bias)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top over-forecast customers (bias)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {byCustomer.over.map((r) => (
              <div key={r.customer} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 ring-1 ring-surface-border">
                <div className="font-medium">{r.customer}</div>
                <div className="text-xs text-surface-soft">{formatPct(r.bias)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Heatmap · FCA by customer × month</CardTitle>
        </CardHeader>
        <CardContent>
          <HeatmapTable rows={heatmapRows} rowKey="customer" colKey="month" value="fca" format={(n) => formatPct(n)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scatter · volume vs FCA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis type="number" dataKey="x" name="Forecast" tick={chartTick} axisLine={false} tickLine={false} />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="FCA"
                    tickFormatter={(v) => formatPct(Number(v))}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3", stroke: chartColors.ice }}
                    contentStyle={{
                      background: chartColors.tooltipBg,
                      borderColor: chartColors.tooltipBorder,
                      color: chartColors.tooltipLabel,
                    }}
                  />
                  <Scatter data={scatterVolFca} fill={chartColors.royal} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scatter · volatility vs bias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Volatility"
                    tickFormatter={(v) => formatPct(Number(v))}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Bias"
                    tickFormatter={(v) => formatPct(Number(v))}
                    tick={chartTick}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3", stroke: chartColors.gold }}
                    contentStyle={{
                      background: chartColors.tooltipBg,
                      borderColor: chartColors.tooltipBorder,
                      color: chartColors.tooltipLabel,
                    }}
                  />
                  <Scatter data={scatterVolBias} fill={chartColors.ice} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Red exception table</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={redRows} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
