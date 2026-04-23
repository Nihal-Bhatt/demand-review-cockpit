import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useDashboard } from "../context/DashboardContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { DataTable } from "../components/DataTable";
import { BubbleIssuesChart } from "../components/charts/BubbleIssuesChart";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import type { IssueRow } from "../types/domain";
import { ConfidenceBadge } from "../components/ConfidenceBadge";
import { labels } from "../config/labels";

export function IssuesView() {
  const { datasets, toggleIssueTag, bulkTagEscalations } = useDashboard();
  const [tab, setTab] = useState<"Upside" | "Risk" | "Strategic" | "All">("All");

  const filtered = useMemo(() => {
    const all = datasets.issues;
    if (tab === "All") return all;
    return all.filter((i) => i.kind === tab);
  }, [datasets.issues, tab]);

  const columns = useMemo<ColumnDef<IssueRow, any>[]>(
    () => [
      {
        header: "Select",
        cell: (ctx) => (
          <input
            type="checkbox"
            checked={!!ctx.row.original.taggedEscalation}
            onChange={() => toggleIssueTag(ctx.row.original.id)}
            aria-label="Tag escalation"
          />
        ),
      },
      { header: "Issue", accessorKey: "title" },
      { header: "Type", accessorKey: "kind" },
      { header: "Value impact", accessorKey: "valueImpact" },
      { header: "Volume impact", accessorKey: "volumeImpact" },
      {
        header: "Confidence",
        accessorKey: "confidence",
        cell: (c) => <ConfidenceBadge value={c.row.original.confidence} />,
      },
      { header: "Supply implication", accessorKey: "supplyImplication" },
      { header: "Decision", accessorKey: "decisionRequired" },
      { header: "Owner", accessorKey: "owner" },
      { header: "Due", accessorKey: "dueDate" },
      { header: "Status", accessorKey: "status" },
      {
        header: "Routes",
        accessorFn: (r) =>
          `${r.needsSupplyReview ? "Supply Review " : ""}${r.needsExecEscalation ? "Exec S&OP" : ""}`,
      },
    ],
    [toggleIssueTag],
  );

  const tagSupplyRoutes = () => {
    const ids = datasets.issues.filter((i) => i.needsSupplyReview || i.needsExecEscalation).map((i) => i.id);
    bulkTagEscalations(ids);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-surface-on">Upside / risks / strategic issues</h1>
          <p className="mt-1 text-sm text-surface-soft">Separate opportunities, risks, and strategic issues for decision forums.</p>
        </div>
        <Button variant="secondary" onClick={tagSupplyRoutes}>
          Mark Supply / Exec routes for tracking
        </Button>
      </div>

      {datasets.issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface-panel p-6 text-sm text-surface-subtle">
          {labels.emptyState}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {(["All", "Upside", "Risk", "Strategic"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 ring-surface-border ${
              tab === t ? "bg-accent-royal text-surface-on ring-accent-royal-soft" : "bg-surface-panel text-surface-hint hover:bg-surface-raised"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Value vs confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <BubbleIssuesChart issues={filtered} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Escalation highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-surface-dim">
            {datasets.issues
              .filter((i) => i.needsExecEscalation)
              .map((i) => (
                <div key={i.id} className="rounded-lg bg-accent-orange/15 p-3 ring-1 ring-accent-orange/40">
                  <div className="text-xs font-semibold text-accent-orange-tint">Executive S&OP</div>
                  <div className="mt-1 font-medium text-surface-hint">{i.title}</div>
                </div>
              ))}
            {datasets.issues
              .filter((i) => i.needsSupplyReview && !i.needsExecEscalation)
              .map((i) => (
                <div key={i.id} className="rounded-lg bg-accent-gold/15 p-3 ring-1 ring-accent-gold/40">
                  <div className="text-xs font-semibold text-accent-gold-tint">Supply Review</div>
                  <div className="mt-1 font-medium text-surface-hint">{i.title}</div>
                </div>
              ))}
            {!datasets.issues.some((i) => i.needsSupplyReview || i.needsExecEscalation) ? (
              <div className="text-xs text-surface-soft">No explicit escalation flags in current dataset.</div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unified issue register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge tone="good">Upside</Badge>
            <Badge tone="warn">Risk</Badge>
            <Badge tone="neutral">Strategic</Badge>
          </div>
          <DataTable data={filtered} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
