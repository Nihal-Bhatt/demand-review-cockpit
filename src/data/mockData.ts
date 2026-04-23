import type {
  ActionRow,
  ActualRow,
  BudgetRow,
  CapacityRow,
  DemandExceptionRow,
  DemandOutlookRow,
  ForecastPerformanceRow,
  IssueRow,
  MonthKey,
  NpdReadinessRow,
  NormalizedDatasets,
} from "../types/domain";
import { todayISO } from "../lib/format";

const months: MonthKey[] = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
  "2026-09",
  "2026-10",
  "2026-11",
  "2026-12",
];

const customers = ["Petco North", "National Pet", "Regional Grocers", "Club Channel", "E-commerce", "Export"];
const markets = ["North America", "LATAM", "Europe", "APAC"];
const ceManagers = ["A. Chen", "R. Patel", "S. Okafor", "L. Meyer"];
const plants = ["Chicago", "Dallas", "Toronto"];
const packaging = ["Bag 4kg", "Bag 10kg", "Can tray", "Pouch multipack"];
const regions = ["US East", "US West", "Canada", "Intl"];

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rnd(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateMockData(): NormalizedDatasets {
  const demandOutlook: DemandOutlookRow[] = [];
  months.forEach((m) => {
    customers.forEach((c) => {
      const r = rnd(hashSeed(`${m}|${c}`));
      const packagingType = packaging[Math.floor(r() * packaging.length)];
      const plant = plants[Math.floor(r() * plants.length)];
      const market = markets[Math.floor(r() * markets.length)];
      const region = regions[Math.floor(r() * regions.length)];
      const ceManager = ceManagers[Math.floor(r() * ceManagers.length)];
      const budgetValue = 800_000 + r() * 1_200_000;
      const budgetVolume = 120_000 + r() * 180_000;
      const priorForecastValue = budgetValue * (0.96 + r() * 0.08);
      const currentForecastValue = priorForecastValue * (0.97 + r() * 0.1);
      const confRoll = r();
      const confidence =
        confRoll < 0.35 ? "Committed" : confRoll < 0.65 ? "Likely" : confRoll < 0.85 ? "Pipeline" : "Stretch";
      demandOutlook.push({
        month: m,
        customer: c,
        market,
        ceManager,
        packagingType,
        plant,
        region,
        sku: `SKU-${c.slice(0, 3).toUpperCase()}-${packagingType.slice(0, 3)}`,
        productFamily: "Dry nutrition",
        budgetValue,
        budgetVolume,
        priorForecastValue,
        priorForecastVolume: budgetVolume * (0.95 + r() * 0.08),
        currentForecastValue,
        currentForecastVolume: budgetVolume * (0.94 + r() * 0.1),
        actualValue: months.indexOf(m) < 4 ? currentForecastValue * (0.92 + r() * 0.12) : undefined,
        actualVolume: months.indexOf(m) < 4 ? budgetVolume * (0.9 + r() * 0.12) : undefined,
        driver:
          currentForecastValue > budgetValue * 1.05
            ? "Promo uplift / distribution win"
            : currentForecastValue < budgetValue * 0.95
              ? "Competitive pressure / delist risk"
              : "Base trend stable",
        confidence,
        owner: ceManager,
        reconfirmDate: "2026-05-15",
        notes: "Mock dataset for Demand Review cockpit.",
      });
    });
  });

  const budget: BudgetRow[] = demandOutlook.map((d) => ({
    month: d.month,
    customer: d.customer,
    market: d.market,
    budgetValue: d.budgetValue,
    budgetVolume: d.budgetVolume,
  }));

  const forecastPerformance: ForecastPerformanceRow[] = [];
  const cycles = ["2025-12", "2026-01", "2026-02"];
  customers.forEach((c) => {
    months.forEach((m) => {
      const r = rnd(hashSeed(`fp|${c}|${m}`));
      const forecast = 500_000 + r() * 900_000;
      const actual = forecast * (0.88 + r() * 0.2);
      const fca = Math.min(0.99, Math.max(0.55, 1 - Math.abs(forecast - actual) / forecast));
      const bias = (forecast - actual) / forecast;
      const volatility = 0.1 + r() * 0.45;
      const segment = (["Core repeat", "High vol / high volatility", "NPD", "Spot / intermittent"][
        Math.floor(r() * 4)
      ] ?? "Core repeat") as ForecastPerformanceRow["segment"];
      forecastPerformance.push({
        forecastCycle: cycles[Math.floor(r() * cycles.length)] ?? "2026-02",
        month: m,
        customer: c,
        skuGroup: `${c} · Core range`,
        segment,
        forecast,
        actual,
        fca,
        bias,
        volatility,
      });
    });
  });

  const actuals: ActualRow[] = demandOutlook
    .filter((d) => d.actualValue !== undefined)
    .map((d) => ({
      month: d.month,
      customer: d.customer,
      sku: d.sku,
      actualValue: d.actualValue ?? 0,
      actualVolume: d.actualVolume ?? 0,
    }));

  const capacity: CapacityRow[] = [];
  months.forEach((m) => {
    packaging.forEach((format) => {
      plants.forEach((plant) => {
        const r = rnd(hashSeed(`cap|${m}|${format}|${plant}`));
        const rated = 1_200_000 + r() * 800_000;
        const effective = rated * (0.85 + r() * 0.1);
        const demand = effective * (0.72 + r() * 0.45);
        const utilization = demand / Math.max(1, effective);
        capacity.push({
          month: m,
          format,
          plant,
          packagingType: format,
          demand,
          ratedCapacity: rated,
          effectiveCapacity: effective,
          utilization,
          affectedCustomers: utilization > 0.98 ? customers.slice(0, 2).join(", ") : "",
          revenueAtRisk: utilization > 1 ? Math.max(0, demand - effective) * 0.35 : 0,
          volumeAtRisk: utilization > 1 ? Math.max(0, demand - effective) * 0.22 : 0,
          mitigation:
            utilization > 1
              ? "reallocation"
              : utilization > 0.95
                ? "prebuild / MTS"
                : "accept service risk",
          owner: "Capacity PMO",
          incrementalCapacityNote: plant === "Toronto" && format === "Pouch multipack" ? "Line 3 upgrade Q3" : "",
        });
      });
    });
  });

  const npdReadiness: NpdReadinessRow[] = [
    {
      customer: "National Pet",
      project: "Grain-free small breed",
      firstShipmentMonth: "2026-05",
      monthlyVolume: 180_000,
      packagingType: "Bag 4kg",
      plant: "Chicago",
      confidence: "Likely",
      capacityReadiness: "amber",
      rmPackagingReadiness: "green",
      qaArtworkReadiness: "amber",
      commercialReadiness: "green",
      riskFlag: "Artwork approval pending",
      owner: "NPD PM · J. Ruiz",
      dueDate: "2026-04-28",
    },
    {
      customer: "E-commerce",
      project: "Subscription bundle",
      firstShipmentMonth: "2026-06",
      monthlyVolume: 95_000,
      packagingType: "Pouch multipack",
      plant: "Dallas",
      confidence: "Pipeline",
      capacityReadiness: "red",
      rmPackagingReadiness: "amber",
      qaArtworkReadiness: "green",
      commercialReadiness: "amber",
      riskFlag: "Capacity headroom tight in Dallas",
      owner: "NPD PM · M. Stone",
      dueDate: "2026-05-10",
    },
    {
      customer: "Club Channel",
      project: "Club exclusive kibble",
      firstShipmentMonth: "2026-08",
      monthlyVolume: 420_000,
      packagingType: "Bag 10kg",
      plant: "Toronto",
      confidence: "Committed",
      capacityReadiness: "green",
      rmPackagingReadiness: "green",
      qaArtworkReadiness: "green",
      commercialReadiness: "green",
      owner: "NPD PM · A. Chen",
      dueDate: "2026-06-30",
    },
  ];

  const issues: IssueRow[] = [
    {
      id: "ISS-101",
      title: "Private label win · incremental shelf space",
      kind: "Upside",
      valueImpact: 6_200_000,
      volumeImpact: 950_000,
      confidence: "Likely",
      supplyImplication: "Requires flex pack week + alternate pallet pattern",
      decisionRequired: "Confirm service window with plant network",
      owner: "Commercial · L. Meyer",
      dueDate: "2026-05-05",
      status: "Open",
      needsSupplyReview: true,
      needsExecEscalation: false,
    },
    {
      id: "ISS-204",
      title: "Spot-buy dependency in co-man network",
      kind: "Risk",
      valueImpact: 2_400_000,
      volumeImpact: 310_000,
      confidence: "Pipeline",
      supplyImplication: "Service risk if spot orders exceed 15% of month",
      decisionRequired: "Agree mitigation playbook with Supply Review",
      owner: "Demand · R. Patel",
      dueDate: "2026-04-30",
      status: "In progress",
      needsSupplyReview: true,
      needsExecEscalation: false,
    },
    {
      id: "ISS-310",
      title: "Regulatory label change · multi-market",
      kind: "Strategic",
      valueImpact: 0,
      volumeImpact: 0,
      confidence: "Committed",
      supplyImplication: "Impacts artwork + QA release gates",
      decisionRequired: "Executive S&OP decision on phased rollout",
      owner: "Regulatory · S. Okafor",
      dueDate: "2026-06-12",
      status: "Open",
      needsSupplyReview: false,
      needsExecEscalation: true,
    },
  ];

  const actions: ActionRow[] = [
    {
      id: "ACT-001",
      category: "Demand action",
      description: "Validate club channel uplift assumptions for Q3",
      owner: "R. Patel",
      dueDate: "2026-04-26",
      status: "In progress",
      impact: "$4.2M value",
      dependency: "Customer forecast letter",
      decisionForum: "Demand Review",
      nextReviewDate: "2026-05-01",
      notes: "",
    },
    {
      id: "ACT-014",
      category: "Capacity action",
      description: "Confirm Dallas pouch line relief scenario",
      owner: "Capacity PMO",
      dueDate: "2026-04-18",
      status: "Open",
      impact: "120k units at risk",
      dependency: "Maintenance window",
      decisionForum: "Supply Review",
      nextReviewDate: "2026-04-22",
      notes: "",
    },
    {
      id: "ACT-021",
      category: "Escalation to Supply Review / S&OP",
      description: "Toronto export lane service risk acceptance",
      owner: "S&OP Lead",
      dueDate: "2026-04-10",
      status: "Open",
      impact: "Service vs margin tradeoff",
      dependency: "Logistics confirmation",
      decisionForum: "Executive S&OP",
      nextReviewDate: "2026-04-12",
      notes: "Overdue in demo to illustrate highlighting",
    },
    {
      id: "ACT-033",
      category: "NPD readiness action",
      description: "Close artwork sign-off for subscription bundle",
      owner: "M. Stone",
      dueDate: "2026-05-02",
      status: "Blocked",
      impact: "Launch slip risk",
      dependency: "Brand team",
      decisionForum: "Demand Review",
      nextReviewDate: "2026-05-03",
      notes: "",
    },
  ];

  const demandExceptions: DemandExceptionRow[] = [
    {
      id: "EXC-9001",
      type: "Uplift vs budget",
      customer: "E-commerce",
      product: "Pouch multipack",
      month: "2026-06",
      impactValue: 1_100_000,
      impactVolume: 140_000,
      confidence: "Likely",
      rootCause: "Subscription campaign pull-forward",
      decisionRequired: "Confirm promo phasing vs capacity",
      owner: "A. Chen",
      dueDate: todayISO(),
      status: "In review",
      severity: "High",
    },
    {
      id: "EXC-9002",
      type: "Repeated under-forecast",
      customer: "National Pet",
      product: "Dry nutrition core",
      month: "2026-04",
      impactValue: 620_000,
      impactVolume: 88_000,
      confidence: "Committed",
      rootCause: "Distribution expansion not in prior cycle",
      decisionRequired: "Update statistical baseline",
      owner: "R. Patel",
      dueDate: "2026-05-08",
      status: "New",
      severity: "Medium",
    },
    {
      id: "EXC-9003",
      type: "NPD uncertainty",
      customer: "Regional Grocers",
      product: "Treats novelty",
      month: "2026-07",
      impactValue: 410_000,
      impactVolume: 52_000,
      confidence: "Pipeline",
      rootCause: "Launch date window shifting",
      decisionRequired: "Confirm readiness gates",
      owner: "M. Stone",
      dueDate: "2026-05-12",
      status: "New",
      severity: "Medium",
    },
  ];

  return {
    demandOutlook,
    budget,
    forecastPerformance,
    actuals,
    capacity,
    npdReadiness,
    issues,
    actions,
    demandExceptions,
  };
}
