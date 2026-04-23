import { thresholds, utilizationTone } from "../config/thresholds";
import type {
  ActionRow,
  CapacityRow,
  DemandExceptionRow,
  DemandOutlookRow,
  ForecastPerformanceRow,
  IssueRow,
  NormalizedDatasets,
} from "../types/domain";
import { isOverdue } from "./format";

export type ValueMode = "value" | "volume";

export interface GlobalFilters {
  months: string[];
  customers: string[];
  ceManagers: string[];
  packaging: string[];
  plants: string[];
  regions: string[];
  markets: string[];
  valueMode: ValueMode;
}

export const defaultFilters: GlobalFilters = {
  months: [],
  customers: [],
  ceManagers: [],
  packaging: [],
  plants: [],
  regions: [],
  markets: [],
  valueMode: "value",
};

function pickMulti(filter: string[], value: string): boolean {
  if (!filter.length) return true;
  return filter.includes(value);
}

export function filterDemandOutlook(rows: DemandOutlookRow[], f: GlobalFilters): DemandOutlookRow[] {
  return rows.filter(
    (r) =>
      pickMulti(f.months, r.month) &&
      pickMulti(f.customers, r.customer) &&
      pickMulti(f.ceManagers, r.ceManager) &&
      pickMulti(f.packaging, r.packagingType) &&
      pickMulti(f.plants, r.plant) &&
      pickMulti(f.regions, r.region) &&
      pickMulti(f.markets, r.market),
  );
}

export function filterForecastPerformance(rows: ForecastPerformanceRow[], f: GlobalFilters) {
  return rows.filter(
    (r) =>
      pickMulti(f.months, r.month) &&
      pickMulti(f.customers, r.customer),
  );
}

export function filterCapacity(rows: CapacityRow[], f: GlobalFilters) {
  return rows.filter(
    (r) =>
      pickMulti(f.months, r.month) &&
      pickMulti(f.packaging, r.packagingType) &&
      pickMulti(f.plants, r.plant),
  );
}

export function rowValue(d: DemandOutlookRow, mode: ValueMode): number {
  return mode === "value" ? d.currentForecastValue : d.currentForecastVolume;
}

export function rowBudget(d: DemandOutlookRow, mode: ValueMode): number {
  return mode === "value" ? d.budgetValue : d.budgetVolume;
}

