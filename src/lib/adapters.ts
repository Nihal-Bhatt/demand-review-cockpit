import type {
  ActionCategory,
  ActionRow,
  ActionStatus,
  ActualRow,
  BudgetRow,
  CapacityRow,
  Confidence,
  DemandExceptionRow,
  DemandOutlookRow,
  ExceptionStatus,
  ExceptionType,
  ForecastPerformanceRow,
  IssueKind,
  IssueRow,
  Mitigation,
  MonthKey,
  NpdReadinessRow,
  Traffic,
} from "../types/domain";
import type { MappingDict } from "../types/mapping";
import { parseMonthKey } from "./format";

function col(map: MappingDict, key: string): string | undefined {
  const v = map[key];
  return v && String(v).trim().length > 0 ? String(v).trim() : undefined;
}

function pick(row: Record<string, unknown>, header?: string): unknown {
  if (!header) return undefined;
  return row[header];
}

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback;
  return String(v).trim();
}

function boolish(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1";
}

function confidence(v: unknown): Confidence {
  const s = String(v ?? "").trim();
  if (s === "Committed" || s === "Likely" || s === "Pipeline" || s === "Stretch") return s;
  return "Unknown";
}

function traffic(v: unknown): Traffic {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "red" || s === "amber" || s === "green") return s;
  if (s.includes("red")) return "red";
  if (s.includes("amber") || s.includes("yellow")) return "amber";
  if (s.includes("green")) return "green";
  return "unknown";
}

function issueKind(v: unknown): IssueKind {
  const s = String(v ?? "").trim();
  if (s === "Upside" || s === "Risk" || s === "Strategic") return s;
  return "Risk";
}

function actionCategory(v: unknown): ActionCategory {
  const s = String(v ?? "").trim();
  const allowed: ActionCategory[] = [
    "Demand action",
    "Capacity action",
    "RM / packaging action",
    "NPD readiness action",
    "Escalation to Supply Review / S&OP",
  ];
  return (allowed.find((a) => a === s) ?? "Demand action") as ActionCategory;
}

function actionStatus(v: unknown): ActionStatus {
  const s = String(v ?? "").trim();
  const allowed: ActionStatus[] = ["Open", "In progress", "Blocked", "Complete"];
  return (allowed.find((a) => a === s) ?? "Open") as ActionStatus;
}

function exceptionType(v: unknown): ExceptionType {
  const s = String(v ?? "").trim();
  const allowed: ExceptionType[] = [
    "Uplift vs budget",
    "Downgrade vs budget",
    "High volatility",
    "Repeated under-forecast",
    "Repeated over-forecast",
    "First-time forecast",
    "NPD uncertainty",
    "Spot order dependency",
  ];
  return (allowed.find((a) => a === s) ?? "High volatility") as ExceptionType;
}

function exceptionStatus(v: unknown): ExceptionStatus {
  const s = String(v ?? "").trim();
  const allowed: ExceptionStatus[] = ["New", "In review", "Agreed", "Closed"];
  return (allowed.find((a) => a === s) ?? "New") as ExceptionStatus;
}

function mitigation(v: unknown): Mitigation | undefined {
  const s = String(v ?? "").trim();
  const allowed: Mitigation[] = [
    "reallocation",
    "prebuild / MTS",
    "stretch capacity",
    "alternate source",
    "accept service risk",
  ];
  return allowed.find((a) => a === s);
}

function monthFrom(row: Record<string, unknown>, map: MappingDict, key = "month"): MonthKey | undefined {
  const h = col(map, key);
  const raw = pick(row, h);
  const parsed = parseMonthKey(raw !== undefined && raw !== null ? String(raw) : undefined);
  return parsed as MonthKey | undefined;
}

