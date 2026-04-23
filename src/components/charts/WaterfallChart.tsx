import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SimpleBridgeBar } from "../../lib/businessLogic";
import { formatCompactNumber } from "../../lib/format";
import { chartColors } from "../../theme/chartColors";

const tickStyle = { fontSize: 11, fill: chartColors.tick };

export function WaterfallChart({ data }: { data: SimpleBridgeBar[] }) {
  const chartData = data.map((d) => ({
    ...d,
    display: d.kind === "down" ? Math.abs(d.value) : d.value,
  }));
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactNumber(Number(v))}
          />
          <Tooltip
            formatter={(val: number, _n, ctx) => {
              const kind = (ctx.payload as SimpleBridgeBar | undefined)?.kind;
              const v = kind === "down" ? -Math.abs(val) : val;
              return [formatCompactNumber(v), "Value"];
            }}
            contentStyle={{
              borderRadius: 12,
              borderColor: chartColors.tooltipBorder,
              background: chartColors.tooltipBg,
              color: chartColors.tooltipLabel,
            }}
            labelStyle={{ color: chartColors.tooltipLabel }}
          />
          <Bar dataKey="display" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => {
              const fill =
                entry.kind === "up"
                  ? chartColors.positive
                  : entry.kind === "down"
                    ? chartColors.negative
                    : entry.kind === "total"
                      ? chartColors.total
                      : chartColors.neutral;
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
