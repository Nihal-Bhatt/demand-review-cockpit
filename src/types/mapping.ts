import type { DatasetKey } from "./domain";

export type MappingDict = Partial<Record<string, string>>;

export type DatasetMappings = Record<DatasetKey, MappingDict>;

export interface UploadRecord {
  id: string;
  dataset: DatasetKey;
  fileName: string;
  uploadedAt: string;
  sheetName: string;
  rowCount: number;
}

export interface ParsedSheet {
  headers: string[];
  rows: Record<string, unknown>[];
}

export interface UploadPayload extends ParsedSheet {
  fileName: string;
  uploadedAt: string;
  sheetName: string;
}