export function rowPrior(d: DemandOutlookRow, mode: ValueMode): number {
  return mode === "value" ? d.priorForecastValue : d.priorForecastVolume;
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

export interface WaterfallStep {
  id: string;
  label: string;
  amount: number;
  tone?: "neutral" | "positive" | "negative";
}

export type WaterfallKind = "total" | "up" | "down";

export interface SimpleBridgeBar {
  key: string;
  name: string;
  value: number;
  kind: WaterfallKind;
}

/** Compact bridge bars for executive charts (readable, not a strict accounting waterfall). */
export function simpleOutlookBridge(rows: DemandOutlookRow[], mode: ValueMode): SimpleBridgeBar[] {
  const B = sum(rows.map((r) => rowBudget(r, mode)));
  const P = sum(rows.map((r) => rowPrior(r, mode)));
  const C = sum(rows.map((r) => rowValue(r, mode)));
  const pos = Math.max(0, C - P);
  const neg = Math.min(0, C - P);
  return [
    { key: "budget", name: "Budget", value: B, kind: "total" },
    { key: "prior", name: "Prior forecast", value: P, kind: "total" },
    { key: "up", name: "Net uplift vs prior", value: pos, kind: "up" },
    { key: "down", name: "Net drag vs prior", value: neg, kind: "down" },
    { key: "current", name: "Current forecast", value: C, kind: "total" },
  ];
}

export function buildOutlookWaterfall(rows: DemandOutlookRow[], mode: ValueMode): WaterfallStep[] {
  const budget = sum(rows.map((r) => rowBudget(r, mode)));
  const prior = sum(rows.map((r) => rowPrior(r, mode)));
  const current = sum(rows.map((r) => rowValue(r, mode)));
  const uplift = sum(
    rows.map((r) => {
      const delta = rowValue(r, mode) - rowPrior(r, mode);
      return r.confidence === "Committed" || r.confidence === "Likely" ? Math.max(0, delta) : 0;
    }),
  );
  const risk = sum(
    rows.map((r) => {
      const delta = rowValue(r, mode) - rowPrior(r, mode);
      const pipeDown = r.confidence === "Pipeline" || r.confidence === "Stretch" ? Math.min(0, delta) : 0;
      const hardDown = delta < 0 ? Math.min(0, delta - pipeDown) : 0;
      return pipeDown + hardDown;
    }),
  );
  // Net bridge reconciliation: show components that explain movement from prior to current
  const netChange = current - prior;
  const explained = uplift + risk;
  const residual = netChange - explained;
  return [
    { id: "budget", label: "Budget", amount: budget, tone: "neutral" },
    { id: "prior", label: "Prior forecast", amount: prior, tone: "neutral" },
    { id: "uplift", label: "Confirmed upside", amount: uplift, tone: "positive" },
    { id: "risk", label: "Risk / downside", amount: risk, tone: "negative" },
    { id: "residual", label: "Other movement", amount: residual, tone: "neutral" },
    { id: "net", label: "Net outlook", amount: current, tone: "neutral" },
  ];
}

export interface ExecutiveKpis {
  fyOutlookVsBudget: number | null;
  ytdActualVsBudget: number | null;
  forecastAccuracy: number | null;
  forecastBias: number | null;
  revenueAtRisk: number;
  volumeAtRisk: number;
  redExceptions: number;
  constrainedSites: number;
  overdueActions: number;
}

export function computeExecutiveKpis(data: NormalizedDatasets, demandFiltered: DemandOutlookRow[]): ExecutiveKpis {
  const budget = sum(demandFiltered.map((d) => d.budgetValue));
  const outlook = sum(demandFiltered.map((d) => d.currentForecastValue));
  const fyOutlookVsBudget = budget > 0 ? outlook / budget - 1 : null;

  const ytdMonths = new Set(["2026-01", "2026-02", "2026-03", "2026-04"]);
  const ytdRows = demandFiltered.filter((d) => ytdMonths.has(d.month));
  const ytdBudget = sum(ytdRows.map((d) => d.budgetValue));
  const ytdActual = sum(
    ytdRows.map((d) => (d.actualValue !== undefined ? d.actualValue : d.currentForecastValue * 0.95)),
  );
  const ytdActualVsBudget = ytdBudget > 0 ? ytdActual / ytdBudget - 1 : null;

  const fcaRows = data.forecastPerformance;
  const forecastAccuracy = fcaRows.length ? sum(fcaRows.map((r) => r.fca)) / fcaRows.length : null;
  const forecastBias = fcaRows.length ? sum(fcaRows.map((r) => r.bias)) / fcaRows.length : null;

  const cap = data.capacity;
  const revenueAtRisk = sum(cap.map((c) => (c.utilization > 1 ? c.revenueAtRisk ?? 0 : 0)));
  const volumeAtRisk = sum(cap.map((c) => (c.utilization > 1 ? c.volumeAtRisk ?? 0 : 0)));

  const redExceptions = data.demandExceptions.filter((e) => e.severity === "High").length;

  const constrainedSites = new Set(
    cap.filter((c) => utilizationTone(c.utilization) === "red").map((c) => `${c.plant}|${c.format}`),
  ).size;

  const overdueActions = data.actions.filter((a) => a.status !== "Complete" && isOverdue(a.dueDate)).length;

  return {
    fyOutlookVsBudget,
    ytdActualVsBudget,
    forecastAccuracy,
    forecastBias,
    revenueAtRisk,
    volumeAtRisk,
    redExceptions,
    constrainedSites,
    overdueActions,
  };
}

export function topCustomerChanges(rows: DemandOutlookRow[], mode: ValueMode, n = 5) {
  const byCustomer = new Map<string, number>();
  rows.forEach((r) => {
    const delta = Math.abs(rowValue(r, mode) - rowPrior(r, mode));
    byCustomer.set(r.customer, (byCustomer.get(r.customer) ?? 0) + delta);
  });
  return [...byCustomer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([customer, movement]) => ({ customer, movement }));
}

export function topRisks(issues: IssueRow[], n = 5) {
  return issues
    .filter((i) => i.kind === "Risk" || i.kind === "Strategic")
    .slice()
    .sort((a, b) => Math.abs(b.valueImpact ?? 0) - Math.abs(a.valueImpact ?? 0))
    .slice(0, n);
}

export function topConstraints(cap: CapacityRow[], n = 5) {
  return cap
    .filter((c) => c.utilization >= thresholds.capacity.tightUtilization)
    .slice()
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, n);
}

