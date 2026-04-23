import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ActionTrackerGrid } from "../components/ActionTrackerGrid";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import type { ActionCategory, ActionRow, ActionStatus } from "../types/domain";
import { isOverdue } from "../lib/format";
import { exportObjectsToCsv } from "../lib/export";
import { labels } from "../config/labels";

export function ActionTrackerView() {
  const { datasets, updateAction } = useDashboard();
  const [owner, setOwner] = useState("All");
  const [category, setCategory] = useState<string>("All");
  const [due, setDue] = useState<string>("");

  const owners = useMemo(() => ["All", ...new Set(datasets.actions.map((a) => a.owner))], [datasets.actions]);

  const rows = useMemo(() => {
    return datasets.actions.filter((a) => {
      if (owner !== "All" && a.owner !== owner) return false;
      if (category !== "All" && a.category !== (category as ActionCategory)) return false;
      if (due && a.dueDate !== due) return false;
      return true;
    });
  }, [datasets.actions, owner, category, due]);

  const overdue = useMemo(() => datasets.actions.filter((a) => a.status !== "Complete" && isOverdue(a.dueDate)), [datasets.actions]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    datasets.actions.forEach((a) => m.set(a.status, (m.get(a.status) ?? 0) + 1));
    return [...m.entries()];
  }, [datasets.actions]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    datasets.actions.forEach((a) => m.set(a.category, (m.get(a.category) ?? 0) + 1));
    return [...m.entries()];
  }, [datasets.actions]);

  const columns = useMemo<ColumnDef<ActionRow, any>[]>(
    () => [
      { header: "ID", accessorKey: "id" },
      {
        header: "Category",
        cell: (ctx) => (
          <Select
            value={ctx.row.original.category}
            onChange={(e) => updateAction(ctx.row.original.id, { category: e.target.value as ActionCategory })}
          >
            {[
              "Demand action",
              "Capacity action",
              "RM / packaging action",
              "NPD readiness action",
              "Escalation to Supply Review / S&OP",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        ),
      },
      {
        header: "Description",
        cell: (ctx) => (
          <Input
            defaultValue={ctx.row.original.description}
            onBlur={(e) => updateAction(ctx.row.original.id, { description: e.target.value })}
          />
        ),
      },
      {
        header: "Owner",
        cell: (ctx) => (
          <Input defaultValue={ctx.row.original.owner} onBlur={(e) => updateAction(ctx.row.original.id, { owner: e.target.value })} />
        ),
      },
      {
        header: "Due date",
        cell: (ctx) => (
          <Input type="date" defaultValue={ctx.row.original.dueDate} onBlur={(e) => updateAction(ctx.row.original.id, { dueDate: e.target.value })} />
        ),
      },
      {
        header: "Status",
        cell: (ctx) => (
          <Select
            value={ctx.row.original.status}
            onChange={(e) => updateAction(ctx.row.original.id, { status: e.target.value as ActionStatus })}
          >
            {(["Open", "In progress", "Blocked", "Complete"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        ),
      },
      {
        header: "Impact",
        cell: (ctx) => (
          <Input defaultValue={ctx.row.original.impact ?? ""} onBlur={(e) => updateAction(ctx.row.original.id, { impact: e.target.value })} />
        ),
      },
      {
        header: "Dependency",
        cell: (ctx) => (
          <Input
            defaultValue={ctx.row.original.dependency ?? ""}
            onBlur={(e) => updateAction(ctx.row.original.id, { dependency: e.target.value })}
          />
        ),
      },
      {
        header: "Decision forum",
        cell: (ctx) => (
          <Input
            defaultValue={ctx.row.original.decisionForum ?? ""}
            onBlur={(e) => updateAction(ctx.row.original.id, { decisionForum: e.target.value })}
          />
        ),
      },
      {
        header: "Next review",
        cell: (ctx) => (
          <Input
            type="date"
            defaultValue={ctx.row.original.nextReviewDate ?? ""}
            onBlur={(e) => updateAction(ctx.row.original.id, { nextReviewDate: e.target.value })}
          />
        ),
      },
      {
        header: "Notes",
        cell: (ctx) => (
          <textarea
            className="min-h-[64px] w-[220px] rounded-md border border-surface-border bg-surface-charcoal p-2 text-xs text-surface-hint"
            defaultValue={ctx.row.original.notes ?? ""}
            onBlur={(e) => updateAction(ctx.row.original.id, { notes: e.target.value })}
          />
        ),
      },
    ],
    [updateAction],
  );

  const exportCsv = () => {
    exportObjectsToCsv(
      `actions_export.csv`,
      rows.map((r) => ({ ...r })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">Action tracker</h1>
          <p className="mt-1 text-sm text-surface-soft">Track Demand Review actions through closure with inline edits.</p>
        </div>
        <button
          type="button"
          className="rounded-md bg-surface-panel px-3 py-2 text-sm font-semibold text-surface-hint ring-1 ring-surface-border hover:bg-surface-raised disabled:opacity-40"
          onClick={exportCsv}
          disabled={!rows.length}
        >
          Download CSV
        </button>
      </div>

      {datasets.actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-accent-orange">{overdue.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-surface-dim">
            {byStatus.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span>{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-surface-dim">
            {byCategory.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <span className="text-xs">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold text-surface-soft">Owner</div>
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="text-xs font-semibold text-surface-soft">Category</div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              <option>Demand action</option>
              <option>Capacity action</option>
              <option>RM / packaging action</option>
              <option>NPD readiness action</option>
              <option>Escalation to Supply Review / S&OP</option>
            </Select>
          </div>
          <div>
            <div className="text-xs font-semibold text-surface-soft">Due date equals</div>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionTrackerGrid
            data={rows}
            columns={columns}
            getRowClassName={(a) => (a.status !== "Complete" && isOverdue(a.dueDate) ? "bg-accent-orange/10" : "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
