import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Gauge, Target, TrendingUp, Users } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { KPICard } from "../components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { WaterfallChart } from "../components/charts/WaterfallChart";
import { HandoffSummaryCard } from "../components/HandoffSummaryCard";
import {
  decisionsRequired,
  escalationsHandoff,
  simpleOutlookBridge,
  topConstraints,
  topCustomerChanges,
  topRisks,
} from "../lib/businessLogic";
import { formatCompactNumber, formatPct } from "../lib/format";
import { labels } from "../config/labels";

export function ExecutiveSummaryView() {
  const navigate = useNavigate();
  const { kpis, demandFiltered, datasets, filters, applyDrilldownFilters } = useDashboard();

  const wf = useMemo(() => simpleOutlookBridge(demandFiltered, filters.valueMode), [demandFiltered, filters.valueMode]);
  const changes = useMemo(() => topCustomerChanges(demandFiltered, filters.valueMode), [demandFiltered, filters.valueMode]);
  const risks = useMemo(() => topRisks(datasets.issues), [datasets.issues]);
  const constraints = useMemo(() => topConstraints(datasets.capacity), [datasets.capacity]);
  const decisions = useMemo(
    () => decisionsRequired(datasets.demandExceptions, datasets.issues),
    [datasets.demandExceptions, datasets.issues],
  );
  const handoff = useMemo(() => {
    const esc = escalationsHandoff(datasets.issues, datasets.actions);
    return esc.map((e) => `${e.title} → ${e.route} (${e.owner})`);
  }, [datasets.issues, datasets.actions]);

  const empty = demandFiltered.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-surface-on">Executive summary</h1>
        <p className="mt-1 text-sm text-surface-soft">One-page monthly Demand Review health and priorities.</p>
      </div>

      {empty ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="FY outlook vs budget"
          value={kpis.fyOutlookVsBudget === null ? "—" : formatPct(kpis.fyOutlookVsBudget)}
          subtitle="Current forecast vs budget"
          icon={TrendingUp}
          onClick={() => navigate("/outlook")}
          tone={kpis.fyOutlookVsBudget !== null && kpis.fyOutlookVsBudget < 0 ? "warn" : "good"}
        />
        <KPICard
          title="YTD actual vs budget"
          value={kpis.ytdActualVsBudget === null ? "—" : formatPct(kpis.ytdActualVsBudget)}
          subtitle="Mock YTD window (Jan–Apr)"
          icon={Target}
          onClick={() => navigate("/outlook")}
        />
        <KPICard
          title="Forecast accuracy (FCA)"
          value={kpis.forecastAccuracy === null ? "—" : formatPct(kpis.forecastAccuracy)}
          subtitle="Average across loaded cycles"
          icon={Gauge}
          onClick={() => navigate("/forecast")}
        />
        <KPICard
          title="Forecast bias"
          value={kpis.forecastBias === null ? "—" : formatPct(kpis.forecastBias)}
          subtitle="Positive = over-forecast"
          icon={Gauge}
          onClick={() => navigate("/forecast")}
        />
        <KPICard
          title="Revenue / volume at risk"
          value={`${formatCompactNumber(kpis.revenueAtRisk)} / ${formatCompactNumber(kpis.volumeAtRisk)}`}
          subtitle="Over-capacity rows"
          icon={AlertTriangle}
          onClick={() => navigate("/capacity")}
          tone={kpis.revenueAtRisk > 0 ? "bad" : "good"}
        />
        <KPICard
          title="Red exceptions"
          value={String(kpis.redExceptions)}
          subtitle="High severity exception queue"
          icon={AlertTriangle}
          onClick={() => navigate("/exceptions")}
          tone={kpis.redExceptions > 0 ? "bad" : "good"}
        />
        <KPICard
          title="Constrained formats / sites"
          value={String(kpis.constrainedSites)}
          subtitle="Distinct plant/format over 100% util"
          icon={Users}
          onClick={() => navigate("/capacity")}
        />
        <KPICard
          title="Overdue actions"
          value={String(kpis.overdueActions)}
          subtitle="Open actions past due date"
          icon={AlertTriangle}
          onClick={() => navigate("/actions")}
          tone={kpis.overdueActions > 0 ? "bad" : "good"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Outlook bridge (filtered)</CardTitle>
          </CardHeader>
          <CardContent>
            <WaterfallChart data={wf} />
            <div className="mt-3 text-xs text-surface-soft">
              Bridge bars summarize movement from prior forecast to current forecast for the active filter set.
            </div>
          </CardContent>
        </Card>

        <HandoffSummaryCard bullets={handoff} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Top customer / market movement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {changes.map((c) => (
              <button
                key={c.customer}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised"
                onClick={() => {
                  const row = demandFiltered.find((d) => d.customer === c.customer);
                  if (row) applyDrilldownFilters(row);
                  navigate("/outlook");
                }}
              >
                <span className="font-medium">{c.customer}</span>
                <span className="text-xs text-surface-soft">{formatCompactNumber(c.movement)}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top demand risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {risks.map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised"
                onClick={() => navigate("/issues")}
              >
                <div className="font-medium">{r.title}</div>
                <div className="mt-1 text-xs text-surface-soft">{r.owner ?? "Unassigned"}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top supply constraints impacting demand</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {constraints.map((c, idx) => (
              <button
                key={`${c.plant}-${c.format}-${idx}`}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised"
                onClick={() => navigate("/capacity")}
              >
                <span className="font-medium">
                  {c.plant} · {c.format}
                </span>
                <span className="text-xs text-surface-soft">{formatPct(c.utilization)}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decisions required this cycle</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {decisions.map((d) => (
            <div key={d.id} className="rounded-lg bg-surface-raised p-4 ring-1 ring-surface-border">
              <div className="text-sm font-semibold text-surface-on">{d.title}</div>
              <div className="mt-2 text-xs text-surface-subtle">{d.detail}</div>
              <div className="mt-2 text-xs font-medium text-surface-soft">Owner: {d.owner}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
