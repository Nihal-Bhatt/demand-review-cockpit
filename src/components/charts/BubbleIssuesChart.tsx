import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { IssueRow } from "../../types/domain";
import { formatCompactNumber } from "../../lib/format";
import { chartColors } from "../../theme/chartColors";

const tickStyle = { fontSize: 11, fill: chartColors.tick };

export function BubbleIssuesChart({ issues }: { issues: IssueRow[] }) {
  const pts = issues.map((i) => ({
    id: i.id,
    name: i.title,
    x: i.confidence === "Committed" ? 4 : i.confidence === "Likely" ? 3 : i.confidence === "Pipeline" ? 2 : 1,
    y: Math.abs(i.valueImpact ?? i.volumeImpact ?? 0),
    z: Math.max(8, Math.min(40, Math.sqrt(Math.abs(i.valueImpact ?? i.volumeImpact ?? 0)) / 80)),
    kind: i.kind,
  }));
  const filtered = pts.filter((p) => p.y > 0);
  const upside = filtered.filter((p) => p.kind === "Upside");
  const risk = filtered.filter((p) => p.kind === "Risk");
  const strategic = filtered.filter((p) => p.kind === "Strategic");
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
          <XAxis
            type="number"
            dataKey="x"
            name="Confidence"
            domain={[0.5, 4.5]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={(t) =>
              t === 1 ? "Stretch" : t === 2 ? "Pipeline" : t === 3 ? "Likely" : t === 4 ? "Committed" : ""
            }
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Impact"
            tickFormatter={(v) => formatCompactNumber(Number(v))}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: chartColors.ice }}
            formatter={(value: number, name: string) => [formatCompactNumber(value), name]}
            labelFormatter={(_, p) => (p?.[0]?.payload?.id ? String(p[0].payload.id) : "")}
            contentStyle={{
              borderRadius: 12,
              borderColor: chartColors.tooltipBorder,
              background: chartColors.tooltipBg,
              color: chartColors.tooltipLabel,
            }}
            labelStyle={{ color: chartColors.tooltipLabel }}
          />
          <Legend wrapperStyle={{ color: chartColors.tick, fontSize: 12 }} />
          <Scatter name="Upside" data={upside} fill={chartColors.teal} />
          <Scatter name="Risk" data={risk} fill={chartColors.orange} />
          <Scatter name="Strategic" data={strategic} fill={chartColors.royal} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
