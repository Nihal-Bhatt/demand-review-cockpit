import { useMemo } from "react";
import { cn } from "../lib/cn";

export function HeatmapTable({
  rows,
  rowKey,
  colKey,
  value,
  format,
}: {
  rows: Record<string, unknown>[];
  rowKey: string;
  colKey: string;
  value: string;
  format?: (n: number) => string;
}) {
  const { customers, months, matrix } = useMemo(() => {
    const customers = [...new Set(rows.map((r) => String(r[rowKey] ?? "")))].filter(Boolean).slice(0, 12);
    const months = [...new Set(rows.map((r) => String(r[colKey] ?? "")))].filter(Boolean).slice(0, 12);
    const matrix = new Map<string, number>();
    rows.forEach((r) => {
      const rk = String(r[rowKey] ?? "");
      const ck = String(r[colKey] ?? "");
      const v = Number(r[value] ?? 0);
      matrix.set(`${rk}||${ck}`, v);
    });
    return { customers, months, matrix };
  }, [rows, rowKey, colKey, value]);

  const vals = [...matrix.values()].filter((n) => Number.isFinite(n));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;

  const color = (n: number) => {
    if (!Number.isFinite(n)) return "bg-surface-inset text-surface-muted";
    const t = max === min ? 0.5 : (n - min) / (max - min);
    if (t < 0.33) return "bg-accent-orange/25 text-accent-orange-tint";
    if (t < 0.66) return "bg-accent-gold/25 text-accent-gold-tint";
    return "bg-accent-teal/25 text-accent-teal-light";
  };

  return (
    <div className="overflow-auto rounded-xl ring-1 ring-surface-border">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead className="sticky top-0 z-10 bg-surface-raised">
          <tr>
            <th className="border-b border-surface-border px-2 py-2 text-left font-semibold text-surface-subtle">{rowKey}</th>
            {months.map((m) => (
              <th key={m} className="border-b border-surface-border px-2 py-2 text-left font-semibold text-surface-subtle">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface-panel">
          {customers.map((c) => (
            <tr key={c} className="border-b border-surface-border/80">
              <td className="whitespace-nowrap px-2 py-2 font-medium text-surface-hint">{c}</td>
              {months.map((m) => {
                const n = matrix.get(`${c}||${m}`) ?? NaN;
                return (
                  <td key={m} className={cn("px-2 py-2", color(n))}>
                    {Number.isFinite(n) ? (format ? format(n) : n.toFixed(2)) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
