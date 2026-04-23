import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { cn } from "../lib/cn";

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  getRowClassName,
}: {
  data: T[];
  columns: ColumnDef<T, any>[];
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string | undefined;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const memoCols = useMemo(() => columns, [columns]);
  const table = useReactTable({
    data,
    columns: memoCols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className="overflow-auto rounded-xl ring-1 ring-surface-border">
      <table className="min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-surface-raised">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="text-left text-xs font-semibold text-surface-subtle">
              {hg.headers.map((h) => (
                <th key={h.id} className="border-b border-surface-border px-3 py-2">
                  {h.isPlaceholder ? null : (
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-1",
                        h.column.getCanSort() ? "cursor-pointer select-none hover:text-surface-on" : "",
                      )}
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() ? <ArrowDownUp className="h-3.5 w-3.5 text-surface-muted" /> : null}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-surface-panel">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-surface-border/80 text-surface-hint hover:bg-surface-raised",
                onRowClick ? "cursor-pointer" : "",
                getRowClassName?.(row.original),
              )}
              onClick={() => onRowClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="whitespace-nowrap px-3 py-2 align-top text-xs text-surface-dim">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
