import * as XLSX from "xlsx";
import type { DatasetKey } from "../../types/domain";
import { DEFAULT_COLUMN_HINTS, SEMANTIC_FIELDS } from "../../config/defaultColumnMappings";

/** Build a starter workbook for a dataset using configured default headers. */
export function downloadTemplateForDataset(dataset: DatasetKey) {
  const hints = DEFAULT_COLUMN_HINTS[dataset];
  const fields = SEMANTIC_FIELDS[dataset];
  const headers = fields.map((f) => hints[f] ?? f);
  const ws = XLSX.utils.aoa_to_sheet([headers, fields.map(() => "")]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, dataset.slice(0, 31));
  XLSX.writeFile(wb, `template_${dataset}.xlsx`);
}

export function downloadAllTemplatesWorkbook() {
  const wb = XLSX.utils.book_new();
  (Object.keys(SEMANTIC_FIELDS) as DatasetKey[]).forEach((dataset) => {
    const hints = DEFAULT_COLUMN_HINTS[dataset];
    const fields = SEMANTIC_FIELDS[dataset];
    const headers = fields.map((f) => hints[f] ?? f);
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(wb, ws, dataset.slice(0, 31));
  });
  XLSX.writeFile(wb, "demand_review_templates_all_sheets.xlsx");
}
