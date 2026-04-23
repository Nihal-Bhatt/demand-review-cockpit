import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ExceptionTable } from "../components/ExceptionTable";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { exceptionPriorityScore } from "../lib/businessLogic";
import type { DecisionRecommendation, DemandExceptionRow, ExceptionStatus } from "../types/domain";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { labels } from "../config/labels";

export function DemandExceptionsView() {
  const { datasets, updateException } = useDashboard();
  const [severity, setSeverity] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [owner, setOwner] = useState<string>("All");

  const rows = useMemo(() => {
    const scored = datasets.demandExceptions
      .map((e) => ({ e, score: exceptionPriorityScore(e) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.e);
    return scored.filter((e) => {
      if (severity !== "All" && e.severity !== severity) return false;
      if (status !== "All" && e.status !== (status as ExceptionStatus)) return false;
      if (owner !== "All" && (e.owner ?? "Unassigned") !== owner) return false;
      return true;
    });
  }, [datasets.demandExceptions, severity, status, owner]);

  const owners = useMemo(() => {
    return ["All", ...new Set(datasets.demandExceptions.map((e) => e.owner ?? "Unassigned"))];
  }, [datasets.demandExceptions]);

  const columns = useMemo<ColumnDef<DemandExceptionRow, any>[]>(
    () => [
      { header: "ID", accessorKey: "id" },
      { header: "Type", accessorKey: "type" },
      { header: "Customer", accessorKey: "customer" },
      { header: "Product", accessorKey: "product" },
      { header: "Month", accessorKey: "month" },
      { header: "Impact value", accessorKey: "impactValue" },
      { header: "Impact volume", accessorKey: "impactVolume" },
      {
        header: "Confidence",
        accessorKey: "confidence",
        cell: (c) => <ConfidenceBadge value={c.row.original.confidence} />,
      },
      { header: "Root cause", accessorKey: "rootCause" },
      { header: "Decision", accessorKey: "decisionRequired" },
      { header: "Owner", accessorKey: "owner" },
      { header: "Due", accessorKey: "dueDate" },
      { header: "Status", accessorKey: "status" },
      {
        header: "Recommendation",
        cell: (ctx) => (
          <Select
            value={ctx.row.original.recommendation ? String(ctx.row.original.recommendation) : ""}
            onChange={(e) => {
              const v = e.target.value as DecisionRecommendation | "";
              updateException(ctx.row.original.id, { recommendation: v ? (v as DecisionRecommendation) : undefined });
            }}
          >
            <option value="">Select…</option>
            <option value="validate">validate</option>
            <option value="hold">hold</option>
            <option value="shape down">shape down</option>
            <option value="escalate to supply">escalate to supply</option>
          </Select>
        ),
      },
      {
        header: "Review notes",
        cell: (ctx) => (
          <textarea
            className="min-h-[64px] w-[240px] rounded-md border border-surface-border bg-surface-charcoal p-2 text-xs text-surface-hint"
            defaultValue={ctx.row.original.reviewNotes ?? ""}
            onBlur={(e) => updateException(ctx.row.original.id, { reviewNotes: e.target.value })}
          />
        ),
      },
    ],
    [updateException],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-surface-on">Demand exceptions</h1>
        <p className="mt-1 text-sm text-surface-soft">Exception-led review queue with prioritization scoring.</p>
      </div>

      {datasets.demandExceptions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs font-semibold text-surface-soft">Severity</div>
            <Select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option>All</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </Select>
          </div>
          <div>
            <div className="text-xs font-semibold text-surface-soft">Status</div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>All</option>
              <option>New</option>
              <option>In review</option>
              <option>Agreed</option>
              <option>Closed</option>
            </Select>
          </div>
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
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge tone="bad">High</Badge>
        <Badge tone="warn">Medium</Badge>
        <Badge tone="neutral">Low</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prioritized exception queue</CardTitle>
        </CardHeader>
        <CardContent>
          <ExceptionTable
            data={rows}
            columns={columns}
            getRowClassName={(r) => (r.severity === "High" ? "bg-accent-orange/10" : "")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
