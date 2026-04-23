import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { generateMockData } from "../data/mockData";
import { DEFAULT_COLUMN_HINTS, SEMANTIC_FIELDS } from "../config/defaultColumnMappings";
import type {
  ActionRow,
  DatasetKey,
  DemandExceptionRow,
  DemandOutlookRow,
  IssueRow,
  NormalizedDatasets,
} from "../types/domain";
import type { DatasetMappings, MappingDict, UploadPayload, UploadRecord } from "../types/mapping";
import { applyMapping, sheetToRows } from "../lib/excel/ingest";
import {
  computeExecutiveKpis,
  defaultFilters,
  type GlobalFilters,
  filterCapacity,
  filterDemandOutlook,
  filterForecastPerformance,
} from "../lib/businessLogic";

const STORAGE_DEMO = "dr_sop_demo_mode";
const STORAGE_MAP = "dr_sop_column_mappings_v1";

function emptyDatasets(): NormalizedDatasets {
  return {
    demandOutlook: [],
    budget: [],
    forecastPerformance: [],
    actuals: [],
    capacity: [],
    npdReadiness: [],
    issues: [],
    actions: [],
    demandExceptions: [],
  };
}

function defaultMappingsFromHints(): DatasetMappings {
  const keys = Object.keys(SEMANTIC_FIELDS) as DatasetKey[];
  const out = {} as DatasetMappings;
  keys.forEach((ds) => {
    const m: MappingDict = {};
    SEMANTIC_FIELDS[ds].forEach((field) => {
      const hint = DEFAULT_COLUMN_HINTS[ds][field];
      if (hint) m[field] = hint;
    });
    out[ds] = m;
  });
  return out;
}

function loadMappings(): DatasetMappings {
  try {
    const raw = localStorage.getItem(STORAGE_MAP);
    if (!raw) return defaultMappingsFromHints();
    const parsed = JSON.parse(raw) as DatasetMappings;
    return { ...defaultMappingsFromHints(), ...parsed };
  } catch {
    return defaultMappingsFromHints();
  }
}

export interface DashboardContextValue {
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  filters: GlobalFilters;
  setFilters: (f: GlobalFilters) => void;
  uploads: UploadRecord[];
  uploadDataset: (dataset: DatasetKey, file: File, sheetName: string) => Promise<void>;
  clearUpload: (dataset: DatasetKey) => void;
  mappings: DatasetMappings;
  setMappingField: (dataset: DatasetKey, semanticField: string, excelHeader: string) => void;
  resetMappings: () => void;
  datasets: NormalizedDatasets;
  demandFiltered: DemandOutlookRow[];
  forecastFiltered: ReturnType<typeof filterForecastPerformance>;
  capacityFiltered: ReturnType<typeof filterCapacity>;
  kpis: ReturnType<typeof computeExecutiveKpis>;
  actionEdits: Record<string, Partial<ActionRow>>;
  updateAction: (id: string, patch: Partial<ActionRow>) => void;
  exceptionEdits: Record<string, Partial<DemandExceptionRow>>;
  updateException: (id: string, patch: Partial<DemandExceptionRow>) => void;
  issueTags: Record<string, boolean>;
  toggleIssueTag: (id: string) => void;
  bulkTagEscalations: (ids: string[]) => void;
  drilldownRow: DemandOutlookRow | null;
  openDrilldown: (row: DemandOutlookRow) => void;
  closeDrilldown: () => void;
  applyDrilldownFilters: (row: DemandOutlookRow) => void;
  exportPaneRef: RefObject<HTMLDivElement>;
  validation: Partial<Record<DatasetKey, string[]>>;
  uploadHeaders: Partial<Record<DatasetKey, string[]>>;
}

