import { useMemo, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import type { DatasetKey } from "../types/domain";
import { SEMANTIC_FIELDS, DEFAULT_COLUMN_HINTS } from "../config/defaultColumnMappings";
import { listSheetNames } from "../lib/excel/ingest";
import { downloadAllTemplatesWorkbook, downloadTemplateForDataset } from "../lib/excel/templates";
import { cn } from "../lib/cn";

const datasetList: DatasetKey[] = [
  "demandOutlook",
  "budget",
  "forecastPerformance",
  "actuals",
  "capacity",
  "npdReadiness",
  "issues",
  "actions",
  "demandExceptions",
];

export function DataAdminView() {
  const {
    demoMode,
    setDemoMode,
    uploadDataset,
    clearUpload,
    mappings,
    setMappingField,
    resetMappings,
    uploads,
    validation,
    uploadHeaders,
  } = useDashboard();

  const [dataset, setDataset] = useState<DatasetKey>("demandOutlook");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheet, setSheet] = useState<string>("");
  const [drag, setDrag] = useState(false);

  const headerOptions = useMemo(() => {
    const live = uploadHeaders[dataset] ?? [];
    const hints = Object.values(DEFAULT_COLUMN_HINTS[dataset] ?? {});
    const mapped = Object.values(mappings[dataset] ?? {});
    return [...new Set([...live, ...hints, ...mapped])].filter(Boolean).sort();
  }, [dataset, mappings, uploadHeaders]);

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    const buf = await file.arrayBuffer();
    const names = listSheetNames(buf);
    setSheets(names);
    setSheet(names[0] ?? "");
  };

  const ingest = async () => {
    if (!pendingFile || !sheet) return;
    await uploadDataset(dataset, pendingFile, sheet);
    setPendingFile(null);
    setSheets([]);
    setSheet("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-surface-on">Data admin / upload</h1>
        <p className="mt-1 text-sm text-surface-soft">
          Replace Excel sources without code changes. Mappings persist in local storage for this browser.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo mode</CardTitle>
          <CardDescription>When enabled, the cockpit uses the built-in mock JSON layer for all tabs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-surface-dim">{demoMode ? "Demo mode is ON." : "Demo mode is OFF — only uploaded datasets populate views."}</div>
          <Button variant={demoMode ? "primary" : "secondary"} onClick={() => setDemoMode(!demoMode)}>
            Toggle demo mode
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Download starter workbooks with suggested headers for each dataset.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={downloadAllTemplatesWorkbook}>
            Download all datasets (multi-sheet)
          </Button>
          {datasetList.map((d) => (
            <Button key={d} variant="ghost" onClick={() => downloadTemplateForDataset(d)}>
              {d}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload workbook</CardTitle>
          <CardDescription>Select dataset target, drop an `.xlsx` file, choose sheet, then ingest.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-surface-soft">Target dataset</div>
              <Select value={dataset} onChange={(e) => setDataset(e.target.value as DatasetKey)}>
                {datasetList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-surface-soft">Sheet</div>
              <Select value={sheet} onChange={(e) => setSheet(e.target.value)} disabled={!sheets.length}>
                <option value="">{sheets.length ? "Select sheet" : "Upload a file to list sheets"}</option>
                {sheets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-dashed border-surface-muted bg-surface-raised p-8 text-center transition",
              drag ? "border-accent-royal-soft bg-accent-royal/25/40" : "",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void onPickFile(f);
            }}
          >
            <UploadCloud className="mx-auto h-8 w-8 text-surface-subtle" />
            <div className="mt-3 text-sm font-semibold text-surface-hint">Drag & drop Excel</div>
            <div className="mt-1 text-xs text-surface-soft">Or choose a file from disk</div>
            <div className="mt-4">
              <input
                type="file"
                accept=".xlsx,.xlsm,.xls"
                onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                className="mx-auto block text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void ingest()} disabled={!pendingFile || !sheet}>
              Parse & refresh dataset
            </Button>
            <Button variant="secondary" onClick={() => clearUpload(dataset)}>
              Clear upload for current dataset
            </Button>
          </div>

          <div className="rounded-xl bg-surface-panel p-4 ring-1 ring-surface-border">
            <div className="text-xs font-semibold text-surface-soft">Uploaded files (this session)</div>
            {uploads.length ? (
              <ul className="mt-2 space-y-2 text-sm text-surface-dim">
                {uploads.map((u) => (
                  <li key={u.id} className="flex flex-col gap-1 rounded-lg bg-surface-raised p-3 ring-1 ring-surface-border md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold">
                        {u.dataset} · {u.fileName}
                      </div>
                      <div className="text-xs text-surface-soft">
                        Sheet: {u.sheetName} · rows: {u.rowCount} · {new Date(u.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" onClick={() => clearUpload(u.dataset)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 text-sm text-surface-soft">No uploads yet.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Column mapping</CardTitle>
          <CardDescription>Map semantic fields to your workbook headers. Defaults match generated templates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={resetMappings}>
              Reset mappings to defaults
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-surface-soft">Dataset</div>
              <Select value={dataset} onChange={(e) => setDataset(e.target.value as DatasetKey)}>
                {datasetList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>
            <div className="rounded-lg bg-surface-raised p-3 text-xs text-surface-dim ring-1 ring-surface-border">
              After upload, your sheet headers appear as suggestions. You can also type any header name; it should match
              the workbook row 1 text exactly.
            </div>
          </div>

          <datalist id={`hdr-${dataset}`}>
            {headerOptions.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {SEMANTIC_FIELDS[dataset].map((field) => {
              const current = mappings[dataset]?.[field] ?? "";
              return (
                <div key={field} className="rounded-lg bg-surface-raised p-3 ring-1 ring-surface-border">
                  <div className="text-xs font-semibold text-surface-subtle">{field}</div>
                  <div className="mt-2">
                    <input
                      key={`${dataset}-${field}-${current}`}
                      className="w-full rounded-md border border-surface-border bg-surface-charcoal px-3 py-2 text-sm text-surface-hint shadow-sm outline-none focus:border-accent-royal-soft focus:ring-2 focus:ring-accent-royal/30"
                      list={`hdr-${dataset}`}
                      defaultValue={current}
                      placeholder="Excel header"
                      onBlur={(e) => setMappingField(dataset, field, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-surface-panel p-4 ring-1 ring-surface-border">
            <div className="text-xs font-semibold text-surface-soft">Validation</div>
            <ul className="mt-2 space-y-1 text-sm text-surface-dim">
              {(validation[dataset] ?? []).map((v) => (
                <li key={v} className="text-accent-gold-tint">
                  {v}
                </li>
              ))}
              {!validation[dataset]?.length ? (
                <li className="text-accent-teal-light">Core mappings present for this dataset.</li>
              ) : null}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
