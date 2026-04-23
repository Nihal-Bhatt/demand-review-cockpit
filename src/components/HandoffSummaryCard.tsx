import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { labels } from "../config/labels";

export function HandoffSummaryCard({ bullets }: { bullets: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.handoffTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-surface-dim">
          {bullets.length ? (
            bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-accent-teal" />
                <span>{b}</span>
              </li>
            ))
          ) : (
            <li className="text-surface-soft">No handoff items yet — add escalations or capacity risks.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
