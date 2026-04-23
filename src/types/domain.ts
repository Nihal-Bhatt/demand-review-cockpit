export type MonthKey = `${number}-${number}`;

export type Confidence = "Committed" | "Likely" | "Pipeline" | "Stretch" | "Unknown";

export type Traffic = "red" | "amber" | "green" | "unknown";

export type IssueKind = "Upside" | "Risk" | "Strategic";

export type ActionCategory =
  | "Demand action"
  | "Capacity action"
  | "RM / packaging action"
  | "NPD readiness action"
  | "Escalation to Supply Review / S&OP";

export type ActionStatus = "Open" | "In progress" | "Blocked" | "Complete";

export type ExceptionType =
  | "Uplift vs budget"
  | "Downgrade vs budget"
  | "High volatility"
  | "Repeated under-forecast"
  | "Repeated over-forecast"
  | "First-time forecast"
  | "NPD uncertainty"
  | "Spot order dependency";

export type ExceptionStatus = "New" | "In review" | "Agreed" | "Closed";

export type DecisionRecommendation =
  | "validate"
  | "hold"
  | "shape down"
  | "escalate to supply";

export type Mitigation =
  | "reallocation"
  | "prebuild / MTS"
  | "stretch capacity"
  | "alternate source"
  | "accept service risk";

export interface DemandOutlookRow {
  month: MonthKey;
  customer: string;
  market: string;
  ceManager: string;
  packagingType: string;
  plant: string;
  region: string;
  sku?: string;
  productFamily?: string;
  budgetValue: number;
  budgetVolume: number;
  priorForecastValue: number;
  priorForecastVolume: number;
  currentForecastValue: number;
  currentForecastVolume: number;
  actualValue?: number;
  actualVolume?: number;
  driver?: string;
  confidence: Confidence;
  owner?: string;
  reconfirmDate?: string;
  notes?: string;
}

export interface BudgetRow {
  month: MonthKey;
  customer: string;
  market: string;
  budgetValue: number;
  budgetVolume: number;
}

export interface ForecastPerformanceRow {
  forecastCycle: string;
  month: MonthKey;
  customer: string;
  skuGroup: string;
  segment: "Core repeat" | "High vol / high volatility" | "NPD" | "Spot / intermittent";
  forecast: number;
  actual: number;
  fca: number;
  bias: number;
  volatility: number;
}

export interface ActualRow {
  month: MonthKey;
  customer: string;
  sku?: string;
  actualValue: number;
  actualVolume: number;
}

export interface CapacityRow {
  month: MonthKey;
  format: string;
  plant: string;
  packagingType: string;
  demand: number;
  ratedCapacity: number;
  effectiveCapacity: number;
  utilization: number;
  affectedCustomers?: string;
  revenueAtRisk?: number;
  volumeAtRisk?: number;
  mitigation?: Mitigation;
  owner?: string;
  incrementalCapacityNote?: string;
}

export interface NpdReadinessRow {
  customer: string;
  project: string;
  firstShipmentMonth: MonthKey;
  monthlyVolume: number;
  packagingType: string;
  plant: string;
  confidence: Confidence;
  capacityReadiness: Traffic;
  rmPackagingReadiness: Traffic;
  qaArtworkReadiness: Traffic;
  commercialReadiness: Traffic;
  riskFlag?: string;
  owner?: string;
  dueDate?: string;
}

export interface IssueRow {
  id: string;
  title: string;
  kind: IssueKind;
  valueImpact?: number;
  volumeImpact?: number;
  confidence: Confidence;
  supplyImplication?: string;
  decisionRequired?: string;
  owner?: string;
  dueDate?: string;
  status: ActionStatus;
  needsSupplyReview?: boolean;
  needsExecEscalation?: boolean;
  taggedEscalation?: boolean;
}

export interface ActionRow {
  id: string;
  category: ActionCategory;
  description: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
  impact?: string;
  dependency?: string;
  decisionForum?: string;
  nextReviewDate?: string;
  notes?: string;
}

export interface DemandExceptionRow {
  id: string;
  type: ExceptionType;
  customer: string;
  product: string;
  month: MonthKey;
  impactValue: number;
  impactVolume: number;
  confidence: Confidence;
  rootCause?: string;
  decisionRequired?: string;
  owner?: string;
  dueDate?: string;
  status: ExceptionStatus;
  severity: "High" | "Medium" | "Low";
  reviewNotes?: string;
  recommendation?: DecisionRecommendation;
}

export interface NormalizedDatasets {
  demandOutlook: DemandOutlookRow[];
  budget: BudgetRow[];
  forecastPerformance: ForecastPerformanceRow[];
  actuals: ActualRow[];
  capacity: CapacityRow[];
  npdReadiness: NpdReadinessRow[];
  issues: IssueRow[];
  actions: ActionRow[];
  demandExceptions: DemandExceptionRow[];
}

export type DatasetKey = keyof NormalizedDatasets;
