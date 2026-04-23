import * as XLSX from "xlsx";
import type { DatasetKey, NormalizedDatasets } from "../../types/domain";
import type { MappingDict } from "../../types/mapping";
import {
  rowToAction,
  rowToActual,
  rowToBudget,
  rowToCapacity,
  rowToDemandException,
  rowToDemandOutlook,
  rowToForecastPerformance,
  rowToIssue,
  rowToNpd,
} from "../adapters";

export function listSheetNames(file: ArrayBuffer): string[] {
  const wb = XLSX.read(file, { type: "array" });
  return wb.SheetNames;
}

export function sheetToRows(file: ArrayBuffer, sheetName: string): { headers: string[]; rows: Record<string, unknown>[] } {
  const wb = XLSX.read(file, { type: "array" });
  const ws = wb.Sheets[sheetName];
  if (!ws) return { headers: [], rows: [] };
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
  if (!aoa.length) return { headers: [], rows: [] };
  const headers = (aoa[0] as unknown[]).map((h) => String(h ?? "").trim());
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < aoa.length; i++) {
    const line = aoa[i] as unknown[];
    if (!line || line.every((c) => c === "" || c === null || c === undefined)) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      obj[h] = line[idx] ?? "";
    });
    rows.push(obj);
  }
  return { headers, rows };
}

export function applyMapping(
  dataset: DatasetKey,
  rows: Record<string, unknown>[],
  mapping: MappingDict,
): NormalizedDatasets[DatasetKey] {
  const out: unknown[] = [];
  for (const r of rows) {
    let item: unknown = null;
    switch (dataset) {
      case "demandOutlook":
        item = rowToDemandOutlook(r, mapping);
        break;
      case "budget":
        item = rowToBudget(r, mapping);
        break;
      case "forecastPerformance":
        item = rowToForecastPerformance(r, mapping);
        break;
      case "actuals":
        item = rowToActual(r, mapping);
        break;
      case "capacity":
        item = rowToCapacity(r, mapping);
        break;
      case "npdReadiness":
        item = rowToNpd(r, mapping);
        break;
      case "issues":
        item = rowToIssue(r, mapping);
        break;
      case "actions":
        item = rowToAction(r, mapping);
        break;
      case "demandExceptions":
        item = rowToDemandException(r, mapping);
        break;
      default:
        break;
    }
    if (item) out.push(item);
  }
  return out as NormalizedDatasets[DatasetKey];
}