const Ctx = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const mock = useMemo(() => generateMockData(), []);
  const exportPaneRef = useRef<HTMLDivElement>(null);

  const [demoMode, setDemoModeState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_DEMO);
      if (v === null) return true;
      return v === "1";
    } catch {
      return true;
    }
  });

  const [filters, setFilters] = useState<GlobalFilters>(defaultFilters);
  const [mappings, setMappings] = useState<DatasetMappings>(() => loadMappings());
  const [uploadCache, setUploadCache] = useState<Partial<Record<DatasetKey, UploadPayload>>>({});
  const [actionEdits, setActionEdits] = useState<Record<string, Partial<ActionRow>>>({});
  const [exceptionEdits, setExceptionEdits] = useState<Record<string, Partial<DemandExceptionRow>>>({});
  const [issueTags, setIssueTags] = useState<Record<string, boolean>>({});
  const [drilldownRow, setDrilldownRow] = useState<DemandOutlookRow | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DEMO, demoMode ? "1" : "0");
    } catch {
      // ignore
    }
  }, [demoMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MAP, JSON.stringify(mappings));
    } catch {
      // ignore
    }
  }, [mappings]);

  const setDemoMode = useCallback((v: boolean) => {
    setDemoModeState(v);
  }, []);

  const resetMappings = useCallback(() => {
    setMappings(defaultMappingsFromHints());
  }, []);

  const setMappingField = useCallback((dataset: DatasetKey, semanticField: string, excelHeader: string) => {
    setMappings((prev) => ({
      ...prev,
      [dataset]: { ...(prev[dataset] ?? {}), [semanticField]: excelHeader },
    }));
  }, []);

  const normalizedFromUploads = useMemo(() => {
    const out = emptyDatasets();
    (Object.keys(uploadCache) as DatasetKey[]).forEach((ds) => {
      const payload = uploadCache[ds];
      if (!payload) return;
      const mapped = applyMapping(ds, payload.rows, mappings[ds] ?? {});
      switch (ds) {
        case "demandOutlook":
          out.demandOutlook = mapped as NormalizedDatasets["demandOutlook"];
          break;
        case "budget":
          out.budget = mapped as NormalizedDatasets["budget"];
          break;
        case "forecastPerformance":
          out.forecastPerformance = mapped as NormalizedDatasets["forecastPerformance"];
          break;
        case "actuals":
          out.actuals = mapped as NormalizedDatasets["actuals"];
          break;
        case "capacity":
          out.capacity = mapped as NormalizedDatasets["capacity"];
          break;
        case "npdReadiness":
          out.npdReadiness = mapped as NormalizedDatasets["npdReadiness"];
          break;
        case "issues":
          out.issues = mapped as NormalizedDatasets["issues"];
          break;
        case "actions":
          out.actions = mapped as NormalizedDatasets["actions"];
          break;
        case "demandExceptions":
          out.demandExceptions = mapped as NormalizedDatasets["demandExceptions"];
          break;
        default:
          break;
      }
    });
    return out;
  }, [uploadCache, mappings]);

  const datasets: NormalizedDatasets = useMemo(() => {
    if (demoMode) return mock;
    return {
      ...emptyDatasets(),
      ...normalizedFromUploads,
    };
  }, [demoMode, mock, normalizedFromUploads]);

  const datasetsMerged = useMemo(() => {
    const actions = datasets.actions.map((a) => ({ ...a, ...actionEdits[a.id] }));
    const demandExceptions = datasets.demandExceptions.map((e) => ({ ...e, ...exceptionEdits[e.id] }));
    const issues = datasets.issues.map((i) => ({ ...i, taggedEscalation: issueTags[i.id] ?? i.taggedEscalation }));
    return { ...datasets, actions, demandExceptions, issues };
  }, [datasets, actionEdits, exceptionEdits, issueTags]);

  const demandFiltered = useMemo(
    () => filterDemandOutlook(datasetsMerged.demandOutlook, filters),
    [datasetsMerged.demandOutlook, filters],
  );

  const forecastFiltered = useMemo(
    () => filterForecastPerformance(datasetsMerged.forecastPerformance, filters),
    [datasetsMerged.forecastPerformance, filters],
  );

  const capacityFiltered = useMemo(
    () => filterCapacity(datasetsMerged.capacity, filters),
    [datasetsMerged.capacity, filters],
  );

  const kpis = useMemo(
    () => computeExecutiveKpis(datasetsMerged, demandFiltered),
    [datasetsMerged, demandFiltered],
  );

  const uploads: UploadRecord[] = useMemo(() => {
    return (Object.entries(uploadCache) as [DatasetKey, UploadPayload][]).map(([dataset, p], idx) => ({
      id: `${dataset}-${idx}`,
      dataset,
      fileName: p.fileName,
      uploadedAt: p.uploadedAt,
      sheetName: p.sheetName,
      rowCount: p.rows.length,
    }));
  }, [uploadCache]);

  // Fix sheetName in uploads - store actual sheetName in UploadPayload
  // I'll extend UploadPayload to include sheetName

  const uploadDataset = useCallback(async (dataset: DatasetKey, file: File, sheetName: string) => {
    const buf = await file.arrayBuffer();
    const parsed = sheetToRows(buf, sheetName);
    setUploadCache((prev) => ({
      ...prev,
      [dataset]: {
        ...parsed,
        fileName: file.name,
        uploadedAt: new Date().toISOString(),
        sheetName,
      } satisfies UploadPayload,
    }));
  }, []);

  const clearUpload = useCallback((dataset: DatasetKey) => {
    setUploadCache((prev) => {
      const next = { ...prev };
      delete next[dataset];
      return next;
    });
  }, []);

  const updateAction = useCallback((id: string, patch: Partial<ActionRow>) => {
    setActionEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const updateException = useCallback((id: string, patch: Partial<DemandExceptionRow>) => {
    setExceptionEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const toggleIssueTag = useCallback((id: string) => {
    setIssueTags((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const bulkTagEscalations = useCallback((ids: string[]) => {
    setIssueTags((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, []);

  const openDrilldown = useCallback((row: DemandOutlookRow) => setDrilldownRow(row), []);
  const closeDrilldown = useCallback(() => setDrilldownRow(null), []);

  const applyDrilldownFilters = useCallback((row: DemandOutlookRow) => {
    setFilters((f) => ({
      ...f,
      customers: row.customer ? [row.customer] : f.customers,
      months: row.month ? [row.month] : f.months,
      ceManagers: row.ceManager ? [row.ceManager] : f.ceManagers,
      packaging: row.packagingType ? [row.packagingType] : f.packaging,
      plants: row.plant ? [row.plant] : f.plants,
      regions: row.region ? [row.region] : f.regions,
      markets: row.market ? [row.market] : f.markets,
    }));
  }, []);

  const uploadHeaders = useMemo(() => {
    const out: Partial<Record<DatasetKey, string[]>> = {};
    (Object.entries(uploadCache) as [DatasetKey, UploadPayload][]).forEach(([ds, p]) => {
      out[ds] = p.headers;
    });
    return out;
  }, [uploadCache]);

  const validation = useMemo(() => {
    const out: Partial<Record<DatasetKey, string[]>> = {};
    (Object.keys(SEMANTIC_FIELDS) as DatasetKey[]).forEach((ds) => {
      const required = ["month", "customer"].filter((k) => SEMANTIC_FIELDS[ds].includes(k));
      const map = mappings[ds] ?? {};
      const missing = required.filter((k) => !map[k] || String(map[k]).trim().length === 0);
      if (missing.length) out[ds] = missing.map((m) => `Missing mapping: ${m}`);
    });
    return out;
  }, [mappings]);

  const value: DashboardContextValue = {
    demoMode,
    setDemoMode,
    filters,
    setFilters,
    uploads,
    uploadDataset,
    clearUpload,
    mappings,
    setMappingField,
    resetMappings,
    datasets: datasetsMerged,
    demandFiltered,
    forecastFiltered,
    capacityFiltered,
    kpis,
    actionEdits,
    updateAction,
    exceptionEdits,
    updateException,
    issueTags,
    toggleIssueTag,
    bulkTagEscalations,
    drilldownRow,
    openDrilldown,
    closeDrilldown,
    applyDrilldownFilters,
    exportPaneRef,
    validation,
    uploadHeaders,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboard() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDashboard must be used within DashboardProvider");
  return v;
}