export function rowToDemandOutlook(row: Record<string, unknown>, map: MappingDict): DemandOutlookRow | null {
  const month = monthFrom(row, map);
  if (!month) return null;
  const customer = str(pick(row, col(map, "customer")), "Unknown");
  return {
    month,
    customer,
    market: str(pick(row, col(map, "market")), "Unknown"),
    ceManager: str(pick(row, col(map, "ceManager")), "Unassigned"),
    packagingType: str(pick(row, col(map, "packagingType")), "Unknown"),
    plant: str(pick(row, col(map, "plant")), "Unknown"),
    region: str(pick(row, col(map, "region")), "Unknown"),
    sku: str(pick(row, col(map, "sku"))),
    productFamily: str(pick(row, col(map, "productFamily"))),
    budgetValue: num(pick(row, col(map, "budgetValue"))),
    budgetVolume: num(pick(row, col(map, "budgetVolume"))),
    priorForecastValue: num(pick(row, col(map, "priorForecastValue"))),
    priorForecastVolume: num(pick(row, col(map, "priorForecastVolume"))),
    currentForecastValue: num(pick(row, col(map, "currentForecastValue"))),
    currentForecastVolume: num(pick(row, col(map, "currentForecastVolume"))),
    actualValue: (() => {
      const v = pick(row, col(map, "actualValue"));
      if (v === undefined || v === null || v === "") return undefined;
      return num(v);
    })(),
    actualVolume: (() => {
      const v = pick(row, col(map, "actualVolume"));
      if (v === undefined || v === null || v === "") return undefined;
      return num(v);
    })(),
    driver: str(pick(row, col(map, "driver"))),
    confidence: confidence(pick(row, col(map, "confidence"))),
    owner: str(pick(row, col(map, "owner"))),
    reconfirmDate: str(pick(row, col(map, "reconfirmDate"))),
    notes: str(pick(row, col(map, "notes"))),
  };
}

export function rowToBudget(row: Record<string, unknown>, map: MappingDict): BudgetRow | null {
  const month = monthFrom(row, map);
  if (!month) return null;
  return {
    month,
    customer: str(pick(row, col(map, "customer")), "Unknown"),
    market: str(pick(row, col(map, "market")), "Unknown"),
    budgetValue: num(pick(row, col(map, "budgetValue"))),
    budgetVolume: num(pick(row, col(map, "budgetVolume"))),
  };
}

export function rowToForecastPerformance(
  row: Record<string, unknown>,
  map: MappingDict,
): ForecastPerformanceRow | null {
  const month = monthFrom(row, map);
  if (!month) return null;
  const segRaw = str(pick(row, col(map, "segment")), "Core repeat");
  const segment = (["Core repeat", "High vol / high volatility", "NPD", "Spot / intermittent"].includes(segRaw)
    ? segRaw
    : "Core repeat") as ForecastPerformanceRow["segment"];
  return {
    forecastCycle: str(pick(row, col(map, "forecastCycle")), "Current cycle"),
    month,
    customer: str(pick(row, col(map, "customer")), "Unknown"),
    skuGroup: str(pick(row, col(map, "skuGroup")), "Unknown"),
    segment,
    forecast: num(pick(row, col(map, "forecast"))),
    actual: num(pick(row, col(map, "actual"))),
    fca: num(pick(row, col(map, "fca"))),
    bias: num(pick(row, col(map, "bias"))),
    volatility: num(pick(row, col(map, "volatility"))),
  };
}

export function rowToActual(row: Record<string, unknown>, map: MappingDict): ActualRow | null {
  const month = monthFrom(row, map);
  if (!month) return null;
  return {
    month,
    customer: str(pick(row, col(map, "customer")), "Unknown"),
    sku: str(pick(row, col(map, "sku"))),
    actualValue: num(pick(row, col(map, "actualValue"))),
    actualVolume: num(pick(row, col(map, "actualVolume"))),
  };
}

export function rowToCapacity(row: Record<string, unknown>, map: MappingDict): CapacityRow | null {
  const month = monthFrom(row, map);
  if (!month) return null;
  const u = num(pick(row, col(map, "utilization")));
  return {
    month,
    format: str(pick(row, col(map, "format")), "Unknown"),
    plant: str(pick(row, col(map, "plant")), "Unknown"),
    packagingType: str(pick(row, col(map, "packagingType")), "Unknown"),
    demand: num(pick(row, col(map, "demand"))),
    ratedCapacity: num(pick(row, col(map, "ratedCapacity"))),
    effectiveCapacity: num(pick(row, col(map, "effectiveCapacity"))),
    utilization: u > 1.5 ? u / 100 : u,
    affectedCustomers: str(pick(row, col(map, "affectedCustomers"))),
    revenueAtRisk: num(pick(row, col(map, "revenueAtRisk"))),
    volumeAtRisk: num(pick(row, col(map, "volumeAtRisk"))),
    mitigation: mitigation(pick(row, col(map, "mitigation"))),
    owner: str(pick(row, col(map, "owner"))),
    incrementalCapacityNote: str(pick(row, col(map, "incrementalCapacityNote"))),
  };
}