export function decisionsRequired(exceptions: DemandExceptionRow[], issues: IssueRow[]) {
  const fromExceptions = exceptions
    .filter((e) => e.status !== "Closed")
    .map((e) => ({
      id: e.id,
      title: `${e.type} · ${e.customer}`,
      detail: e.decisionRequired ?? "Decision pending",
      owner: e.owner ?? "Unassigned",
    }));
  const fromIssues = issues
    .filter((i) => i.status !== "Complete")
    .map((i) => ({
      id: i.id,
      title: i.title,
      detail: i.decisionRequired ?? "Decision pending",
      owner: i.owner ?? "Unassigned",
    }));
  return [...fromExceptions, ...fromIssues].slice(0, 8);
}

export function escalationsHandoff(issues: IssueRow[], actions: ActionRow[]) {
  const issueLines = issues
    .filter((i) => i.needsSupplyReview || i.needsExecEscalation || i.taggedEscalation)
    .map((i) => ({
      id: i.id,
      title: i.title,
      route: i.needsExecEscalation ? "Executive S&OP" : "Supply Review",
      owner: i.owner ?? "Unassigned",
    }));
  const actionLines = actions
    .filter((a) => a.category === "Escalation to Supply Review / S&OP" && a.status !== "Complete")
    .map((a) => ({
      id: a.id,
      title: a.description,
      route: a.decisionForum ?? "Supply Review",
      owner: a.owner,
    }));
  return [...issueLines, ...actionLines].slice(0, 10);
}

export function confidenceBuckets(rows: DemandOutlookRow[], mode: ValueMode) {
  const buckets: Record<string, number> = { Committed: 0, Likely: 0, Pipeline: 0, Stretch: 0, Unknown: 0 };
  rows.forEach((r) => {
    const key = buckets[r.confidence] !== undefined ? r.confidence : "Unknown";
    buckets[key] += rowValue(r, mode);
  });
  return Object.entries(buckets).map(([confidence, total]) => ({ confidence, total }));
}

export function exceptionPriorityScore(e: DemandExceptionRow): number {
  const w = thresholds.exceptions.weights;
  const impact = Math.log10(10 + Math.abs(e.impactValue));
  const confScore =
    e.confidence === "Committed" ? 1 : e.confidence === "Likely" ? 0.75 : e.confidence === "Pipeline" ? 0.55 : 0.35;
  const sev = e.severity === "High" ? 1 : e.severity === "Medium" ? 0.6 : 0.35;
  return w.impact * impact + w.confidence * confScore + w.severity * sev;
}

export function paretoShare(rows: ForecastPerformanceRow[], onRed: (r: ForecastPerformanceRow) => boolean) {
  const sorted = rows.slice().sort((a, b) => b.forecast - a.forecast);
  const total = sum(sorted.map((s) => s.forecast));
  let cum = 0;
  let count = 0;
  for (const r of sorted) {
    cum += r.forecast;
    count += 1;
    if (cum >= total * 0.8) break;
  }
  const redInTail = sorted.slice(count).filter(onRed).length;
  return { skuCount80: count, totalSkus: sorted.length, redOutsidePareto: redInTail };
}