export function rowToNpd(row: Record<string, unknown>, map: MappingDict): NpdReadinessRow | null {
  const m = monthFrom(row, map, "firstShipmentMonth");
  if (!m) return null;
  return {
    customer: str(pick(row, col(map, "customer")), "Unknown"),
    project: str(pick(row, col(map, "project")), "Unknown"),
    firstShipmentMonth: m,
    monthlyVolume: num(pick(row, col(map, "monthlyVolume"))),
    packagingType: str(pick(row, col(map, "packagingType")), "Unknown"),
    plant: str(pick(row, col(map, "plant")), "Unknown"),
    confidence: confidence(pick(row, col(map, "confidence"))),
    capacityReadiness: traffic(pick(row, col(map, "capacityReadiness"))),
    rmPackagingReadiness: traffic(pick(row, col(map, "rmPackagingReadiness"))),
    qaArtworkReadiness: traffic(pick(row, col(map, "qaArtworkReadiness"))),
    commercialReadiness: traffic(pick(row, col(map, "commercialReadiness"))),
    riskFlag: str(pick(row, col(map, "riskFlag"))),
    owner: str(pick(row, col(map, "owner"))),
    dueDate: str(pick(row, col(map, "dueDate"))),
  };
}

export function rowToIssue(row: Record<string, unknown>, map: MappingDict): IssueRow | null {
  const id = str(pick(row, col(map, "id")));
  if (!id) return null;
  return {
    id,
    title: str(pick(row, col(map, "title")), "Untitled"),
    kind: issueKind(pick(row, col(map, "kind"))),
    valueImpact: num(pick(row, col(map, "valueImpact"))),
    volumeImpact: num(pick(row, col(map, "volumeImpact"))),
    confidence: confidence(pick(row, col(map, "confidence"))),
    supplyImplication: str(pick(row, col(map, "supplyImplication"))),
    decisionRequired: str(pick(row, col(map, "decisionRequired"))),
    owner: str(pick(row, col(map, "owner"))),
    dueDate: str(pick(row, col(map, "dueDate"))),
    status: actionStatus(pick(row, col(map, "status"))),
    needsSupplyReview: boolish(pick(row, col(map, "needsSupplyReview"))),
    needsExecEscalation: boolish(pick(row, col(map, "needsExecEscalation"))),
    taggedEscalation: false,
  };
}

export function rowToAction(row: Record<string, unknown>, map: MappingDict): ActionRow | null {
  const id = str(pick(row, col(map, "id")));
  if (!id) return null;
  return {
    id,
    category: actionCategory(pick(row, col(map, "category"))),
    description: str(pick(row, col(map, "description")), ""),
    owner: str(pick(row, col(map, "owner")), "Unassigned"),
    dueDate: str(pick(row, col(map, "dueDate")), ""),
    status: actionStatus(pick(row, col(map, "status"))),
    impact: str(pick(row, col(map, "impact"))),
    dependency: str(pick(row, col(map, "dependency"))),
    decisionForum: str(pick(row, col(map, "decisionForum"))),
    nextReviewDate: str(pick(row, col(map, "nextReviewDate"))),
    notes: str(pick(row, col(map, "notes"))),
  };
}

export function rowToDemandException(row: Record<string, unknown>, map: MappingDict): DemandExceptionRow | null {
  const id = str(pick(row, col(map, "id")));
  if (!id) return null;
  const month = monthFrom(row, map);
  if (!month) return null;
  const sevRaw = str(pick(row, col(map, "severity")), "Medium");
  const severity = (["High", "Medium", "Low"].includes(sevRaw) ? sevRaw : "Medium") as DemandExceptionRow["severity"];
  return {
    id,
    type: exceptionType(pick(row, col(map, "type"))),
    customer: str(pick(row, col(map, "customer")), "Unknown"),
    product: str(pick(row, col(map, "product")), "Unknown"),
    month,
    impactValue: num(pick(row, col(map, "impactValue"))),
    impactVolume: num(pick(row, col(map, "impactVolume"))),
    confidence: confidence(pick(row, col(map, "confidence"))),
    rootCause: str(pick(row, col(map, "rootCause"))),
    decisionRequired: str(pick(row, col(map, "decisionRequired"))),
    owner: str(pick(row, col(map, "owner"))),
    dueDate: str(pick(row, col(map, "dueDate"))),
    status: exceptionStatus(pick(row, col(map, "status"))),
    severity,
  };
}
